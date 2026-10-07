// Inline clean SVG images for high fidelity offline rendering
const makeSvgImage = (title, color = '#334155', accent = '#2563EB') => {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400" viewBox="0 0 600 400" fill="none">
    <rect width="600" height="400" fill="#F1F5F9"/>
    <rect x="50" y="50" width="500" height="300" rx="16" fill="${color}" stroke="#CBD5E1" stroke-width="4"/>
    <circle cx="300" cy="180" r="60" fill="${accent}" opacity="0.8"/>
    <path d="M 220 220 L 380 220 M 260 140 L 340 140" stroke="#FFFFFF" stroke-width="8" stroke-linecap="round"/>
    <text x="300" y="320" font-family="sans-serif" font-size="22" font-weight="bold" fill="#FFFFFF" text-anchor="middle">${title}</text>
  </svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
};

export const MOCK_CATEGORIES = [
  { slug: 'tubos', nombre: 'Tubos', descripcion: 'Tubos estructurales, redondos, cuadrados y rectangulares en acero negro y galvanizado.', total: 2 },
  { slug: 'planchas', nombre: 'Planchas', descripcion: 'Planchas de acero LAC (laminado en caliente) y LAF (laminado en frío).', total: 2 },
  { slug: 'perfiles', nombre: 'Perfiles', descripcion: 'Perfiles estructurales tipo C, H, U y ángulos de alta resistencia.', total: 2 },
  { slug: 'fierros', nombre: 'Fierros', descripcion: 'Fierro corrugado para construcción civil y fierro redondo liso.', total: 2 }
];

export const MOCK_PRODUCTS = [
  {
    id: 'prod-001',
    nombre: 'Tubo Negro Estructural 2" x 2.0 mm x 6m',
    categoria: 'tubos',
    acabado: 'negro',
    medida: '2 pulgadas (50.8 mm)',
    espesor: '2.0 mm',
    descripcion_corta: 'Tubo de acero negro apto para estructuras metálicas, cercos y tijerales de alta estabilidad.',
    ficha_tecnica: [
      { clave: 'Diámetro / Medida', valor: '2 pulgadas (50.8 mm)' },
      { clave: 'Espesor de pared', valor: '2.0 mm' },
      { clave: 'Longitud estándar', valor: '6.00 metros' },
      { clave: 'Norma de fabricación', valor: 'NTE INACAL / ASTM A500' },
      { clave: 'Peso aproximado', valor: '14.20 kg' }
    ],
    faqs: [
      { pregunta: '¿Viene pintado o barnizado?', respuesta: 'Se entrega con un recubrimiento protector temporal de aceite anticorrosivo.' },
      { pregunta: '¿Realizan cortes a medida?', respuesta: 'Sí, podemos coordinar cortes preliminares previa confirmación con el asesor.' }
    ],
    precio_unitario: 128.90,
    stock_disponible: 45,
    stock_estado: 'disponible', // disponible | pocas_unidades | agotado
    imagen_url: makeSvgImage('Tubo Negro 2" x 2mm', '#1E293B', '#2563EB')
  },
  {
    id: 'prod-002',
    nombre: 'Tubo Galvanizado Redondo 1 1/2" x 1.8 mm x 6m',
    categoria: 'tubos',
    acabado: 'galvanizado',
    medida: '1 1/2 pulgadas',
    espesor: '1.8 mm',
    descripcion_corta: 'Resistente a la corrosión exterior, ideal para cercos perimétricos y estructuras expuestas.',
    ficha_tecnica: [
      { clave: 'Diámetro', valor: '1 1/2 pulgadas (38.1 mm)' },
      { clave: 'Espesor', valor: '1.8 mm' },
      { clave: 'Longitud', valor: '6.00 metros' },
      { clave: 'Capa galvanizada', valor: 'Z-275 (275 g/m²)' }
    ],
    faqs: [
      { pregunta: '¿Soporta intemperie sin pintar?', respuesta: 'Sí, la capa de zinc brinda alta resistencia a la corrosión en Lima y zonas costeras.' }
    ],
    precio_unitario: 154.50,
    stock_disponible: 5,
    stock_estado: 'pocas_unidades',
    imagen_url: makeSvgImage('Tubo Galvanizado 1 1/2"', '#475569', '#0EA5E9')
  },
  {
    id: 'prod-003',
    nombre: 'Plancha LAC de Acero 1/8" (3.0 mm) x 1.20m x 2.40m',
    categoria: 'planchas',
    acabado: 'lac',
    medida: '1.20 m x 2.40 m',
    espesor: '3.0 mm (1/8")',
    descripcion_corta: 'Plancha de acero laminada en caliente para plataformas, tolvas y cerrajería pesada.',
    ficha_tecnica: [
      { clave: 'Dimensiones', valor: '1200 mm x 2400 mm' },
      { clave: 'Espesor nominal', valor: '3.0 mm (1/8")' },
      { clave: 'Calidad de acero', valor: 'ASTM A36' },
      { clave: 'Peso estimado', valor: '67.80 kg' }
    ],
    faqs: [
      { pregunta: '¿Es maleable para plegado?', respuesta: 'Sí, el acero ASTM A36 es excelente para soldadura y plegado industrial.' }
    ],
    precio_unitario: 310.00,
    stock_disponible: 18,
    stock_estado: 'disponible',
    imagen_url: makeSvgImage('Plancha LAC 3mm 1.2x2.4m', '#0F172A', '#F97316')
  },
  {
    id: 'prod-004',
    nombre: 'Plancha LAF Laminada en Frío 1.2 mm x 1.20m x 2.40m',
    categoria: 'planchas',
    acabado: 'laf',
    medida: '1.20 m x 2.40 m',
    espesor: '1.2 mm',
    descripcion_corta: 'Superficie lisa y limpia de alta precisión, especial para gabinetes y tableros eléctricos.',
    ficha_tecnica: [
      { clave: 'Dimensiones', valor: '1200 mm x 2400 mm' },
      { clave: 'Espesor', valor: '1.2 mm' },
      { clave: 'Acabado', valor: 'Laminado en frío pulido' },
      { clave: 'Peso estimado', valor: '27.10 kg' }
    ],
    faqs: [
      { pregunta: '¿Se requiere preparación previa para pintura al horno?', respuesta: 'Únicamente un desengrasado ligero ya que no posee cascarilla de laminación.' }
    ],
    precio_unitario: 185.00,
    stock_disponible: 0,
    stock_estado: 'agotado',
    imagen_url: makeSvgImage('Plancha LAF 1.2mm', '#334155', '#6366F1')
  },
  {
    id: 'prod-005',
    nombre: 'Perfil C Galvanizado 100 x 50 x 2.0 mm x 6m',
    categoria: 'perfiles',
    acabado: 'galvanizado',
    medida: '100 mm x 50 mm',
    espesor: '2.0 mm',
    descripcion_corta: 'Perfil liviano galvanizado para correas de techo, naves industriales y estructuras ligeras.',
    ficha_tecnica: [
      { clave: 'Peralte x Ala', valor: '100 mm x 50 mm' },
      { clave: 'Espesor', valor: '2.0 mm' },
      { clave: 'Largo', valor: '6.00 metros' },
      { clave: 'Material', valor: 'Acero galvanizado de alta tenacidad' }
    ],
    faqs: [
      { pregunta: '¿Cómo se fija en techos?', respuesta: 'Mediante pernos autorroscantes o soldadura con electrodo adecuado para galvanizado.' }
    ],
    precio_unitario: 142.00,
    stock_disponible: 32,
    stock_estado: 'disponible',
    imagen_url: makeSvgImage('Perfil C Galv 100x50', '#1E293B', '#10B981')
  },
  {
    id: 'prod-006',
    nombre: 'Perfil H BEAM 6" x 6" (HEB 150) x 6m',
    categoria: 'perfiles',
    acabado: 'negro',
    medida: '6" x 6" (150 mm x 150 mm)',
    espesor: 'Estructural 7 mm',
    descripcion_corta: 'Viga de acero estructural pesado para columnas de soporte y puentes grúa.',
    ficha_tecnica: [
      { clave: 'Sección', valor: '150 mm x 150 mm (6x6")' },
      { clave: 'Largo', valor: '6.00 metros' },
      { clave: 'Norma', valor: 'ASTM A992 / A36' },
      { clave: 'Peso metro', valor: '30.00 kg/m' }
    ],
    faqs: [
      { pregunta: '¿Entregan certificado de calidad de colada?', respuesta: 'Sí, Comercial Kenpaku entrega certificado del fabricante previa solicitud.' }
    ],
    precio_unitario: 890.00,
    stock_disponible: 3,
    stock_estado: 'pocas_unidades',
    imagen_url: makeSvgImage('Perfil H BEAM 6x6"', '#0F172A', '#EAB308')
  },
  {
    id: 'prod-007',
    nombre: 'Fierro Corrugado Grado 60 1/2" x 9m',
    categoria: 'fierros',
    acabado: 'corrugado',
    medida: '1/2 pulgada (12 mm)',
    espesor: '12 mm',
    descripcion_corta: 'Varilla de acero corrugado de alta adherencia para columnas, vigas y zapatas de construcción.',
    ficha_tecnica: [
      { clave: 'Diámetro nominal', valor: '1/2" (12 mm)' },
      { clave: 'Longitud', valor: '9.00 metros' },
      { clave: 'Grado', valor: 'Grado 60 (Fy = 4200 kg/cm²)' },
      { clave: 'Norma', valor: 'NTP 341.068 / ASTM A615' }
    ],
    faqs: [
      { pregunta: '¿Viene en atados o unidades?', respuesta: 'Vendemos desde 1 unidad hasta paquetes de tonelada con precio preferencial.' }
    ],
    precio_unitario: 42.50,
    stock_disponible: 250,
    stock_estado: 'disponible',
    imagen_url: makeSvgImage('Fierro Corrugado 1/2"', '#334155', '#2563EB')
  },
  {
    id: 'prod-008',
    nombre: 'Fierro Redondo Liso 3/8" x 6m',
    categoria: 'fierros',
    acabado: 'negro',
    medida: '3/8 pulgada (9.5 mm)',
    espesor: '9.5 mm',
    descripcion_corta: 'Barra redonda lisa de acero ideal para cerrajería, estribos y estructuras de herrería.',
    ficha_tecnica: [
      { clave: 'Diámetro', valor: '3/8" (9.5 mm)' },
      { clave: 'Longitud', valor: '6.00 metros' },
      { clave: 'Acabado', valor: 'Negro liso' }
    ],
    faqs: [
      { pregunta: '¿Es fácil de doblar en frío?', respuesta: 'Sí, excelente ductilidad para elaboración de estribos y rejas.' }
    ],
    precio_unitario: 24.80,
    stock_disponible: 85,
    stock_estado: 'disponible',
    imagen_url: makeSvgImage('Fierro Redondo Liso 3/8"', '#475569', '#EC4899')
  }
];

export const MOCK_ORDERS = [
  {
    codigo: 'KPK-000101',
    fecha: '2026-10-06T10:15:00',
    estado: 'pendiente', // pendiente, confirmado, entregado, cancelado
    cliente: {
      nombre: 'Juan Pérez Tafur',
      telefono: '987654321',
      correo: 'juan.perez@ejemplo.com'
    },
    recojo_en_tienda: false,
    direccion: 'Av. Gambetta 1420, Puente Piedra, Lima',
    observaciones: 'Entregar por la mañana, llamar antes de llegar.',
    subtotal: 396.10,
    igv: 71.30,
    total: 467.40,
    items: [
      { product_id: 'prod-001', nombre: 'Tubo Negro Estructural 2" x 2.0 mm x 6m', cantidad: 3, precio_unitario: 128.90 },
      { product_id: 'prod-007', nombre: 'Fierro Corrugado Grado 60 1/2" x 9m', cantidad: 2, precio_unitario: 42.50 }
    ]
  }
];

export const MOCK_CLAIMS = [
  {
    codigo_seguimiento: 'REC-2026-0089',
    fecha: '2026-10-05T14:20:00',
    nombre: 'Carlos Mendoza',
    documento: '45891234',
    telefono: '912345678',
    correo: 'carlos.mendoza@ejemplo.com',
    direccion: 'Jr. Los Olivos 345, Puente Piedra',
    tipo_bien: 'producto',
    monto_reclamado: 128.90,
    descripcion_bien: 'Tubo Negro Estructural 2"',
    tipo: 'reclamo',
    detalle: 'El producto presentó un raspón profundo en el galvanizado de la punta.',
    pedido_consumidor: 'Cambio de la barra de tubo por una en perfecto estado.'
  }
];

export const MOCK_CHAT_LOGS = [
  {
    id: 'session-8921',
    conversation_id: 'conv-abc-123',
    fecha: '2026-10-06T11:00:00',
    mensajes_count: 4,
    handoff: false,
    resumen: 'Consulta sobre tipo de tubo para tijeral de 6 metros.'
  }
];
