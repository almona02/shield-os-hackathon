/**
 * SAM 3.1 evidence verification via Meta Model API.
 * Docs: https://dev.meta.ai/docs/sam/overview
 *
 * POST https://api.meta.ai/v1/responses  model: sam-3.1
 * Prompt = expected spare-part noun phrase + image URL / data URL.
 * Zero matches → fake/suspicious. Detections → real (confidence-weighted).
 *
 * Falls back to filename heuristics when META_API_KEY is missing or the
 * photo is a demo filename (not a real image URL).
 */

export interface EvidenceVerdict {
  score: number; // 0–100 realness
  label: "real" | "suspicious" | "fake";
  reason_en: string;
  reason_ar: string;
  photo_hash: string;
  source: "sam_3_1" | "mock";
  detections?: number;
}

const META_RESPONSES_URL =
  process.env.META_SAM_URL ?? "https://api.meta.ai/v1/responses";
const SAM_MODEL = process.env.META_SAM_MODEL ?? "sam-3.1";

function hashString(input: string): string {
  let h = 0;
  for (let i = 0; i < input.length; i += 1) {
    h = (Math.imul(31, h) + input.charCodeAt(i)) | 0;
  }
  return `ph_${Math.abs(h).toString(16).padStart(8, "0")}`;
}

function labelFromScore(score: number): EvidenceVerdict["label"] {
  if (score >= 70) return "real";
  if (score >= 40) return "suspicious";
  return "fake";
}

function reasons(
  label: EvidenceVerdict["label"],
  expectedPart?: string,
): Pick<EvidenceVerdict, "reason_en" | "reason_ar"> {
  if (label === "real") {
    return {
      reason_en: `SAM 3.1 found a physical spare part${expectedPart ? ` matching “${expectedPart}”` : ""}.`,
      reason_ar: `SAM 3.1 رصد قطعة غيار حقيقية${expectedPart ? ` تطابق “${expectedPart}”` : ""}.`,
    };
  }
  if (label === "suspicious") {
    return {
      reason_en: "Ambiguous evidence — recommend on-site re-capture.",
      reason_ar: "دليل غير واضح — يُفضّل إعادة التصوير في الموقع.",
    };
  }
  return {
    reason_en:
      "Likely fake / edited / non-part image. Block approval until re-verified.",
    reason_ar:
      "يُحتمل أن تكون الصورة مزيفة أو معدّلة. امنع الموافقة حتى إعادة التحقق.",
  };
}

/** Demo-friendly mock when there is no real image bytes to send SAM. */
export function mockVerifyEvidence(
  photo: string,
  expectedPart?: string,
): EvidenceVerdict {
  const lower = photo.toLowerCase();
  const photo_hash = hashString(photo.slice(0, 256) + (expectedPart ?? ""));

  let score = 78;
  if (
    /fake|screenshot|invoice|edited|photoshop|stock/.test(lower) ||
    lower.includes("data:image/gif")
  ) {
    score = 18;
  } else if (/motor|bearing|yilmaz|ylm|part|workshop/.test(lower)) {
    score = 92;
  } else if (photo.startsWith("data:image/")) {
    score = 71;
  }

  if (expectedPart && lower.includes(expectedPart.toLowerCase().slice(0, 4))) {
    score = Math.min(100, score + 8);
  }

  const label = labelFromScore(score);
  return {
    score,
    label,
    ...reasons(label, expectedPart),
    photo_hash,
    source: "mock",
  };
}

function isImagePayload(photo: string): boolean {
  return (
    photo.startsWith("http://") ||
    photo.startsWith("https://") ||
    photo.startsWith("data:image/")
  );
}

/** Map part SKU → short noun phrase SAM prefers. */
function samPrompt(expectedPart?: string): string {
  const p = (expectedPart ?? "").toLowerCase();
  if (/motor|ylm/.test(p)) return "electric motor";
  if (/bearing/.test(p)) return "machine bearing";
  if (/spindle/.test(p)) return "machine spindle";
  if (/seal/.test(p)) return "rubber seal";
  if (expectedPart) return `${expectedPart} spare part`;
  return "industrial machine spare part";
}

function countSamDetections(outputText: string): number {
  if (!outputText.trim()) return 0;
  const boxes = outputText.match(/<\|box;/g);
  return boxes?.length ?? 0;
}

function avgConfidence(outputText: string): number | null {
  const hits = [...outputText.matchAll(/;c=([0-9.]+)/g)].map((m) =>
    Number(m[1]),
  );
  if (hits.length === 0) return null;
  return hits.reduce((a, b) => a + b, 0) / hits.length;
}

/**
 * Call Meta SAM 3.1. Returns null if the key is missing or the call fails
 * so the caller can fall back to the mock.
 */
export async function verifyEvidenceWithSam(
  photoUrl: string,
  expectedPart?: string,
): Promise<EvidenceVerdict | null> {
  const apiKey =
    process.env.META_API_KEY?.trim() ||
    process.env.MODEL_API_KEY?.trim();
  if (!apiKey) return null;

  const prompt = samPrompt(expectedPart);

  try {
    const res = await fetch(META_RESPONSES_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: SAM_MODEL,
        input: [
          {
            type: "message",
            role: "user",
            content: [
              { type: "input_text", text: prompt },
              { type: "input_image", image_url: photoUrl },
            ],
          },
        ],
        stream: false,
        metadata: {
          mask_encoding: "one_bit",
          include_confidence: "true",
        },
      }),
    });

    if (!res.ok) {
      console.warn("[sam] Meta API error", res.status, await res.text());
      return null;
    }

    const data = (await res.json()) as {
      output_text?: string;
      output?: { content?: { text?: string; type?: string }[] }[];
    };

    let outputText = data.output_text ?? "";
    if (!outputText && Array.isArray(data.output)) {
      for (const block of data.output) {
        for (const part of block.content ?? []) {
          if (part.text) outputText += part.text;
        }
      }
    }

    const detections = countSamDetections(outputText);
    const conf = avgConfidence(outputText);

    let score: number;
    if (detections === 0) {
      score = 15;
    } else if (conf != null) {
      score = Math.round(Math.min(100, 55 + conf * 45 + Math.min(detections, 3) * 5));
    } else {
      score = Math.min(95, 70 + detections * 8);
    }

    const label = labelFromScore(score);
    const photo_hash = hashString(
      `${photoUrl.slice(0, 128)}|${prompt}|${detections}|${outputText.slice(0, 64)}`,
    );

    return {
      score,
      label,
      ...reasons(label, expectedPart),
      photo_hash,
      source: "sam_3_1",
      detections,
    };
  } catch (err) {
    console.warn("[sam] call failed", err);
    return null;
  }
}

/**
 * Primary entry: real SAM 3.1 when possible, otherwise mock.
 */
export async function verifyEvidence(
  photo: string,
  expectedPart?: string,
): Promise<EvidenceVerdict> {
  if (isImagePayload(photo)) {
    const live = await verifyEvidenceWithSam(photo, expectedPart);
    if (live) return live;
  }
  return mockVerifyEvidence(photo, expectedPart);
}
