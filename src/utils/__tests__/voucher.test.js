import { describe, it, expect } from 'vitest';
import { getVoucherUrl, getVoucherList } from '../voucher';

describe('getVoucherUrl helper', () => {
  it('returns empty string for falsy or invalid input', () => {
    expect(getVoucherUrl('')).toBe('');
    expect(getVoucherUrl(null)).toBe('');
    expect(getVoucherUrl(undefined)).toBe('');
  });

  it('returns external Supabase HTTPS URL without modifications', () => {
    const supabaseUrl = 'https://xyz.supabase.co/storage/v1/object/public/vouchers/voucher_123.jpg';
    expect(getVoucherUrl(supabaseUrl)).toBe(supabaseUrl);
  });

  it('returns blob: and data: URLs without modifications', () => {
    const blobUrl = 'blob:http://localhost:3000/123-abc';
    expect(getVoucherUrl(blobUrl)).toBe(blobUrl);
    const dataUrl = 'data:image/png;base64,iVBORw0KGgo';
    expect(getVoucherUrl(dataUrl)).toBe(dataUrl);
  });

  it('prepends backend base to relative /api/orders/voucher/ path', () => {
    const relativeUrl = '/api/orders/voucher/voucher_test_123.png';
    const result = getVoucherUrl(relativeUrl);
    expect(result).toMatch(/^http:\/\/[^/]+\/api\/orders\/voucher\/voucher_test_123\.png$/);
  });

  it('handles relative path without leading slash', () => {
    const relativeUrl = 'api/orders/voucher/voucher_test_123.png';
    const result = getVoucherUrl(relativeUrl);
    expect(result).toMatch(/^http:\/\/[^/]+\/api\/orders\/voucher\/voucher_test_123\.png$/);
  });
});

describe('getVoucherList helper', () => {
  it('returns empty array when no voucher or events exist', () => {
    expect(getVoucherList('')).toEqual([]);
    expect(getVoucherList(null, [])).toEqual([]);
  });

  it('correctly handles a single voucher string', () => {
    const list = getVoucherList('https://supabase.co/voucher1.jpg');
    expect(list).toHaveLength(1);
    expect(list[0].url).toBe('https://supabase.co/voucher1.jpg');
    expect(list[0].isPdf).toBe(false);
  });

  it('correctly splits comma-separated multiple vouchers (e.g. 2 vouchers)', () => {
    const list = getVoucherList(
      'https://supabase.co/v1.png, /api/orders/voucher/v2.pdf'
    );
    expect(list).toHaveLength(2);
    expect(list[0].label).toBe('Comprobante #1');
    expect(list[0].isPdf).toBe(false);
    expect(list[1].label).toBe('Comprobante #2');
    expect(list[1].isPdf).toBe(true);
  });

  it('recovers previous vouchers from order timeline events if not in voucher_referencia', () => {
    const events = [
      {
        id: 'ev-1',
        nota: 'Comprobante de pago cargado (voucher_first_111.jpg). En proceso de verificación.',
        created_at: '2026-10-18T10:00:00Z',
      },
      {
        id: 'ev-2',
        nota: 'Comprobante de pago cargado (voucher_second_222.pdf). En proceso de verificación.',
        created_at: '2026-10-18T10:05:00Z',
      },
    ];

    // Simulating voucher_referencia only having the second one
    const list = getVoucherList('/api/orders/voucher/voucher_second_222.pdf', events);
    expect(list).toHaveLength(2);
    expect(list.some((v) => v.rawUrl.includes('voucher_first_111.jpg'))).toBe(true);
    expect(list.some((v) => v.rawUrl.includes('voucher_second_222.pdf'))).toBe(true);
  });
});
