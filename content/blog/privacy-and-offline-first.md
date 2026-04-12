---
title: Privacy by Design — Why Offline-First Matters
slug: privacy-and-offline-first
date: 2026-04-10
author: Ephemeral Forms Team
summary: Your data stays in your browser. Here's why we built it that way and what it means for you.
tags: privacy, architecture
---

# Privacy by Design — Why Offline-First Matters

Most form builders store everything on their servers. Your questions, your respondents' answers, their email addresses — all sitting in someone else's database, governed by someone else's privacy policy.

We took a different approach.

## Your browser is the database

Every form you create and every response you collect is stored in IndexedDB — a database built into your browser. It's fast, it's persistent, and it's yours.

This means:

- **No account required** — Start building immediately
- **No data leaves your device** — Unless you explicitly share a form
- **No vendor lock-in** — Your data isn't trapped in our infrastructure
- **Works offline** — Create and edit forms without an internet connection

## When you choose to share

Sometimes you need collaborators to fill out your form. That's where our sharing system comes in:

1. You generate a magic link
2. The form syncs to Firebase Firestore
3. Respondents submit through the shared link
4. You can manage responses from any device using your passphrase

The key word is *choose*. Sharing is opt-in, per-form, and uses expiring links. Nothing is shared by default.

## Passphrase-based identity

We don't use email/password accounts. Instead, you create a simple identity with a display name and a passphrase. The passphrase is hashed with PBKDF2 (100,000 iterations, SHA-256) — we never store it in plain text, and we never see it.

This gives you cross-device sync without requiring an email address, OAuth provider, or any personally identifiable information.

## The trade-off

Offline-first means if you clear your browser data, your local forms are gone. That's the trade-off for true privacy. For important forms, use the share feature to sync them to the cloud as a backup.

We believe this trade-off is worth it. Your data, your rules.
