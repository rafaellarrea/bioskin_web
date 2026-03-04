export const taxRules = {
  general: "El SRI permite deducir gastos relacionados con la generación de ingresos.",
  users: {
    Rafael: {
      profession: "Ingeniero Biomédico / Técnico",
      deductible_keywords: [
        "herramienta", "repuesto", "electrónica", "cable", "batería",
        "mantenimiento", "gasolina", "peaje", "parqueadero", "internet",
        "plan celular", "uniforme", "botas", "casco", "lente seguridad"
      ],
      personal_keywords: [
        "cine", "ropa", "zapatos", "supermercado", "juguete", "gym",
        "restaurante", "bar", "hotel", "viaje turismo"
      ],
      warnings: {
        "alimentacion": "⚠️ Solo deducible si es viático o reunión de negocios con cliente.",
        "vehiculo": "✅ Deducible (gasolina/mtto) si el vehículo se usa para visitas técnicas.",
        "salud": "❌ Gasto Personal (Rebaja IR). No genera crédito tributario."
      }
    },
    Daniela: {
      profession: "Médico Estético",
      deductible_keywords: [
        "insumo médico", "farmacia", "bata", "uniforme", "guantes",
        "jeringa", "toxina", "ácido hialurónico", "gasa", "alcohol",
        "congreso", "curso", "publicidad", "marketing", "consultorio", "alquiler"
      ],
      personal_keywords: [
        "ropa", "cartera", "joya", "maquillaje personal", "peluquería",
        "supermercado", "colegio", "restaurante"
      ],
      warnings: {
        "alimentacion": "❌ Generalmente Gasto Personal. Solo deducible como 'Representación' (reunión proveedores).",
        "vehiculo": "⚠️ Deducible solo en proporción al uso profesional (visitas). Rutina casa-consultorio es personal.",
        "belleza": "❌ Peluquería/Uñas: Gasto Personal. Insumos para pacientes: Deducible."
      }
    }
  }
};

export const deductibilityLogic = (description, user) => {
  if (!user || !taxRules.users[user]) return { status: 'unknown', text: '' };
  
  const rules = taxRules.users[user];
  const lowerDesc = description.toLowerCase();
  
  // 1. Check Deductible Keywords
  const isDeductible = rules.deductible_keywords.some(k => lowerDesc.includes(k));
  if (isDeductible) return { 
    status: 'deductible', 
    text: '✅ Gasto Deducible (Negocio)', 
    color: 'text-green-600',
    bg: 'bg-green-50'
  };

  // 2. Check Personal Keywords
  const isPersonal = rules.personal_keywords.some(k => lowerDesc.includes(k));
  if (isPersonal) return { 
    status: 'personal', 
    text: '👤 Gasto Personal (Rebaja IR)', 
    color: 'text-blue-600',
    bg: 'bg-blue-50'
  };

  // 3. Fallback logic based on categories
  if (lowerDesc.includes('comida') || lowerDesc.includes('restaurante')) 
    return { status: 'warning', text: rules.warnings.alimentacion, color: 'text-orange-600', bg: 'bg-orange-50' };
    
  if (lowerDesc.includes('gasolina') || lowerDesc.includes('llanta') || lowerDesc.includes('taller')) 
    return { status: 'warning', text: rules.warnings.vehiculo, color: 'text-orange-600', bg: 'bg-orange-50' };

  return { status: 'neutral', text: '❓ Clasificación manual requerida', color: 'text-gray-500', bg: 'bg-gray-50' };
};
