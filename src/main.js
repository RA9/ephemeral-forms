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

// ---- Google Analytics ----
const GA_ID = import.meta.env.VITE_GA_MEASUREMENT_ID;
if (GA_ID) {
  const script = document.createElement('script');
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_ID}`;
  document.head.appendChild(script);

  window.dataLayer = window.dataLayer || [];
  window.gtag = function () { window.dataLayer.push(arguments); };
  window.gtag('js', new Date());
  window.gtag('config', GA_ID, { send_page_view: false });
}

function trackPageView(path) {
  if (GA_ID && window.gtag) {
    window.gtag('event', 'page_view', { page_path: path });
  }
}

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
  trackPageView(window.location.hash.replace('#', '') || '/');
}

// Global responder mode CSS cleanup + analytics
window.addEventListener('hashchange', () => {
  const hash = window.location.hash;
  const shell = document.querySelector('.app-shell');
  if (shell) {
    if ((hash.startsWith('#/form/') && !hash.endsWith('/responses')) || hash.startsWith('#/share/') || hash === '#/docs') {
      shell.classList.add('responder-mode');
    } else {
      shell.classList.remove('responder-mode');
    }
  }
  trackPageView(hash.replace('#', '') || '/');
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
