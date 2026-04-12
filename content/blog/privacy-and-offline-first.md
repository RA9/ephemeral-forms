---
title: Privacy by Design — Why Offline-First Matters
slug: privacy-and-offline-first
date: 2026-04-12
author: Ephemeral Forms Team
summary: Your data stays in your browser, and when it leaves, it's encrypted end-to-end. Here's why we built it that way.
tags: privacy, architecture, encryption
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

## End-to-end encrypted responses

Even when you share a form and responses flow through our servers, we can't read them. Every shared form is protected by end-to-end encryption, enabled by default.

Here's how it works:

### The encryption model

When you share a form, Ephemeral Forms generates a random **AES-256 encryption key** — the form key. This key is used to encrypt every response before it's stored in our database. The encryption uses **AES-256-GCM**, a standard used by banks, governments, and security-critical applications worldwide.

The form key itself is then **wrapped** (encrypted) using a key derived from your passphrase via **PBKDF2** with 100,000 iterations of SHA-256. The wrapped key is stored on our servers. The raw form key is not.

### Where the key lives

The raw encryption key is embedded in the share link as a URL fragment parameter (`#/share/token?ek=...`). URL fragments are never sent to servers — they stay in the browser. This means:

- **Our servers never see the encryption key** — It exists only in the share URL and in the respondent's browser
- **Responses are encrypted before they leave the respondent's device** — What we store is ciphertext
- **Only you can decrypt responses** — Using your passphrase to unwrap the form key

This is the same principle behind zero-knowledge file sharing tools and end-to-end encrypted messaging apps.

### What this means in practice

When a respondent fills out your shared form, their answers are encrypted in their browser using the form key from the URL. The encrypted data is then sent to Firestore. If someone were to access the database directly — whether through a breach, a subpoena, or an insider — they would see only encrypted blobs, not readable answers.

When you open the Manage Dashboard and enter your passphrase, the system:

1. Derives a decryption key from your passphrase using PBKDF2
2. Unwraps the stored form key
3. Decrypts each response locally in your browser

The decryption happens entirely client-side. Your passphrase never leaves your device.

### The analytics page

If you're viewing analytics for a shared form from the device where you originally shared it, the form key is stored locally in your browser's share metadata. Responses are decrypted automatically — no passphrase prompt needed. On a different device, use the Manage Dashboard to authenticate with your passphrase and view decrypted responses.

## Passphrase-based identity

We don't use email/password accounts. Instead, you create a simple identity with a display name and a passphrase. The passphrase is hashed with PBKDF2 (100,000 iterations, SHA-256) — we never store it in plain text, and we never see it.

This gives you cross-device sync without requiring an email address, OAuth provider, or any personally identifiable information.

Your passphrase also serves as the master key for response encryption. One passphrase protects both your identity and your data.

## How we compare

| Feature | Google Forms | Typeform | Ephemeral Forms |
|---|---|---|---|
| Data storage | Google servers | Typeform servers | Your browser (IndexedDB) |
| Account required | Yes (Google) | Yes (email) | No |
| Response encryption | At rest (Google managed) | At rest (Typeform managed) | End-to-end (AES-256-GCM) |
| Who holds the key | Google | Typeform | You |
| Offline support | No | No | Yes (PWA) |
| Server can read responses | Yes | Yes | No |

## The trade-off

Offline-first means if you clear your browser data, your local forms are gone. And with end-to-end encryption, if you lose your passphrase, your encrypted responses can't be recovered — not even by us. That's the trade-off for true privacy.

For important forms, use the share feature to sync them to the cloud as an encrypted backup. And keep your passphrase safe.

We believe this trade-off is worth it. Your data, your rules, your keys.
