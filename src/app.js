import { createIcons, LayoutDashboard, PlusCircle, Puzzle, Sun, Moon, Menu } from 'lucide';
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
              <rect x="4" y="2" width="20" height="26" rx="3" fill="#6c5ce7"/>
              <rect x="8" y="8" width="10" height="2" rx="1" fill="rgba(255,255,255,0.9)"/>
              <rect x="8" y="13" width="12" height="2" rx="1" fill="rgba(255,255,255,0.6)"/>
              <rect x="8" y="18" width="8" height="2" rx="1" fill="rgba(255,255,255,0.4)"/>
              <circle cx="26" cy="6" r="2" fill="#6c5ce7" opacity="0.7"/>
              <circle cx="28" cy="12" r="1.5" fill="#6c5ce7" opacity="0.45"/>
              <circle cx="26" cy="17" r="1" fill="#6c5ce7" opacity="0.25"/>
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
      Menu
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
