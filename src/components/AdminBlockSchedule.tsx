import React, { useState, useEffect } from 'react';
import { 
  Calendar,
  Clock,
  X,
  Plus,
  AlertTriangle,
  CheckCircle,
  Settings,
  ArrowLeft,
  Save,
  Trash2
} from 'lucide-react';

interface BlockScheduleProps {
  onBack: () => void;
}

interface TimeSlot {
  hour: string;
  selected: boolean;
}

interface BlockedEvent {
  date: string;
  hours: string[];
  reason: string;
  created: string;
  events?: Array<{
    id: string;
    hour: string;
    summary: string;
    description?: string;
    htmlLink?: string;
  }>;
}

const AdminBlockSchedule: React.FC<BlockScheduleProps> = ({ onBack }) => {
  const [selectedDate, setSelectedDate] = useState('');
  const [reason, setReason] = useState('');
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error' | ''>('');
  const [existingBlocks, setExistingBlocks] = useState<BlockedEvent[]>([]);
  const [showExisting, setShowExisting] = useState(false);

  // Horarios disponibles (9:00 AM - 7:00 PM)
  const availableHours = [
    '09:00', '10:00', '11:00', '12:00', '13:00', 
    '14:00', '15:00', '16:00', '17:00', '18:00', '19:00'
  ];

  // Razones predefinidas
  const predefinedReasons = [
    'Reunión de equipo',
    'Mantenimiento de equipos',
    'Capacitación del personal',
    'Día festivo',
    'Emergencia médica',
    'Cierre temporal',
    'Evento especial',
    'Ausencia del doctor',
    'Inventario',
    'Otro'
  ];

  // Inicializar slots de tiempo
  useEffect(() => {
    setTimeSlots(
      availableHours.map(hour => ({
        hour,
        selected: false
      }))
    );
  }, []);

  // Obtener mínima fecha (hoy)
  const getMinDate = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  // Obtener máxima fecha (3 meses adelante)
  const getMaxDate = () => {
    const maxDate = new Date();
    maxDate.setMonth(maxDate.getMonth() + 3);
    return maxDate.toISOString().split('T')[0];
  };

  // Toggle selección de hora
  const toggleTimeSlot = (hour: string) => {
    setTimeSlots(prev => 
      prev.map(slot => 
        slot.hour === hour 
          ? { ...slot, selected: !slot.selected }
          : slot
      )
    );
  };

  // Seleccionar todas las horas
  const selectAllHours = () => {
    setTimeSlots(prev => 
      prev.map(slot => ({ ...slot, selected: true }))
    );
  };

  // Deseleccionar todas las horas
  const deselectAllHours = () => {
    setTimeSlots(prev => 
      prev.map(slot => ({ ...slot, selected: false }))
    );
  };

  // Obtener eventos existentes para verificar ocupación
  const checkExistingEvents = async (date: string) => {
    try {
      const response = await fetch('/api/getEvents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date }),
      });
      
      const data = await response.json();
      return data.occupiedTimes || [];
    } catch (error) {
      console.error('Error checking existing events:', error);
      return [];
    }
  };

  // Formatear hora para mostrar
  const formatTimeDisplay = (hour: string) => {
    const [h, m] = hour.split(':');
    const hourNum = parseInt(h);
    const ampm = hourNum >= 12 ? 'PM' : 'AM';
    const hour12 = hourNum % 12 === 0 ? 12 : hourNum % 12;
    return `${hour12}:${m} ${ampm}`;
  };

  // Enviar bloqueo al servidor
  const handleSubmit = async () => {
    if (!selectedDate) {
      setMessage('Por favor selecciona una fecha');
      setMessageType('error');
      return;
    }

    const selectedHours = timeSlots
      .filter(slot => slot.selected)
      .map(slot => slot.hour);

    if (selectedHours.length === 0) {
      setMessage('Por favor selecciona al menos una hora');
      setMessageType('error');
      return;
    }

    if (!reason.trim()) {
      setMessage('Por favor especifica el motivo del bloqueo');
      setMessageType('error');
      return;
    }

    setIsSubmitting(true);
    setMessage('');

    try {
      console.log('🔄 Enviando bloqueo de horarios...', {
        date: selectedDate,
        hours: selectedHours,
        reason: reason.trim()
      });

      // Usar el nuevo endpoint específico para bloqueos
      const response = await fetch('/api/blockSchedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: selectedDate,
          hours: selectedHours,
          reason: reason.trim(),
          adminName: 'Administrador BIOSKIN'
        }),
      });

      const data = await response.json();

      if (data.success) {
        setMessage(data.message);
        setMessageType('success');
        
        // Limpiar formulario
        setSelectedDate('');
        setReason('');
        deselectAllHours();
        
        // Actualizar lista de bloqueos existentes
        loadExistingBlocks();
        
        console.log('✅ Bloqueo exitoso:', data);
      } else {
        throw new Error(data.message || 'Error al bloquear horarios');
      }
      
    } catch (error) {
      console.error('❌ Error blocking schedule:', error);
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      setMessage(`❌ Error al bloquear horarios: ${errorMessage}`);
      setMessageType('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Eliminar bloqueo
  const handleDeleteBlock = async (block: BlockedEvent) => {
    if (!block.events || block.events.length === 0) {
      setMessage('❌ No se encontraron eventos para eliminar');
      setMessageType('error');
      return;
    }

    const confirmDelete = window.confirm(
      `¿Estás seguro de eliminar el bloqueo del ${new Date(block.date).toLocaleDateString('es-ES')} para ${block.hours.length} hora(s)?\n\nMotivo: ${block.reason}`
    );

    if (!confirmDelete) return;

    try {
      const eventIds = block.events.map(event => event.id);
      
      const response = await fetch('/api/deleteBlockedSchedule', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventIds,
          date: block.date,
          reason: block.reason
        }),
      });

      const data = await response.json();

      if (data.success) {
        setMessage(`✅ Bloqueo eliminado exitosamente`);
        setMessageType('success');
        
        // Recargar bloqueos existentes
        loadExistingBlocks();
        
        console.log('✅ Bloqueo eliminado:', data);
      } else {
        throw new Error(data.message || 'Error al eliminar bloqueo');
      }
      
    } catch (error) {
      console.error('❌ Error deleting block:', error);
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      setMessage(`❌ Error al eliminar bloqueo: ${errorMessage}`);
      setMessageType('error');
    }
  };

  // Cargar bloqueos existentes desde la API
  const loadExistingBlocks = async () => {
    try {
      console.log('🔄 Cargando bloqueos existentes...');
      const response = await fetch('/api/getBlockedSchedules');
      const data = await response.json();
      
      if (data.success) {
        setExistingBlocks(data.data.blocks || []);
        console.log(`✅ ${data.data.totalBlocks} bloqueos cargados`);
      } else {
        console.error('❌ Error cargando bloqueos:', data.message);
        setExistingBlocks([]);
      }
    } catch (error) {
      console.error('❌ Error al cargar bloqueos:', error);
      setExistingBlocks([]);
    }
  };

  useEffect(() => {
    loadExistingBlocks();
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2 text-gray-600 hover:text-[#deb887] hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Bloquear Horarios</h2>
            <p className="text-gray-600">Gestiona horarios no disponibles para citas</p>
          </div>
        </div>
        <button
          onClick={() => setShowExisting(!showExisting)}
          className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
        >
          <Settings className="w-4 h-4" />
          {showExisting ? 'Ocultar Existentes' : 'Ver Existentes'}
        </button>
      </div>

      {/* Mensaje de estado */}
      {message && (
        <div className={`p-4 rounded-lg flex items-center gap-3 ${
          messageType === 'success' 
            ? 'bg-green-50 border border-green-200 text-green-800' 
            : 'bg-red-50 border border-red-200 text-red-800'
        }`}>
          {messageType === 'success' ? (
            <CheckCircle className="w-5 h-5" />
          ) : (
            <AlertTriangle className="w-5 h-5" />
          )}
          <span>{message}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Panel de bloqueo */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
            <Plus className="w-5 h-5 text-[#deb887]" />
            Nuevo Bloqueo
          </h3>

          {/* Selección de fecha */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Fecha a bloquear
            </label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              min={getMinDate()}
              max={getMaxDate()}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#deb887] focus:border-transparent"
            />
          </div>

          {/* Selección de horarios */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <label className="text-sm font-medium text-gray-700">
                Horarios a bloquear
              </label>
              <div className="flex gap-2">
                <button
                  onClick={selectAllHours}
                  className="text-xs px-2 py-1 text-[#deb887] hover:bg-[#deb887] hover:text-white border border-[#deb887] rounded transition-colors"
                >
                  Todos
                </button>
                <button
                  onClick={deselectAllHours}
                  className="text-xs px-2 py-1 text-gray-600 hover:bg-gray-600 hover:text-white border border-gray-600 rounded transition-colors"
                >
                  Ninguno
                </button>
              </div>
            </div>
            
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
              {timeSlots.map((slot) => (
                <button
                  key={slot.hour}
                  onClick={() => toggleTimeSlot(slot.hour)}
                  className={`p-3 text-sm rounded-lg border-2 transition-all ${
                    slot.selected
                      ? 'bg-[#deb887] text-white border-[#deb887] shadow-md'
                      : 'bg-white text-gray-700 border-gray-300 hover:border-[#deb887] hover:bg-[#deb887]/10'
                  }`}
                >
                  <Clock className="w-4 h-4 mx-auto mb-1" />
                  <div className="font-medium">{formatTimeDisplay(slot.hour)}</div>
                </button>
              ))}
            </div>
            
            <p className="text-xs text-gray-500 mt-2">
              Seleccionadas: {timeSlots.filter(s => s.selected).length} hora(s)
            </p>
          </div>

          {/* Motivo del bloqueo */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Motivo del bloqueo
            </label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#deb887] focus:border-transparent mb-3"
            >
              <option value="">Selecciona un motivo</option>
              {predefinedReasons.map((reasonOption) => (
                <option key={reasonOption} value={reasonOption}>
                  {reasonOption}
                </option>
              ))}
            </select>
            
            {reason === 'Otro' && (
              <input
                type="text"
                placeholder="Especifica el motivo..."
                value={reason === 'Otro' ? '' : reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#deb887] focus:border-transparent"
              />
            )}
          </div>

          {/* Botón de envío */}
          <button
            onClick={handleSubmit}
            disabled={isSubmitting || !selectedDate || timeSlots.filter(s => s.selected).length === 0 || !reason.trim()}
            className={`w-full py-3 px-4 rounded-lg font-semibold flex items-center justify-center gap-2 transition-all ${
              isSubmitting || !selectedDate || timeSlots.filter(s => s.selected).length === 0 || !reason.trim()
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-[#deb887] hover:bg-[#d4a574] text-white shadow-lg hover:shadow-xl'
            }`}
          >
            {isSubmitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Bloqueando...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Bloquear Horarios
              </>
            )}
          </button>
        </div>

        {/* Panel de información/bloqueos existentes */}
        <div className="space-y-6">
          {/* Información importante */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <h4 className="text-lg font-semibold text-blue-800 mb-3 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" />
              Información Importante
            </h4>
            <ul className="space-y-2 text-sm text-blue-700">
              <li className="flex items-start gap-2">
                <span className="w-2 h-2 bg-blue-600 rounded-full mt-2 flex-shrink-0"></span>
                Los horarios bloqueados aparecerán como ocupados en el sistema de citas
              </li>
              <li className="flex items-start gap-2">
                <span className="w-2 h-2 bg-blue-600 rounded-full mt-2 flex-shrink-0"></span>
                Se crearán eventos automáticamente en Google Calendar
              </li>
              <li className="flex items-start gap-2">
                <span className="w-2 h-2 bg-blue-600 rounded-full mt-2 flex-shrink-0"></span>
                Los pacientes no podrán agendar en estos horarios
              </li>
              <li className="flex items-start gap-2">
                <span className="w-2 h-2 bg-blue-600 rounded-full mt-2 flex-shrink-0"></span>
                Puedes bloquear hasta 3 meses por adelantado
              </li>
            </ul>
          </div>

          {/* Bloqueos existentes */}
          {showExisting && (
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h4 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-gray-600" />
                Bloqueos Existentes
              </h4>
              
              {existingBlocks.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Calendar className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>No hay bloqueos programados</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {existingBlocks.map((block, index) => (
                    <div key={index} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="font-medium text-gray-800 mb-2">
                            {new Date(block.date).toLocaleDateString('es-ES', {
                              weekday: 'long',
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric'
                            })}
                          </div>
                          <div className="text-sm text-gray-600 mb-1">
                            <span className="font-medium">Horarios:</span> {
                              block.hours.map(h => formatTimeDisplay(h)).join(', ')
                            } ({block.hours.length} hora{block.hours.length !== 1 ? 's' : ''})
                          </div>
                          <div className="text-sm text-gray-600 mb-2">
                            <span className="font-medium">Motivo:</span> {block.reason}
                          </div>
                          <div className="text-xs text-gray-500">
                            Creado: {new Date(block.created).toLocaleDateString('es-ES')}
                            {block.events && block.events.length > 0 && (
                              <span className="ml-2">• {block.events.length} evento{block.events.length !== 1 ? 's' : ''}</span>
                            )}
                          </div>
                        </div>
                        <button
                          onClick={() => handleDeleteBlock(block)}
                          className="text-red-500 hover:text-red-700 p-2 hover:bg-red-50 rounded-lg transition-colors ml-4"
                          title="Eliminar bloqueo"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      
                      {/* Mostrar eventos individuales si existen */}
                      {block.events && block.events.length > 1 && (
                        <div className="mt-3 pt-3 border-t border-gray-100">
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                            {block.events.map((event, eventIndex) => (
                              <div key={eventIndex} className="text-xs bg-gray-100 px-2 py-1 rounded">
                                <Clock className="w-3 h-3 inline mr-1" />
                                {formatTimeDisplay(event.hour)}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminBlockSchedule;