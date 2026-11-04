# SHIELD.OS — submission draft

## One sentence

SHIELD.OS helps workshop managers review spare-part evidence and preserve a tamper-evident history of their approval decisions, with Meta-powered visual category detection and bilingual anomaly explanations.

## Problem

A spare-part request can arrive with a photo and a short message. A manager needs to know what the evidence shows, who made the decision, and whether the recorded history later changed. A spreadsheet alone makes that review difficult.

## What we built

We extracted a small governance prototype from ALMONA's larger Reality OS work and built a standalone spare-parts demonstration. A technician submits a request. SAM 3.1 searches the photo for the expected object category. A manager makes an explicit decision, and the application appends a hash-linked event. A dashboard shows the history, supplied locations, and English/Arabic risk explanations.

The model advises; deterministic rules implement the approval transitions. Model results and local-rule fallbacks are labeled separately. A motor-category detection is useful evidence for review, but does not prove an exact SKU or an authentic invoice.

## What is demonstrated versus planned

The repository includes a working UI, event hashing, approval rules, a Supabase adapter/migration, and Meta API clients. The submission video must show which providers actually succeeded in the deployed environment. Filename fixtures are explicitly simulated. No production adoption, measured fraud reduction, or accuracy percentage is claimed.

Before a real workshop pilot we need authenticated roles, persistent transactional approvals, restricted database policies, concurrency protection, and a labeled photo evaluation. This prototype is intended to test that focused workflow, not claim those requirements are already complete.

## Why this team

ALMONA's industrial machinery and workshop experience provides the domain context for the problem. Add one personally verified example of the existing procurement workflow when narrating; do not invent losses, customer adoption, or test results.

## Links

- Demo: https://shield-os-hackathon.vercel.app
- Repository: https://github.com/almona02/shield-os-hackathon
- Video: add the actual completed recording to the submission form before submitting.
