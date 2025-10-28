// src/components/AdminCalendar.tsx
// Componente para visualizar la agenda desde Google Calendar

import React, { useState, useEffect } from 'react';
import { Calendar, Clock, User, Phone, Mail, ArrowLeft, ChevronLeft, ChevronRight, RefreshCw } from 'lucide-react';

// Helpers para español
const daysOfWeek = ['Domingo','Lunes','Martes','Miércoles','Jueves','Viernes','Sábado'];
const months = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];

interface CalendarEvent {
  id: string;
  summary: string;
  start: string;
  end: string;
  description?: string;
}

interface AdminCalendarProps {
  onBack: () => void;
}

const AdminCalendar: React.FC<AdminCalendarProps> = ({ onBack }) => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Generar días del mes actual
  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();
    
    const days = [];
    
    // Días vacíos al inicio
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    
    // Días del mes
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day));
    }
    
    return days;
  };

  const days = getDaysInMonth(selectedDate);

  // Obtener eventos de Google Calendar para el día seleccionado
  const fetchEventsForDate = async (date: Date) => {
    if (!date) return;
    
    setLoading(true);
    setError('');
    
    try {
      const dateString = date.toISOString().split('T')[0]; // YYYY-MM-DD
      const response = await fetch('/api/getEvents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date: dateString }),
      });
      
      const data = await response.json();
      
      if (data.events && Array.isArray(data.events)) {
        setEvents(data.events);
      } else {
        setEvents([]);
      }
    } catch (err) {
      console.error('Error fetching events:', err);
      setError('Error al cargar los eventos del calendario');
      setEvents([]);
    } finally {
      setLoading(false);
    }
  };

  // Cargar eventos cuando cambia la fecha seleccionada
  useEffect(() => {
    fetchEventsForDate(selectedDate);
  }, [selectedDate]);

  // Navegar entre meses
  const navigateMonth = (direction: number) => {
    const newDate = new Date(selectedDate);
    newDate.setMonth(newDate.getMonth() + direction);
    setSelectedDate(newDate);
  };

  // Ir a hoy
  const goToToday = () => {
    setSelectedDate(new Date());
  };

  // Formatear hora
  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('es-ES', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: false 
    });
  };

  // Formatear fecha
  const formatDate = (date: Date) => {
    return `${daysOfWeek[date.getDay()]} ${date.getDate()} de ${months[date.getMonth()]} ${date.getFullYear()}`;
  };

  // Verificar si una fecha tiene eventos
  const hasEvents = (date: Date) => {
    if (!date) return false;
    const dateString = date.toISOString().split('T')[0];
    // Esta función podría mejorarse obteniendo un resumen de eventos por mes
    return false; // Por ahora no implementamos esta funcionalidad
  };

  // Extraer información del paciente de la descripción del evento
  const parseEventDescription = (description: string = '') => {
    const lines = description.split('\n');
    let phone = '';
    let email = '';
    let service = '';
    let notes = '';
    
    lines.forEach(line => {
      if (line.startsWith('Teléfono:')) {
        phone = line.replace('Teléfono:', '').trim();
      } else if (line.startsWith('Correo:') || line.includes('@')) {
        email = line.replace('Correo:', '').trim();
      } else if (line.startsWith('Servicio:')) {
        service = line.replace('Servicio:', '').trim();
      } else if (line.includes('Comentario adicional:')) {
        notes = line.replace('Comentario adicional:', '').trim();
      }
    });
    
    return { phone, email, service, notes };
  };

  return (
    <div className="max-w-7xl mx-auto bg-white rounded-lg shadow-lg p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-[#deb887] hover:text-[#d4a574] font-medium"
          >
            <ArrowLeft className="w-5 h-5" />
            Volver al Dashboard
          </button>
          <div className="h-6 w-px bg-gray-300"></div>
          <h2 className="text-2xl font-bold text-gray-800">Visualizar Agenda</h2>
        </div>
        <button
          onClick={() => fetchEventsForDate(selectedDate)}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-[#deb887] text-white rounded-lg hover:bg-[#d4a574] transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Actualizar
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Calendario */}
        <div className="bg-gray-50 rounded-lg p-6">
          {/* Navegación de mes */}
          <div className="flex items-center justify-between mb-6">
            <button
              onClick={() => navigateMonth(-1)}
              className="flex items-center gap-2 px-3 py-2 bg-white hover:bg-gray-100 rounded-lg transition-colors border"
            >
              <ChevronLeft className="w-4 h-4" />
              Anterior
            </button>
            
            <div className="text-center">
              <h3 className="text-xl font-bold text-gray-800">
                {months[selectedDate.getMonth()]} {selectedDate.getFullYear()}
              </h3>
              <button
                onClick={goToToday}
                className="text-sm text-[#deb887] hover:text-[#d4a574] mt-1"
              >
                Ir a hoy
              </button>
            </div>
            
            <button
              onClick={() => navigateMonth(1)}
              className="flex items-center gap-2 px-3 py-2 bg-white hover:bg-gray-100 rounded-lg transition-colors border"
            >
              Siguiente
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Grid del calendario */}
          <div className="grid grid-cols-7 gap-1 mb-4">
            {['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'].map(day => (
              <div key={day} className="text-center text-sm font-semibold text-gray-600 p-2">
                {day}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {days.map((day, index) => (
              <button
                key={index}
                onClick={() => day && setSelectedDate(day)}
                disabled={!day}
                className={`h-12 text-sm font-medium rounded transition-colors ${
                  !day 
                    ? 'invisible' 
                    : day.toDateString() === selectedDate.toDateString()
                    ? 'bg-[#deb887] text-white'
                    : day.toDateString() === new Date().toDateString()
                    ? 'bg-blue-100 text-blue-800 hover:bg-blue-200'
                    : 'bg-white hover:bg-gray-100 text-gray-700'
                }`}
              >
                {day?.getDate()}
                {day && hasEvents(day) && (
                  <div className="w-2 h-2 bg-red-500 rounded-full mx-auto mt-1"></div>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Lista de eventos */}
        <div className="bg-gray-50 rounded-lg p-6">
          <div className="flex items-center gap-3 mb-6">
            <Calendar className="w-6 h-6 text-[#deb887]" />
            <h3 className="text-xl font-bold text-gray-800">
              Agenda del {formatDate(selectedDate)}
            </h3>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="w-6 h-6 text-[#deb887] animate-spin mr-2" />
              <span className="text-gray-600">Cargando eventos...</span>
            </div>
          ) : error ? (
            <div className="text-center py-8">
              <div className="text-red-600 mb-2">{error}</div>
              <button
                onClick={() => fetchEventsForDate(selectedDate)}
                className="text-[#deb887] hover:text-[#d4a574] font-medium"
              >
                Intentar nuevamente
              </button>
            </div>
          ) : events.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p>No hay citas programadas para este día</p>
            </div>
          ) : (
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {events.map((event, index) => {
                const eventInfo = parseEventDescription(event.description);
                return (
                  <div
                    key={event.id || index}
                    className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-[#deb887]" />
                        <span className="font-semibold text-gray-800">
                          {formatTime(event.start)} - {formatTime(event.end)}
                        </span>
                      </div>
                    </div>
                    
                    <h4 className="font-semibold text-gray-800 mb-2">
                      {event.summary || 'Cita sin título'}
                    </h4>
                    
                    {eventInfo.service && (
                      <div className="flex items-center gap-2 mb-2">
                        <User className="w-4 h-4 text-gray-500" />
                        <span className="text-sm text-gray-600">
                          <strong>Servicio:</strong> {eventInfo.service}
                        </span>
                      </div>
                    )}
                    
                    {eventInfo.phone && (
                      <div className="flex items-center gap-2 mb-2">
                        <Phone className="w-4 h-4 text-gray-500" />
                        <span className="text-sm text-gray-600">
                          <strong>Teléfono:</strong> {eventInfo.phone}
                        </span>
                      </div>
                    )}
                    
                    {eventInfo.email && (
                      <div className="flex items-center gap-2 mb-2">
                        <Mail className="w-4 h-4 text-gray-500" />
                        <span className="text-sm text-gray-600">
                          <strong>Email:</strong> {eventInfo.email}
                        </span>
                      </div>
                    )}
                    
                    {eventInfo.notes && (
                      <div className="mt-3 p-3 bg-gray-50 rounded text-sm text-gray-600">
                        <strong>Notas:</strong> {eventInfo.notes}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminCalendar;