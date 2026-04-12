import { createIcons, Settings, Clock, RefreshCw, Link } from 'lucide';
import { getAllSettings, setSetting } from '../storage/settingsStore.js';
import { showToast } from '../utils.js';
import { refreshLinkExpiry } from '../firebase/shareService.js';
import { getShareMeta, saveShareMeta } from '../storage/shareStore.js';
import { listForms } from '../storage/formStore.js';

const EXPIRY_OPTIONS = [
  { value: 1, label: '1 day' },
  { value: 3, label: '3 days' },
  { value: 7, label: '1 week' },
  { value: 14, label: '2 weeks' },
  { value: 30, label: '30 days' },
];

export async function renderSettings(container) {
  const settings = await getAllSettings();
  const forms = await listForms();

  // Collect forms that have share metadata
  const sharedForms = [];
  for (const form of forms) {
    const meta = await getShareMeta(form.id);
    if (meta?.shared) {
      sharedForms.push({ form, meta });
    }
  }

  function render() {
    container.innerHTML = `
      <div class="page-container settings-page fade-in">
        <div class="page-title-row">
          <div>
            <h1 class="page-title"><i data-lucide="settings" style="width:22px;height:22px;vertical-align:-3px;margin-right:var(--space-2);"></i> Settings</h1>
            <p class="page-subtitle">Configure global preferences for your workspace.</p>
          </div>
        </div>

        <div class="settings-sections">
          <!-- Share Link Expiry -->
          <section class="settings-section card">
            <div class="settings-section-header">
              <div class="settings-section-icon" style="background:rgba(108,92,231,0.1);color:var(--primary-500);">
                <i data-lucide="clock" style="width:18px;height:18px;"></i>
              </div>
              <div>
                <h2 class="settings-section-title">Share Link Expiry</h2>
                <p class="settings-section-desc">Set how long generated sharing links remain active before they expire.</p>
              </div>
            </div>

            <div class="settings-field">
              <label class="settings-label">Default expiry duration</label>
              <div class="settings-select-wrap">
                <select class="input settings-select" id="expiry-select">
                  ${EXPIRY_OPTIONS.map(o =>
                    `<option value="${o.value}" ${settings.shareLinkExpiry === o.value ? 'selected' : ''}>${o.label}</option>`
                  ).join('')}
                </select>
              </div>
              <p class="settings-hint">New share links will expire after this duration. Existing links are not affected.</p>
            </div>

            <div class="settings-actions">
              <button class="btn btn-primary btn-sm" id="save-expiry">Save</button>
            </div>
          </section>

          <!-- Refresh Link Expiry -->
          ${sharedForms.length ? `
          <section class="settings-section card">
            <div class="settings-section-header">
              <div class="settings-section-icon" style="background:rgba(0,184,148,0.1);color:var(--accent-500);">
                <i data-lucide="refresh-cw" style="width:18px;height:18px;"></i>
              </div>
              <div>
                <h2 class="settings-section-title">Refresh Link Expiry</h2>
                <p class="settings-section-desc">Extend the expiry of active sharing links without regenerating them.</p>
              </div>
            </div>

            <div class="settings-shared-list">
              ${sharedForms.map(({ form, meta }) => {
                const expiresAt = meta.expiresAt ? new Date(meta.expiresAt) : null;
                const isExpired = expiresAt && expiresAt < new Date();
                const timeLeft = expiresAt ? formatTimeLeft(expiresAt) : 'Unknown';
                return `
                  <div class="settings-shared-item">
                    <div class="settings-shared-info">
                      <span class="settings-shared-name">${form.title || 'Untitled Form'}</span>
                      <span class="settings-shared-expiry ${isExpired ? 'expired' : ''}">
                        <i data-lucide="link" style="width:12px;height:12px;"></i>
                        ${isExpired ? 'Expired' : timeLeft}
                      </span>
                    </div>
                    <button class="btn btn-secondary btn-sm settings-refresh-btn" data-form-id="${form.id}" ${isExpired ? 'disabled' : ''}>
                      <i data-lucide="refresh-cw" style="width:14px;height:14px;"></i> Refresh
                    </button>
                  </div>
                `;
              }).join('')}
            </div>
          </section>
          ` : ''}
        </div>
      </div>
    `;

    createIcons({ icons: { Settings, Clock, RefreshCw, Link } });

    // Save expiry
    container.querySelector('#save-expiry')?.addEventListener('click', async () => {
      const val = parseInt(container.querySelector('#expiry-select')?.value, 10);
      await setSetting('shareLinkExpiry', val);
      settings.shareLinkExpiry = val;
      showToast(`Default expiry set to ${EXPIRY_OPTIONS.find(o => o.value === val)?.label}`, 'success');
    });

    // Refresh buttons
    container.querySelectorAll('.settings-refresh-btn').forEach(btn => {
      btn.addEventListener('click', async () => {
        const formId = btn.dataset.formId;
        btn.disabled = true;
        btn.innerHTML = '<i data-lucide="refresh-cw" style="width:14px;height:14px;"></i> Refreshing...';
        createIcons({ icons: { RefreshCw } });

        try {
          const result = await refreshLinkExpiry(formId, settings.shareLinkExpiry);
          const meta = await getShareMeta(formId);
          await saveShareMeta(formId, { ...meta, expiresAt: result.expiresAt });
          showToast('Link expiry refreshed!', 'success');
          render();
        } catch (err) {
          showToast('Failed: ' + err.message, 'error');
          btn.disabled = false;
          btn.innerHTML = '<i data-lucide="refresh-cw" style="width:14px;height:14px;"></i> Refresh';
          createIcons({ icons: { RefreshCw } });
        }
      });
    });
  }

  render();
}

function formatTimeLeft(expiresAt) {
  const diff = expiresAt - new Date();
  if (diff <= 0) return 'Expired';
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(hours / 24);
  const rem = hours % 24;
  if (days > 0) return `${days}d ${rem}h remaining`;
  if (hours > 0) return `${hours}h remaining`;
  return `${Math.floor(diff / 60000)}m remaining`;
}
