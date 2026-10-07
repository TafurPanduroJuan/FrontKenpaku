export const STORE_INFO = {
  name: 'Comercial Kenpaku S.A.C.',
  ruc: '20521664623',
  address: import.meta.env.VITE_STORE_ADDRESS || 'Av. Panamericana Norte Km 25.5, Puente Piedra, Lima - Perú',
  phone: import.meta.env.VITE_STORE_PHONE || '(01) 555-1234',
  whatsappNumber: import.meta.env.VITE_WHATSAPP_NUMBER || '51987654321',
  schedule: 'Lun – Sáb: 8:00 a. m. – 6:00 p. m.',
  locationBadge: 'Atención en Puente Piedra, Lima',
  experienceYears: 14,
};

export const STOCK_STATUS = {
  DISPONIBLE: {
    label: 'Disponible',
    variant: 'success',
    badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-200'
  },
  POCAS_UNIDADES: {
    label: 'Pocas unidades',
    variant: 'warning',
    badgeClass: 'bg-amber-100 text-amber-800 border-amber-200'
  },
  AGOTADO: {
    label: 'Agotado',
    variant: 'danger',
    badgeClass: 'bg-slate-100 text-slate-600 border-slate-200'
  }
};

export const CATEGORIES_LIST = [
  { slug: 'tubos', nombre: 'Tubos' },
  { slug: 'planchas', nombre: 'Planchas' },
  { slug: 'perfiles', nombre: 'Perfiles' },
  { slug: 'fierros', nombre: 'Fierros' }
];

export const FINISH_TYPES = [
  { slug: 'negro', nombre: 'Acero Negro' },
  { slug: 'galvanizado', nombre: 'Galvanizado' },
  { slug: 'laf', nombre: 'Laminado en Frío (LAF)' },
  { slug: 'lac', nombre: 'Laminado en Caliente (LAC)' },
  { slug: 'corrugado', nombre: 'Corrugado' }
];

export const SORT_OPTIONS = [
  { value: 'relevancia', label: 'Más relevantes' },
  { value: 'precio_asc', label: 'Precio: Menor a Mayor' },
  { value: 'precio_desc', label: 'Precio: Mayor a Menor' },
  { value: 'nombre_asc', label: 'Nombre: A - Z' }
];
