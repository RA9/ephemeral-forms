// Built-in Plugin: Form Stepper & Progress UI
// This plugin replaces the standard progress bar with a numbered stepper UI (Step 1 -> Step 2 -> Step 3)
// and handles visual indicators for multi-page forms.

if (window.EphemeralPlugins) {
  window.EphemeralPlugins.register({
    id: 'form-stepper',
    name: 'Multi-Step Form Progress',
    version: '1.0',
    description: 'Replaces the standard progress bar with a beautiful numbered stepper (Step 1, Step 2, etc.)',
    iconId: 'list-ordered',
    tags: ['UI', 'Navigation', 'Progress'],
    enabled: true,
    setup(api) {
      // Hook into the progress bar rendering
      api.registerHook('onRenderProgressBar', ({ container, currentPage, totalPages, themeColor, pages }) => {
        if (totalPages <= 1) return;

        const stepperHtml = `
          <div class="stepper-ui" style="display: flex; align-items: center; justify-content: space-between; margin-bottom: var(--space-8); position: relative; padding: 0 var(--space-4);">
            <!-- Connecting Line -->
            <div class="stepper-line" style="position: absolute; top: 18px; left: var(--space-10); right: var(--space-10); height: 2px; background: var(--border-light); z-index: 0;">
              <div class="stepper-line-fill" style="height: 100%; background: ${themeColor}; transition: width 0.3s ease; width: ${((currentPage) / (totalPages - 1)) * 100}%;"></div>
            </div>
            
            ${pages.map((_, idx) => {
              const isActive = idx === currentPage;
              const isCompleted = idx < currentPage;
              
              return `
                <div class="step-item" style="z-index: 1; display: flex; flex-direction: column; align-items: center; gap: var(--space-2);">
                  <div class="step-number" style="
                    width: 36px; 
                    height: 36px; 
                    border-radius: 50%; 
                    display: flex; 
                    align-items: center; 
                    justify-content: center; 
                    font-weight: bold; 
                    font-size: var(--font-sm);
                    transition: all 0.3s ease;
                    background: ${isCompleted || isActive ? themeColor : 'var(--surface)'};
                    color: ${isCompleted || isActive ? 'white' : 'var(--text-tertiary)'};
                    border: 2px solid ${isCompleted || isActive ? themeColor : 'var(--border-light)'};
                    box-shadow: ${isActive ? `0 0 0 4px ${themeColor}33` : 'none'};
                  ">
                    ${isCompleted ? '✓' : idx + 1}
                  </div>
                  <span style="font-size: 10px; font-weight: 600; color: ${isActive ? 'var(--text-primary)' : 'var(--text-tertiary)'}; text-transform: uppercase; letter-spacing: 0.05em;">
                    Step ${idx + 1}
                  </span>
                </div>
              `;
            }).join('')}
          </div>
        `;

        container.innerHTML = stepperHtml;
      });
    }
  });
}
