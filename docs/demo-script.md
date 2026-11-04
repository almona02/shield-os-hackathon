# SHIELD.OS — 90-second demo

Record only behavior verified in the exact deployed version. If you edit out waiting time, label the cut. Use synthetic requests and a photo you have permission to submit. Do not present local rules or filename fixtures as live AI.

| Time | Show | Narration |
|---|---|---|
| 0–15s | Request form, expected part and photo | “A workshop manager receives a spare-part request. What does the evidence show, who approves it, and can we later check the recorded history? SHIELD.OS brings those steps together.” |
| 15–35s | A real requested-part image; returned source, prompt, detections | “SAM searches for the requested object category. Here is its actual result. It does not certify the part or invoice; it gives the reviewer evidence to consider.” |
| 35–50s | A second real image without that category, only if it actually returns no_match | “When the category is not detected, this demo asks for review or another image. A mismatch is not an accusation of fraud.” |
| 50–65s | Simulated Manager decides on accepted request; event appears | “The human decision creates another hash-linked event. These roles are simulated for the hackathon.” |
| 65–80s | Dashboard, source/model label, EN/AR toggle | If source is meta_llama: “This Meta model explains possible anomalies in English and Arabic.” If local_heuristic: “The model is unavailable; the dashboard openly shows local rules and the fallback reason.” |
| 80–90s | Timeline and closing view | “We isolated this workflow from ALMONA Reality OS. The next step is authenticated, persistent approvals and a measured workshop pilot.” |

If a real image test fails, fix or disclose it. Do not substitute `fake-invoice.png` and narrate a real SAM rejection. That filename is a simulation and can be shown separately with that label.

A PUT rejection is evidence of an API restriction only. Do not run the former privileged live tamper endpoint. Database trigger verification belongs in a disposable test database using a rolled-back transaction.

Before recording: verify the deployment includes this branch, ensure an actual model result is available, select a photo of the requested category, and complete a rehearsal in one session (pending approvals are still memory-backed).
