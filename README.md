# ✦ Ephemeral Forms

Ephemeral Forms is a modern, zero-login, offline-first form builder. Built with a focus on privacy and speed, all your forms and responses are stored directly in your browser's IndexedDB. No accounts, no servers, and no tracking required.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![PWA](https://img.shields.io/badge/PWA-Ready-success)
![Storage](https://img.shields.io/badge/Storage-IndexedDB-orange)

## ✨ Features

- **📊 Dashboard & Analytics**: Track responses with beautiful Chart.js visualizations.
- **📝 Powerful Form Builder**: Drag-and-drop reordering, 10+ question types, and instant auto-save.
- **🧩 Plugin System**: Extend the app with custom question types, themes, and hooks.
- **🔀 Conditional Logic**: Create dynamic, branching forms that react to user input.
- **✍️ Advanced Inputs**: Signature pads, star ratings, file uploads, and more.
- **📱 Responsive & PWA**: Fully mobile-ready and installable for offline use.
- **🔒 Privacy First**: All data stays in your browser. No login, no cloud, no leaks.

## 🚀 Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm (v6 or higher)

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/your-username/eform.git
   cd eform
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

### Building for Production

To create a production-ready bundle:
```bash
npm run build
```

## 🏗 Tech Stack

- **Core**: Vite, Vanilla JavaScript
- **Storage**: IndexedDB (via [idb](https://www.npmjs.com/package/idb))
- **Charts**: [Chart.js](https://www.chartjs.org/)
- **UI**: Modern Vanilla CSS (Glassmorphism, Dark Mode)
- **Utilities**: SortableJS, UUID

## 🧩 Plugins

Ephemeral Forms features a modular plugin system. You can easily extend the application by building or loading custom JavaScript plugins right from the **Plugin Manager** UI.

### Built-in Plugins
- **Rating Stars**: Interactive 1-5 or 1-10 star rating questions.
- **Signature Pad**: Canvas-based signature input with touch support.
- **Conditional Logic**: Basic branching and logic engine for dynamic forms.

### Adding Custom Plugins
1. Open the **Plugins** page from the sidebar menu.
2. Click **Add Custom Plugin**.
3. Paste your plugin JavaScript code (which must call `window.EphemeralPlugins.register(...)`).
4. Click Install! The plugin will be saved to IndexedDB and automatically loaded every time you open the app.

## 🗺️ Roadmap

Here are the features prioritized for future development:

1. **Advanced Routing Engine**: Deeper conditional logic with multi-path branching and skip logic.
2. **Offline Data Sync (Backend Integration)**: Ability to optionally configure Firebase or Supabase to sync your local queue automatically when network is restored.
3. **Webhooks & Integrations**: Send submissions instantly to Zapier, Google Sheets, or Slack.
4. **Theme Builder UI**: A visual editor to define custom typography, layout spacing, and complex color palettes beyond the single primary hex code.
5. **Collaborative Editing**: Peer-to-peer form editing over WebRTC.

## 🤝 Contributing

We welcome contributions! Please see our [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines on how to get started.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
