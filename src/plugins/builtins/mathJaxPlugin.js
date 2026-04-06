// MathJax Plugin: Parses and Renders LaTeX blocks using MathJax dynamically.
import { escapeHtml } from '../../utils.js';

let mathJaxLoaded = false;
let mathJaxLoadingPromise = null;

function loadMathJax() {
  if (mathJaxLoaded) return Promise.resolve();
  if (mathJaxLoadingPromise) return mathJaxLoadingPromise;

  mathJaxLoadingPromise = new Promise((resolve) => {
    window.MathJax = {
      tex: { inlineMath: [['$', '$'], ['\\\\(', '\\\\)']] },
      svg: { fontCache: 'global' },
      startup: {
        pageReady: () => {
          mathJaxLoaded = true;
          resolve();
          return window.MathJax.startup.defaultPageReady();
        }
      }
    };

    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-svg.js';
    script.async = true;
    document.head.appendChild(script);
  });

  return mathJaxLoadingPromise;
}

export function setupMathJaxPlugin(api) {
  api.registerQuestionType('mathjax_display', {
    label: 'Math Equation',
    icon: 'sigma',
    category: 'advanced',
    getDefault: () => ({ mathSyntax: 'E = mc^2' }),

    render: (question, value, onChange) => {
      const container = document.createElement('div');
      container.className = 'mathjax-rendered-block';
      container.style.padding = '16px';
      container.style.backgroundColor = 'var(--bg-tertiary)';
      container.style.borderRadius = 'var(--radius-md)';
      container.style.overflowX = 'auto';
      container.style.textAlign = 'center';
      
      const syntax = question.mathSyntax || 'E = mc^2';
      container.innerHTML = `\\[ ${escapeHtml(syntax)} \\]`;

      // Trigger MathJax typeset
      loadMathJax().then(() => {
        if (window.MathJax && window.MathJax.typesetPromise) {
          window.MathJax.typesetPromise([container]).catch(err => console.warn("MathJax Typeset failed", err));
        }
      });

      return container;
    },

    validate: () => null, // Presentation only
  });
}

if (window.EphemeralPlugins) {
  window.EphemeralPlugins.register({
    id: 'builtin-mathjax',
    name: 'Mathematical Formulas',
    version: '1.0',
    description: 'Render beautiful LaTeX mathematics and formulas elegantly on your forms using MathJax.',
    iconId: 'sigma',
    tags: ['Math', 'Education', 'Visual'],
    enabled: true,
    setup: setupMathJaxPlugin
  });
}
