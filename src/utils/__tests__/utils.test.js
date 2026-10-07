import { describe, it, expect } from 'vitest';
import { formatPEN } from '../formatPEN';
import { calcIGV } from '../calcIGV';

describe('formatPEN utility', () => {
  it('formats numbers to Peruvian Soles (PEN)', () => {
    expect(formatPEN(128.9)).toBe('S/ 128.90');
    expect(formatPEN(0)).toBe('S/ 0.00');
    expect(formatPEN(1500)).toBe('S/ 1,500.00');
  });

  it('handles invalid numeric inputs gracefully', () => {
    expect(formatPEN('invalid')).toBe('S/ 0.00');
    expect(formatPEN(null)).toBe('S/ 0.00');
  });
});

describe('calcIGV utility', () => {
  it('correctly extracts subtotal and IGV (18%) from total price containing IGV', () => {
    // 118 total => subtotal 100, IGV 18
    const result = calcIGV(118);
    expect(result.total).toBe(118);
    expect(result.subtotal).toBe(100);
    expect(result.igv).toBe(18);
  });

  it('rounds decimal amounts accurately', () => {
    const result = calcIGV(128.90);
    expect(result.total).toBe(128.90);
    expect(result.subtotal).toBe(109.24);
    expect(result.igv).toBe(19.66);
  });
});
