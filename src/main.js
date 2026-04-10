import './styles/variables.css';
import './styles/base.css';
import './styles/components.css';
import './styles/layout.css';
import './builder/styles.css';
import './responder/styles.css';
import './dashboard/styles.css';
import './plugins/styles.css';
import './docs/styles.css';

import { registerRoute, startRouter } from './router.js';
import { renderAppShell } from './app.js';
import { renderDashboard } from './dashboard/Dashboard.js';
import { renderFormBuilder } from './builder/FormBuilder.js';
import { renderFormResponder } from './responder/FormResponder.js';
import { renderSharedFormResponder } from './responder/SharedFormResponder.js';
import { renderFormAnalytics } from './dashboard/FormAnalytics.js';
import { renderManageDashboard } from './dashboard/ManageDashboard.js';

import { renderPluginManager } from './plugins/PluginManager.js';
import { renderDocs } from './docs/Docs.js';
import { getCustomPlugins } from './storage/pluginStore.js';

// Import built-in plugins
import './plugins/builtins/ratingPlugin.js';
import './plugins/builtins/signaturePlugin.js';
import './plugins/builtins/conditionalLogicPlugin.js';
import './plugins/builtins/stepperPlugin.js';
import './plugins/builtins/mathJaxPlugin.js';
import './plugins/builtins/formStepperPlugin.js';

import './landing/styles.css';
import { renderLandingPage } from './landing/Landing.js';

const appElement = document.getElementById('app');

// Initialize App
async function init() {
  const contentArea = renderAppShell(appElement);

  // Load custom plugins (non-blocking — don't hold up routing)
  getCustomPlugins().then(customPlugins => {
    customPlugins.forEach(p => {
      try {
        const script = document.createElement('script');
        script.textContent = p.code;
        document.head.appendChild(script);
      } catch(err) {
        console.error('Failed to execute custom plugin', p.id, err);
      }
    });
  }).catch(err => {
    console.error('Failed to load custom plugins from DB', err);
  });

  // Define Routes
  registerRoute('/', () => {
    // Hide shell for landing
    const shell = document.querySelector('.app-shell');
    if (shell) shell.classList.add('responder-mode');
    return renderLandingPage(contentArea);
  });
  
  registerRoute('/dashboard', () => {
    const shell = document.querySelector('.app-shell');
    if (shell) shell.classList.remove('responder-mode');
    return renderDashboard(contentArea);
  });

  registerRoute('/build', () => {
    const shell = document.querySelector('.app-shell');
    if (shell) shell.classList.remove('responder-mode');
    return renderFormBuilder(contentArea);
  });

  registerRoute('/build/:id', (params) => {
    const shell = document.querySelector('.app-shell');
    if (shell) shell.classList.remove('responder-mode');
    return renderFormBuilder(contentArea, params.id);
  });
  registerRoute('/form/:id', (params) => {
    // Hide sidebar for responder
    const shell = document.querySelector('.app-shell');
    if (shell) shell.classList.add('responder-mode');
    return renderFormResponder(contentArea, params.id);
  });
  registerRoute('/share/:token', (params) => {
    const shell = document.querySelector('.app-shell');
    if (shell) shell.classList.add('responder-mode');
    return renderSharedFormResponder(contentArea, params.token);
  });
  registerRoute('/manage/:formId', (params) => {
    const shell = document.querySelector('.app-shell');
    if (shell) shell.classList.remove('responder-mode');
    return renderManageDashboard(contentArea, params.formId);
  });
  registerRoute('/form/:id/responses', (params) => renderFormAnalytics(contentArea, params.id));
  registerRoute('/plugins', () => {
    const shell = document.querySelector('.app-shell');
    if (shell) shell.classList.remove('responder-mode');
    return renderPluginManager(contentArea);
  });
  registerRoute('/docs', () => {
    const shell = document.querySelector('.app-shell');
    if (shell) shell.classList.add('responder-mode');
    return renderDocs(contentArea);
  });

  // Start Router
  startRouter();
}

// Global responder mode CSS cleanup
window.addEventListener('hashchange', () => {
  const shell = document.querySelector('.app-shell');
  if (shell) {
    const hash = window.location.hash;
    if ((hash.startsWith('#/form/') && !hash.endsWith('/responses')) || hash.startsWith('#/share/') || hash === '#/docs') {
      shell.classList.add('responder-mode');
    } else {
      shell.classList.remove('responder-mode');
    }
  }
});

// PWA Service Worker Registration
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(err => {
      console.log('SW registration failed: ', err);
    });
  });
}

init();
