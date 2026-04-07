// Share modal — handles the full share/regenerate/status flow
import { shareForm, getLinkStatus, regenerateLink, resyncSharedForm } from '../firebase/shareService.js';
import { saveShareMeta, getShareMeta } from '../storage/shareStore.js';
import { showModal, showToast } from '../utils.js';

function formatTTL(expiresAt) {
  const diff = new Date(expiresAt) - new Date();
  if (diff <= 0) return 'Expired';
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(hours / 24);
  const remainingHours = hours % 24;
  if (days > 0) return `${days}d ${remainingHours}h remaining`;
  if (hours > 0) return `${hours}h remaining`;
  return `${Math.floor(diff / 60000)}m remaining`;
}

function buildShareURL(token) {
  return `${window.location.origin}${window.location.pathname}#/share/${token}`;
}

function modalBody(status, url) {
  if (!status || !status.active) {
    return `
      <div class="share-modal-content">
        <p style="color:var(--text-secondary);font-size:var(--font-sm);margin-bottom:var(--space-4);">
          Generate a magic link to share this form online. Anyone with the link can fill it out — no login needed. Links expire after 3 days.
        </p>
        <p style="color:var(--text-tertiary);font-size:var(--font-xs);text-align:center;margin-top:var(--space-2);">
          ${status ? 'Your previous link has expired.' : 'No active link for this form.'}
        </p>
      </div>
    `;
  }

  return `
    <div class="share-modal-content">
      <p style="color:var(--text-secondary);font-size:var(--font-sm);margin-bottom:var(--space-4);">
        Share this link with anyone — no login needed to fill out the form.
      </p>
      <div class="share-link-box" style="display:flex;gap:var(--space-2);margin-bottom:var(--space-4);">
        <input type="text" class="input" id="share-link-input" value="${url}" readonly
               style="flex:1;font-size:var(--font-xs);background:var(--bg-tertiary);cursor:text;" />
        <button class="btn btn-primary btn-sm" data-action="copy" style="white-space:nowrap;">Copy</button>
      </div>
      <div style="display:flex;justify-content:space-between;align-items:center;">
        <span class="share-ttl-badge" style="font-size:var(--font-xs);color:var(--text-tertiary);background:var(--bg-tertiary);padding:var(--space-1) var(--space-3);border-radius:var(--radius-full);">
          ⏳ ${formatTTL(status.expiresAt)}
        </span>
      </div>
    </div>
  `;
}

export async function showShareModal(form) {
  const meta = await getShareMeta(form.id);
  let status = null;
  let url = '';

  // Check existing link status
  if (meta?.creatorSecret) {
    try {
      status = await getLinkStatus(form.id, meta.creatorSecret);
      if (status?.active) {
        url = buildShareURL(status.token);
      }
    } catch {
      status = null;
    }
  }

  const hasActiveLink = status?.active;

  const actions = hasActiveLink
    ? [
        { id: 'regenerate', label: 'Regenerate Link', class: 'btn-secondary' },
        { id: 'close', label: 'Done', class: 'btn-primary' },
      ]
    : [
        { id: 'generate', label: 'Generate Link', class: 'btn-primary' },
        { id: 'close', label: 'Cancel', class: 'btn-secondary' },
      ];

  const result = await showModal({
    title: 'Share Form Online',
    body: modalBody(status, url),
    actions,
  });

  if (result === 'copy') {
    try {
      await navigator.clipboard.writeText(url);
      showToast('Link copied!', 'success');
    } catch {
      showToast(url, 'info', 8000);
    }
    return showShareModal(form); // Re-open modal
  }

  if (result === 'generate') {
    try {
      const res = await shareForm(form);
      await saveShareMeta(form.id, {
        creatorSecret: res.creatorSecret,
        token: res.token,
        expiresAt: res.expiresAt,
        sharedAt: new Date().toISOString(),
      });
      showToast('Magic link created!', 'success');
      return showShareModal(form); // Re-open to show the link
    } catch (err) {
      showToast('Failed to share form: ' + err.message, 'error');
    }
  }

  if (result === 'regenerate') {
    try {
      const res = await regenerateLink(form.id, meta.creatorSecret);
      // Also re-sync the form in case it was edited
      await resyncSharedForm(form.id, meta.creatorSecret, form);
      await saveShareMeta(form.id, {
        creatorSecret: meta.creatorSecret,
        token: res.token,
        expiresAt: res.expiresAt,
        sharedAt: new Date().toISOString(),
      });
      showToast('New link generated!', 'success');
      return showShareModal(form); // Re-open to show new link
    } catch (err) {
      showToast('Failed to regenerate: ' + err.message, 'error');
    }
  }
}
