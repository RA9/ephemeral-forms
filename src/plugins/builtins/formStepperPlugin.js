// Built-in Plugin: Form Stepper & Progress UI
// Replaces the standard progress bar with a card-style step navigator.

if (window.EphemeralPlugins) {
  window.EphemeralPlugins.register({
    id: 'form-stepper',
    name: 'Multi-Step Form Progress',
    version: '2.0',
    description: 'Replaces the standard progress bar with a card-style step navigator showing each section as a card.',
    iconId: 'list-ordered',
    tags: ['UI', 'Navigation', 'Progress'],
    enabled: true,
    setup(api) {
      api.registerHook('onRenderProgressBar', ({ container, currentPage, totalPages, themeColor, pages }) => {
        if (totalPages <= 1) return;

        // Get a label for each page from its section_header, or fall back to "Step N"
        const stepLabels = pages.map((pageQuestions, idx) => {
          const header = pageQuestions.find(q => q.type === 'section_header');
          return header?.sectionTitle || header?.label || `Step ${idx + 1}`;
        });

        const cards = pages.map((_, idx) => {
          const isActive    = idx === currentPage;
          const isCompleted = idx < currentPage;
          const isUpcoming  = idx > currentPage;

          const numContent = isCompleted
            ? `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polyline points="2.5,8 6,12 13.5,4"/></svg>`
            : `${idx + 1}`;

          return `
            <div class="stpr-card ${isActive ? 'stpr-active' : ''} ${isCompleted ? 'stpr-done' : ''} ${isUpcoming ? 'stpr-upcoming' : ''}"
                 style="${isActive ? `--stpr-color: ${themeColor};` : ''}">
              <div class="stpr-num">${numContent}</div>
              <span class="stpr-label">${stepLabels[idx]}</span>
            </div>
          `;
        }).join('<div class="stpr-arrow">›</div>');

        container.innerHTML = `<div class="stpr-row">${cards}</div>`;
      });
    }
  });
}
