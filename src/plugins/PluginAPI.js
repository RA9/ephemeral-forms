// Plugin API — Extensible architecture for Ephemeral Forms
// Plugins can register question types, themes, hooks, export formats, and validators

import { registerQuestionType } from '../builder/questionTypes.js';

const plugins = new Map();
const hooks = {
  onFormCreate: [],
  onFormSubmit: [],
  onFormSave: [],
  onResponseView: [],
  onExport: [],
};

class PluginAPI {
  constructor(pluginId) {
    this.pluginId = pluginId;
  }

  /**
   * Register a new question type
   * @param {string} type - Unique type identifier
   * @param {object} config - { label, icon, category, getDefault, render, validate }
   */
  registerQuestionType(type, config) {
    registerQuestionType(type, { ...config, pluginId: this.pluginId });
  }

  /**
   * Register a hook
   * @param {string} hookName - Hook name (onFormCreate, onFormSubmit, etc.)
   * @param {function} callback - Hook callback
   */
  registerHook(hookName, callback) {
    if (hooks[hookName]) {
      hooks[hookName].push({ pluginId: this.pluginId, callback });
    }
  }

  /**
   * Register a custom CSS theme
   * @param {string} name - Theme name
   * @param {object} variables - CSS variable overrides
   */
  registerTheme(name, variables) {
    const style = document.createElement('style');
    style.id = `plugin-theme-${this.pluginId}-${name}`;
    const vars = Object.entries(variables)
      .map(([key, val]) => `${key}: ${val};`)
      .join('\n  ');
    style.textContent = `[data-plugin-theme="${name}"] {\n  ${vars}\n}`;
    document.head.appendChild(style);
  }

  /**
   * Register a custom export format
   * @param {string} format - Format name (e.g., 'xlsx', 'pdf')
   * @param {function} exporter - Export function(form, responses) => void
   */
  registerExportFormat(format, exporter) {
    hooks.onExport.push({ pluginId: this.pluginId, format, callback: exporter });
  }
}

/**
 * Register a plugin
 * @param {object} pluginDef - { id, name, description, version, icon, setup(api) }
 */
export function registerPlugin(pluginDef) {
  if (plugins.has(pluginDef.id)) return;
  
  const api = new PluginAPI(pluginDef.id);
  const plugin = {
    ...pluginDef,
    enabled: true,
    api,
  };
  
  plugins.set(pluginDef.id, plugin);
  
  // Run setup or init
  if (typeof pluginDef.setup === 'function') {
    pluginDef.setup(api);
  } else if (typeof pluginDef.init === 'function') {
    pluginDef.init(api);
  }
}

// Expose globally for custom plugins loaded from IndexedDB or external URLs
window.EphemeralPlugins = {
  register: registerPlugin
};

export function getPlugin(id) {
  return plugins.get(id);
}

export function getAllPlugins() {
  return Array.from(plugins.values());
}

export function enablePlugin(id) {
  const plugin = plugins.get(id);
  if (plugin) plugin.enabled = true;
}

export function disablePlugin(id) {
  const plugin = plugins.get(id);
  if (plugin) plugin.enabled = false;
}

export async function runHook(hookName, data) {
  if (!hooks[hookName]) return data;
  for (const { pluginId, callback } of hooks[hookName]) {
    const plugin = plugins.get(pluginId);
    if (plugin?.enabled) {
      try {
        const result = await callback(data);
        if (result !== undefined) data = result;
      } catch (err) {
        console.warn(`Plugin ${pluginId} hook ${hookName} error:`, err);
      }
    }
  }
  return data;
}

export function getExportFormats() {
  return hooks.onExport
    .filter(h => plugins.get(h.pluginId)?.enabled)
    .map(h => ({ format: h.format, pluginId: h.pluginId, export: h.callback }));
}
