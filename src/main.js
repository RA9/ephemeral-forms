import './styles/variables.css';
import './styles/base.css';
import './styles/components.css';
import './styles/layout.css';
import './builder/styles.css';
import './responder/styles.css';
import './dashboard/styles.css';
import './plugins/styles.css';
import './docs/styles.css';
import './blog/styles.css';
import './settings/styles.css';

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
import { renderBlogList, renderBlogPost } from './blog/Blog.js';
import { renderSettings } from './settings/Settings.js';
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
import { setMeta } from './utils/meta.js';

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
    const shell = document.querySelector('.app-shell');
    if (shell) shell.classList.add('responder-mode');
    setMeta(null, 'Create beautiful forms instantly with AI. No sign-up, offline-first, privacy by design.');
    return renderLandingPage(contentArea);
  });

  registerRoute('/dashboard', () => {
    const shell = document.querySelector('.app-shell');
    if (shell) shell.classList.remove('responder-mode');
    setMeta('Dashboard', 'Manage your forms, view responses, and track analytics.');
    return renderDashboard(contentArea);
  });

  registerRoute('/build', () => {
    const shell = document.querySelector('.app-shell');
    if (shell) shell.classList.remove('responder-mode');
    setMeta('Create Form', 'Build a new form with the drag-and-drop builder or AI generation.');
    return renderFormBuilder(contentArea);
  });

  registerRoute('/build/:id', (params) => {
    const shell = document.querySelector('.app-shell');
    if (shell) shell.classList.remove('responder-mode');
    setMeta('Edit Form', 'Edit your form with the drag-and-drop builder.');
    return renderFormBuilder(contentArea, params.id);
  });
  registerRoute('/form/:id', (params) => {
    const shell = document.querySelector('.app-shell');
    if (shell) shell.classList.add('responder-mode');
    setMeta('Form', 'Fill out this form.');
    return renderFormResponder(contentArea, params.id);
  });
  registerRoute('/share/:token', (params) => {
    const shell = document.querySelector('.app-shell');
    if (shell) shell.classList.add('responder-mode');
    setMeta('Shared Form', 'Fill out this shared form.');
    return renderSharedFormResponder(contentArea, params.token);
  });
  registerRoute('/manage/:formId', (params) => {
    const shell = document.querySelector('.app-shell');
    if (shell) shell.classList.remove('responder-mode');
    setMeta('Manage Form', 'View responses, collaborators, and audit logs for this shared form.');
    return renderManageDashboard(contentArea, params.formId);
  });
  registerRoute('/form/:id/responses', (params) => {
    setMeta('Form Analytics', 'View response data and analytics for this form.');
    return renderFormAnalytics(contentArea, params.id);
  });
  registerRoute('/plugins', () => {
    const shell = document.querySelector('.app-shell');
    if (shell) shell.classList.remove('responder-mode');
    setMeta('Plugins', 'Extend your forms with custom question types and features.');
    return renderPluginManager(contentArea);
  });
  registerRoute('/settings', () => {
    const shell = document.querySelector('.app-shell');
    if (shell) shell.classList.remove('responder-mode');
    setMeta('Settings', 'Configure workspace preferences and share link expiry.');
    return renderSettings(contentArea);
  });
  registerRoute('/docs', () => {
    const shell = document.querySelector('.app-shell');
    if (shell) shell.classList.add('responder-mode');
    setMeta('Documentation', 'Learn how to use Ephemeral Forms — guides, API reference, and plugin development.');
    return renderDocs(contentArea);
  });
  registerRoute('/blog', () => {
    const shell = document.querySelector('.app-shell');
    if (shell) shell.classList.add('responder-mode');
    setMeta('Blog', 'Updates, guides, and behind-the-scenes from the Ephemeral Forms team.');
    return renderBlogList(contentArea);
  });
  registerRoute('/blog/:slug', (params) => {
    const shell = document.querySelector('.app-shell');
    if (shell) shell.classList.add('responder-mode');
    // Title set dynamically by renderBlogPost
    return renderBlogPost(contentArea, params.slug);
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
    if ((hash.startsWith('#/form/') && !hash.endsWith('/responses')) || hash.startsWith('#/share/') || hash === '#/docs' || hash.startsWith('#/blog')) {
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
