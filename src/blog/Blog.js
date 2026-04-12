import { marked } from 'marked';
import { createIcons, Calendar, User, ArrowLeft, BookOpen, Clock, Search, Sun, Moon } from 'lucide';
import { navigateTo } from '../router.js';
import { getCreatorId } from '../storage/creatorStore.js';
import { blogPosts } from '../../content/blog/index.js';

// ---- Helpers ----

function parseFrontmatter(raw) {
  const match = raw.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!match) return { meta: {}, content: raw };
  const meta = {};
  match[1].split('\n').forEach(line => {
    const idx = line.indexOf(':');
    if (idx === -1) return;
    meta[line.slice(0, idx).trim()] = line.slice(idx + 1).trim();
  });
  return { meta, content: match[2] };
}

function getAllPosts() {
  return blogPosts
    .map(raw => {
      const parsed = parseFrontmatter(raw);
      parsed.meta.readingTime = estimateReadingTime(parsed.content);
      parsed.meta.tags = (parsed.meta.tags || '').split(',').map(t => t.trim()).filter(Boolean);
      return parsed;
    })
    .filter(p => p.meta.slug)
    .sort((a, b) => (b.meta.date || '').localeCompare(a.meta.date || ''));
}

function estimateReadingTime(text) {
  const words = text.replace(/<[^>]*>/g, '').split(/\s+/).filter(Boolean).length;
  const minutes = Math.max(1, Math.ceil(words / 230));
  return `${minutes} min read`;
}

function formatDate(dateStr) {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  } catch { return dateStr; }
}

function getAllTags(posts) {
  const tagSet = new Set();
  posts.forEach(p => p.meta.tags.forEach(t => tagSet.add(t)));
  return Array.from(tagSet).sort();
}

// ---- Shared Layout ----

function renderNav(isDark, hasIdentity) {
  return `
    <nav class="lp-nav" id="lp-nav">
      <div class="lp-nav-inner">
        <div class="lp-logo">
          <div class="lp-logo-icon">
            <svg viewBox="0 0 32 32" width="24" height="24" fill="none"><rect x="4" y="2" width="20" height="26" rx="3" fill="#6c5ce7"/><rect x="8" y="8" width="10" height="2" rx="1" fill="rgba(255,255,255,0.9)"/><rect x="8" y="13" width="12" height="2" rx="1" fill="rgba(255,255,255,0.6)"/><rect x="8" y="18" width="8" height="2" rx="1" fill="rgba(255,255,255,0.4)"/><circle cx="26" cy="6" r="2" fill="#6c5ce7" opacity="0.7"/><circle cx="28" cy="12" r="1.5" fill="#6c5ce7" opacity="0.45"/><circle cx="26" cy="17" r="1" fill="#6c5ce7" opacity="0.25"/></svg>
          </div>
          <span class="lp-logo-text">Ephemeral Forms</span>
        </div>
        <div class="lp-nav-links">
          <button class="lp-nav-link lp-theme-toggle" id="blog-theme-toggle" title="${isDark ? 'Light' : 'Dark'} mode">
            <i data-lucide="${isDark ? 'sun' : 'moon'}" style="width:16px;height:16px;"></i>
          </button>
          <button class="lp-nav-link" id="blog-nav-home">Home</button>
          <button class="lp-nav-link active" id="blog-nav-blog">Blog</button>
          ${hasIdentity ? '<button class="lp-nav-link" id="blog-nav-docs">Docs</button>' : ''}
          ${hasIdentity
            ? '<button class="lp-nav-cta" id="blog-nav-cta">Dashboard</button>'
            : '<button class="lp-nav-cta" id="blog-nav-cta">Get Started</button>'
          }
        </div>
      </div>
    </nav>
  `;
}

function renderFooter(hasIdentity) {
  return `
    <footer class="lp-footer">
      <div class="lp-footer-inner">
        <div class="lp-footer-brand">
          <svg viewBox="0 0 32 32" width="18" height="18" fill="none"><rect x="4" y="2" width="20" height="26" rx="3" fill="#6c5ce7"/><rect x="8" y="8" width="10" height="2" rx="1" fill="rgba(255,255,255,0.9)"/><rect x="8" y="13" width="12" height="2" rx="1" fill="rgba(255,255,255,0.6)"/><rect x="8" y="18" width="8" height="2" rx="1" fill="rgba(255,255,255,0.4)"/><circle cx="26" cy="6" r="2" fill="#6c5ce7" opacity="0.7"/><circle cx="28" cy="12" r="1.5" fill="#6c5ce7" opacity="0.45"/><circle cx="26" cy="17" r="1" fill="#6c5ce7" opacity="0.25"/></svg>
          <span>Ephemeral Forms</span>
        </div>
        <div class="lp-footer-links">
          ${hasIdentity
            ? '<button class="lp-footer-link" id="blog-footer-dashboard">Dashboard</button>'
            : '<button class="lp-footer-link" id="blog-footer-home">Home</button>'
          }
          <button class="lp-footer-link" id="blog-footer-blog">Blog</button>
          <button class="lp-footer-link" id="blog-footer-docs">Docs</button>
        </div>
        <div class="lp-footer-love">Made ❤️ Grand Kru.</div>
      </div>
    </footer>
  `;
}

function bindNavEvents(container, hasIdentity, rerenderFn) {
  container.querySelector('#blog-nav-home')?.addEventListener('click', () => navigateTo('/'));
  container.querySelector('#blog-nav-blog')?.addEventListener('click', () => navigateTo('/blog'));
  container.querySelector('#blog-nav-docs')?.addEventListener('click', () => navigateTo('/docs'));
  container.querySelector('#blog-nav-cta')?.addEventListener('click', () => {
    navigateTo(hasIdentity ? '/dashboard' : '/');
  });
  container.querySelector('#blog-footer-dashboard')?.addEventListener('click', () => navigateTo('/dashboard'));
  container.querySelector('#blog-footer-home')?.addEventListener('click', () => navigateTo('/'));
  container.querySelector('#blog-footer-blog')?.addEventListener('click', () => navigateTo('/blog'));
  container.querySelector('#blog-footer-docs')?.addEventListener('click', () => navigateTo('/docs'));
  container.querySelector('.lp-logo')?.addEventListener('click', () => navigateTo('/'));

  container.querySelector('#blog-theme-toggle')?.addEventListener('click', () => {
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    const newTheme = isDark ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    if (rerenderFn) rerenderFn();
  });
}

// ---- Blog List ----

export async function renderBlogList(container) {
  const identity = await getCreatorId();
  const hasIdentity = !!identity;
  const posts = getAllPosts();
  const allTags = getAllTags(posts);
  let activeTag = '';
  let searchQuery = '';

  function render() {
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';

    const filtered = posts.filter(post => {
      const matchesTag = !activeTag || post.meta.tags.includes(activeTag);
      const matchesSearch = !searchQuery ||
        (post.meta.title || '').toLowerCase().includes(searchQuery) ||
        (post.meta.summary || '').toLowerCase().includes(searchQuery);
      return matchesTag && matchesSearch;
    });

    container.innerHTML = `
      <div class="lp blog-page fade-in">
        ${renderNav(isDark, hasIdentity)}

        <div class="blog-header">
          <div class="blog-header-inner">
            <h1 class="blog-page-title"><i data-lucide="book-open" style="width:28px;height:28px;vertical-align:-4px;margin-right:8px;"></i> Blog</h1>
            <p class="blog-page-sub">Updates, guides, and behind-the-scenes from the Ephemeral Forms team.</p>
          </div>
        </div>

        <div class="blog-toolbar">
          <div class="blog-toolbar-inner">
            <div class="blog-search">
              <i data-lucide="search" class="blog-search-icon" style="width:16px;height:16px;"></i>
              <input type="text" class="input blog-search-input" id="blog-search" placeholder="Search posts..." value="${searchQuery}" />
            </div>
            ${allTags.length ? `
              <div class="blog-filters">
                <button class="blog-filter-tag ${!activeTag ? 'active' : ''}" data-tag="">All</button>
                ${allTags.map(t => `<button class="blog-filter-tag ${activeTag === t ? 'active' : ''}" data-tag="${t}">${t}</button>`).join('')}
              </div>
            ` : ''}
          </div>
        </div>

        <div class="blog-list">
          ${filtered.map(post => `
            <article class="blog-card" data-slug="${post.meta.slug}">
              <div class="blog-card-body">
                <h2 class="blog-card-title">${post.meta.title || 'Untitled'}</h2>
                <p class="blog-card-summary">${post.meta.summary || ''}</p>
                <div class="blog-card-meta">
                  <span class="blog-card-meta-item"><i data-lucide="calendar" style="width:14px;height:14px;"></i> ${formatDate(post.meta.date)}</span>
                  <span class="blog-card-meta-item"><i data-lucide="clock" style="width:14px;height:14px;"></i> ${post.meta.readingTime}</span>
                  <span class="blog-card-meta-item"><i data-lucide="user" style="width:14px;height:14px;"></i> ${post.meta.author || ''}</span>
                </div>
                ${post.meta.tags.length ? `<div class="blog-card-tags">${post.meta.tags.map(t => `<span class="blog-tag">${t}</span>`).join('')}</div>` : ''}
              </div>
              <div class="blog-card-arrow"><i data-lucide="arrow-left" style="width:18px;height:18px;transform:rotate(180deg);"></i></div>
            </article>
          `).join('')}

          ${filtered.length === 0 ? `
            <div class="blog-empty">
              <p>${searchQuery || activeTag ? 'No posts match your search.' : 'No posts yet. Check back soon!'}</p>
            </div>
          ` : ''}
        </div>

        ${renderFooter(hasIdentity)}
      </div>
    `;

    createIcons({ icons: { Calendar, User, ArrowLeft, BookOpen, Clock, Search, Sun, Moon } });

    bindNavEvents(container, hasIdentity, render);

    // Search
    const searchInput = container.querySelector('#blog-search');
    searchInput?.addEventListener('input', (e) => {
      searchQuery = e.target.value.toLowerCase();
      render();
      // Restore focus and cursor position
      const newInput = container.querySelector('#blog-search');
      if (newInput) { newInput.focus(); newInput.selectionStart = newInput.selectionEnd = newInput.value.length; }
    });

    // Tag filters
    container.querySelectorAll('.blog-filter-tag').forEach(btn => {
      btn.addEventListener('click', () => {
        activeTag = btn.dataset.tag;
        render();
      });
    });

    // Card clicks
    container.querySelectorAll('.blog-card').forEach(card => {
      card.addEventListener('click', () => navigateTo(`/blog/${card.dataset.slug}`));
    });
  }

  render();
}

// ---- Single Post ----

export async function renderBlogPost(container, slug) {
  const identity = await getCreatorId();
  const hasIdentity = !!identity;
  const posts = getAllPosts();
  const post = posts.find(p => p.meta.slug === slug);

  function render() {
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';

    if (!post) {
      container.innerHTML = `
        <div class="lp blog-page fade-in">
          ${renderNav(isDark, hasIdentity)}
          <div class="blog-post-wrap">
            <div class="blog-not-found">
              <h2>Post not found</h2>
              <p>This blog post doesn't exist or has been removed.</p>
              <button class="btn btn-primary" id="blog-back-home">Back to Blog</button>
            </div>
          </div>
          ${renderFooter(hasIdentity)}
        </div>
      `;
      createIcons({ icons: { Sun, Moon } });
      bindNavEvents(container, hasIdentity, render);
      container.querySelector('#blog-back-home')?.addEventListener('click', () => navigateTo('/blog'));
      return;
    }

    const html = marked.parse(post.content);
    const idx = posts.indexOf(post);
    const prevPost = posts[idx + 1] || null;
    const nextPost = posts[idx - 1] || null;

    container.innerHTML = `
      <div class="lp blog-page fade-in">
        ${renderNav(isDark, hasIdentity)}

        <div class="blog-post-wrap">
          <nav class="blog-post-nav">
            <button class="blog-back-btn" id="blog-back"><i data-lucide="arrow-left" style="width:16px;height:16px;"></i> All Posts</button>
          </nav>

          <article class="blog-post">
            <header class="blog-post-header">
              <h1 class="blog-post-title">${post.meta.title}</h1>
              <div class="blog-post-meta">
                <span><i data-lucide="calendar" style="width:14px;height:14px;"></i> ${formatDate(post.meta.date)}</span>
                <span><i data-lucide="clock" style="width:14px;height:14px;"></i> ${post.meta.readingTime}</span>
                <span><i data-lucide="user" style="width:14px;height:14px;"></i> ${post.meta.author || ''}</span>
              </div>
              ${post.meta.tags.length ? `<div class="blog-card-tags">${post.meta.tags.map(t => `<span class="blog-tag">${t}</span>`).join('')}</div>` : ''}
            </header>

            <div class="blog-post-content">
              ${html}
            </div>
          </article>

          ${prevPost || nextPost ? `
            <nav class="blog-post-siblings">
              ${prevPost ? `<button class="blog-sibling-btn blog-sibling-prev" data-slug="${prevPost.meta.slug}"><span class="blog-sibling-label">Older</span><span class="blog-sibling-title">${prevPost.meta.title}</span></button>` : '<div></div>'}
              ${nextPost ? `<button class="blog-sibling-btn blog-sibling-next" data-slug="${nextPost.meta.slug}"><span class="blog-sibling-label">Newer</span><span class="blog-sibling-title">${nextPost.meta.title}</span></button>` : '<div></div>'}
            </nav>
          ` : ''}
        </div>

        ${renderFooter(hasIdentity)}
      </div>
    `;

    createIcons({ icons: { Calendar, User, ArrowLeft, Clock, Sun, Moon } });
    bindNavEvents(container, hasIdentity, render);

    container.querySelector('#blog-back')?.addEventListener('click', () => navigateTo('/blog'));
    container.querySelectorAll('.blog-sibling-btn').forEach(btn => {
      btn.addEventListener('click', () => navigateTo(`/blog/${btn.dataset.slug}`));
    });

    window.scrollTo({ top: 0 });
  }

  render();
}
