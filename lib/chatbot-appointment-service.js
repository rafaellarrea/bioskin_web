/**
 * Servicio de Agendamiento para WhatsApp Chatbot
 * Permite verificar disponibilidad y crear citas directamente desde el chat
 */

// Usar fetch nativo de Node 18+ (Vercel usa Node 18)
const fetch = globalThis.fetch;

const CALENDAR_API = process.env.VERCEL_URL 
  ? `https://${process.env.VERCEL_URL}/api/calendar`
  : 'http://localhost:3000/api/calendar';

const EMAIL_API = process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_URL}/api/sendEmail`
  : 'http://localhost:3000/api/sendEmail';

// Link público de agendamiento
export const APPOINTMENT_LINK = 'https://saludbioskin.vercel.app/#/appointment';

/**
 * Horario de atención de BIOSKIN
 */
export const BUSINESS_HOURS = {
  start: '09:00',
  end: '19:00',
  availableHours: ['09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00']
};

/**
 * Verifica si una fecha es válida (no es domingo, no es pasada)
 */
export function isValidDate(dateStr) {
  try {
    const date = new Date(dateStr + 'T00:00:00-05:00');
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // No puede ser fecha pasada
    if (date < today) {
      return { valid: false, reason: 'La fecha ya pasó' };
    }
    
    // No puede ser domingo (día 0)
    if (date.getDay() === 0) {
      return { valid: false, reason: 'No atendemos los domingos' };
    }
    
    return { valid: true };
  } catch (error) {
    return { valid: false, reason: 'Formato de fecha inválido' };
  }
}

/**
 * Verifica si una hora está en el rango de atención
 */
export function isValidHour(hour) {
  return BUSINESS_HOURS.availableHours.includes(hour);
}

/**
 * Verifica disponibilidad de una fecha y hora específica
 * @param {string} date - Fecha en formato YYYY-MM-DD
 * @param {string} hour - Hora en formato HH:MM
 * @returns {Promise<Object>} - { available: boolean, reason?: string, occupiedTimes?: Array }
 */
export async function checkAvailability(date, hour) {
  try {
    console.log(`📅 [Appointment] Verificando disponibilidad: ${date} a las ${hour}`);
    
    // Validar fecha
    const dateValidation = isValidDate(date);
    if (!dateValidation.valid) {
      return {
        available: false,
        reason: dateValidation.reason
      };
    }
    
    // Validar hora
    if (!isValidHour(hour)) {
      return {
        available: false,
        reason: `La hora debe estar entre ${BUSINESS_HOURS.start} y ${BUSINESS_HOURS.end}`
      };
    }
    
    // Verificar si la hora ya pasó (solo para hoy)
    const today = new Date();
    const selectedDate = new Date(date + 'T00:00:00-05:00');
    const isSameDay = today.toDateString() === selectedDate.toDateString();
    
    if (isSameDay) {
      const [hourNum, minuteNum] = hour.split(':').map(Number);
      const appointmentTime = new Date();
      appointmentTime.setHours(hourNum, minuteNum, 0, 0);
      
      if (appointmentTime <= today) {
        return {
          available: false,
          reason: 'Esta hora ya pasó'
        };
      }
    }
    
    // Consultar eventos ocupados en Google Calendar
    const response = await fetch(CALENDAR_API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'getEvents',
        date: date
      })
    });
    
    if (!response.ok) {
      throw new Error('Error consultando calendario');
    }
    
    const data = await response.json();
    const occupiedTimes = data.occupiedTimes || [];
    
    console.log(`📋 [Appointment] Horarios ocupados del día:`, occupiedTimes);
    
    // Verificar si la hora solicitada está ocupada (considerando 2 horas de duración)
    const startTime = new Date(date + 'T' + hour + ':00-05:00');
    const endTime = new Date(startTime.getTime() + 2 * 60 * 60 * 1000); // +2 horas
    
    const isOccupied = occupiedTimes.some(slot => {
      const slotStart = new Date(slot.start);
      const slotEnd = new Date(slot.end);
      // Hay conflicto si los rangos se superponen
      return (startTime < slotEnd && endTime > slotStart);
    });
    
    if (isOccupied) {
      return {
        available: false,
        reason: 'Esta hora ya está ocupada',
        occupiedTimes: occupiedTimes.map(slot => ({
          start: new Date(slot.start).toLocaleTimeString('es-ES', { 
            hour: '2-digit', 
            minute: '2-digit',
            timeZone: 'America/Guayaquil'
          }),
          end: new Date(slot.end).toLocaleTimeString('es-ES', { 
            hour: '2-digit', 
            minute: '2-digit',
            timeZone: 'America/Guayaquil'
          })
        }))
      };
    }
    
    return {
      available: true,
      message: `✅ La hora ${hour} del ${formatDate(date)} está disponible`
    };
    
  } catch (error) {
    console.error('❌ [Appointment] Error verificando disponibilidad:', error);
    return {
      available: false,
      reason: 'Error al verificar disponibilidad',
      error: error.message
    };
  }
}

/**
 * Obtiene horarios disponibles para un día específico
 * @param {string} date - Fecha en formato YYYY-MM-DD
 * @returns {Promise<Object>} - { available: Array, occupied: Array }
 */
export async function getAvailableHours(date) {
  try {
    console.log(`🔍 [Appointment] Obteniendo horarios disponibles para ${date}`);
    
    // Validar fecha
    const dateValidation = isValidDate(date);
    if (!dateValidation.valid) {
      return {
        available: [],
        reason: dateValidation.reason
      };
    }
    
    // Obtener eventos del día
    const response = await fetch(CALENDAR_API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'getEvents',
        date: date
      })
    });
    
    if (!response.ok) {
      throw new Error('Error consultando calendario');
    }
    
    const data = await response.json();
    const occupiedTimes = data.occupiedTimes || [];
    
    // Verificar cada hora disponible
    const today = new Date();
    const selectedDate = new Date(date + 'T00:00:00-05:00');
    const isSameDay = today.toDateString() === selectedDate.toDateString();
    
    const availableHours = [];
    const occupiedHours = [];
    
    for (const hour of BUSINESS_HOURS.availableHours) {
      // Si es hoy, verificar si la hora ya pasó
      if (isSameDay) {
        const [hourNum, minuteNum] = hour.split(':').map(Number);
        const appointmentTime = new Date();
        appointmentTime.setHours(hourNum, minuteNum, 0, 0);
        
        if (appointmentTime <= today) {
          occupiedHours.push(hour);
          continue;
        }
      }
      
      // Verificar si está ocupada
      const startTime = new Date(date + 'T' + hour + ':00-05:00');
      const endTime = new Date(startTime.getTime() + 2 * 60 * 60 * 1000);
      
      const isOccupied = occupiedTimes.some(slot => {
        const slotStart = new Date(slot.start);
        const slotEnd = new Date(slot.end);
        return (startTime < slotEnd && endTime > slotStart);
      });
      
      if (isOccupied) {
        occupiedHours.push(hour);
      } else {
        availableHours.push(hour);
      }
    }
    
    return {
      date: date,
      dateFormatted: formatDate(date),
      available: availableHours,
      occupied: occupiedHours,
      total: BUSINESS_HOURS.availableHours.length
    };
    
  } catch (error) {
    console.error('❌ [Appointment] Error obteniendo horarios:', error);
    return {
      available: [],
      error: error.message
    };
  }
}

/**
 * Crea una cita en el calendario
 * @param {Object} appointmentData - Datos de la cita
 * @returns {Promise<Object>} - { success: boolean, message: string }
 */
export async function createAppointment(appointmentData) {
  try {
    const { 
      name, 
      phone, 
      service, 
      date, 
      hour,
      email = `${phone}@whatsapp.user` // Email temporal si no lo proporciona
    } = appointmentData;
    
    console.log(`📝 [Appointment] Creando cita:`, appointmentData);
    
    // Validar datos requeridos
    if (!name || !phone || !service || !date || !hour) {
      return {
        success: false,
        message: 'Faltan datos requeridos para crear la cita'
      };
    }
    
    // Verificar disponibilidad una vez más
    const availability = await checkAvailability(date, hour);
    if (!availability.available) {
      return {
        success: false,
        message: `No se pudo agendar: ${availability.reason}`
      };
    }
    
    // Construir fechas para Google Calendar
    const startDateTime = `${date}T${hour}:00-05:00`;
    const [hourNum, minuteNum] = hour.split(':').map(Number);
    const endHour = (hourNum + 2).toString().padStart(2, '0');
    const endDateTime = `${date}T${endHour}:${minuteNum.toString().padStart(2, '0')}:00-05:00`;
    
    // Construir mensaje para email
    const message = `CITA AGENDADA VÍA WHATSAPP CHATBOT
    
Paciente: ${name}
Teléfono: ${phone}
Servicio: ${service}
Fecha: ${formatDate(date)}
Hora: ${hour}

Agendado automáticamente desde WhatsApp por Matías (Chatbot)
`;
    
    // Enviar a la API de email (que también crea el evento en Calendar)
    const response = await fetch(EMAIL_API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: name,
        email: email,
        phone: phone,
        service: service,
        message: message,
        start: startDateTime,
        end: endDateTime
      })
    });
    
    if (!response.ok) {
      throw new Error('Error al crear la cita');
    }
    
    const result = await response.json();
    
    if (result.success) {
      console.log(`✅ [Appointment] Cita creada exitosamente para ${name}`);
      return {
        success: true,
        message: `✅ ¡Cita agendada exitosamente!\n\n📅 ${formatDate(date)} a las ${hour}\n🏥 Servicio: ${service}\n\nTe esperamos en BIOSKIN 😊`
      };
    } else {
      return {
        success: false,
        message: 'Error al crear la cita en el sistema'
      };
    }
    
  } catch (error) {
    console.error('❌ [Appointment] Error creando cita:', error);
    return {
      success: false,
      message: 'Error al procesar la cita',
      error: error.message
    };
  }
}

/**
 * Sugiere horarios disponibles según preferencias
 * @param {Object} preferences - Preferencias del paciente
 * @returns {Promise<Object>} - Sugerencias de horarios
 */
export async function suggestAvailableHours(preferences = {}) {
  try {
    const {
      preferredTime = 'any', // 'morning', 'afternoon', 'evening', 'any'
      daysAhead = 7,
      isWeekend = false
    } = preferences;
    
    console.log(`💡 [Appointment] Sugiriendo horarios:`, preferences);
    
    const suggestions = [];
    const today = new Date();
    
    // Buscar en los próximos días
    for (let i = 0; i < daysAhead; i++) {
      const checkDate = new Date(today);
      checkDate.setDate(today.getDate() + i);
      
      // Saltar domingos
      if (checkDate.getDay() === 0) continue;
      
      // Filtrar por preferencia de fin de semana
      const isWeekendDay = checkDate.getDay() === 6; // Sábado
      if (isWeekend && !isWeekendDay) continue;
      if (!isWeekend && isWeekendDay) continue;
      
      const dateStr = checkDate.toISOString().split('T')[0];
      const availability = await getAvailableHours(dateStr);
      
      if (availability.available.length > 0) {
        // Filtrar por hora preferida
        let filteredHours = availability.available;
        
        if (preferredTime === 'morning') {
          filteredHours = filteredHours.filter(h => parseInt(h.split(':')[0]) < 12);
        } else if (preferredTime === 'afternoon') {
          filteredHours = filteredHours.filter(h => {
            const hour = parseInt(h.split(':')[0]);
            return hour >= 12 && hour < 17;
          });
        } else if (preferredTime === 'evening') {
          filteredHours = filteredHours.filter(h => parseInt(h.split(':')[0]) >= 17);
        }
        
        if (filteredHours.length > 0) {
          suggestions.push({
            date: dateStr,
            dateFormatted: formatDate(dateStr),
            dayName: getDayName(checkDate),
            availableHours: filteredHours.slice(0, 3) // Mostrar máximo 3 horas
          });
        }
      }
      
      // Limitar a 3 días con disponibilidad
      if (suggestions.length >= 3) break;
    }
    
    return {
      suggestions,
      totalDays: suggestions.length
    };
    
  } catch (error) {
    console.error('❌ [Appointment] Error sugiriendo horarios:', error);
    return {
      suggestions: [],
      error: error.message
    };
  }
}

/**
 * Formatea una fecha a texto legible en español
 */
function formatDate(dateStr) {
  const months = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 
                  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
  const date = new Date(dateStr + 'T00:00:00-05:00');
  return `${date.getDate()} de ${months[date.getMonth()]} de ${date.getFullYear()}`;
}

/**
 * Obtiene el nombre del día en español
 */
function getDayName(date) {
  const days = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
  return days[date.getDay()];
}

/**
 * Parsea una fecha en lenguaje natural a formato YYYY-MM-DD
 * Ejemplos: "mañana", "pasado mañana", "lunes", "viernes 20"
 */
export function parseNaturalDate(text) {
  const today = new Date();
  text = text.toLowerCase().trim();
  
  // Mañana
  if (text.includes('mañana') && !text.includes('pasado')) {
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  }
  
  // Pasado mañana
  if (text.includes('pasado mañana')) {
    const dayAfter = new Date(today);
    dayAfter.setDate(today.getDate() + 2);
    return dayAfter.toISOString().split('T')[0];
  }
  
  // Días de la semana
  const days = {
    'lunes': 1, 'martes': 2, 'miércoles': 3, 'miercoles': 3,
    'jueves': 4, 'viernes': 5, 'sábado': 6, 'sabado': 6
  };
  
  for (const [dayName, dayNum] of Object.entries(days)) {
    if (text.includes(dayName)) {
      const targetDate = new Date(today);
      let daysToAdd = dayNum - today.getDay();
      if (daysToAdd <= 0) daysToAdd += 7; // Próxima semana
      targetDate.setDate(today.getDate() + daysToAdd);
      return targetDate.toISOString().split('T')[0];
    }
  }
  
  // Formato YYYY-MM-DD
  const isoMatch = text.match(/(\d{4})-(\d{2})-(\d{2})/);
  if (isoMatch) {
    return isoMatch[0];
  }
  
  // Formato DD/MM o DD-MM (asume año actual)
  const dateMatch = text.match(/(\d{1,2})[\/\-](\d{1,2})/);
  if (dateMatch) {
    const day = dateMatch[1].padStart(2, '0');
    const month = dateMatch[2].padStart(2, '0');
    return `${today.getFullYear()}-${month}-${day}`;
  }
  
  return null;
}

/**
 * Parsea una hora en lenguaje natural a formato HH:MM
 * Ejemplos: "10am", "3pm", "15:30", "tres de la tarde"
 */
export function parseNaturalTime(text) {
  text = text.toLowerCase().trim();
  
  // Formato HH:MM
  const timeMatch = text.match(/(\d{1,2}):(\d{2})/);
  if (timeMatch) {
    return `${timeMatch[1].padStart(2, '0')}:${timeMatch[2]}`;
  }
  
  // Formato con AM/PM
  const ampmMatch = text.match(/(\d{1,2})\s*(am|pm)/);
  if (ampmMatch) {
    let hour = parseInt(ampmMatch[1]);
    if (ampmMatch[2] === 'pm' && hour < 12) hour += 12;
    if (ampmMatch[2] === 'am' && hour === 12) hour = 0;
    return `${hour.toString().padStart(2, '0')}:00`;
  }
  
  // Horas en texto
  const hourTexts = {
    'nueve': '09:00', 'diez': '10:00', 'once': '11:00', 'doce': '12:00',
    'una': '13:00', 'dos': '14:00', 'tres': '15:00', 'cuatro': '16:00',
    'cinco': '17:00', 'seis': '18:00', 'siete': '19:00'
  };
  
  for (const [word, time] of Object.entries(hourTexts)) {
    if (text.includes(word)) {
      return time;
    }
  }
  
  return null;
}
