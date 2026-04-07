import { createIcons, CheckCircle, AlertCircle, Info, XCircle } from 'lucide';

// Toast Notification System
export function showToast(message, type = 'info', duration = 3000) {
  const container = document.getElementById('toast-container') || createToastContainer();
  const toast = document.createElement('div');
  toast.className = `toast toast-${type} fade-in`;
  
  const icons = {
    success: 'check-circle',
    error: 'x-circle',
    warning: 'alert-circle',
    info: 'info'
  };

  toast.innerHTML = `
    <i data-lucide="${icons[type] || 'info'}" class="toast-icon"></i>
    <span class="toast-message">${message}</span>
  `;
  
  container.appendChild(toast);
  
  // Init icon
  createIcons({
    icons: {
      CheckCircle,
      AlertCircle,
      Info,
      XCircle
    }
  });

  setTimeout(() => {
    toast.classList.add('toast-out');
    toast.addEventListener('animationend', () => toast.remove());
  }, duration);
}

// Modal utility
export function showModal({ title, body, actions = [] }) {
  const overlay = document.getElementById('modal-overlay');
  
  const actionsHTML = actions.map(a => 
    `<button class="btn ${a.class || 'btn-secondary'}" data-action="${a.id}">${a.label}</button>`
  ).join('');

  overlay.innerHTML = `
    <div class="modal">
      <div class="modal-header">
        <h3 class="modal-title">${title}</h3>
        <button class="btn-icon modal-close" data-action="close">✕</button>
      </div>
      <div class="modal-body">${body}</div>
      ${actionsHTML ? `<div class="modal-footer">${actionsHTML}</div>` : ''}
    </div>
  `;
  overlay.classList.add('active');

  return new Promise((resolve) => {
    overlay.addEventListener('click', function handler(e) {
      const action = e.target.dataset?.action;
      if (action || e.target === overlay) {
        overlay.classList.remove('active');
        overlay.removeEventListener('click', handler);
        resolve(action || 'close');
      }
    });
  });
}

// Confirm dialog
export async function showConfirm(title, message) {
  const result = await showModal({
    title,
    body: `<p style="color:var(--text-secondary);font-size:var(--font-sm)">${message}</p>`,
    actions: [
      { id: 'cancel', label: 'Cancel', class: 'btn-secondary' },
      { id: 'confirm', label: 'Confirm', class: 'btn-primary' },
    ],
  });
  return result === 'confirm';
}

// Format date
export function formatDate(dateStr) {
  if (!dateStr) return 'N/A';
  const d = new Date(dateStr);
  const now = new Date();
  const diff = now - d;
  
  if (diff < 60000) return 'Just now';
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
  if (diff < 604800000) return `${Math.floor(diff / 86400000)}d ago`;
  
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

// Format number
export function formatNumber(n) {
  if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
  if (n >= 1000) return (n / 1000).toFixed(1) + 'K';
  return n.toString();
}

// Debounce
export function debounce(fn, ms = 300) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), ms);
  };
}

// Deep clone
export function deepClone(obj) {
  return JSON.parse(JSON.stringify(obj));
}

// Generate a short share slug
export function generateSlug() {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let slug = '';
  for (let i = 0; i < 8; i++) {
    slug += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return slug;
}
// HTML Escaping
export function escapeHtml(str) {
  if (typeof str !== 'string') return str;
  const div = document.createElement('div');
  div.textContent = str || '';
  return div.innerHTML;
}

export function escapeAttr(str) {
  if (typeof str !== 'string') return str;
  return (str || '').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

// String Utilities
export function truncate(str, max = 50) {
  if (!str) return '';
  return str.length > max ? str.slice(0, max) + '…' : str;
}

// Analytics Utilities
export function generateColors(count) {
  const palette = [
    '#6c5ce7', '#00b894', '#e17055', '#74b9ff', '#fdcb6e',
    '#a29bfe', '#55efc4', '#fab1a0', '#81ecec', '#ffeaa7',
    '#636e72', '#d63031', '#00cec9', '#e84393', '#2d3436',
  ];
  const colors = [];
  for (let i = 0; i < count; i++) {
    colors.push(palette[i % palette.length]);
  }
  return colors;
}

export function formatAnswer(val) {
  if (val === undefined || val === null || val === '') return '<span style="color:var(--text-tertiary)">—</span>';
  if (Array.isArray(val)) return escapeHtml(val.join(', '));
  if (typeof val === 'object') return escapeHtml(JSON.stringify(val));
  return escapeHtml(String(val));
}

export function shuffleArray(arr) {
  const shuffled = [...arr];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}
