import { createIcons, LayoutDashboard, PlusCircle, Puzzle, Sun, Moon, Menu, Globe } from 'lucide';
import { navigateTo, getCurrentPath } from './router.js';

export function renderAppShell(container) {
  const isDark = localStorage.getItem('theme') === 'dark';
  if (isDark) document.documentElement.setAttribute('data-theme', 'dark');

  container.innerHTML = `
    <div class="app-shell">
      <button class="mobile-menu-btn" id="mobile-menu-btn">
        <i data-lucide="menu"></i>
      </button>
      <div class="sidebar-overlay" id="sidebar-overlay"></div>
      
      <aside class="sidebar" id="sidebar">
        <div class="sidebar-header">
          <div class="sidebar-logo-icon">
            <svg viewBox="0 0 32 32" width="22" height="22" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect width="32" height="32" rx="8" fill="#6c5ce7"/>
              <text x="16" y="23" text-anchor="middle" font-family="system-ui,sans-serif" font-size="18" font-weight="700" fill="white">ef</text>
            </svg>
          </div>
          <span class="sidebar-logo">Ephemeral Forms</span>
        </div>
        
        <nav class="sidebar-nav">
          <div class="sidebar-section-title">Main</div>
          <button class="nav-item" data-nav="/dashboard" id="nav-dashboard">
            <span class="nav-item-icon"><i data-lucide="layout-dashboard"></i></span>
            <span>Dashboard</span>
          </button>
          <button class="nav-item" data-nav="/build" id="nav-build">
            <span class="nav-item-icon"><i data-lucide="plus-circle"></i></span>
            <span>Create Form</span>
          </button>
          
          <div class="sidebar-section-title">Online</div>
          <button class="nav-item" data-nav="/workspace" id="nav-workspace">
            <span class="nav-item-icon"><i data-lucide="globe"></i></span>
            <span>Workspace</span>
          </button>

          <div class="sidebar-section-title">Extensions</div>
          <button class="nav-item" data-nav="/plugins" id="nav-plugins">
            <span class="nav-item-icon"><i data-lucide="puzzle"></i></span>
            <span>Plugins</span>
          </button>
        </nav>

        <div class="sidebar-footer">
          <button class="nav-item" id="theme-toggle">
            <span class="nav-item-icon">
              <i data-lucide="${isDark ? 'sun' : 'moon'}"></i>
            </span>
            <span>${isDark ? 'Light' : 'Dark'} Mode</span>
          </button>
        </div>
      </aside>

      <main class="main-content">
        <div id="page-content"></div>
      </main>
    </div>
  `;

  // Initialize icons
  createIcons({
    icons: {
      LayoutDashboard,
      PlusCircle,
      Puzzle,
      Sun,
      Moon,
      Menu,
      Globe
    }
  });

  // Bind sidebar events
  const sidebar = container.querySelector('#sidebar');
  const overlay = container.querySelector('#sidebar-overlay');
  const mobileBtn = container.querySelector('#mobile-menu-btn');

  const toggleSidebar = () => {
    sidebar.classList.toggle('open');
    overlay.classList.toggle('open');
  };

  mobileBtn.addEventListener('click', toggleSidebar);
  overlay.addEventListener('click', toggleSidebar);

  container.querySelectorAll('[data-nav]').forEach(item => {
    item.addEventListener('click', () => {
      const path = item.dataset.nav;
      navigateTo(path);
      if (window.innerWidth <= 768) toggleSidebar();
    });
  });

  container.querySelector('#theme-toggle').addEventListener('click', () => {
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    const newTheme = isDark ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    
    // Update button text/icon
    const btn = container.querySelector('#theme-toggle');
    const iconName = newTheme === 'dark' ? 'sun' : 'moon';
    btn.querySelector('.nav-item-icon').innerHTML = `<i data-lucide="${iconName}"></i>`;
    btn.querySelector('span:not(.nav-item-icon)').textContent = `${newTheme === 'dark' ? 'Light' : 'Dark'} Mode`;
    createIcons({ icons: { Sun, Moon } });
  });

  // Handle active state in nav
  const updateActiveNav = () => {
    const path = getCurrentPath();
    container.querySelectorAll('.nav-item').forEach(item => {
      const navPath = item.dataset.nav;
      if (navPath) {
        // Highlight Dashboard if at root or /dashboard
        const isActive = (navPath === '/dashboard' && (path === '/dashboard' || path === '/')) ||
                        (navPath !== '/dashboard' && path === navPath);
        item.classList.toggle('active', isActive);
      }
    });
  };

  window.addEventListener('hashchange', updateActiveNav);
  updateActiveNav();

  return container.querySelector('#page-content');
}
