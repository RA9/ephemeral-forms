=== Ephemeral Forms ===
Contributors: ephemeralforms
Tags: forms, survey, embed, privacy, offline
Requires at least: 5.8
Tested up to: 6.5
Requires PHP: 7.4
Stable tag: 1.0.0
License: MIT

Embed privacy-first, offline-capable forms into any WordPress page or post.

== Description ==

Ephemeral Forms lets you embed beautiful, privacy-first forms into your WordPress site. Forms are built on the Ephemeral Forms platform and embedded via share links.

**Features:**

* Shortcode and Gutenberg block support
* Responsive iframe embed that adapts to any layout
* Configurable height
* Accepts share tokens or full share URLs
* Self-hosted or cloud — point to any Ephemeral Forms instance

== Installation ==

1. Upload the `ephemeral-forms` folder to `/wp-content/plugins/`
2. Activate the plugin through the Plugins menu
3. (Optional) Go to Settings > Ephemeral Forms to set your app base URL

== Usage ==

**Shortcode:**

`[ephemeral_form token="YOUR_SHARE_TOKEN"]`

`[ephemeral_form token="YOUR_SHARE_TOKEN" height="700"]`

**Gutenberg Block:**

Search for "Ephemeral Form" in the block inserter. Paste your share token or URL into the input field.

== Frequently Asked Questions ==

= Where do I get a share token? =

Build a form on your Ephemeral Forms app, click Share, and copy the share link. The token is the last part of the URL (e.g. `abc123def456`).

= Can I self-host the app? =

Yes. Deploy the Ephemeral Forms app to your own server and update the base URL in Settings > Ephemeral Forms.

= Are responses stored on my WordPress site? =

No. Responses are handled by the Ephemeral Forms app (locally or via Firebase). This plugin only embeds the form.

== Changelog ==

= 1.0.0 =
* Initial release
* Shortcode support
* Gutenberg block with live preview
* Settings page for base URL configuration
