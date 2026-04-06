// Built-in Plugin: Star Rating Question Type
import { registerPlugin } from '../PluginAPI.js';

registerPlugin({
  id: 'rating-stars',
  name: 'Star Rating',
  description: 'Add star rating questions to your forms with customizable 1-5 or 1-10 star scales.',
  version: '1.0',
  iconId: 'star',
  tags: ['question type', 'rating'],
  setup(api) {
    api.registerQuestionType('star_rating', {
      label: 'Star Rating',
      icon: '⭐',
      category: 'choice',
      getDefault: () => ({ maxStars: 5 }),
      render: (question, value, onChange) => {
        const container = document.createElement('div');
        container.className = 'star-rating-container';
        const max = question.maxStars || 5;
        const current = value || 0;

        let html = '<div class="star-rating-stars">';
        for (let i = 1; i <= max; i++) {
          html += `<button type="button" class="star-btn ${i <= current ? 'active' : ''}" data-value="${i}">★</button>`;
        }
        html += '</div>';
        html += `<span class="star-rating-label">${current > 0 ? `${current} / ${max}` : 'Not rated'}</span>`;

        container.innerHTML = html;

        container.querySelectorAll('.star-btn').forEach(btn => {
          btn.addEventListener('click', () => {
            const val = parseInt(btn.dataset.value);
            onChange(val);
            // Update UI
            container.querySelectorAll('.star-btn').forEach((b, idx) => {
              b.classList.toggle('active', idx < val);
            });
            container.querySelector('.star-rating-label').textContent = `${val} / ${max}`;
          });

          btn.addEventListener('mouseenter', () => {
            const val = parseInt(btn.dataset.value);
            container.querySelectorAll('.star-btn').forEach((b, idx) => {
              b.classList.toggle('hover', idx < val);
            });
          });

          btn.addEventListener('mouseleave', () => {
            container.querySelectorAll('.star-btn').forEach(b => b.classList.remove('hover'));
          });
        });

        return container;
      },
      validate: (question, value) => {
        if (question.required && (!value || value < 1)) return 'Please select a rating';
        return null;
      },
    });
  },
});
