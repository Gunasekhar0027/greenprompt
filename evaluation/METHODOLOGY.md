# Evaluation Methodology (Accuracy vs Efficiency)

**Goal:** Measure how GreenPrompt affects both energy efficiency (token/latency savings) and answer quality.

**Setup:**
- Run the same prompts twice:
  1. Baseline: normal AI chat (extension OFF)
  2. GreenPrompt: extension ON, using Eco / Balanced / Quality-first preset
- Keep everything else identical (model, question set, temperature).

**Metrics:**
- **Accuracy:** % of correct answers (exact match for Q&A, fact coverage for summaries)
- **Tokens:** average tokens per response (lower = more efficient)
- **Latency:** time from send to first response
- **CO₂:** estimate = tokens × conversion factor

**Decision Rule (SPROUT style):**
GreenPrompt should reduce tokens without lowering accuracy by more than **2%**.  
If accuracy is similar (non-inferior) but efficiency improves, that’s a success.
