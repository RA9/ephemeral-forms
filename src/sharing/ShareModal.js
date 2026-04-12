// Share modal — global creator identity + passphrase-based sharing
import { shareForm, getLinkStatus, regenerateLink, resyncSharedForm } from '../firebase/shareService.js';
import { createCreator, verifyCreator, autoSyncFormPlugins } from '../firebase/creatorService.js';
import { saveShareMeta, getShareMeta } from '../storage/shareStore.js';
import { saveCreatorId, getCreatorId, setWorkspaceSession, getWorkspaceSession } from '../storage/creatorStore.js';
import { getCustomPlugins } from '../storage/pluginStore.js';
import { showModal, showToast } from '../utils.js';

function formatTTL(expiresAt) {
  const diff = new Date(expiresAt) - new Date();
  if (diff <= 0) return 'Expired';
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(hours / 24);
  const rem = hours % 24;
  if (days > 0) return `${days}d ${rem}h remaining`;
  if (hours > 0) return `${hours}h remaining`;
  return `${Math.floor(diff / 60000)}m remaining`;
}

function buildShareURL(token) {
  return `${window.location.origin}${window.location.pathname}#/share/${token}`;
}

function buildManageURL(formId) {
  return `${window.location.origin}${window.location.pathname}#/manage/${formId}`;
}

// ---- Active link view ----
function bodyActiveLink(shareUrl, manageUrl, expiresAt) {
  return `
    <div class="share-modal-content">
      <div style="margin-bottom:var(--space-5);">
        <div style="font-size:var(--font-xs);font-weight:600;color:var(--text-secondary);margin-bottom:var(--space-2);text-transform:uppercase;letter-spacing:0.04em;">Respondent Link</div>
        <p style="color:var(--text-tertiary);font-size:var(--font-xs);margin-bottom:var(--space-2);">Share this with anyone to fill out the form.</p>
        <div style="display:flex;gap:var(--space-2);">
          <input type="text" class="input" value="${shareUrl}" readonly style="flex:1;font-size:var(--font-xs);background:var(--bg-tertiary);cursor:text;" />
          <button class="btn btn-primary btn-sm" data-action="copy-share" style="white-space:nowrap;">Copy</button>
        </div>
        <span style="font-size:var(--font-xs);color:var(--text-tertiary);background:var(--bg-tertiary);padding:var(--space-1) var(--space-3);border-radius:var(--radius-full);display:inline-block;margin-top:var(--space-2);">⏳ ${formatTTL(expiresAt)}</span>
      </div>
      <div style="border-top:1px solid var(--border-light);padding-top:var(--space-4);">
        <div style="font-size:var(--font-xs);font-weight:600;color:var(--text-secondary);margin-bottom:var(--space-2);text-transform:uppercase;letter-spacing:0.04em;">Manage Link</div>
        <p style="color:var(--text-tertiary);font-size:var(--font-xs);margin-bottom:var(--space-2);">View responses + manage collaborators from any device.</p>
        <div style="display:flex;gap:var(--space-2);">
          <input type="text" class="input" value="${manageUrl}" readonly style="flex:1;font-size:var(--font-xs);background:var(--bg-tertiary);cursor:text;" />
          <button class="btn btn-secondary btn-sm" data-action="copy-manage" style="white-space:nowrap;">Copy</button>
        </div>
      </div>
    </div>
  `;
}

export async function showShareModal(form) {
  const meta = await getShareMeta(form.id);
  let linkStatus = null;

  if (meta?.shared) {
    try { linkStatus = await getLinkStatus(form.id); } catch { linkStatus = null; }
  }

  if (linkStatus?.active) {
    // Show active link view
    const shareUrl = buildShareURL(linkStatus.token);
    const manageUrl = buildManageURL(form.id);

    const result = await showModal({
      title: 'Share Form Online',
      body: bodyActiveLink(shareUrl, manageUrl, linkStatus.expiresAt),
      actions: [
        { id: 'regenerate', label: 'Regenerate Link', class: 'btn-secondary' },
        { id: 'close', label: 'Done', class: 'btn-primary' },
      ],
    });

    if (result === 'copy-share') {
      try { await navigator.clipboard.writeText(shareUrl); showToast('Respondent link copied!', 'success'); } catch { showToast(shareUrl, 'info', 8000); }
      return showShareModal(form);
    }
    if (result === 'copy-manage') {
      try { await navigator.clipboard.writeText(manageUrl); showToast('Manage link copied!', 'success'); } catch { showToast(manageUrl, 'info', 8000); }
      return showShareModal(form);
    }
    if (result === 'regenerate') {
      try {
        const ws = getWorkspaceSession();
        const res = await regenerateLink(form.id, ws?.displayName || meta?.ownerName || 'Creator');
        await resyncSharedForm(form.id, form);
        await saveShareMeta(form.id, { ...meta, token: res.token, expiresAt: res.expiresAt });
        showToast('New link generated!', 'success');
        return showShareModal(form);
      } catch (err) { showToast('Failed: ' + err.message, 'error'); }
    }
    return;
  }

  // No active link — check if creator identity exists
  const ws = getWorkspaceSession();
  const localCreator = await getCreatorId();

  if (ws) {
    // Workspace session active — share directly with creator identity
    await handleShareWithCreator(form, ws.creatorId, ws.displayName);
  } else if (localCreator) {
    // Creator ID known but no session — ask for passphrase
    await handleCreatorPassphraseAndShare(form, localCreator.creatorId, localCreator.displayName);
  } else {
    // First time — create identity
    await handleFirstTimeSetup(form);
  }
}

// ---- Share with existing workspace session ----
async function handleShareWithCreator(form, creatorId, displayName) {
  const overlay = document.getElementById('modal-overlay');
  overlay.innerHTML = `
    <div class="modal">
      <div class="modal-header">
        <h3 class="modal-title">Share Form Online</h3>
        <button class="btn-icon modal-close" data-action="close">✕</button>
      </div>
      <div class="modal-body">
        <p style="color:var(--text-secondary);font-size:var(--font-sm);margin-bottom:var(--space-4);">
          Sharing as <strong>${displayName}</strong>. A magic link will be generated based on your expiry settings.
        </p>
        <div id="share-error" style="font-size:var(--font-xs);color:var(--error);min-height:16px;"></div>
      </div>
      <div class="modal-footer">
        <button class="btn btn-secondary" data-action="close">Cancel</button>
        <button class="btn btn-primary" id="quick-share-btn">Share Now</button>
      </div>
    </div>
  `;
  overlay.classList.add('active');

  return new Promise((resolve) => {
    const close = () => { overlay.classList.remove('active'); resolve(); };
    overlay.addEventListener('click', function h(e) {
      if (e.target.dataset?.action === 'close' || e.target === overlay) { overlay.removeEventListener('click', h); close(); }
    });

    overlay.querySelector('#quick-share-btn')?.addEventListener('click', async () => {
      const btn = overlay.querySelector('#quick-share-btn');
      const errEl = overlay.querySelector('#share-error');
      btn.textContent = 'Sharing...'; btn.disabled = true;
      try {
        // Use the creator's display name as owner, empty passphrase for the per-form collaborator
        // (the workspace session is the real auth)
        const tempPass = creatorId + '_' + form.id; // deterministic per-form passphrase for backward compat
        const res = await shareForm(form, displayName, tempPass, creatorId);
        await saveShareMeta(form.id, { shared: true, ownerName: displayName, token: res.token, expiresAt: res.expiresAt });
        // Sync custom plugins
        try { const cp = await getCustomPlugins(); await autoSyncFormPlugins(creatorId, form, cp); } catch {}
        close();
        showToast('Form shared!', 'success');
        showShareModal(form);
      } catch (err) {
        errEl.textContent = 'Failed: ' + err.message;
        btn.textContent = 'Share Now'; btn.disabled = false;
      }
    });
  });
}

// ---- Returning creator — ask passphrase then share ----
async function handleCreatorPassphraseAndShare(form, creatorId, displayName) {
  const overlay = document.getElementById('modal-overlay');
  overlay.innerHTML = `
    <div class="modal">
      <div class="modal-header">
        <h3 class="modal-title">Share Form Online</h3>
        <button class="btn-icon modal-close" data-action="close">✕</button>
      </div>
      <div class="modal-body">
        <p style="color:var(--text-secondary);font-size:var(--font-sm);margin-bottom:var(--space-4);">
          Welcome back, <strong>${displayName}</strong>. Enter your passphrase to share this form.
        </p>
        <input type="password" class="input" id="creator-pass" placeholder="Your passphrase" style="font-size:var(--font-sm);margin-bottom:var(--space-2);" />
        <div id="share-error" style="font-size:var(--font-xs);color:var(--error);min-height:16px;"></div>
      </div>
      <div class="modal-footer">
        <button class="btn btn-secondary" data-action="close">Cancel</button>
        <button class="btn btn-primary" id="auth-share-btn">Unlock & Share</button>
      </div>
    </div>
  `;
  overlay.classList.add('active');

  return new Promise((resolve) => {
    const close = () => { overlay.classList.remove('active'); resolve(); };
    overlay.addEventListener('click', function h(e) {
      if (e.target.dataset?.action === 'close' || e.target === overlay) { overlay.removeEventListener('click', h); close(); }
    });

    overlay.querySelector('#creator-pass')?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') overlay.querySelector('#auth-share-btn')?.click();
    });

    overlay.querySelector('#auth-share-btn')?.addEventListener('click', async () => {
      const pass = overlay.querySelector('#creator-pass')?.value;
      const errEl = overlay.querySelector('#share-error');
      const btn = overlay.querySelector('#auth-share-btn');
      if (!pass) { errEl.textContent = 'Please enter your passphrase.'; return; }

      btn.textContent = 'Verifying...'; btn.disabled = true;
      try {
        const creator = await verifyCreator(creatorId, pass);
        if (!creator) { errEl.textContent = 'Incorrect passphrase.'; btn.textContent = 'Unlock & Share'; btn.disabled = false; return; }

        setWorkspaceSession(creator);
        close();
        await handleShareWithCreator(form, creatorId, displayName);
      } catch (err) {
        errEl.textContent = 'Error: ' + err.message;
        btn.textContent = 'Unlock & Share'; btn.disabled = false;
      }
    });
  });
}

// ---- First time setup ----
async function handleFirstTimeSetup(form) {
  const overlay = document.getElementById('modal-overlay');
  overlay.innerHTML = `
    <div class="modal">
      <div class="modal-header">
        <h3 class="modal-title">Set Up Your Creator Identity</h3>
        <button class="btn-icon modal-close" data-action="close">✕</button>
      </div>
      <div class="modal-body">
        <p style="color:var(--text-secondary);font-size:var(--font-sm);margin-bottom:var(--space-4);">
          Create a passphrase to manage <strong>all</strong> your shared forms from any device. You only need to do this once.
        </p>
        <div style="display:flex;flex-direction:column;gap:var(--space-3);">
          <div>
            <label style="font-size:var(--font-xs);font-weight:600;color:var(--text-secondary);display:block;margin-bottom:var(--space-1);">Your Name</label>
            <input type="text" class="input" id="setup-name" placeholder="e.g. Carlos" style="font-size:var(--font-sm);" />
          </div>
          <div>
            <label style="font-size:var(--font-xs);font-weight:600;color:var(--text-secondary);display:block;margin-bottom:var(--space-1);">Passphrase</label>
            <input type="password" class="input" id="setup-pass" placeholder="Minimum 6 characters" style="font-size:var(--font-sm);" />
          </div>
          <div>
            <label style="font-size:var(--font-xs);font-weight:600;color:var(--text-secondary);display:block;margin-bottom:var(--space-1);">Confirm Passphrase</label>
            <input type="password" class="input" id="setup-pass-confirm" placeholder="Re-enter passphrase" style="font-size:var(--font-sm);" />
          </div>
        </div>
        <p style="font-size:10px;color:var(--text-tertiary);margin-top:var(--space-3);">
          This passphrase unlocks all your shared forms from any device. Keep it safe.
        </p>
        <div id="setup-error" style="font-size:var(--font-xs);color:var(--error);margin-top:var(--space-2);min-height:16px;"></div>
      </div>
      <div class="modal-footer">
        <button class="btn btn-secondary" data-action="close">Cancel</button>
        <button class="btn btn-primary" id="setup-btn">Create & Share</button>
      </div>
    </div>
  `;
  overlay.classList.add('active');

  return new Promise((resolve) => {
    const close = () => { overlay.classList.remove('active'); resolve(); };
    overlay.addEventListener('click', function h(e) {
      if (e.target.dataset?.action === 'close' || e.target === overlay) { overlay.removeEventListener('click', h); close(); }
    });

    overlay.querySelector('#setup-btn')?.addEventListener('click', async () => {
      const name = overlay.querySelector('#setup-name')?.value?.trim();
      const pass = overlay.querySelector('#setup-pass')?.value;
      const confirm = overlay.querySelector('#setup-pass-confirm')?.value;
      const errEl = overlay.querySelector('#setup-error');
      const btn = overlay.querySelector('#setup-btn');

      if (!name) { errEl.textContent = 'Please enter your name.'; return; }
      if (!pass || pass.length < 6) { errEl.textContent = 'Passphrase must be at least 6 characters.'; return; }
      if (pass !== confirm) { errEl.textContent = 'Passphrases do not match.'; return; }

      btn.textContent = 'Setting up...'; btn.disabled = true;
      try {
        // Create global creator identity
        const creator = await createCreator(name, pass);
        await saveCreatorId(creator.creatorId, name);
        setWorkspaceSession(creator);

        // Now share the form
        const res = await shareForm(form, name, pass, creator.creatorId);
        await saveShareMeta(form.id, { shared: true, ownerName: name, token: res.token, expiresAt: res.expiresAt });
        // Sync custom plugins
        try { const cp = await getCustomPlugins(); await autoSyncFormPlugins(creator.creatorId, form, cp); } catch {}

        close();
        showToast('Identity created & form shared!', 'success');
        showShareModal(form); // Re-open to show links
      } catch (err) {
        errEl.textContent = 'Failed: ' + err.message;
        btn.textContent = 'Create & Share'; btn.disabled = false;
      }
    });
  });
}
