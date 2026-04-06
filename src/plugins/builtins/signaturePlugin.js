// Built-in Plugin: Signature Pad Question Type
import { registerPlugin } from '../PluginAPI.js';

registerPlugin({
  id: 'signature-pad',
  name: 'Signature Pad',
  description: 'Allow respondents to draw their signature directly on the form using a canvas-based input.',
  version: '1.0',
  iconId: 'pen-tool',
  tags: ['question type', 'signature'],
  setup(api) {
    api.registerQuestionType('signature', {
      label: 'Signature',
      icon: '✍️',
      category: 'other',
      getDefault: () => ({ penColor: '#1a1e2e', penWidth: 2 }),
      render: (question, value, onChange) => {
        const container = document.createElement('div');
        container.className = 'signature-container';

        container.innerHTML = `
          <canvas class="signature-canvas" width="500" height="160"></canvas>
          <div class="signature-actions">
            <button type="button" class="btn btn-ghost btn-sm signature-clear">Clear</button>
          </div>
        `;

        const canvas = container.querySelector('.signature-canvas');
        const ctx = canvas.getContext('2d');
        let isDrawing = false;
        let lastX = 0;
        let lastY = 0;

        // Set canvas styles
        ctx.strokeStyle = question.penColor || '#1a1e2e';
        ctx.lineWidth = question.penWidth || 2;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        // If there's existing data, restore it
        if (value) {
          const img = new Image();
          img.onload = () => ctx.drawImage(img, 0, 0);
          img.src = value;
        }

        const getCoords = (e) => {
          const rect = canvas.getBoundingClientRect();
          const scaleX = canvas.width / rect.width;
          const scaleY = canvas.height / rect.height;
          if (e.touches) {
            return {
              x: (e.touches[0].clientX - rect.left) * scaleX,
              y: (e.touches[0].clientY - rect.top) * scaleY,
            };
          }
          return {
            x: (e.clientX - rect.left) * scaleX,
            y: (e.clientY - rect.top) * scaleY,
          };
        };

        const startDrawing = (e) => {
          isDrawing = true;
          const coords = getCoords(e);
          lastX = coords.x;
          lastY = coords.y;
        };

        const draw = (e) => {
          if (!isDrawing) return;
          e.preventDefault();
          const coords = getCoords(e);
          ctx.beginPath();
          ctx.moveTo(lastX, lastY);
          ctx.lineTo(coords.x, coords.y);
          ctx.stroke();
          lastX = coords.x;
          lastY = coords.y;
        };

        const stopDrawing = () => {
          if (isDrawing) {
            isDrawing = false;
            onChange(canvas.toDataURL());
          }
        };

        canvas.addEventListener('mousedown', startDrawing);
        canvas.addEventListener('mousemove', draw);
        canvas.addEventListener('mouseup', stopDrawing);
        canvas.addEventListener('mouseleave', stopDrawing);
        canvas.addEventListener('touchstart', startDrawing, { passive: false });
        canvas.addEventListener('touchmove', draw, { passive: false });
        canvas.addEventListener('touchend', stopDrawing);

        container.querySelector('.signature-clear').addEventListener('click', () => {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          onChange(null);
        });

        return container;
      },
      validate: (question, value) => {
        if (question.required && !value) return 'Please provide a signature';
        return null;
      },
    });
  },
});
