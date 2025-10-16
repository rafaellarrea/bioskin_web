// api/blogs/test.js
// Endpoint de diagnóstico para verificar estado del sistema de blogs

export default async function handler(req, res) {
  try {
    // Información básica del sistema
    const diagnosis = {
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
      method: req.method,
      endpoint: '/api/blogs/test'
    };

    // Verificar variables de entorno críticas
    const envCheck = {
      hasOpenAI: !!process.env.OPENAI_API_KEY,
      hasGoogle: !!process.env.GOOGLE_CREDENTIALS_BASE64,
      hasEmail: !!process.env.EMAIL_USER,
      openaiPartial: process.env.OPENAI_API_KEY ? process.env.OPENAI_API_KEY.substring(0, 10) + '...' : 'NO_CONFIGURADA'
    };

    // Verificar imports críticos
    let importStatus = {};
    try {
      const { validateAIConfiguration } = await import('../../lib/ai-service.js');
      importStatus.aiService = 'OK';
      
      // Intentar validar IA
      try {
        validateAIConfiguration();
        importStatus.aiValidation = 'OK';
      } catch (aiError) {
        importStatus.aiValidation = `ERROR: ${aiError.message}`;
      }
    } catch (importError) {
      importStatus.aiService = `IMPORT_ERROR: ${importError.message}`;
    }

    try {
      const { initializeDatabase } = await import('../../lib/database.js');
      importStatus.database = 'OK';
    } catch (dbError) {
      importStatus.database = `IMPORT_ERROR: ${dbError.message}`;
    }

    // Respuesta de diagnóstico
    res.status(200).json({
      success: true,
      message: 'Diagnóstico del sistema de blogs',
      diagnosis,
      environment: envCheck,
      imports: importStatus,
      recommendations: generateRecommendations(envCheck, importStatus)
    });

  } catch (error) {
    console.error('Error en diagnóstico:', error);
    
    // Respuesta de error detallada
    res.status(500).json({
      success: false,
      message: 'Error en diagnóstico del sistema',
      error: {
        message: error.message,
        stack: error.stack,
        name: error.name
      },
      endpoint: '/api/blogs/test'
    });
  }
}

function generateRecommendations(envCheck, importStatus) {
  const recommendations = [];

  if (!envCheck.hasOpenAI) {
    recommendations.push('⚠️ OPENAI_API_KEY no configurada - Configurar en Vercel Environment Variables');
  }

  if (!envCheck.hasGoogle) {
    recommendations.push('⚠️ GOOGLE_CREDENTIALS_BASE64 no configurada');
  }

  if (importStatus.aiService !== 'OK') {
    recommendations.push('🔧 Error importando ai-service.js - Verificar dependencias');
  }

  if (importStatus.database !== 'OK') {
    recommendations.push('🔧 Error importando database.js - Verificar SQLite dependencies');
  }

  if (importStatus.aiValidation && importStatus.aiValidation.includes('ERROR')) {
    recommendations.push('🤖 Configuración IA inválida - Verificar OPENAI_API_KEY');
  }

  if (recommendations.length === 0) {
    recommendations.push('✅ Sistema parece estar configurado correctamente');
  }

  return recommendations;
}