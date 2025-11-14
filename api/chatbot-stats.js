import { getDatabaseStats } from '../lib/neon-chatbot-db-vercel.js';
import { cleanupService } from '../lib/chatbot-cleanup.js';
import { FallbackStorage } from '../lib/fallback-storage.js';

/**
 * ENDPOINT DE MONITOREO DEL CHATBOT
 * Proporciona estadísticas de uso, almacenamiento y salud del sistema
 * 
 * Métodos soportados:
 * - GET: Obtener estadísticas
 * - POST: Ejecutar mantenimiento manual
 */

export default async function handler(req, res) {
  try {
    // ============================================
    // OBTENER ESTADÍSTICAS (GET)
    // ============================================
    if (req.method === 'GET') {
      console.log('📊 Obteniendo estadísticas del chatbot...');

      let dbStats;
      let usedFallback = false;
      
      // Intentar obtener estadísticas de la base de datos (con timeout)
      try {
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Timeout')), 3000)
        );
        dbStats = await Promise.race([getDatabaseStats(), timeoutPromise]);
      } catch (error) {
        console.warn('⚠️ Base de datos no disponible, usando fallback:', error.message);
        dbStats = FallbackStorage.getStats();
        usedFallback = true;
      }

      // Verificar uso de almacenamiento
      const storageCheck = usedFallback 
        ? { needsCleanup: false, currentMB: 0, maxMB: 512, percentUsed: 0, sizePretty: '0 MB' }
        : await cleanupService.checkStorageUsage();

      // Respuesta completa
      const stats = {
        timestamp: new Date().toISOString(),
        status: storageCheck.needsCleanup ? 'warning' : (usedFallback ? 'fallback' : 'healthy'),
        dataSource: usedFallback ? 'memory (database unavailable)' : 'database',
        storage: {
          current: `${storageCheck.currentMB} MB`,
          limit: `${storageCheck.maxMB} MB`,
          percentUsed: `${storageCheck.percentUsed}%`,
          needsCleanup: storageCheck.needsCleanup,
          pretty: storageCheck.sizePretty
        },
        database: dbStats,
        limits: {
          maxMessagesPerSession: cleanupService.maxMessagesPerSession,
          maxSessionAgeDays: cleanupService.maxSessionAgeDays,
          cleanupThreshold: `${cleanupService.cleanupThreshold * 100}%`
        }
      };

      console.log(`✅ Estadísticas generadas${usedFallback ? ' (modo fallback)' : ''}`);
      return res.status(200).json(stats);
    }

    // ============================================
    // EJECUTAR MANTENIMIENTO (POST)
    // ============================================
    if (req.method === 'POST') {
      const { action, force } = req.body;

      console.log(`🔧 Ejecutando acción: ${action || 'maintenance'}`);

      switch (action) {
        case 'maintenance':
        case 'cleanup':
          // Ejecutar mantenimiento completo
          const maintenanceResult = await cleanupService.performMaintenance(force);
          return res.status(200).json({
            success: true,
            action: 'maintenance',
            result: maintenanceResult
          });

        case 'check':
          // Solo verificar sin limpiar
          const checkResult = await cleanupService.checkStorageUsage();
          return res.status(200).json({
            success: true,
            action: 'check',
            result: checkResult
          });

        case 'stats':
          // Obtener estadísticas completas
          const statsResult = await getDatabaseStats();
          return res.status(200).json({
            success: true,
            action: 'stats',
            result: statsResult
          });

        default:
          return res.status(400).json({
            error: 'Acción no válida',
            validActions: ['maintenance', 'cleanup', 'check', 'stats']
          });
      }
    }

    // Método no permitido
    return res.status(405).json({ error: 'Method not allowed' });

  } catch (error) {
    console.error('❌ Error en endpoint de monitoreo:', error);
    return res.status(500).json({ 
      error: 'Error interno del servidor',
      message: error.message 
    });
  }
}
