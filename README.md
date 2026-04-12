# Ephemeral Forms

A modern, zero-login, offline-first form builder with AI-powered generation, real-time collaboration, and cross-device sync. Built entirely with vanilla JavaScript — no frameworks, no bloat.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![PWA](https://img.shields.io/badge/PWA-Ready-success)
![Storage](https://img.shields.io/badge/Storage-IndexedDB-orange)
![Firebase](https://img.shields.io/badge/Cloud-Firebase-yellow)

## Features

### Core
- **Form Builder** — Drag-and-drop reordering, 10+ question types, multi-step forms, auto-save, and cover image uploads
- **AI Form Generation** — Describe what you need in plain text, get a complete form with title, description, and questions (powered by Qwen3-8B via HuggingFace Inference)
- **Field Validation** — Built-in validators for email, URL, phone, number, zip code, min/max length, date ranges, regex patterns, and more
- **Dashboard & Analytics** — Track responses with Chart.js sparklines, per-question insights, and timeline views
- **Form Responder** — Clean, themed response pages with cover images, progress steppers, and wave hero headers

### Collaboration & Sync
- **Passphrase-Based Identity** — No email/password accounts. Create an identity with a name and passphrase, sync across devices
- **Magic Link Sharing** — Share forms via expiring links with real-time Firestore sync
- **Cross-Device Management** — Access shared form responses from any device via the Manage Dashboard
- **Collaborators & Audit Trails** — Invite collaborators with invite codes, track all activity

### Plugins
- **Plugin System** — Extend with custom question types, themes, and hooks via `window.EphemeralPlugins.register()`
- **Built-in Plugins** — Rating stars, signature pad, conditional logic, form stepper, MathJax display
- **Cloud Plugin Sync** — Custom plugins sync to Firestore and load on shared form responses

### Infrastructure
- **Offline-First PWA** — IndexedDB primary storage, service worker with SPA fallback, installable
- **Dark Mode** — Full theme support with CSS custom properties
- **Google Analytics** — Route-level page view tracking
- **GitHub Pages CI/CD** — Automated build and deploy via GitHub Actions

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Build | Vite 6 |
| Language | Vanilla JavaScript (ES modules) |
| Local Storage | IndexedDB via [idb](https://www.npmjs.com/package/idb) |
| Cloud | Firebase Firestore |
| AI | HuggingFace Inference API (Qwen3-8B on Fireworks) |
| Charts | Chart.js 4 |
| Icons | Lucide |
| Drag & Drop | SortableJS |
| Crypto | Web Crypto API (PBKDF2) |
| Analytics | Google Analytics 4 |

## Getting Started

### Prerequisites

- Node.js 18+
- npm 8+
- A Firebase project (for sharing/sync features)
- HuggingFace API token (for AI generation, optional)

### Installation

```bash
git clone https://github.com/csnamah/ephemeral-forms.git
cd ephemeral-forms
npm install
```

### Environment Variables

Create a `.env` file in the project root:

```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_GA_MEASUREMENT_ID=G-XXXXXXXXXX
VITE_HF_TOKEN=hf_your_token
```

Firebase and HuggingFace tokens are optional — the app works fully offline without them.

### Development

```bash
npm run dev
```

### Production Build

```bash
npm run build
npm run preview
```

## Project Structure

```
src/
  ai/              # AI form generation (HuggingFace integration)
  builder/         # Form builder, question types, validators
  dashboard/       # Dashboard, analytics, manage dashboard
  docs/            # In-app documentation
  firebase/        # Firebase config, share service, creator service, image service
  landing/         # Landing page
  plugins/         # Plugin system and built-in plugins
  responder/       # Form responder (local + shared)
  sharing/         # Share modal
  storage/         # IndexedDB stores (forms, responses, plugins, creator)
  styles/          # Global CSS (variables, base, components, layout)
  utils/           # Crypto utilities
```

## Deployment

The project includes a GitHub Actions workflow (`.github/workflows/deploy.yml`) that automatically builds and deploys to GitHub Pages on push to `main`. Add your environment variables as repository secrets.

## Firebase Setup

### Firestore Rules

Deploy the included `firestore.rules`:

```bash
firebase deploy --only firestore:rules
```

Collections used: `creators`, `shared_forms`, `magic_links`, `shared_responses`, `collaborators`, `invite_codes`, `audit_logs`, `shared_plugins`

## Contributing

Contributions welcome! Please open an issue or submit a pull request.

## License

MIT License — see [LICENSE](LICENSE) for details.

---

Made with ❤️ Grand Kru.
