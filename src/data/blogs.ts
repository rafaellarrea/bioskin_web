// src/data/blogs.ts

export interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  category: 'medico-estetico' | 'tecnico';
  author: string;
  publishedAt: string;
  readTime: number; // en minutos
  tags: string[];
  image: string;
  featured: boolean;
  citations?: {
    text: string;
    source: string;
    url?: string;
  }[];
}

// Datos de ejemplo para desarrollo
export const blogPosts: BlogPost[] = [
  {
    id: "1",
    title: "Beneficios del Ácido Hialurónico en Tratamientos Faciales",
    slug: "beneficios-acido-hialuronico-tratamientos-faciales",
    excerpt: "Descubre cómo el ácido hialurónico puede transformar tu piel y los diferentes tipos de tratamientos disponibles en medicina estética.",
    content: `
# Beneficios del Ácido Hialurónico en Tratamientos Faciales

El ácido hialurónico es una de las sustancias más revolucionarias en el mundo de la medicina estética moderna. Esta molécula natural, presente en nuestro cuerpo, ha demostrado ser fundamental para mantener la hidratación y elasticidad de la piel.

## ¿Qué es el Ácido Hialurónico?

El ácido hialurónico es una sustancia naturalmente presente en nuestro organismo, especialmente en la piel, articulaciones y ojos. Su principal característica es su capacidad de retener hasta 1000 veces su peso en agua.

## Beneficios Principales

### 1. Hidratación Profunda
- Mejora la retención de humedad en la piel
- Proporciona un aspecto más radiante y saludable

### 2. Reducción de Arrugas
- Rellena líneas finas y arrugas
- Estimula la producción natural de colágeno

### 3. Resultados Naturales
- Los tratamientos con ácido hialurónico ofrecen resultados sutiles y naturales
- No alteran la expresión facial natural

## Tipos de Tratamientos

En BIOSKIN ofrecemos diferentes aplicaciones de ácido hialurónico según las necesidades específicas de cada paciente.
    `,
    category: "medico-estetico",
    author: "Dra. Daniela Creamer",
    publishedAt: "2024-10-10",
    readTime: 5,
    tags: ["ácido hialurónico", "hidratación", "anti-aging", "medicina estética"],
    image: "/images/blog/acido-hialuronico.jpg",
    featured: true,
    citations: [
      {
        text: "El ácido hialurónico puede retener hasta 1000 veces su peso en agua",
        source: "Journal of Cosmetic Dermatology, 2023"
      }
    ]
  },
  {
    id: "2",
    title: "Tecnología IPL: Fundamentos y Aplicaciones Clínicas",
    slug: "tecnologia-ipl-fundamentos-aplicaciones-clinicas",
    excerpt: "Análisis técnico de la tecnología de Luz Pulsada Intensa (IPL) y sus múltiples aplicaciones en medicina estética.",
    content: `
# Tecnología IPL: Fundamentos y Aplicaciones Clínicas

La tecnología de Luz Pulsada Intensa (IPL) representa uno de los avances más significativos en equipamiento médico estético.

## Principios Físicos del IPL

### Espectro de Luz
- Longitudes de onda: 515-1200 nm
- Filtros específicos para diferentes cromóforos
- Energía controlada y programable

### Mecanismo de Acción
1. **Fototermólisis Selectiva**: La luz es absorbida por cromóforos específicos
2. **Conversión térmica**: La energía lumínica se convierte en calor
3. **Efecto terapéutico**: Destrucción selectiva del tejido objetivo

## Aplicaciones Clínicas

### Eliminación de Manchas
- Melasma
- Léntigos solares
- Hiperpigmentación post-inflamatoria

### Depilación
- Destrucción del folículo piloso
- Resultados duraderos
- Apto para diferentes fototipos

## Consideraciones Técnicas

### Parámetros de Tratamiento
- **Fluencia**: 12-40 J/cm²
- **Duración del pulso**: 2.5-20 ms
- **Intervalo entre disparos**: 1-3 segundos

### Seguridad
- Evaluación del fototipo cutáneo
- Prueba de sensibilidad obligatoria
- Protección ocular esencial
    `,
    category: "tecnico",
    author: "Equipo Técnico BIOSKIN",
    publishedAt: "2024-10-08",
    readTime: 8,
    tags: ["IPL", "fototermólisis", "tecnología médica", "equipamiento"],
    image: "/images/blog/tecnologia-ipl.jpg",
    featured: false,
    citations: [
      {
        text: "La fototermólisis selectiva es el principio fundamental de los tratamientos con IPL",
        source: "Lasers in Surgery and Medicine, 2024"
      }
    ]
  }
];

// Función para obtener blogs por categoría
export const getBlogsByCategory = (category?: 'medico-estetico' | 'tecnico'): BlogPost[] => {
  if (!category) return blogPosts;
  return blogPosts.filter(blog => blog.category === category);
};

// Función para obtener blog por slug
export const getBlogBySlug = (slug: string): BlogPost | undefined => {
  return blogPosts.find(blog => blog.slug === slug);
};

// Función para obtener blogs destacados
export const getFeaturedBlogs = (): BlogPost[] => {
  return blogPosts.filter(blog => blog.featured);
};