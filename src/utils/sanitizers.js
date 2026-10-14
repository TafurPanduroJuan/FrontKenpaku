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
  return value.replace(/[^a-zA-Z0-9-]/g, '').toUpperCase().slice(0, 50);
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

/**
 * Sanitiza nombres comerciales de productos y medidas.
 * Permite letras, números, espacios, comillas de pulgada, puntos, barras, paréntesis y guiones.
 * Bloquea etiquetas HTML, scripts, operadores y caracteres peligrosos.
 *
 * @param {string} value
 * @returns {string}
 */
export function sanitizeProductName(value) {
  if (typeof value !== 'string') return '';
  return value.replace(/[^a-zA-Z0-9áéíóúÁÉÍÓÚñÑüÜ\s/.\-"'()_]/g, '');
}

/**
 * Sanitiza valores para stock: solo números enteros positivos (0 o mayores).
 *
 * @param {string|number} value
 * @returns {string}
 */
export function sanitizePositiveInteger(value) {
  if (typeof value !== 'string' && typeof value !== 'number') return '';
  return String(value).replace(/\D/g, '');
}

/**
 * Sanitiza valores decimales positivos (por ejemplo, precios):
 * Permite dígitos y a lo sumo un punto decimal, sin signos negativos ni exponenciales.
 *
 * @param {string|number} value
 * @returns {string}
 */
export function sanitizePositiveDecimal(value) {
  if (typeof value !== 'string' && typeof value !== 'number') return '';
  let str = String(value).replace(/[^0-9.]/g, '');
  const parts = str.split('.');
  if (parts.length > 2) {
    str = parts[0] + '.' + parts.slice(1).join('');
  }
  return str;
}

/**
 * Sanitiza redacción técnica (especificaciones, normas ASTM, usos, advertencias).
 * Admite multilínea, saltos de línea, dos puntos, viñetas, porcentajes y grados.
 * Bloquea inyecciones de script y etiquetas < > { } [ ] \ ^ $ = *.
 *
 * @param {string} value
 * @returns {string}
 */
export function sanitizeTechnicalSpecs(value) {
  if (typeof value !== 'string') return '';
  return value.replace(/[^a-zA-Z0-9áéíóúÁÉÍÓÚñÑüÜ\s/.\-"',;:_()¿?¡!%°±\n\r]/g, '');
}

/**
 * Previene el tipeo de caracteres no enteros en inputs numéricos de stock (+, -, e, E, ., ,).
 *
 * @param {React.KeyboardEvent} e
 */
export function preventNonIntegerKeys(e) {
  if (['e', 'E', '+', '-', '.', ','].includes(e.key)) {
    e.preventDefault();
  }
}

/**
 * Previene el tipeo de caracteres negativos o exponenciales en inputs decimales (+, -, e, E, ,).
 *
 * @param {React.KeyboardEvent} e
 */
export function preventNegativeAndExpKeys(e) {
  if (['e', 'E', '+', '-', ','].includes(e.key)) {
    e.preventDefault();
  }
}
