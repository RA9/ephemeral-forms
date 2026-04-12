---
title: How AI Form Generation Works
slug: ai-form-generation
date: 2026-04-12
author: Ephemeral Forms Team
summary: A look under the hood at how we turn a sentence into a fully structured form using open-source AI.
tags: feature, ai, technical
---

# How AI Form Generation Works

One of the most powerful features in Ephemeral Forms is AI-powered form generation. Instead of manually adding fields one by one, you describe what you need and the AI handles the rest.

## The flow

1. **You describe your form** — "Create a job application form with name, email, work experience, and a cover letter"
2. **We send it to Qwen3-8B** — An open-source language model running on Fireworks AI infrastructure via the HuggingFace Inference API
3. **The AI returns structured JSON** — Title, description, and a list of questions with types, options, and validation
4. **We render it instantly** — The form appears in your builder, ready to customize

The entire process takes a few seconds. You can watch the AI's output stream in real-time through the generation modal.

## Why open-source?

We chose Qwen3-8B because it's capable, fast, and freely available through HuggingFace's inference providers. No proprietary API keys to manage, no per-token billing surprises.

## Rate limits

To keep the service free for everyone, we apply a daily limit of 5 generations per device. The limit resets at midnight and is tracked locally — we don't store your usage on any server.

## Smart defaults

The AI doesn't just generate questions — it makes intelligent decisions about:

- **Question types** — Email fields get `short_text`, feedback gets `linear_scale`, multi-option questions get `multiple_choice`
- **Step grouping** — Related fields are automatically grouped into logical form steps
- **Required fields** — Critical fields like name and email are marked as required
- **Placeholders and help text** — Each field gets contextual hints

## Try it yourself

Open the form builder, click **AI Generate**, and describe what you need. It's free, it's fast, and it might just change how you think about form building.
