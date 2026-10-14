/**
 * Utilidades de sanitización y validación para buscadores y formularios.
 */

/**
 * Sanitiza la búsqueda permitiendo texto, números, espacios y caracteres
 * habituales en especificaciones de acero y construcción (/ . - " '),
 * bloqueando caracteres especiales u operaciones que puedan prestarse a inyecciones.
 *
 * @param {string} value
 * @returns {string}
 */
export function sanitizeSearchQuery(value) {
  if (typeof value !== 'string') return '';
  return value.replace(/[^a-zA-Z0-9áéíóúÁÉÍÓÚñÑüÜ\s/.\-"']/g, '');
}

/**
 * Limpia el texto de entrada para correos electrónicos mientras se escribe,
 * eliminando espacios y caracteres no permitidos en una dirección de email.
 *
 * @param {string} value
 * @returns {string}
 */
export function sanitizeEmailInput(value) {
  if (typeof value !== 'string') return '';
  return value.replace(/[^a-zA-Z0-9@._+-]/g, '');
}

/**
 * Valida si una cadena cumple con un formato de correo electrónico estándar
 * (debe contener usuario, '@', dominio y extensión de al menos 2 caracteres).
 *
 * @param {string} email
 * @returns {boolean}
 */
export function isValidEmail(email) {
  if (!email || typeof email !== 'string') return false;
  const trimmed = email.trim();
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return emailRegex.test(trimmed);
}

/**
 * Permite únicamente letras y espacios (para nombres de personas).
 * Bloquea números y cualquier carácter especial.
 *
 * @param {string} value
 * @returns {string}
 */
export function sanitizeOnlyLettersAndSpaces(value) {
  if (typeof value !== 'string') return '';
  return value.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s]/g, '');
}

/**
 * Permite únicamente dígitos numéricos (0-9) con una longitud máxima opcional.
 *
 * @param {string} value
 * @param {number} [maxLength]
 * @returns {string}
 */
export function sanitizeDigits(value, maxLength) {
  if (typeof value !== 'string' && typeof value !== 'number') return '';
  const digits = String(value).replace(/\D/g, '');
  return maxLength ? digits.slice(0, maxLength) : digits;
}

/**
 * Sanitiza el código de pedido: solo permite letras, números y el guion '-',
 * transformándolo a mayúsculas y eliminando caracteres especiales.
 *
 * @param {string} value
 * @returns {string}
 */
export function sanitizeOrderCode(value) {
  if (typeof value !== 'string') return '';
  return value.replace(/[^a-zA-Z0-9-]/g, '').toUpperCase().slice(0, 20);
}

/**
 * Sanitiza el número de documento según el tipo seleccionado:
 * - DNI: 8 dígitos numéricos
 * - RUC: 11 dígitos numéricos
 * - CE: 9 dígitos numéricos
 * - Pasaporte: alfanumérico hasta 12 caracteres
 *
 * @param {string} value
 * @param {string} documentType
 * @returns {string}
 */
export function sanitizeDocumentNumber(value, documentType = 'DNI') {
  if (typeof value !== 'string' && typeof value !== 'number') return '';
  const str = String(value);

  switch (documentType) {
    case 'DNI':
      return str.replace(/\D/g, '').slice(0, 8);
    case 'RUC':
      return str.replace(/\D/g, '').slice(0, 11);
    case 'CE':
      return str.replace(/\D/g, '').slice(0, 9);
    case 'Pasaporte':
      return str.replace(/[^a-zA-Z0-9]/g, '').toUpperCase().slice(0, 12);
    default:
      return str.replace(/[^a-zA-Z0-9]/g, '').toUpperCase().slice(0, 15);
  }
}

/**
 * Sanitiza texto seguro para áreas de redacción (detalle, reclamo, observaciones).
 * Permite letras, números, signos de puntuación seguros y medidas,
 * bloqueando inyecciones y caracteres como < > { } [ ] \ ^ $ * = + ~
 *
 * @param {string} value
 * @returns {string}
 */
export function sanitizeSafeText(value) {
  if (typeof value !== 'string') return '';
  return value.replace(/[^a-zA-Z0-9áéíóúÁÉÍÓÚñÑüÜ\s/.\-"',;:_()¿?¡!%]/g, '');
}
