/** SAM detects prompted object categories; it does not authenticate invoices or SKUs. */
import { createHash } from "node:crypto";

export interface EvidenceVerdict {
  score: number | null; // Model detection confidence, never authenticity probability.
  label: "matched" | "no_match" | "unavailable" | "simulated_match" | "simulated_reject";
  reason_en: string;
  reason_ar: string;
  photo_hash: string; // Hash of submitted reference, NOT downloaded image bytes.
  source: "sam_3_1" | "mock" | "unavailable";
  detections?: number;
  matched_prompt?: string;
}
const referenceHash = (photo: string) => createHash("sha256").update(photo).digest("hex");
const unavailable = (photo: string): EvidenceVerdict => ({
  score: null, label: "unavailable", source: "unavailable", photo_hash: referenceHash(photo),
  reason_en: "Visual analysis unavailable. No authenticity conclusion; retry or review manually.",
  reason_ar: "التحليل البصري غير متاح. لا يوجد حكم على الأصالة؛ أعد المحاولة أو راجع يدوياً.",
});
export function mockVerifyEvidence(photo: string): EvidenceVerdict {
  const rejected = /fake|invoice|edited|screenshot/i.test(photo);
  return {
    score: null, label: rejected ? "simulated_reject" : "simulated_match",
    source: "mock", photo_hash: referenceHash(photo),
    reason_en: "Filename simulation only. No image was analyzed and no Meta API was called.",
    reason_ar: "محاكاة باسم الملف فقط. لم تُحلل صورة ولم يُستدعَ نموذج Meta.",
  };
}
export function samPrompts(expectedPart?: string): string[] {
  const p = (expectedPart ?? "").toLowerCase();
  if (/motor|ylm/.test(p)) return ["electric motor", "motor"];
  if (/bearing/.test(p)) return ["bearing", "machine bearing"];
  if (/spindle/.test(p)) return ["spindle"];
  if (/seal/.test(p)) return ["seal"];
  return expectedPart?.trim() ? [expectedPart.trim()] : [];
}
export function parseSamOutput(text: string) {
  const detections = (text.match(/<\|box;/g) ?? []).length;
  const confidence = [...text.matchAll(/;c=([0-9.]+)/g)]
    .map(m => Number(m[1])).filter(n => Number.isFinite(n) && n >= 0 && n <= 1);
  return { detections, score: confidence.length
    ? Math.round(100 * confidence.reduce((a, b) => a + b, 0) / confidence.length) : null };
}
/** Avoid an arbitrary server-side URL fetch. Only a known public CDN is proxied. */
async function imagePayload(photo: string): Promise<string | null> {
  if (/^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/=]+$/.test(photo)) {
    return photo.length <= 2_500_000 ? photo : null;
  }
  try {
    const url = new URL(photo);
    if (url.protocol !== "https:" || url.hostname !== "images.unsplash.com" || url.port || url.username || url.password) return null;
    url.searchParams.set("w", "960"); url.searchParams.set("q", "70");
    const res = await fetch(url, { redirect: "error", signal: AbortSignal.timeout(8000) });
    const mime = (res.headers.get("content-type") ?? "").split(";")[0];
    if (!res.ok || !["image/jpeg", "image/png", "image/webp"].includes(mime) || !res.body) return null;
    const reader = res.body.getReader();
    const chunks: Uint8Array[] = []; let size = 0;
    while (true) {
      const { done, value } = await reader.read(); if (done) break;
      size += value.length;
      if (size > 1_800_000) { await reader.cancel(); return null; }
      chunks.push(value);
    }
    return `data:${mime};base64,${Buffer.concat(chunks).toString("base64")}`;
  } catch { return null; }
}
export async function verifyEvidenceWithSam(photo: string, expectedPart?: string): Promise<EvidenceVerdict | null> {
  const key = process.env.META_API_KEY?.trim() || process.env.MODEL_API_KEY?.trim();
  if (!key) return null;
  const prompts = samPrompts(expectedPart);
  const image = await imagePayload(photo);
  if (!image || !prompts.length) return null;
  let completed = false;
  for (const prompt of prompts) {
    try {
      const res = await fetch(process.env.META_SAM_URL ?? "https://api.meta.ai/v1/responses", {
        method: "POST", signal: AbortSignal.timeout(12000),
        headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
        body: JSON.stringify({ model: process.env.META_SAM_MODEL ?? "sam-3.1", stream: false,
          input: [{ type: "message", role: "user", content: [
            { type: "input_text", text: prompt }, { type: "input_image", image_url: image },
          ] }], metadata: { mask_encoding: "one_bit", include_confidence: "true" } }),
      });
      if (!res.ok) { console.warn("[sam] HTTP", res.status); continue; }
      const data = await res.json();
      if (data.error || (data.status && data.status !== "completed")) continue;
      if (typeof data.output_text !== "string" && !Array.isArray(data.output)) continue;
      const output = data.output_text ?? data.output?.flatMap((b: { content?: { text?: string }[] }) => b.content ?? []).map((p: { text?: string }) => p.text ?? "").join("") ?? "";
      // Unknown non-empty output must not be treated as a successful negative result.
      if (output.trim() && !output.includes("<0f>")) continue;
      completed = true;
      const parsed = parseSamOutput(output);
      if (parsed.detections) return {
        ...parsed, label: "matched", source: "sam_3_1", photo_hash: referenceHash(photo), matched_prompt: prompt,
        reason_en: `Detected category “${prompt}”. This does not verify SKU, ownership, condition, or invoice authenticity.`,
        reason_ar: `تم رصد فئة «${prompt}». لا يثبت ذلك الموديل أو الملكية أو الحالة أو أصالة الفاتورة.`,
      };
    } catch { /* A provider failure is unavailable, never a fabricated verdict. */ }
  }
  return completed ? {
    score: null, detections: 0, label: "no_match", source: "sam_3_1", photo_hash: referenceHash(photo),
    reason_en: "Requested object category not detected. Review the image; this is not proof of fraud.",
    reason_ar: "لم تُرصد فئة القطعة المطلوبة. راجع الصورة؛ هذه ليست دليلاً على الاحتيال.",
  } : null;
}
export async function verifyEvidence(photo: string, expectedPart?: string): Promise<EvidenceVerdict> {
  if (/^(https?:|data:)/i.test(photo)) return await verifyEvidenceWithSam(photo, expectedPart) ?? unavailable(photo);
  return mockVerifyEvidence(photo);
}
