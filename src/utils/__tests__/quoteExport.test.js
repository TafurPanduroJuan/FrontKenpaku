import { describe, expect, it } from 'vitest';
import { prepareQuoteImageExport } from '../quoteExport';

describe('prepareQuoteImageExport', () => {
  it('removes suggestion controls and prices while retaining a text-only alternative', () => {
    const clone = document.implementation.createHTMLDocument();
    clone.body.innerHTML = `
      <section data-export-hide>
        <p>Alternativa disponible: Tubo · 40x40 — S/ 999.00</p>
        <button>Agregar</button>
      </section>
      <p class="hidden" data-export-alternative="Tubo · 40x40"></p>
    `;

    prepareQuoteImageExport(clone);

    expect(clone.body.textContent).toContain('Alternativa disponible: Tubo · 40x40');
    expect(clone.body.textContent).not.toContain('999.00');
    expect(clone.body.textContent).not.toContain('Agregar');
    expect(clone.body.querySelector('[data-export-alternative]').classList.contains('hidden')).toBe(false);
  });
});
