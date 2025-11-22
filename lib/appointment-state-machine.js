/**
 * Máquina de Estados para Agendamiento de Citas - MEJORADA
 * 
 * Mejoras implementadas:
 * - Mensajes más naturales y concisos
 * - Validaciones más flexibles y permisivas
 * - Mejor manejo de errores con fallbacks
 * - Código DRY con funciones helper
 * - Timeout configurable
 */

import { 
  checkAvailability, 
  getAvailableHours,
  suggestAvailableHours,
  parseNaturalDate,
  parseNaturalTime,
  createAppointment,
  APPOINTMENT_LINK 
} from './chatbot-appointment-service.js';
import { findServiceByKeyword as findTreatmentByKeyword } from './services-adapter.js';

// ========================================
// FUNCIONES HELPER (DRY)
// ========================================

/**
 * Formatea fecha legible en español
 * Ejemplo: "viernes, 21 de noviembre de 2025"
 */
function formatDateFriendly(dateStr) {
  const dateObj = new Date(dateStr + 'T00:00:00-05:00');
  return dateObj.toLocaleDateString('es-ES', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    weekday: 'long',
    timeZone: 'America/Guayaquil'
  });
}

/**
 * Formatea fecha corta en español
 * Ejemplo: "viernes, 21 de noviembre"
 */
function formatDateShort(dateStr) {
  const dateObj = new Date(dateStr + 'T00:00:00-05:00');
  return dateObj.toLocaleDateString('es-ES', {
    day: 'numeric',
    month: 'long',
    weekday: 'long',
    timeZone: 'America/Guayaquil'
  });
}

/**
 * Organiza horarios por periodos del día
 * Filtra hora de almuerzo (13:00) automáticamente
 */
function formatAvailableSlots(slots) {
  const filtered = slots.filter(h => parseInt(h.split(':')[0]) !== 13);
  
  const morning = filtered.filter(h => parseInt(h.split(':')[0]) < 12);
  const afternoon = filtered.filter(h => {
    const hour = parseInt(h.split(':')[0]);
    return hour >= 12 && hour < 17;
  });
  const evening = filtered.filter(h => parseInt(h.split(':')[0]) >= 17);

  let result = [];
  if (morning.length > 0) result.push(`🌅 Mañana: ${morning.join(', ')}`);
  if (afternoon.length > 0) result.push(`☀️ Tarde: ${afternoon.join(', ')}`);
  if (evening.length > 0) result.push(`🌙 Noche: ${evening.join(', ')}`);
  
  return result.join('\n');
}

/**
 * Valida nombre - MÁS PERMISIVO que antes
 * Acepta: espacios, guiones, apóstrofes, tildes
 */
function isValidName(name) {
  const trimmed = name.trim();
  if (trimmed.split(/\s+/).length < 2) return false;
  const pattern = /^[A-Za-zÁÉÍÓÚáéíóúÑñ\s\-']+$/;
  return pattern.test(trimmed);
}

/**
 * Capitaliza nombre correctamente
 */
function capitalizeName(name) {
  return name
    .trim()
    .split(/\s+/)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

/**
 * Wrapper seguro para llamadas externas
 */
async function safeCall(fn, context) {
  try {
    return await fn();
  } catch (error) {
    console.error(`❌ [SafeCall] Error en ${context}:`, error);
    return { success: false, available: [], error: true, message: 'Error técnico' };
  }
}

// ========================================
// ESTADOS DE LA MÁQUINA
// ========================================

export const APPOINTMENT_STATES = {
  IDLE: 'IDLE',                       // Sin proceso de agendamiento activo
  AWAITING_DATE: 'AWAITING_DATE',     // Esperando que el usuario indique fecha
  CONFIRMING_DATE: 'CONFIRMING_DATE', // Confirmando la fecha elegida
  AWAITING_TIME: 'AWAITING_TIME',     // Esperando hora específica
  CONFIRMING_TIME: 'CONFIRMING_TIME', // Confirmando la hora elegida
  AWAITING_NAME: 'AWAITING_NAME',     // Esperando nombre del paciente
  AWAITING_SERVICE: 'AWAITING_SERVICE', // Esperando tratamiento deseado
  CONFIRMING: 'CONFIRMING',           // Esperando confirmación final
  COMPLETE: 'COMPLETE'                // Cita creada exitosamente
};

/**
 * Clase que maneja el estado de agendamiento de una conversación
 */
export class AppointmentStateMachine {
  constructor(sessionId, options = {}) {
    this.sessionId = sessionId;
    this.state = APPOINTMENT_STATES.IDLE;
    this.data = {
      date: null,
      time: null,
      name: null,
      service: null,
      phone: null
    };
    this.lastActivity = Date.now();
    this.timeoutMinutes = options.timeoutMinutes || 10; // Timeout configurable
  }

  /**
   * Verifica si la sesión ha expirado por inactividad
   */
  isExpired() {
    const now = Date.now();
    const elapsed = (now - this.lastActivity) / 1000 / 60; // minutos
    return elapsed > this.timeoutMinutes;
  }

  /**
   * Actualiza el timestamp de última actividad
   */
  updateActivity() {
    this.lastActivity = Date.now();
  }

  /**
   * Inicia el proceso de agendamiento
   * @param {string} phone - Número de teléfono
   * @param {Object} options - Opciones adicionales (treatmentId, contextQuestionId, treatmentPrice, consultationIncluded)
   * @returns {Object} Estado y mensaje inicial
   */
  start(phone, options = {}) {
    console.log(`📋 [StateMachine] Iniciando flujo de agendamiento para ${this.sessionId}`);
    
    // Configurar opciones
    if (options.treatmentId) {
      console.log(`🎯 [StateMachine] Pre-llenando servicio: ${options.treatmentId}`);
      this.data.service = options.treatmentId;
      this.data.treatmentPrice = options.treatmentPrice || null;
      this.data.consultationIncluded = options.consultationIncluded !== undefined ? options.consultationIncluded : true;
      this.data.contextQuestionId = options.contextQuestionId || null;
    }
    
    this.state = APPOINTMENT_STATES.AWAITING_DATE;
    this.data.phone = phone;
    
    return {
      state: this.state,
      message: `¡Perfecto! Te ayudo a agendar tu cita 😊\n\n¿Qué día te gustaría venir?\n\nPuedes decir, por ejemplo:\n• Mañana\n• Este viernes\n• 25 de noviembre`
    };
  }

  /**
   * Procesa un mensaje del usuario según el estado actual
   * @param {string} userMessage - Mensaje del usuario
   * @param {Function} onAppointmentCreated - Callback opcional que se llama cuando se crea una cita exitosamente
   * @returns {Promise<Object>} Resultado del procesamiento
   */
  async processMessage(userMessage, onAppointmentCreated = null) {
    console.log(`🔄 [StateMachine] Estado actual: ${this.state}`);
    console.log(`💬 [StateMachine] Procesando: "${userMessage}"`);

    // Actualizar actividad
    this.updateActivity();

    // Verificar si la sesión expiró
    if (this.isExpired() && this.state !== APPOINTMENT_STATES.IDLE) {
      console.log(`⏰ [StateMachine] Sesión expirada por inactividad`);
      this.reset();
      return {
        state: this.state,
        message: `Tu sesión de agendamiento expiró por inactividad.\n\nSi aún deseas agendar, escribe "agendar" para empezar de nuevo 😊`,
        expired: true
      };
    }

    // Detectar comandos globales (disponibles en cualquier estado)
    const cancelCommands = /(cancelar|ya no|olvida|déjalo|dejalo|no quiero|mejor no)/i;
    const backCommands = /(volver|atrás|atras|regresar|cambiar fecha|corregir fecha)/i;
    
    // Cancelar proceso
    if (cancelCommands.test(userMessage) && this.state !== APPOINTMENT_STATES.IDLE) {
      console.log(`🚫 [StateMachine] Usuario canceló el proceso`);
      this.reset();
      return {
        state: this.state,
        message: `Proceso cancelado 😊\n\nSi cambias de opinión, escribe "agendar" cuando gustes.\n\n¿Hay algo más en lo que pueda ayudarte?`,
        cancelled: true
      };
    }

    // Volver a elegir fecha (disponible después de confirmarla)
    if (backCommands.test(userMessage) && (this.state === APPOINTMENT_STATES.AWAITING_TIME || this.state === APPOINTMENT_STATES.CONFIRMING_TIME)) {
      console.log(`🔙 [StateMachine] Usuario quiere cambiar la fecha`);
      this.data.date = null;
      this.data.time = null;
      this.state = APPOINTMENT_STATES.AWAITING_DATE;
      return {
        state: this.state,
        message: `Sin problema 😊 ¿Qué otro día prefieres?`
      };
    }

    switch (this.state) {
      case APPOINTMENT_STATES.IDLE:
        return this._handleIdle(userMessage);
      
      case APPOINTMENT_STATES.AWAITING_DATE:
        return await this._handleAwaitingDate(userMessage);
      
      case APPOINTMENT_STATES.CONFIRMING_DATE:
        return await this._handleConfirmingDate(userMessage);
      
      case APPOINTMENT_STATES.AWAITING_TIME:
        return await this._handleAwaitingTime(userMessage);
      
      case APPOINTMENT_STATES.CONFIRMING_TIME:
        return await this._handleConfirmingTime(userMessage);
      
      case APPOINTMENT_STATES.AWAITING_NAME:
        return await this._handleAwaitingName(userMessage);
      
      case APPOINTMENT_STATES.AWAITING_SERVICE:
        return await this._handleAwaitingService(userMessage);
      
      case APPOINTMENT_STATES.CONFIRMING:
        return await this._handleConfirming(userMessage, onAppointmentCreated);
      
      default:
        console.error(`❌ [StateMachine] Estado desconocido: ${this.state}`);
        return {
          state: this.state,
          message: 'Hubo un error. ¿Quieres empezar de nuevo?'
        };
    }
  }

  /**
   * Estado IDLE - No hay proceso activo
   */
  _handleIdle(userMessage) {
    // Solo detectar si el usuario quiere agendar
    const wantsAppointment = /(agendar|cita|reservar|turno|disponibilidad)/i.test(userMessage);
    
    if (wantsAppointment) {
      return {
        state: this.state,
        message: `¡Perfecto! Puedo ayudarte de dos formas:\n\n1️⃣ Agenda directamente aquí: ${APPOINTMENT_LINK}\n2️⃣ Te guío paso a paso (verifico disponibilidad en tiempo real)\n\n¿Cuál prefieres?`,
        requiresConfirmation: true
      };
    }

    return {
      state: this.state,
      message: null, // Dejar que la IA responda normalmente
      shouldUseAI: true
    };
  }

  /**
   * Estado AWAITING_DATE - Esperando fecha
   */
  async _handleAwaitingDate(userMessage) {
    console.log(`📅 [StateMachine] Extrayendo fecha de: "${userMessage}"`);
    
    const date = parseNaturalDate(userMessage);
    
    if (!date) {
      console.log(`❌ [StateMachine] No se pudo extraer fecha`);
      return {
        state: this.state,
        message: `No entendí la fecha 🤔\n\nPuedes decir:\n• Mañana / Pasado mañana\n• Este viernes\n• 25 de noviembre\n• 25/11`
      };
    }

    console.log(`✅ [StateMachine] Fecha detectada: ${date}`);
    this.data.date = date;

    const dateFormatted = formatDateFriendly(date);

    // Verificar disponibilidad con manejo de errores
    const availability = await safeCall(
      () => getAvailableHours(date),
      'getAvailableHours en _handleAwaitingDate'
    );
    
    if (availability.error) {
      return {
        state: this.state,
        message: `Hubo un problema verificando disponibilidad.\n\n¿Prefieres que te comparta el enlace directo para agendar?`
      };
    }
    
    if (availability.available.length === 0) {
      return {
        state: this.state,
        message: `El ${dateFormatted} no tenemos horarios disponibles 😔\n\n¿Prefieres otro día?`
      };
    }

    this.state = APPOINTMENT_STATES.CONFIRMING_DATE;

    return {
      state: this.state,
      message: `📅 ${dateFormatted}\n\n¿Confirmamos esta fecha?`
    };
  }

  /**
   * Estado CONFIRMING_DATE - Confirmando fecha elegida
   */
  async _handleConfirmingDate(userMessage) {
    console.log(`✅ [StateMachine] Confirmando fecha: "${userMessage}"`);
    
    const confirms = /(sí|si|confirmo|confirmar|ok|vale|dale|perfecto|adelante|esa|correcto)/i;
    const changes = /(no|cambiar|otra|otro día|diferente)/i;

    if (confirms.test(userMessage)) {
      const dateFormatted = formatDateShort(this.data.date);

      const availability = await safeCall(
        () => getAvailableHours(this.data.date),
        'getAvailableHours en _handleConfirmingDate'
      );
      
      if (availability.error || availability.available.length === 0) {
        return {
          state: APPOINTMENT_STATES.AWAITING_DATE,
          message: `Hubo un problema verificando horarios.\n\n¿Prefieres elegir otro día?`
        };
      }

      const slotsFormatted = formatAvailableSlots(availability.available);
      const message = `Perfecto, el ${dateFormatted} tenemos:\n\n${slotsFormatted}\n\n¿Qué hora prefieres?`;

      this.state = APPOINTMENT_STATES.AWAITING_TIME;

      return {
        state: this.state,
        message: message
      };
    } else if (changes.test(userMessage)) {
      this.data.date = null;
      this.state = APPOINTMENT_STATES.AWAITING_DATE;
      
      return {
        state: this.state,
        message: `¿Qué otro día prefieres?`
      };
    }

    // Si detecta una nueva fecha, procesarla
    const newDate = parseNaturalDate(userMessage);
    if (newDate) {
      this.data.date = newDate;
      const dateFormatted = formatDateShort(newDate);
      
      return {
        state: this.state,
        message: `📅 ${dateFormatted}\n\n¿Confirmamos esta fecha?`
      };
    }

    return {
      state: this.state,
      message: `¿Confirmamos esta fecha? Responde "sí" o "cambiar"`
    };
  }

  /**
   * Estado AWAITING_TIME - Esperando hora
   */
  async _handleAwaitingTime(userMessage) {
    console.log(`⏰ [StateMachine] Extrayendo hora de: "${userMessage}"`);
    
    if (/(cambiar|corregir|modificar)\s*(la\s*)?(fecha|día)/i.test(userMessage)) {
      console.log(`🔙 [StateMachine] Usuario quiere volver a cambiar fecha desde hora`);
      this.data.date = null;
      this.data.time = null;
      this.state = APPOINTMENT_STATES.AWAITING_DATE;
      return {
        state: this.state,
        message: `¿Qué otro día prefieres?`
      };
    }
    
    const time = parseNaturalTime(userMessage);
    
    if (!time) {
      console.log(`❌ [StateMachine] No se pudo extraer hora`);
      return {
        state: this.state,
        message: `No entendí la hora 🤔\n\nPuedes decir:\n• 3pm o 15:00\n• 5 y media de la tarde\n• Tres de la tarde\n\n(O "cambiar fecha" para otro día)`
      };
    }

    console.log(`✅ [StateMachine] Hora detectada: ${time}`);

    const availability = await safeCall(
      () => checkAvailability(this.data.date, time),
      'checkAvailability en _handleAwaitingTime'
    );

    if (availability.error) {
      return {
        state: this.state,
        message: `Hubo un problema verificando disponibilidad.\n\n¿Intentas con otra hora o prefieres cambiar de fecha?`
      };
    }

    if (!availability.available) {
      const alternatives = await safeCall(
        () => getAvailableHours(this.data.date),
        'getAvailableHours alternativas'
      );
      const altHours = alternatives.available?.slice(0, 3).join(', ') || 'Consultar otras fechas';
      
      return {
        state: this.state,
        message: `Las ${time} ya está ocupado ❌\n\nOtras opciones:\n⏰ ${altHours}\n\n¿Te sirve alguno?`
      };
    }

    this.data.time = time;
    this.state = APPOINTMENT_STATES.CONFIRMING_TIME;

    const dateFormatted = formatDateShort(this.data.date);

    return {
      state: this.state,
      message: `📅 ${dateFormatted}\n⏰ ${time}\n\n¿Confirmamos este horario?`
    };
  }

  /**
   * Estado CONFIRMING_TIME - Confirmando hora elegida
   */
  async _handleConfirmingTime(userMessage) {
    console.log(`✅ [StateMachine] Confirmando hora: "${userMessage}"`);
    
    const confirms = /(sí|si|confirmo|confirmar|ok|vale|dale|perfecto|adelante|esa|correcto)/i;
    const changes = /(no|cambiar|otra|otro|diferente)/i;

    if (confirms.test(userMessage)) {
      this.state = APPOINTMENT_STATES.AWAITING_NAME;

      return {
        state: this.state,
        message: `Perfecto ✅\n\n¿Cuál es tu nombre completo?`
      };
    } else if (changes.test(userMessage)) {
      this.data.time = null;
      this.state = APPOINTMENT_STATES.AWAITING_TIME;
      
      const availability = await safeCall(
        () => getAvailableHours(this.data.date),
        'getAvailableHours en _handleConfirmingTime'
      );
      
      if (availability.error || availability.available.length === 0) {
        return {
          state: this.state,
          message: `Hubo un problema. ¿Prefieres cambiar de fecha?`
        };
      }

      const slotsFormatted = formatAvailableSlots(availability.available);
      const message = `Horarios disponibles:\n\n${slotsFormatted}\n\n¿Qué otra hora prefieres?`;

      return {
        state: this.state,
        message: message
      };
    }

    // Si detecta una nueva hora, procesarla
    const newTime = parseNaturalTime(userMessage);
    if (newTime) {
      const availability = await safeCall(
        () => checkAvailability(this.data.date, newTime),
        'checkAvailability nueva hora'
      );
      
      if (availability.error || !availability.available) {
        const alternatives = await safeCall(
          () => getAvailableHours(this.data.date),
          'getAvailableHours alternativas'
        );
        const altHours = alternatives.available?.slice(0, 3).join(', ') || 'Consultar otras fechas';
        
        return {
          state: APPOINTMENT_STATES.AWAITING_TIME,
          message: `Las ${newTime} no está disponible ❌\n\nOtras opciones:\n⏰ ${altHours}`
        };
      }
      
      this.data.time = newTime;
      const dateFormatted = formatDateShort(this.data.date);
      
      return {
        state: this.state,
        message: `📅 ${dateFormatted}\n⏰ ${newTime}\n\n¿Confirmamos este horario?`
      };
    }

    return {
      state: this.state,
      message: `¿Confirmamos las ${this.data.time}? Responde "sí" o "cambiar"`
    };
  }

  /**
   * Estado AWAITING_NAME - Esperando nombre
   */
  async _handleAwaitingName(userMessage) {
    console.log(`👤 [StateMachine] Extrayendo nombre de: "${userMessage}"`);
    
    if (!isValidName(userMessage)) {
      console.log(`❌ [StateMachine] Nombre inválido`);
      return {
        state: this.state,
        message: `Por favor, indícame tu nombre completo (nombre y apellido)\n\nEjemplo: María González`
      };
    }

    const name = capitalizeName(userMessage);
    console.log(`✅ [StateMachine] Nombre detectado: ${name}`);
    
    this.data.name = name;
    this.state = APPOINTMENT_STATES.AWAITING_SERVICE;

    return {
      state: this.state,
      message: `Perfecto, ${name.split(' ')[0]} 😊\n\n¿Qué tratamiento deseas?\n\nEjemplos:\n• Limpieza facial\n• HIFU\n• Depilación láser\n• Consulta con la Dra.`
    };
  }

  /**
   * Estado AWAITING_SERVICE - Esperando tratamiento
   */
  async _handleAwaitingService(userMessage) {
    console.log(`💆 [StateMachine] Extrayendo servicio de: "${userMessage}"`);
    
    const treatment = findTreatmentByKeyword(userMessage);
    const service = treatment ? treatment.name : userMessage.trim();
    
    if (!service || service.length < 3) {
      console.log(`❌ [StateMachine] Servicio inválido o muy corto`);
      return {
        state: this.state,
        message: `¿Qué tratamiento deseas? 🤔\n\nAlgunos servicios:\n• Limpieza facial\n• HIFU\n• Depilación láser\n• Rellenos\n• Consulta con la Dra.`
      };
    }

    console.log(`✅ [StateMachine] Servicio detectado: ${service}`);
    
    this.data.service = service;
    this.state = APPOINTMENT_STATES.CONFIRMING;

    const dateFormatted = formatDateFriendly(this.data.date);

    return {
      state: this.state,
      message: `Resumen de tu cita:\n\n👤 ${this.data.name}\n📅 ${dateFormatted}\n⏰ ${this.data.time}\n💆 ${service}\n\n¿Confirmo la cita?`
    };
  }

  /**
   * Estado CONFIRMING - Esperando confirmación final
   * @param {string} userMessage - Mensaje del usuario
   * @param {Function} onAppointmentCreated - Callback opcional que se llama cuando se crea una cita
   */
  async _handleConfirming(userMessage, onAppointmentCreated = null) {
    console.log(`✅ [StateMachine] Procesando confirmación: "${userMessage}"`);
    
    const confirms = /(sí|si|confirmo|confirmar|ok|vale|dale|perfecto|adelante)/i;
    const rejects = /(no|mejor no|cambiar|cancelar|espera)/i;

    if (confirms.test(userMessage)) {
      console.log(`🎯 [StateMachine] Usuario confirmó, creando cita...`);
      
      // Determinar precio según regla de consulta incluida
      let appointmentPrice = 11.50; // Precio por defecto para consulta sola
      let priceNote = 'Consulta ($11.50 IVA incluido)';
      
      if (this.data.service && this.data.treatmentPrice) {
        // Si hay tratamiento específico pre-llenado y precio
        appointmentPrice = this.data.treatmentPrice;
        priceNote = `Tratamiento ${this.data.service} (consulta incluida)`;
        console.log(`💰 [StateMachine] Precio con tratamiento: $${appointmentPrice} - ${priceNote}`);
      } else if (this.data.service && this.data.consultationIncluded) {
        // Si hay servicio pero sin precio específico, aplicar lógica de consulta incluida
        priceNote = 'Consulta incluida en tratamiento';
        console.log(`💰 [StateMachine] ${priceNote}`);
      } else {
        console.log(`💰 [StateMachine] Solo consulta: $${appointmentPrice}`);
      }
      
      const result = await safeCall(
        () => createAppointment({
          name: this.data.name,
          phone: this.data.phone,
          service: this.data.service,
          date: this.data.date,
          hour: this.data.time,
          price: appointmentPrice,
          priceNote: priceNote
        }),
        'createAppointment en _handleConfirming'
      );

      if (result.success) {
        this.state = APPOINTMENT_STATES.COMPLETE;
        
        const dateFormatted = formatDateFriendly(this.data.date);

        // Llamar al callback si existe (para notificar al staff)
        if (onAppointmentCreated && typeof onAppointmentCreated === 'function') {
          console.log(`📢 [StateMachine] Llamando callback para notificar al staff...`);
          try {
            await onAppointmentCreated({
              name: this.data.name,
              phone: this.data.phone,
              service: this.data.service,
              date: this.data.date,
              hour: this.data.time,
              price: appointmentPrice,
              priceNote: priceNote
            });
            console.log(`✅ [StateMachine] Callback ejecutado exitosamente`);
          } catch (callbackError) {
            console.error(`⚠️ [StateMachine] Error en callback (no crítico):`, callbackError);
          }
        }

        return {
          state: this.state,
          message: `🎉 ¡Cita agendada!\n\n👤 ${this.data.name}\n📅 ${dateFormatted}\n⏰ ${this.data.time}\n💆 ${this.data.service}\n💰 ${priceNote}\n\nRecibirás confirmación por correo.\n\nTe esperamos en BIOSKIN 😊\n📍 Av. Ordóñez Lasso y Calle de la Menta\n🗺️ https://maps.app.goo.gl/KfXhuCB1hEFhQzP56\n\n¿Hay algo más en lo que pueda ayudarte?`,
          completed: true
        };
      } else {
        return {
          state: this.state,
          message: `Hubo un problema al crear la cita${result.message ? ': ' + result.message : ''}.\n\n¿Quieres intentar de nuevo o prefieres el enlace directo?\n${APPOINTMENT_LINK}`,
          error: true
        };
      }
    } else if (rejects.test(userMessage)) {
      console.log(`🔄 [StateMachine] Usuario rechazó, reiniciando...`);
      this.reset();
      return {
        state: this.state,
        message: `Entendido 😊\n\n¿Qué deseas cambiar?\n• Fecha\n• Hora\n• Tratamiento\n• Cancelar\n\nO agenda directamente en:\n${APPOINTMENT_LINK}`
      };
    }

    return {
      state: this.state,
      message: `¿Confirmas la cita? Responde "sí" o "no"`
    };
  }

  /**
   * Reinicia la máquina de estados
   */
  reset() {
    console.log(`🔄 [StateMachine] Reiniciando estado`);
    this.state = APPOINTMENT_STATES.IDLE;
    this.data = {
      date: null,
      time: null,
      name: null,
      service: null,
      phone: this.data.phone // Mantener teléfono
    };
  }

  /**
   * Verifica si hay un proceso de agendamiento activo
   */
  isActive() {
    return this.state !== APPOINTMENT_STATES.IDLE && this.state !== APPOINTMENT_STATES.COMPLETE;
  }

  /**
   * Obtiene el estado actual
   */
  getState() {
    return {
      state: this.state,
      data: { ...this.data },
      isActive: this.isActive()
    };
  }

  /**
   * Serializa el estado para guardarlo
   */
  serialize() {
    return JSON.stringify({
      state: this.state,
      data: this.data,
      lastActivity: this.lastActivity
    });
  }

  /**
   * Restaura el estado desde JSON
   */
  static deserialize(sessionId, json) {
    try {
      const parsed = JSON.parse(json);
      const machine = new AppointmentStateMachine(sessionId);
      machine.state = parsed.state || APPOINTMENT_STATES.IDLE;
      machine.data = parsed.data || {};
      machine.lastActivity = parsed.lastActivity || Date.now();
      return machine;
    } catch (error) {
      console.error(`❌ [StateMachine] Error deserializando:`, error);
      return new AppointmentStateMachine(sessionId);
    }
  }
}

// Almacenamiento en memoria para las máquinas de estado (temporal)
const stateMachines = new Map();

/**
 * Obtiene o crea una máquina de estados para una sesión
 */
export function getStateMachine(sessionId, phone) {
  if (!stateMachines.has(sessionId)) {
    const machine = new AppointmentStateMachine(sessionId);
    machine.data.phone = phone;
    stateMachines.set(sessionId, machine);
    console.log(`✅ [StateMachine] Nueva máquina creada para ${sessionId}`);
  }
  return stateMachines.get(sessionId);
}

/**
 * Guarda el estado de una máquina (para persistencia futura)
 */
export function saveStateMachine(sessionId, machine) {
  stateMachines.set(sessionId, machine);
  // TODO: Guardar en base de datos cuando esté disponible
}

/**
 * Elimina una máquina de estados
 */
export function deleteStateMachine(sessionId) {
  const deleted = stateMachines.delete(sessionId);
  console.log(`🗑️ [StateMachine] Máquina eliminada: ${deleted}`);
  return deleted;
}
