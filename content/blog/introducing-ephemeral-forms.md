---
title: Introducing Ephemeral Forms
slug: introducing-ephemeral-forms
date: 2026-04-12
author: Ephemeral Forms Team
summary: Meet the zero-login, AI-powered form builder that keeps your data where it belongs — in your browser.
tags: announcement, launch
---

# Introducing Ephemeral Forms

We built Ephemeral Forms because we were tired of form builders that demand an account before you can even see what they do. Sign up, verify your email, pick a plan, *then* maybe you can drag a text field onto a canvas.

We thought: what if you could just... start building?

## The problem with today's form builders

There's no shortage of form tools out there. Google Forms, Typeform, JotForm, Tally, SurveyMonkey — the list goes on. They all work. But they all share the same set of compromises that we kept running into.

### Google Forms: free, but you pay with data

Google Forms is the default choice for most people, and for good reason — it's free and simple. But everything lives on Google's servers. Every response, every email address, every piece of data your respondents submit gets fed into Google's ecosystem. For internal team surveys that's probably fine. For collecting sensitive information from clients, patients, or students? That's a conversation worth having.

There's also the design problem. Google Forms looks like Google Forms. You can change the header color, and that's about it. No multi-step layouts, no conditional logic, no custom branding. The form you make looks identical to everyone else's.

### Typeform: beautiful, but expensive

Typeform changed the game with its one-question-at-a-time interface. It looks fantastic. But that beauty comes at a steep price — $25/month just to remove the Typeform branding, and $50/month to get basic logic jumps. Need more than 100 responses per month? That's another tier.

For freelancers, small teams, and side projects, Typeform's pricing doesn't make sense. You're paying a monthly subscription to collect a few dozen responses.

### JotForm: powerful, but bloated

JotForm has every feature you could imagine — and that's the problem. The builder is overwhelming. Hundreds of widgets, integrations, and settings panels compete for attention. It's the enterprise Swiss Army knife of forms, which is great if you need HIPAA compliance and payment processing, but overkill if you just want a clean feedback form.

JotForm also limits submissions on its free plan (100/month) and locks essential features like conditional logic behind paid tiers.

### SurveyMonkey: built for surveys, stuck in the past

SurveyMonkey is excellent for academic-style surveys but struggles with modern use cases. The interface feels dated, the free plan limits you to 10 questions, and exporting data requires a paid plan. It's a tool designed for a specific era of web forms, and it shows.

### The common thread

Across all of these tools, the same issues keep showing up:

- **Account walls** — You can't do anything without signing up first.
- **Data ownership** — Your data lives on someone else's servers, governed by their privacy policy.
- **Pricing tiers** — The features you actually need (logic, branding, exports) are locked behind paid plans.
- **Vendor lock-in** — Your forms and responses are trapped in a proprietary format.
- **No offline support** — Lose your connection, lose your work.

## How Ephemeral Forms is different

Ephemeral Forms takes a fundamentally different approach. Instead of starting with a cloud service and adding privacy disclaimers, we started with a local-first architecture and added sharing when you need it.

### No account required — ever

Open the app and start building. Your forms are stored in your browser's IndexedDB. There's no sign-up flow, no email verification, no "free trial" countdown. You own the tool from the first click.

### Your data stays yours

Forms and responses live on your device by default. Nothing touches a server unless you explicitly generate a share link. When you do share, data syncs to Firestore with passphrase-based encryption — no email/password accounts, no OAuth tokens, no profile data collected.

### AI does the heavy lifting

Describe your form in plain English — "a job application with experience levels and a cover letter upload" — and our AI generates the entire structure. Title, sections, question types, validation rules. You can refine from there or use it as-is. No dragging 15 fields onto a canvas one by one.

### Actually free

There's no paid tier. No "upgrade to unlock conditional logic." No response limits. Every feature — multi-step forms, field validation, analytics, plugins, AI generation, real-time sharing — is available to everyone.

### Works offline

Built as a Progressive Web App, Ephemeral Forms works without an internet connection. Build forms on a plane, collect responses in a field clinic, review analytics on a train. Your data syncs when connectivity returns.

### Extensible by design

Our plugin system lets you add custom question types — rating stars, signature pads, math equations, steppers — without forking the core. Build a plugin, drop it in, and it's available across all your forms.

## Key highlights

- **AI-powered generation** — Describe what you need in plain English. Our AI builds the form for you, complete with title, sections, and field types.
- **Multi-step forms** — Break long forms into logical steps with progress tracking and conditional routing.
- **Field validation** — Email, phone, URL, regex patterns, min/max constraints — all configurable per field.
- **Plugin system** — Rating stars, signature pads, MathJax, conditional logic, and more. Build your own plugins with a simple API.
- **Cover images** — Add visual personality to your forms with cover photos that display in the hero section.
- **Real-time collaboration** — Share forms with magic links. Responses sync in real-time. Manage from any device with your passphrase.
- **Built-in analytics** — Charts, completion rates, response timelines, and per-question breakdowns — no third-party tools needed.
- **WordPress integration** — Embed forms on your WordPress site with a shortcode or Gutenberg block.

## What's next

We're actively building. Expect deeper analytics, webhook integrations, and a theme builder in upcoming releases. If you'd like to contribute or have ideas, check out the project on [GitHub](https://github.com/ra9/ephemeral-forms).

[Get started now](/#/) — no sign-up required.
