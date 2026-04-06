# Contributing to Ephemeral Forms

First off, thank you for considering contributing to Ephemeral Forms! It's people like you that make this a great tool for everyone.

## 📝 Code of Conduct

Help us keep Ephemeral Forms open and inclusive. Please read and follow our [Code of Conduct](CODE_OF_CONDUCT.md).

## 🚀 How to Contribute

### 1. Reporting Bugs
- Check the [Issues](https://github.com/your-username/eform/issues) to see if the bug has already been reported.
- If not, create a new issue. Include steps to reproduce, expected behavior, and actual behavior.

### 2. Suggesting Enhancements
- Open a new issue with a clear title and description of the suggested feature.

### 3. Pull Requests
- Fork the repository.
- Create a new branch: `git checkout -b feature/my-new-feature`.
- Make your changes and commit them: `git commit -m 'Add some feature'`.
- Push to the branch: `git push origin feature/my-new-feature`.
- Open a Pull Request.

## 🧩 Developing Plugins

One of the best ways to contribute is by building new plugins! Here's a quick guide:

1. Create your plugin file in `src/plugins/custom/myPlugin.js`.
2. Use the `PluginAPI` to register your plugin:
   ```javascript
   import { registerPlugin } from '../PluginAPI.js';

   registerPlugin({
     id: 'my-custom-plugin',
     name: 'My Custom Plugin',
     description: 'Describe what it does.',
     version: '1.0',
     icon: '🧩',
     setup(api) {
       // Register new question types, hooks, or themes
       api.registerQuestionType('my_new_type', {
         // ...
       });
     }
   });
   ```
3. Import your plugin in `src/main.js` to enable it.

## 🎨 Style Guide

- Follow standard JavaScript ESM practices.
- Use CSS variables from `variables.css` for styling to maintain theme consistency.
- Keep components modular and single-purpose.

## 🛠 Development Workflow

1. Run `npm install` to install dependencies.
2. Run `npm run dev` to start the development server.
3. Test your changes in both light and dark modes.

Thanks again for your contribution!
