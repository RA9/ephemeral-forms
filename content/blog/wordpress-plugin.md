---
title: Embed Ephemeral Forms in WordPress
slug: wordpress-plugin
date: 2026-04-12
author: Ephemeral Forms Team
summary: Our official WordPress plugin lets you embed privacy-first forms into any page or post — with a shortcode or Gutenberg block.
tags: wordpress, guide, integration
---

# Embed Ephemeral Forms in WordPress

You've built a beautiful form on Ephemeral Forms. Now you want it on your WordPress site. We just shipped an official plugin that makes this dead simple — no code, no iframes to wrangle manually, just paste your share token and go.

## Download & Install

1. **Download** the plugin ZIP from the [Ephemeral Forms landing page](/#/).
2. In your WordPress admin, go to **Plugins > Add New > Upload Plugin**.
3. Choose the ZIP file and click **Install Now**.
4. Click **Activate**.

That's it. No API keys, no accounts, no configuration required.

## Option 1: Shortcode

Drop this into any page, post, or widget:

```
[ephemeral_form token="YOUR_SHARE_TOKEN"]
```

The `token` is the last segment of your share link. For example, if your share URL is:

```
https://ephemeralforms.web.app/#/share/abc123def456
```

Then your token is `abc123def456`.

You can also set a custom height (default is 600px):

```
[ephemeral_form token="abc123def456" height="800"]
```

## Option 2: Gutenberg Block

If you're using the block editor:

1. Click the **+** block inserter.
2. Search for **Ephemeral Form**.
3. Paste your share token or the full share URL — the plugin extracts the token automatically.
4. Adjust the height in the sidebar settings (300–1200px).

You'll see a live preview of your form right in the editor.

## Configuration

By default, the plugin points to the hosted app at `https://ephemeralforms.web.app`. If you self-host Ephemeral Forms, go to **Settings > Ephemeral Forms** and update the base URL.

## How It Works

The plugin embeds your form in a responsive iframe. The form runs entirely in the respondent's browser — no data passes through your WordPress server. Responses flow to wherever your Ephemeral Forms app stores them (locally or via Firebase).

This means:

- **No extra database tables** on your WordPress site.
- **No server load** — the form is a standalone app.
- **Privacy by design** — responses never touch your WP server.

## Tips

- **Responsive layout**: The iframe is 100% width by default and fits any theme.
- **Multiple forms**: Use as many shortcodes or blocks as you want on a single page.
- **Expiring links**: If your share link expires, update the token in the shortcode or block — no need to reinstall anything.
- **Full-width alignment**: The Gutenberg block supports wide and full-width alignments.

## What's Next

This is v1 — a lightweight embed approach. We're exploring a deeper native integration for v2 that would store responses directly in your WordPress database and provide a builder inside the WP admin. If that interests you, let us know.

---

Get the plugin from the [downloads section](/#/) on our landing page, or grab it directly from the [GitHub repository](https://github.com/ra9/ephemeral-forms).
