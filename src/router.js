// Simple hash-based SPA router
const routes = [];
let currentCleanup = null;

export function registerRoute(pattern, handler) {
  // pattern: string like '/build/:id' or '/form/:id/responses'
  const paramNames = [];
  const regexStr = pattern.replace(/:([^/]+)/g, (_, name) => {
    paramNames.push(name);
    return '([^/]+)';
  });
  const regex = new RegExp(`^${regexStr}$`);
  routes.push({ pattern, regex, paramNames, handler });
}

export function navigateTo(path) {
  window.location.hash = path;
}

export function getCurrentPath() {
  return window.location.hash.slice(1) || '/';
}

function matchRoute(path) {
  for (const route of routes) {
    const match = path.match(route.regex);
    if (match) {
      const params = {};
      route.paramNames.forEach((name, i) => {
        params[name] = match[i + 1];
      });
      return { handler: route.handler, params };
    }
  }
  return null;
}

async function handleRoute() {
  const path = getCurrentPath();
  const match = matchRoute(path);

  // Cleanup previous route
  if (currentCleanup && typeof currentCleanup === 'function') {
    currentCleanup();
    currentCleanup = null;
  }

  if (match) {
    const result = await match.handler(match.params);
    if (typeof result === 'function') {
      currentCleanup = result;
    }
  } else {
    // Redirect to dashboard
    navigateTo('/');
  }
}

export function startRouter() {
  window.addEventListener('hashchange', handleRoute);
  handleRoute();
}
