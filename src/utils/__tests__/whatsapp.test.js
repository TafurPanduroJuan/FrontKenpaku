import { describe, it, expect } from 'vitest';
import { normalizePhoneForWhatsApp, buildStatusWhatsAppUrl } from '../whatsapp';

describe('WhatsApp Utility Functions', () => {
  describe('normalizePhoneForWhatsApp', () => {
    it('normalizes 9-digit Peruvian phone number with 51 country code', () => {
      expect(normalizePhoneForWhatsApp('987654321')).toBe('51987654321');
    });

    it('cleans formatting symbols (spaces, dashes, parens, +)', () => {
      expect(normalizePhoneForWhatsApp('+51 987-654-321')).toBe('51987654321');
      expect(normalizePhoneForWhatsApp('(51) 987 654 321')).toBe('51987654321');
    });

    it('keeps already prefixed 51 numbers intact', () => {
      expect(normalizePhoneForWhatsApp('51912345678')).toBe('51912345678');
    });

    it('returns empty string if input is empty or null', () => {
      expect(normalizePhoneForWhatsApp(null)).toBe('');
      expect(normalizePhoneForWhatsApp('')).toBe('');
      expect(normalizePhoneForWhatsApp(undefined)).toBe('');
    });
  });

  describe('buildStatusWhatsAppUrl', () => {
    const mockOrder = {
      codigo: 'PED-20261011-TEST',
      cliente_nombre: 'Alexis Maza',
      cliente_telefono: '987654321',
      estado: 'despachado',
      total: 1500,
      costo_flete: 50,
      tracking_token: 'valid-test-token-123'
    };

    it('builds a valid wa.me URL with phone and URL-encoded message for despachado', () => {
      const url = buildStatusWhatsAppUrl(mockOrder);
      expect(url).toContain('https://wa.me/51987654321?text=');
      const decodedUrl = decodeURIComponent(url);
      expect(decodedUrl).toContain('Alexis Maza');
      expect(decodedUrl).toContain('PED-20261011-TEST');
      expect(decodedUrl).toContain('DESPACHADO A OBRA');
      expect(decodedUrl).toContain('/seguimiento?token=valid-test-token-123');
    });

    it('builds customized message for entregado status', () => {
      const url = buildStatusWhatsAppUrl({ ...mockOrder, estado: 'entregado' });
      const decodedUrl = decodeURIComponent(url);
      expect(decodedUrl).toContain('ha sido *ENTREGADO*');
      expect(decodedUrl).toContain('Muchas gracias por su preferencia');
    });

    it('builds customized message for pendiente status', () => {
      const url = buildStatusWhatsAppUrl({ ...mockOrder, estado: 'pendiente' });
      const decodedUrl = decodeURIComponent(url);
      expect(decodedUrl).toContain('hemos recibido su pedido');
    });

    it('builds customized message for cancelado status', () => {
      const url = buildStatusWhatsAppUrl({ ...mockOrder, estado: 'cancelado' });
      const decodedUrl = decodeURIComponent(url);
      expect(decodedUrl).toContain('ha sido cancelado');
    });

    it('builds customized message for flete_cotizado status', () => {
      const url = buildStatusWhatsAppUrl({ ...mockOrder, estado: 'flete_cotizado' });
      const decodedUrl = decodeURIComponent(url);
      expect(decodedUrl).toContain('costo de flete');
      expect(decodedUrl).toContain('S/ 50.00');
    });

    it('builds customized message for listo_para_recojo status', () => {
      const url = buildStatusWhatsAppUrl({ ...mockOrder, estado: 'listo_para_recojo' });
      const decodedUrl = decodeURIComponent(url);
      expect(decodedUrl).toContain('LISTOS PARA RECOJO');
      expect(decodedUrl).toContain('Puente Piedra');
    });

    it('falls back safely if phone is missing in order', () => {
      const url = buildStatusWhatsAppUrl({ ...mockOrder, cliente_telefono: null, cliente: null });
      expect(url).toBe('');
    });

    it('returns empty string if order is null', () => {
      expect(buildStatusWhatsAppUrl(null)).toBe('');
    });
  });
});
