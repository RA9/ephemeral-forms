const SITE_NAME = 'Ephemeral Forms';
const DEFAULT_DESC = 'Create beautiful forms instantly, no login required. AI-powered, offline-first form builder with analytics.';

export function setMeta(title, description) {
  document.title = title ? `${title} — ${SITE_NAME}` : SITE_NAME;
  const tag = document.querySelector('meta[name="description"]');
  if (tag) tag.setAttribute('content', description || DEFAULT_DESC);
}
