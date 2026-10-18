import { describe, it, expect } from 'vitest';
import {
  sanitizeSearchQuery,
  sanitizeEmailInput,
  isValidEmail,
  sanitizeOnlyLettersAndSpaces,
  sanitizeDigits,
  sanitizeOrderCode,
  sanitizeDocumentNumber,
  sanitizeSafeText,
  sanitizeProductName,
  sanitizePositiveInteger,
  sanitizePositiveDecimal,
  sanitizeTechnicalSpecs,
  sanitizeAddress
} from '../sanitizers';

describe('sanitizers utility', () => {
  describe('sanitizeSearchQuery', () => {
    it('allows letters, numbers and spaces', () => {
      expect(sanitizeSearchQuery('Tubo cuadrado 50x50')).toBe('Tubo cuadrado 50x50');
      expect(sanitizeSearchQuery('Ángulo de acero')).toBe('Ángulo de acero');
    });

    it('allows measurement characters used in steel: / . - " \'', () => {
      expect(sanitizeSearchQuery('Tubo 1 1/2"')).toBe('Tubo 1 1/2"');
      expect(sanitizeSearchQuery('Plancha LAC 1.5mm')).toBe('Plancha LAC 1.5mm');
      expect(sanitizeSearchQuery('Perfil 2-1/2')).toBe('Perfil 2-1/2');
    });

    it('removes dangerous special characters and mathematical operation symbols', () => {
      expect(sanitizeSearchQuery('Tubo <script>alert(1)</script>')).toBe('Tubo scriptalert1/script');
      expect(sanitizeSearchQuery('Plancha + fierro = 5 * 2; SELECT * FROM products')).toBe('Plancha  fierro  5  2 SELECT  FROM products');
      expect(sanitizeSearchQuery('Tubo $100 & % { } [ ] ! ? ^ ~')).toBe('Tubo 100          ');
    });

    it('handles non-string inputs gracefully', () => {
      expect(sanitizeSearchQuery(null)).toBe('');
      expect(sanitizeSearchQuery(undefined)).toBe('');
    });
  });

  describe('sanitizeEmailInput', () => {
    it('removes spaces and disallowed characters from email input', () => {
      expect(sanitizeEmailInput('admin @kenpaku.pe')).toBe('admin@kenpaku.pe');
      expect(sanitizeEmailInput('user<test>;:="\'@domain.com')).toBe('usertest@domain.com');
      expect(sanitizeEmailInput('admin.name+tag_1-2@kenpaku.pe')).toBe('admin.name+tag_1-2@kenpaku.pe');
    });
  });

  describe('isValidEmail', () => {
    it('validates properly formatted emails', () => {
      expect(isValidEmail('admin@kenpaku.pe')).toBe(true);
      expect(isValidEmail('alexis.maza@gmail.com')).toBe(true);
      expect(isValidEmail('ventas_acero-1@empresa.com.pe')).toBe(true);
    });

    it('rejects invalid emails', () => {
      expect(isValidEmail('admin')).toBe(false);
      expect(isValidEmail('admin@')).toBe(false);
      expect(isValidEmail('admin@kenpaku')).toBe(false);
      expect(isValidEmail('@kenpaku.pe')).toBe(false);
      expect(isValidEmail('admin@kenpaku.')).toBe(false);
      expect(isValidEmail('')).toBe(false);
      expect(isValidEmail(null)).toBe(false);
    });
  });

  describe('sanitizeOnlyLettersAndSpaces', () => {
    it('allows letters, accents, ñ and spaces while stripping numbers and symbols', () => {
      expect(sanitizeOnlyLettersAndSpaces('Juan Pérez Niño')).toBe('Juan Pérez Niño');
      expect(sanitizeOnlyLettersAndSpaces('Carlos123 #$! Gomez')).toBe('Carlos  Gomez');
    });

    it('handles non-string input', () => {
      expect(sanitizeOnlyLettersAndSpaces(null)).toBe('');
    });
  });

  describe('sanitizeDigits', () => {
    it('keeps only digits and respects maxLength', () => {
      expect(sanitizeDigits('987-654-321', 9)).toBe('987654321');
      expect(sanitizeDigits('abc 987654321012', 9)).toBe('987654321');
      expect(sanitizeDigits('45891234', 8)).toBe('45891234');
    });
  });

  describe('sanitizeOrderCode', () => {
    it('keeps only alphanumeric and hyphens, converted to uppercase', () => {
      expect(sanitizeOrderCode('kpk-000123')).toBe('KPK-000123');
      expect(sanitizeOrderCode('kpk@#_123*')).toBe('KPK123');
    });
  });

  describe('sanitizeDocumentNumber', () => {
    it('formats DNI strictly to max 8 digits', () => {
      expect(sanitizeDocumentNumber('1234567890', 'DNI')).toBe('12345678');
      expect(sanitizeDocumentNumber('45a89b12c34', 'DNI')).toBe('45891234');
    });

    it('formats RUC strictly to max 11 digits', () => {
      expect(sanitizeDocumentNumber('2060123456789', 'RUC')).toBe('20601234567');
    });

    it('formats CE strictly to max 9 digits', () => {
      expect(sanitizeDocumentNumber('001234567890', 'CE')).toBe('001234567');
    });

    it('formats Pasaporte to uppercase alphanumeric max 12 chars', () => {
      expect(sanitizeDocumentNumber('a123-bc456#7890123', 'Pasaporte')).toBe('A123BC456789');
    });
  });

  describe('sanitizeSafeText', () => {
    it('preserves text, punctuation and measurements but strips tags/injections', () => {
      expect(sanitizeSafeText('Tubo de 2" x 1.5mm, ¿tiene stock?')).toBe('Tubo de 2" x 1.5mm, ¿tiene stock?');
      expect(sanitizeSafeText('<script>alert("hack")</script>')).toBe('scriptalert("hack")/script');
    });
  });

  describe('sanitizeProductName', () => {
    it('allows letters, numbers, spaces, quotes, and measurements while stripping scripts and operators', () => {
      expect(sanitizeProductName('Tubo Negro 2" x 2.0 mm (6m)')).toBe('Tubo Negro 2" x 2.0 mm (6m)');
      expect(sanitizeProductName('Plancha <script> $100 = 5*2')).toBe('Plancha script 100  52');
    });
  });

  describe('sanitizePositiveInteger', () => {
    it('keeps only digits for stock', () => {
      expect(sanitizePositiveInteger('-45')).toBe('45');
      expect(sanitizePositiveInteger('1e5')).toBe('15');
      expect(sanitizePositiveInteger('abc 120 xyz')).toBe('120');
    });
  });

  describe('sanitizePositiveDecimal', () => {
    it('keeps positive decimals and only one dot for prices', () => {
      expect(sanitizePositiveDecimal('128.50')).toBe('128.50');
      expect(sanitizePositiveDecimal('-99.90')).toBe('99.90');
      expect(sanitizePositiveDecimal('12.34.56')).toBe('12.3456');
    });
  });

  describe('sanitizeTechnicalSpecs', () => {
    it('allows multiline text, norms and symbols like % ° ± while stripping tags', () => {
      const text = 'Norma: ASTM A500\nUsos: Estructuras ± 5% a 20°C';
      expect(sanitizeTechnicalSpecs(text)).toBe(text);
      expect(sanitizeTechnicalSpecs('<script>bad()</script>')).toBe('scriptbad()/script');
    });
  });

  describe('sanitizeAddress', () => {
    it('allows letters, numbers, spaces and address symbols like #, °, -, /, ., ()', () => {
      expect(sanitizeAddress('Av. Néstor Gambetta #1420, Mz. B Lt. 12 (2° piso)'))
        .toBe('Av. Néstor Gambetta #1420, Mz. B Lt. 12 (2° piso)');
      expect(sanitizeAddress('Carretera Panamericana Km. 26.5 - Almacén #4'))
        .toBe('Carretera Panamericana Km. 26.5 - Almacén #4');
    });

    it('strips dangerous HTML tags and script injections', () => {
      expect(sanitizeAddress('Av. Perú <script>alert(1)</script> #100'))
        .toBe('Av. Perú scriptalert(1)/script #100');
      expect(sanitizeAddress('Calle $100 & % { } [ ] ~ * + ='))
        .toBe('Calle 100          ');
    });

    it('handles non-string values gracefully', () => {
      expect(sanitizeAddress(null)).toBe('');
      expect(sanitizeAddress(undefined)).toBe('');
    });
  });
});
