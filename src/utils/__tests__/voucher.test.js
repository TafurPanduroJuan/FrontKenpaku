import { describe, it, expect } from 'vitest';
import { getVoucherUrl } from '../voucher';

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
