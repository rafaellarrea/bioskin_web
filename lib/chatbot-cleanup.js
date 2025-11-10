import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.NEON_DATABASE_URL);

/**
 * Servicio de limpieza y mantenimiento del chatbot
 * Mantiene el uso de almacenamiento bajo control
 */
export class ChatbotCleanupService {
  constructor() {
    this.maxStorageMB = 400; // 78% del límite de 512 MB
    this.maxMessagesPerSession = 50; // Máximo de mensajes por sesión
    this.maxSessionAgeDays = 30; // Días antes de borrar sesión inactiva
    this.cleanupThreshold = 0.8; // Limpiar al 80% de uso
  }

  /**
   * Verifica el uso actual de almacenamiento
   */
  async checkStorageUsage() {
    try {
      const result = await sql`
        SELECT 
          pg_database_size(current_database()) as size_bytes,
          pg_size_pretty(pg_database_size(current_database())) as size_pretty
      `;
      
      const sizeMB = result[0].size_bytes / (1024 * 1024);
      const percentUsed = (sizeMB / this.maxStorageMB) * 100;
      
      return {
        currentMB: parseFloat(sizeMB.toFixed(2)),
        maxMB: this.maxStorageMB,
        percentUsed: parseFloat(percentUsed.toFixed(1)),
        needsCleanup: sizeMB > (this.maxStorageMB * this.cleanupThreshold),
        sizePretty: result[0].size_pretty
      };
    } catch (error) {
      console.error('❌ Error verificando almacenamiento:', error);
      throw error;
    }
  }

  /**
   * Limpia conversaciones antiguas (>30 días sin actividad)
   */
  async cleanOldConversations() {
    try {
      console.log('🧹 Limpiando conversaciones antiguas...');
      
      const result = await sql`
        DELETE FROM chat_conversations
        WHERE last_message_at < NOW() - INTERVAL '${this.maxSessionAgeDays} days'
        RETURNING id, session_id
      `;
      
      const count = result.length;
      console.log(`✅ ${count} conversaciones antiguas eliminadas`);
      
      return {
        deleted: count,
        type: 'old_conversations'
      };
    } catch (error) {
      console.error('❌ Error limpiando conversaciones:', error);
      throw error;
    }
  }

  /**
   * Recorta sesiones largas manteniendo solo los últimos N mensajes
   */
  async trimLongSessions() {
    try {
      console.log('✂️ Recortando sesiones largas...');
      
      // Encuentra sesiones con más mensajes del límite
      const longSessions = await sql`
        SELECT session_id, COUNT(*) as message_count
        FROM chat_messages
        GROUP BY session_id
        HAVING COUNT(*) > ${this.maxMessagesPerSession}
      `;

      let totalDeleted = 0;
      
      for (const session of longSessions) {
        const toDelete = session.message_count - this.maxMessagesPerSession;
        
        const deleted = await sql`
          DELETE FROM chat_messages
          WHERE id IN (
            SELECT id FROM chat_messages
            WHERE session_id = ${session.session_id}
            ORDER BY timestamp ASC
            LIMIT ${toDelete}
          )
          RETURNING id
        `;
        
        totalDeleted += deleted.length;
      }

      console.log(`✅ ${totalDeleted} mensajes antiguos eliminados de ${longSessions.length} sesiones`);
      
      return {
        deleted: totalDeleted,
        sessionsAffected: longSessions.length,
        type: 'trim_sessions'
      };
    } catch (error) {
      console.error('❌ Error recortando sesiones:', error);
      throw error;
    }
  }

  /**
   * Limpia sesiones inactivas (sin actividad en los últimos N días)
   */
  async cleanInactiveSessions(daysInactive = 7) {
    try {
      console.log(`🗑️ Limpiando sesiones inactivas (>${daysInactive} días)...`);
      
      const result = await sql`
        DELETE FROM chat_conversations
        WHERE 
          is_active = false 
          OR last_message_at < NOW() - INTERVAL '${daysInactive} days'
        RETURNING id, session_id
      `;
      
      const count = result.length;
      console.log(`✅ ${count} sesiones inactivas eliminadas`);
      
      return {
        deleted: count,
        type: 'inactive_sessions'
      };
    } catch (error) {
      console.error('❌ Error limpiando sesiones inactivas:', error);
      throw error;
    }
  }

  /**
   * Ejecuta limpieza completa con reporte detallado
   */
  async performMaintenance(force = false) {
    try {
      const startTime = Date.now();
      console.log('🔧 Iniciando mantenimiento del chatbot...');
      
      // Verificar uso actual
      const usageBefore = await this.checkStorageUsage();
      console.log(`📊 Uso actual: ${usageBefore.currentMB} MB (${usageBefore.percentUsed}%)`);

      // Si no necesita limpieza y no es forzado, salir
      if (!usageBefore.needsCleanup && !force) {
        console.log('✅ No se requiere limpieza en este momento');
        return {
          performed: false,
          reason: 'below_threshold',
          usage: usageBefore
        };
      }

      // Ejecutar limpieza
      const results = {
        oldConversations: await this.cleanOldConversations(),
        trimmedSessions: await this.trimLongSessions(),
        inactiveSessions: await this.cleanInactiveSessions()
      };

      // Verificar uso después de limpieza
      const usageAfter = await this.checkStorageUsage();
      const duration = Date.now() - startTime;

      const report = {
        performed: true,
        duration: `${duration}ms`,
        before: usageBefore,
        after: usageAfter,
        freed: {
          mb: parseFloat((usageBefore.currentMB - usageAfter.currentMB).toFixed(2)),
          percent: parseFloat((usageBefore.percentUsed - usageAfter.percentUsed).toFixed(1))
        },
        details: results
      };

      console.log('✅ Mantenimiento completado:', report);
      return report;
    } catch (error) {
      console.error('❌ Error en mantenimiento:', error);
      throw error;
    }
  }

  /**
   * Limpieza ligera para ejecutar en cada request
   * Solo limpia si está muy cerca del límite
   */
  async lightCleanup() {
    try {
      const usage = await this.checkStorageUsage();
      
      // Solo actuar si está por encima del 90%
      if (usage.percentUsed > 90) {
        console.log('⚠️ Almacenamiento crítico, ejecutando limpieza ligera...');
        await this.cleanInactiveSessions(3); // Solo últimos 3 días
        return { performed: true, reason: 'critical_storage' };
      }
      
      return { performed: false, reason: 'storage_ok' };
    } catch (error) {
      console.error('❌ Error en limpieza ligera:', error);
      return { performed: false, error: error.message };
    }
  }
}

// Instancia por defecto
export const cleanupService = new ChatbotCleanupService();
