/**
 * Máquina de Estados para Agendamiento de Citas
 * 
 * Controla el flujo estructurado de agendamiento paso a paso
 * para evitar redundancias y garantizar datos completos
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
import { findTreatmentByKeyword } from './treatments-data.js';

// Estados posibles de la máquina
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
  constructor(sessionId) {
    this.sessionId = sessionId;
    this.state = APPOINTMENT_STATES.IDLE;
    this.data = {
      date: null,
      time: null,
      name: null,
      service: null,
      phone: null
    };
    this.lastActivity = Date.now(); // Timestamp de última actividad
    this.timeoutMinutes = 10; // Timeout de 10 minutos de inactividad
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
   */
  start(phone) {
    console.log(`📋 [StateMachine] Iniciando flujo de agendamiento para ${this.sessionId}`);
    this.state = APPOINTMENT_STATES.AWAITING_DATE;
    this.data.phone = phone;
    return {
      state: this.state,
      message: `¡Perfecto! 😊 Te ayudo a agendar\n\n¿Qué día te gustaría venir?`
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
        message: `La sesión de agendamiento expiró por inactividad 😔\n\nSi aún deseas agendar, escribe "agendar cita" para empezar de nuevo.`,
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
        message: `Sin problema 😊 Si cambias de opinión, estoy aquí para ayudarte.\n\n¿Hay algo más en lo que pueda asistirte?`,
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
    
    // Extraer fecha del mensaje
    const date = parseNaturalDate(userMessage);
    
    if (!date) {
      console.log(`❌ [StateMachine] No se pudo extraer fecha`);
      return {
        state: this.state,
        message: `No pude entender la fecha 🤔\n\nPor favor indícala en alguno de estos formatos:\n• Día/Mes (ejemplo: 25/11)\n• DD de mes (ejemplo: 25 de noviembre)\n• Día de la semana (ejemplo: el viernes)\n• Mañana`
      };
    }

    console.log(`✅ [StateMachine] Fecha detectada: ${date}`);
    this.data.date = date;

    // Formatear fecha legible
    const dateObj = new Date(date + 'T00:00:00-05:00');
    const dateFormatted = dateObj.toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      timeZone: 'America/Guayaquil',
      weekday: 'long'
    });

    // Obtener horarios disponibles del día
    const availability = await getAvailableHours(date);
    
    if (availability.available.length === 0) {
      return {
        state: this.state,
        message: `Lo siento, el ${dateFormatted} no tenemos horarios disponibles 😔\n\n¿Prefieres otro día?`
      };
    }

    // Avanzar a confirmación de fecha
    this.state = APPOINTMENT_STATES.CONFIRMING_DATE;

    return {
      state: this.state,
      message: `Perfecto, elegiste el ${dateFormatted} 📅\n\n¿Confirmamos esta fecha? (Responde "sí" o "cambiar")`
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
      // Formatear fecha
      const dateObj = new Date(this.data.date + 'T00:00:00-05:00');
      const dateFormatted = dateObj.toLocaleDateString('es-ES', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        weekday: 'long',
        timeZone: 'America/Guayaquil'
      });

      // Obtener horarios disponibles y mostrarlos
      const availability = await getAvailableHours(this.data.date);
      
      // Filtrar hora de almuerzo
      const availableWithoutLunch = availability.available.filter(h => {
        const hour = parseInt(h.split(':')[0]);
        return hour !== 13;
      });
      
      const morningSlots = availableWithoutLunch.filter(h => parseInt(h.split(':')[0]) < 12);
      const afternoonSlots = availableWithoutLunch.filter(h => {
        const hour = parseInt(h.split(':')[0]);
        return hour >= 12 && hour < 17;
      });
      const eveningSlots = availableWithoutLunch.filter(h => parseInt(h.split(':')[0]) >= 17);

      let message = `Excelente, el ${dateFormatted} tenemos disponibilidad 😊\n\n`;
      
      if (morningSlots.length > 0) {
        message += `🌅 Mañana: ${morningSlots.join(', ')}\n`;
      }
      if (afternoonSlots.length > 0) {
        message += `☀️ Tarde: ${afternoonSlots.join(', ')}\n`;
      }
      if (eveningSlots.length > 0) {
        message += `🌙 Noche: ${eveningSlots.join(', ')}\n`;
      }

      message += `\n¿Qué hora prefieres?`;

      // Avanzar al siguiente estado
      this.state = APPOINTMENT_STATES.AWAITING_TIME;

      return {
        state: this.state,
        message: message
      };
    } else if (changes.test(userMessage)) {
      // Usuario quiere cambiar la fecha
      this.data.date = null;
      this.state = APPOINTMENT_STATES.AWAITING_DATE;
      
      return {
        state: this.state,
        message: `Sin problema 😊 ¿Qué otro día prefieres?`
      };
    }

    // Si detecta una nueva fecha en lugar de confirmar, procesarla
    const newDate = parseNaturalDate(userMessage);
    if (newDate) {
      this.data.date = newDate;
      const dateObj = new Date(newDate + 'T00:00:00-05:00');
      const dateFormatted = dateObj.toLocaleDateString('es-ES', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        weekday: 'long',
        timeZone: 'America/Guayaquil'
      });
      
      return {
        state: this.state,
        message: `Perfecto, cambiaste a ${dateFormatted} 📅\n\n¿Confirmamos esta fecha? (Responde "sí" o "cambiar")`
      };
    }

    return {
      state: this.state,
      message: `No entendí 🤔 ¿Confirmamos el ${this.data.date}? Responde "sí" o "cambiar"`
    };
  }

  /**
   * Estado AWAITING_TIME - Esperando hora
   */
  async _handleAwaitingTime(userMessage) {
    console.log(`⏰ [StateMachine] Extrayendo hora de: "${userMessage}"`);
    
    // Detectar si quiere cambiar la fecha (comando alternativo)
    if (/(cambiar|corregir|modificar)\s*(la\s*)?(fecha|día)/i.test(userMessage)) {
      console.log(`🔙 [StateMachine] Usuario quiere volver a cambiar fecha desde hora`);
      this.data.date = null;
      this.data.time = null;
      this.state = APPOINTMENT_STATES.AWAITING_DATE;
      return {
        state: this.state,
        message: `Sin problema 😊 ¿Qué otro día prefieres?`
      };
    }
    
    // Extraer hora del mensaje
    const time = parseNaturalTime(userMessage);
    
    if (!time) {
      console.log(`❌ [StateMachine] No se pudo extraer hora`);
      return {
        state: this.state,
        message: `No entendí la hora 🤔\n\nPor favor indícala así:\n• Formato 12h: "3pm", "5:30pm"\n• Formato 24h: "15:00", "17:30"\n• En palabras: "tres de la tarde"\n\nO escribe "cambiar fecha" si quieres elegir otro día.`
      };
    }

    console.log(`✅ [StateMachine] Hora detectada: ${time}`);

    // Verificar disponibilidad de la hora específica
    const availability = await checkAvailability(this.data.date, time);

    if (!availability.available) {
      // Sugerir alternativas
      const alternatives = await getAvailableHours(this.data.date);
      const altHours = alternatives.available?.slice(0, 3).join(', ') || 'ninguno';
      
      return {
        state: this.state,
        message: `Lo siento, las ${time} ya está ocupado ❌\n\nOtras opciones disponibles:\n⏰ ${altHours}\n\n¿Te sirve alguno?\n\n(O escribe "cambiar fecha" para elegir otro día)`
      };
    }

    // Guardar hora y avanzar a confirmación
    this.data.time = time;
    this.state = APPOINTMENT_STATES.CONFIRMING_TIME;

    // Formatear fecha
    const dateObj = new Date(this.data.date + 'T00:00:00-05:00');
    const dateFormatted = dateObj.toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'long',
      weekday: 'long',
      timeZone: 'America/Guayaquil'
    });

    return {
      state: this.state,
      message: `Perfecto, elegiste:\n\n📅 ${dateFormatted}\n⏰ ${time}\n\n¿Confirmamos este horario? (Responde "sí" o "cambiar")`
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
      // Avanzar a solicitar nombre
      this.state = APPOINTMENT_STATES.AWAITING_NAME;

      return {
        state: this.state,
        message: `¡Excelente! ✅\n\n¿Cuál es tu nombre completo?`
      };
    } else if (changes.test(userMessage)) {
      // Usuario quiere cambiar la hora
      this.data.time = null;
      this.state = APPOINTMENT_STATES.AWAITING_TIME;
      
      // Mostrar horarios disponibles nuevamente
      const availability = await getAvailableHours(this.data.date);
      const availableWithoutLunch = availability.available.filter(h => {
        const hour = parseInt(h.split(':')[0]);
        return hour !== 13;
      });
      
      const morningSlots = availableWithoutLunch.filter(h => parseInt(h.split(':')[0]) < 12);
      const afternoonSlots = availableWithoutLunch.filter(h => {
        const hour = parseInt(h.split(':')[0]);
        return hour >= 12 && hour < 17;
      });
      const eveningSlots = availableWithoutLunch.filter(h => parseInt(h.split(':')[0]) >= 17);

      let message = `Sin problema 😊 Horarios disponibles:\n\n`;
      
      if (morningSlots.length > 0) {
        message += `🌅 Mañana: ${morningSlots.join(', ')}\n`;
      }
      if (afternoonSlots.length > 0) {
        message += `☀️ Tarde: ${afternoonSlots.join(', ')}\n`;
      }
      if (eveningSlots.length > 0) {
        message += `🌙 Noche: ${eveningSlots.join(', ')}\n`;
      }

      message += `\n¿Qué otra hora prefieres?`;

      return {
        state: this.state,
        message: message
      };
    }

    // Si detecta una nueva hora en lugar de confirmar, procesarla
    const newTime = parseNaturalTime(userMessage);
    if (newTime) {
      const availability = await checkAvailability(this.data.date, newTime);
      
      if (!availability.available) {
        const alternatives = await getAvailableHours(this.data.date);
        const altHours = alternatives.available?.slice(0, 3).join(', ') || 'ninguno';
        
        return {
          state: APPOINTMENT_STATES.AWAITING_TIME,
          message: `Lo siento, las ${newTime} ya está ocupado ❌\n\nOtras opciones:\n⏰ ${altHours}\n\n¿Te sirve alguno?`
        };
      }
      
      this.data.time = newTime;
      const dateObj = new Date(this.data.date + 'T00:00:00-05:00');
      const dateFormatted = dateObj.toLocaleDateString('es-ES', {
        day: 'numeric',
        month: 'long',
        weekday: 'long',
        timeZone: 'America/Guayaquil'
      });
      
      return {
        state: this.state,
        message: `Perfecto, cambiaste a:\n\n📅 ${dateFormatted}\n⏰ ${newTime}\n\n¿Confirmamos este horario? (Responde "sí" o "cambiar")`
      };
    }

    return {
      state: this.state,
      message: `No entendí 🤔 ¿Confirmamos las ${this.data.time}? Responde "sí" o "cambiar"`
    };
  }

  /**
   * Estado AWAITING_NAME - Esperando nombre
   */
  async _handleAwaitingName(userMessage) {
    console.log(`👤 [StateMachine] Extrayendo nombre de: "${userMessage}"`);
    
    // Validar que sea un nombre válido (al menos 2 palabras con letras)
    const namePattern = /^([A-ZÁÉÍÓÚÑ][a-záéíóúñ]+(?:\s+[A-ZÁÉÍÓÚÑ][a-záéíóúñ]+)+)$/;
    const match = userMessage.trim().match(namePattern);
    
    if (!match || userMessage.trim().split(' ').length < 2) {
      console.log(`❌ [StateMachine] Nombre inválido`);
      return {
        state: this.state,
        message: `Por favor, indícame tu nombre completo (nombre y apellido) 😊\n\nEjemplo: María González`
      };
    }

    const name = userMessage.trim();
    console.log(`✅ [StateMachine] Nombre detectado: ${name}`);
    
    this.data.name = name;
    this.state = APPOINTMENT_STATES.AWAITING_SERVICE;

    return {
      state: this.state,
      message: `Perfecto, ${name.split(' ')[0]} 😊\n\n¿Qué tratamiento deseas?\n\nPor ejemplo:\n• Limpieza facial\n• HIFU\n• Depilación láser\n• Consulta general`
    };
  }

  /**
   * Estado AWAITING_SERVICE - Esperando tratamiento
   */
  async _handleAwaitingService(userMessage) {
    console.log(`💆 [StateMachine] Extrayendo servicio de: "${userMessage}"`);
    
    // Intentar encontrar tratamiento conocido
    const treatment = findTreatmentByKeyword(userMessage);
    const service = treatment ? treatment.name : userMessage.trim();
    
    if (!service || service.length < 3) {
      console.log(`❌ [StateMachine] Servicio inválido o muy corto`);
      return {
        state: this.state,
        message: `¿Podrías especificar el tratamiento que deseas? 🤔\n\nAlgunos de nuestros servicios:\n• Limpieza facial\n• HIFU\n• Depilación láser\n• Rellenos\n• Consulta con la Dra.`
      };
    }

    console.log(`✅ [StateMachine] Servicio detectado: ${service}`);
    
    this.data.service = service;
    this.state = APPOINTMENT_STATES.CONFIRMING;

    // Formatear fecha
    const dateObj = new Date(this.data.date + 'T00:00:00-05:00');
    const dateFormatted = dateObj.toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      weekday: 'long',
      timeZone: 'America/Guayaquil'
    });

    return {
      state: this.state,
      message: `Perfecto, resumiendo tu cita:\n\n👤 Paciente: ${this.data.name}\n📅 Fecha: ${dateFormatted}\n⏰ Hora: ${this.data.time}\n💆 Tratamiento: ${service}\n\n¿Confirmo tu cita? (Responde "sí" o "no")`
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
      
      try {
        const result = await createAppointment({
          name: this.data.name,
          phone: this.data.phone,
          service: this.data.service,
          date: this.data.date,
          hour: this.data.time
        });

        if (result.success) {
          this.state = APPOINTMENT_STATES.COMPLETE;
          
          // Formatear fecha
          const dateObj = new Date(this.data.date + 'T00:00:00-05:00');
          const dateFormatted = dateObj.toLocaleDateString('es-ES', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
            weekday: 'long',
            timeZone: 'America/Guayaquil'
          });

          // Llamar al callback si existe (para notificar al staff)
          if (onAppointmentCreated && typeof onAppointmentCreated === 'function') {
            console.log(`📢 [StateMachine] Llamando callback para notificar al staff...`);
            try {
              await onAppointmentCreated({
                name: this.data.name,
                phone: this.data.phone,
                service: this.data.service,
                date: this.data.date,
                hour: this.data.time
              });
              console.log(`✅ [StateMachine] Callback ejecutado exitosamente`);
            } catch (callbackError) {
              console.error(`⚠️ [StateMachine] Error en callback (no crítico):`, callbackError);
              // No fallar la cita si el callback falla
            }
          }

          return {
            state: this.state,
            message: `🎉 ¡Cita agendada exitosamente!\n\n👤 ${this.data.name}\n📅 ${dateFormatted}\n⏰ ${this.data.time}\n💆 ${this.data.service}\n\nRecibirás un correo de confirmación.\n\nTe esperamos en BIOSKIN Salud & Estética 😊\n📍 Av. Ordóñez Lasso y Calle de la Menta\n🗺️ https://maps.app.goo.gl/KfXhuCB1hEFhQzP56\n\n¿Hay algo más en lo que pueda asistirle?`,
            completed: true
          };
        } else {
          return {
            state: this.state,
            message: `❌ Hubo un problema al crear la cita: ${result.message}\n\n¿Quieres intentar de nuevo?`,
            error: true
          };
        }
      } catch (error) {
        console.error(`❌ [StateMachine] Error creando cita:`, error);
        return {
          state: this.state,
          message: `⚠️ Hubo un problema técnico al crear tu cita.\n\nPuedes agendar directamente en: ${APPOINTMENT_LINK}`,
          error: true
        };
      }
    } else if (rejects.test(userMessage)) {
      console.log(`🔄 [StateMachine] Usuario rechazó, reiniciando...`);
      this.reset();
      return {
        state: this.state,
        message: `Sin problema 😊\n\n¿Qué deseas cambiar?\n• La fecha\n• La hora\n• El tratamiento\n• Cancelar el agendamiento\n\nO puedes agendar directamente en: ${APPOINTMENT_LINK}`
      };
    }

    return {
      state: this.state,
      message: `No entendí tu respuesta 🤔\n\n¿Confirmas la cita? Responde "sí" para confirmar o "no" para cancelar.`
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
