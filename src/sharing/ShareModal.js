// Share modal — passphrase-based sharing with collaborator support
import { shareForm, getLinkStatus, regenerateLink, resyncSharedForm } from '../firebase/shareService.js';
import { saveShareMeta, getShareMeta } from '../storage/shareStore.js';
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

// ---- Modal body: no active link ----
function bodyNoLink(hasExpired) {
  return `
    <div class="share-modal-content">
      <p style="color:var(--text-secondary);font-size:var(--font-sm);margin-bottom:var(--space-4);">
        Share this form online with a magic link. You'll set a passphrase to manage responses from any device.
      </p>
      <div style="display:flex;flex-direction:column;gap:var(--space-3);">
        <div>
          <label style="font-size:var(--font-xs);font-weight:600;color:var(--text-secondary);display:block;margin-bottom:var(--space-1);">Your Name</label>
          <input type="text" class="input" id="share-owner-name" placeholder="e.g. Carlos" style="font-size:var(--font-sm);" />
        </div>
        <div>
          <label style="font-size:var(--font-xs);font-weight:600;color:var(--text-secondary);display:block;margin-bottom:var(--space-1);">Set Passphrase</label>
          <input type="password" class="input" id="share-passphrase" placeholder="Minimum 6 characters" style="font-size:var(--font-sm);" />
        </div>
        <div>
          <label style="font-size:var(--font-xs);font-weight:600;color:var(--text-secondary);display:block;margin-bottom:var(--space-1);">Confirm Passphrase</label>
          <input type="password" class="input" id="share-passphrase-confirm" placeholder="Re-enter passphrase" style="font-size:var(--font-sm);" />
        </div>
      </div>
      <p style="font-size:10px;color:var(--text-tertiary);margin-top:var(--space-3);">
        ${hasExpired ? 'Your previous link expired. ' : ''}This passphrase lets you (and collaborators) access responses from any device.
      </p>
      <div id="share-error" style="font-size:var(--font-xs);color:var(--error);margin-top:var(--space-2);min-height:16px;"></div>
    </div>
  `;
}

// ---- Modal body: active link ----
function bodyActiveLink(shareUrl, manageUrl, expiresAt) {
  return `
    <div class="share-modal-content">
      <!-- Respondent Link -->
      <div style="margin-bottom:var(--space-5);">
        <div style="font-size:var(--font-xs);font-weight:600;color:var(--text-secondary);margin-bottom:var(--space-2);text-transform:uppercase;letter-spacing:0.04em;">Respondent Link</div>
        <p style="color:var(--text-tertiary);font-size:var(--font-xs);margin-bottom:var(--space-2);">Share this with anyone to fill out the form.</p>
        <div style="display:flex;gap:var(--space-2);">
          <input type="text" class="input" value="${shareUrl}" readonly style="flex:1;font-size:var(--font-xs);background:var(--bg-tertiary);cursor:text;" />
          <button class="btn btn-primary btn-sm" data-action="copy-share" style="white-space:nowrap;">Copy</button>
        </div>
        <span style="font-size:var(--font-xs);color:var(--text-tertiary);background:var(--bg-tertiary);padding:var(--space-1) var(--space-3);border-radius:var(--radius-full);display:inline-block;margin-top:var(--space-2);">
          ⏳ ${formatTTL(expiresAt)}
        </span>
      </div>

      <!-- Manage Link -->
      <div style="border-top:1px solid var(--border-light);padding-top:var(--space-4);">
        <div style="font-size:var(--font-xs);font-weight:600;color:var(--text-secondary);margin-bottom:var(--space-2);text-transform:uppercase;letter-spacing:0.04em;">Manage Link</div>
        <p style="color:var(--text-tertiary);font-size:var(--font-xs);margin-bottom:var(--space-2);">
          Open from any device → enter your passphrase → view responses + manage collaborators.
        </p>
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

  // Check existing link
  if (meta?.shared) {
    try {
      linkStatus = await getLinkStatus(form.id);
    } catch {
      linkStatus = null;
    }
  }

  const hasActiveLink = linkStatus?.active;

  if (hasActiveLink) {
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
      try { await navigator.clipboard.writeText(shareUrl); showToast('Respondent link copied!', 'success'); }
      catch { showToast(shareUrl, 'info', 8000); }
      return showShareModal(form);
    }

    if (result === 'copy-manage') {
      try { await navigator.clipboard.writeText(manageUrl); showToast('Manage link copied!', 'success'); }
      catch { showToast(manageUrl, 'info', 8000); }
      return showShareModal(form);
    }

    if (result === 'regenerate') {
      try {
        const ownerName = meta?.ownerName || 'Creator';
        const res = await regenerateLink(form.id, ownerName);
        await resyncSharedForm(form.id, form);
        await saveShareMeta(form.id, { shared: true, ownerName, token: res.token, expiresAt: res.expiresAt });
        showToast('New link generated!', 'success');
        return showShareModal(form);
      } catch (err) {
        showToast('Failed to regenerate: ' + err.message, 'error');
      }
    }
  } else {
    // No active link — show passphrase setup form
    const hasExpired = !!meta?.shared;

    const result = await showModal({
      title: hasExpired ? 'Re-share Form Online' : 'Share Form Online',
      body: bodyNoLink(hasExpired),
      actions: [
        { id: 'close', label: 'Cancel', class: 'btn-secondary' },
        { id: 'generate', label: 'Generate Link', class: 'btn-primary' },
      ],
    });

    if (result === 'generate') {
      // Validate inputs — need to read from the DOM before modal closes
      // Since showModal resolves after click, the DOM is still there briefly
      // We need to capture values via a different mechanism
      // Re-open with validation
      return handleGenerate(form, hasExpired);
    }
  }
}

async function handleGenerate(form, hasExpired) {
  // Show the modal again but this time capture values before it closes
  return new Promise((resolve) => {
    const overlay = document.getElementById('modal-overlay');

    const actionsHTML = `
      <button class="btn btn-secondary" data-action="close">Cancel</button>
      <button class="btn btn-primary" id="share-generate-btn">Generate Link</button>
    `;

    overlay.innerHTML = `
      <div class="modal">
        <div class="modal-header">
          <h3 class="modal-title">${hasExpired ? 'Re-share Form Online' : 'Share Form Online'}</h3>
          <button class="btn-icon modal-close" data-action="close">✕</button>
        </div>
        <div class="modal-body">${bodyNoLink(hasExpired)}</div>
        <div class="modal-footer">${actionsHTML}</div>
      </div>
    `;
    overlay.classList.add('active');

    const closeModal = () => {
      overlay.classList.remove('active');
      resolve();
    };

    // Close on overlay click or cancel
    overlay.addEventListener('click', function handler(e) {
      const action = e.target.dataset?.action;
      if (action === 'close' || e.target === overlay) {
        overlay.removeEventListener('click', handler);
        closeModal();
      }
    });

    // Generate button
    overlay.querySelector('#share-generate-btn')?.addEventListener('click', async () => {
      const nameInput = overlay.querySelector('#share-owner-name');
      const passInput = overlay.querySelector('#share-passphrase');
      const confirmInput = overlay.querySelector('#share-passphrase-confirm');
      const errorEl = overlay.querySelector('#share-error');

      const name = nameInput?.value?.trim();
      const pass = passInput?.value;
      const confirm = confirmInput?.value;

      if (!name) { errorEl.textContent = 'Please enter your name.'; return; }
      if (!pass || pass.length < 6) { errorEl.textContent = 'Passphrase must be at least 6 characters.'; return; }
      if (pass !== confirm) { errorEl.textContent = 'Passphrases do not match.'; return; }

      errorEl.textContent = '';
      const btn = overlay.querySelector('#share-generate-btn');
      btn.textContent = 'Generating...';
      btn.disabled = true;

      try {
        const res = await shareForm(form, name, pass);
        await saveShareMeta(form.id, {
          shared: true,
          ownerName: name,
          token: res.token,
          expiresAt: res.expiresAt,
        });
        overlay.classList.remove('active');
        showToast('Form shared! Magic link created.', 'success');
        resolve();
        // Re-open to show the links
        showShareModal(form);
      } catch (err) {
        errorEl.textContent = 'Failed: ' + err.message;
        btn.textContent = 'Generate Link';
        btn.disabled = false;
      }
    });
  });
}
