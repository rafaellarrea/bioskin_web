import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  ArrowLeft, Bell, BellOff, Send, Loader2, 
  MessageSquare, Clock, User as UserIcon, Search 
} from 'lucide-react';

interface Message {
  id: number;
  phone: string;
  sender: 'user' | 'admin' | 'bot';
  message: string;
  timestamp: string;
  isRead: boolean;
}

interface Conversation {
  phone: string;
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
  messageCount: number;
  conversationState: string;
}

interface Stats {
  totalConversations: number;
  activeToday: number;
  totalMessages: number;
  unreadConversations: number;
}

const API_BASE = '/api/chatbot-api?type=manager';

export default function AdminChatManager() {
  const navigate = useNavigate();
  const { isAuthenticated, checkAuth } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [selectedPhone, setSelectedPhone] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [stats, setStats] = useState<Stats>({ 
    totalConversations: 0, 
    activeToday: 0, 
    totalMessages: 0, 
    unreadConversations: 0 
  });
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showMobileChat, setShowMobileChat] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const knownConversationsRef = useRef(new Set<string>());

  useEffect(() => {
    const verifyAuth = async () => {
      const authenticated = await checkAuth();
      if (!authenticated) {
        navigate('/admin/login');
      }
    };
    verifyAuth();
  }, [checkAuth, navigate]);

  useEffect(() => {
    if (isAuthenticated) {
      loadConversations();
      loadStats();
      
      // Auto-refresh cada 30 segundos
      const interval = setInterval(() => {
        loadConversations();
        loadStats();
        if (selectedPhone) {
          loadMessages(selectedPhone);
        }
      }, 30000);

      return () => clearInterval(interval);
    }
  }, [isAuthenticated, selectedPhone]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadConversations = async () => {
    try {
      const response = await fetch(`${API_BASE}&action=conversations`);
      if (!response.ok) throw new Error('Error al cargar conversaciones');
      
      const data = await response.json();
      const newConversations = data.conversations || [];
      setConversations(newConversations);
      setLoading(false);

      // Notificaciones de nuevas conversaciones
      if (notificationsEnabled && newConversations.length > 0) {
        console.log('🔍 Verificando nuevas conversaciones...', {
          total: newConversations.length,
          conocidas: knownConversationsRef.current.size
        });

        newConversations.forEach((conv: Conversation) => {
          const isNew = !knownConversationsRef.current.has(conv.phone);
          const hasKnownConversations = knownConversationsRef.current.size > 0;
          
          if (isNew && hasKnownConversations) {
            console.log('🆕 Nueva conversación detectada:', conv.phone);
            const preview = conv.lastMessage?.substring(0, 50) || 'Sin mensaje';
            showNotification(
              `💬 Nueva conversación`,
              `${conv.phone}\n${preview}${conv.lastMessage?.length > 50 ? '...' : ''}`
            );
          }
          
          knownConversationsRef.current.add(conv.phone);
        });
      }
    } catch (error) {
      console.error('Error loading conversations:', error);
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const response = await fetch(`${API_BASE}&action=stats`);
      if (!response.ok) throw new Error('Error al cargar estadísticas');
      
      const data = await response.json();
      setStats({
        totalConversations: data.totalConversations || 0,
        activeToday: data.activeToday || 0,
        totalMessages: data.totalMessages || 0,
        unreadConversations: data.unreadConversations || 0
      });
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const loadMessages = async (phone: string) => {
    try {
      const response = await fetch(`${API_BASE}&action=messages&phone=${encodeURIComponent(phone)}`);
      if (!response.ok) throw new Error('Error al cargar mensajes');
      
      const data = await response.json();
      setMessages(data.messages || []);
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  };

  const selectConversation = (phone: string) => {
    setSelectedPhone(phone);
    loadMessages(phone);
    setShowMobileChat(true);
  };

  const backToConversations = () => {
    setShowMobileChat(false);
    setSelectedPhone(null);
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedPhone || sending) return;

    setSending(true);
    try {
      const response = await fetch(`${API_BASE}&action=send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: selectedPhone,
          message: newMessage.trim()
        })
      });

      if (!response.ok) throw new Error('Error al enviar mensaje');

      setNewMessage('');
      await loadMessages(selectedPhone);
      await loadConversations();
    } catch (error) {
      console.error('Error sending message:', error);
      alert('Error al enviar el mensaje');
    } finally {
      setSending(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const toggleNotifications = async () => {
    if (!notificationsEnabled) {
      // Verificar si el navegador soporta notificaciones
      if (!('Notification' in window)) {
        alert('Tu navegador no soporta notificaciones de escritorio');
        return;
      }

      // Si ya está granted, activar directamente
      if (Notification.permission === 'granted') {
        setNotificationsEnabled(true);
        // Inicializar set con conversaciones actuales
        conversations.forEach(conv => knownConversationsRef.current.add(conv.phone));
        showNotification('✅ Notificaciones activadas', 'Recibirás alertas de nuevas conversaciones');
        return;
      }

      // Si está denegado, informar al usuario
      if (Notification.permission === 'denied') {
        alert('❌ Las notificaciones están bloqueadas. Por favor, habilítalas en la configuración de tu navegador.');
        return;
      }

      // Solicitar permiso
      try {
        console.log('🔔 Solicitando permiso de notificaciones...');
        const permission = await Notification.requestPermission();
        console.log('🔔 Permiso otorgado:', permission);
        
        if (permission === 'granted') {
          setNotificationsEnabled(true);
          // Inicializar set con conversaciones actuales
          conversations.forEach(conv => knownConversationsRef.current.add(conv.phone));
          // Mostrar notificación de prueba
          const notification = new Notification('✅ Notificaciones activadas', {
            body: 'Recibirás alertas de nuevas conversaciones',
            icon: '/favicon.ico',
            badge: '/favicon.ico',
            tag: 'bioskin-notifications-enabled'
          });
          
          // Auto-cerrar después de 3 segundos
          setTimeout(() => notification.close(), 3000);
        } else {
          alert('⚠️ Necesitas otorgar permisos de notificaciones para usar esta función');
        }
      } catch (error) {
        console.error('❌ Error al solicitar permisos:', error);
        alert('Error al activar notificaciones. Intenta recargar la página.');
      }
    } else {
      setNotificationsEnabled(false);
      console.log('🔕 Notificaciones desactivadas');
    }
  };

  const showNotification = (title: string, body: string) => {
    if (!notificationsEnabled) return;
    
    if ('Notification' in window && Notification.permission === 'granted') {
      try {
        const notification = new Notification(title, { 
          body, 
          icon: '/favicon.ico',
          badge: '/favicon.ico',
          tag: `bioskin-${Date.now()}`,
          requireInteraction: false
        });

        // Auto-cerrar después de 5 segundos
        setTimeout(() => notification.close(), 5000);

        // Log para debugging
        console.log('🔔 Notificación enviada:', title, body);
      } catch (error) {
        console.error('❌ Error mostrando notificación:', error);
      }
    }
  };

  const filteredConversations = conversations.filter(conv => {
    const phone = conv.phone || '';
    const lastMessage = conv.lastMessage || '';
    const query = searchQuery.toLowerCase();
    return phone.includes(searchQuery) || lastMessage.toLowerCase().includes(query);
  });

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-white shadow-md sticky top-0 z-50">
        <div className="container-custom py-4">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/admin')}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-6 h-6" />
              </button>
              <div>
                <h1 className="text-xl md:text-2xl font-bold text-gray-900">Gestión de Chats</h1>
                <p className="text-sm text-gray-600">WhatsApp Business</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              {/* Stats */}
              <div className="hidden md:flex items-center gap-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-[#deb887]">{stats.totalConversations}</div>
                  <div className="text-xs text-gray-600">Conversaciones</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{stats.activeToday}</div>
                  <div className="text-xs text-gray-600">Hoy</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{stats.unreadConversations}</div>
                  <div className="text-xs text-gray-600">Sin leer</div>
                </div>
              </div>

              {/* Notifications */}
              <div className="relative">
                <button
                  onClick={toggleNotifications}
                  className={`p-2 rounded-lg transition-all ${
                    notificationsEnabled 
                      ? 'bg-green-100 text-green-600 hover:bg-green-200 animate-pulse' 
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                  title={notificationsEnabled ? '🔔 Notificaciones ACTIVAS - Click para desactivar' : '🔕 Click para activar notificaciones'}
                >
                  {notificationsEnabled ? <Bell className="w-5 h-5" /> : <BellOff className="w-5 h-5" />}
                </button>
                {notificationsEnabled && (
                  <span className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container-custom py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-180px)]">
          {/* Conversations List */}
          <div className={`lg:col-span-1 bg-white rounded-lg shadow-lg overflow-hidden flex flex-col ${
            showMobileChat ? 'hidden lg:flex' : 'flex'
          }`}>
            <div className="p-4 border-b">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Buscar conversaciones..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#deb887] focus:border-transparent"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto">
              {loading ? (
                <div className="flex items-center justify-center h-full">
                  <Loader2 className="w-8 h-8 animate-spin text-[#deb887]" />
                </div>
              ) : filteredConversations.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-gray-500 p-8">
                  <MessageSquare className="w-16 h-16 mb-4 opacity-50" />
                  <p>No hay conversaciones</p>
                </div>
              ) : (
                filteredConversations.map((conv) => (
                  <button
                    key={conv.phone}
                    onClick={() => selectConversation(conv.phone)}
                    className={`w-full p-4 border-b hover:bg-gray-50 transition-colors text-left ${
                      selectedPhone === conv.phone ? 'bg-blue-50 border-l-4 border-l-[#deb887]' : ''
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <UserIcon className="w-5 h-5 text-gray-600" />
                        <span className="font-semibold text-gray-900">{conv.phone}</span>
                      </div>
                      {conv.unreadCount > 0 && (
                        <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                          {conv.unreadCount}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 truncate mb-1">{conv.lastMessage}</p>
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {new Date(conv.lastMessageTime).toLocaleString('es-ES', {
                          day: '2-digit',
                          month: '2-digit',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </div>
                      <span>{conv.messageCount} mensajes</span>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>

          {/* Chat Area */}
          <div className={`lg:col-span-2 bg-white rounded-lg shadow-lg flex flex-col ${
            !showMobileChat ? 'hidden lg:flex' : 'flex'
          }`}>
            {selectedPhone ? (
              <>
                {/* Chat Header */}
                <div className="p-4 border-b flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={backToConversations}
                      className="lg:hidden p-2 hover:bg-gray-100 rounded-lg"
                    >
                      <ArrowLeft className="w-5 h-5" />
                    </button>
                    <UserIcon className="w-8 h-8 text-gray-600" />
                    <div>
                      <h3 className="font-semibold text-gray-900">{selectedPhone}</h3>
                      <p className="text-sm text-gray-500">WhatsApp</p>
                    </div>
                  </div>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex ${msg.sender === 'user' ? 'justify-start' : 'justify-end'}`}
                    >
                      <div
                        className={`max-w-[70%] rounded-lg px-4 py-2 ${
                          msg.sender === 'user'
                            ? 'bg-gray-100 text-gray-900'
                            : msg.sender === 'admin'
                            ? 'bg-[#deb887] text-white'
                            : 'bg-blue-100 text-gray-900'
                        }`}
                      >
                        <p className="whitespace-pre-wrap break-words">{msg.message}</p>
                        <p className="text-xs mt-1 opacity-70">
                          {new Date(msg.timestamp).toLocaleTimeString('es-ES', {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>

                {/* Message Input */}
                <div className="p-4 border-t">
                  <div className="flex gap-2">
                    <textarea
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder="Escribe un mensaje..."
                      rows={2}
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#deb887] focus:border-transparent resize-none"
                    />
                    <button
                      onClick={sendMessage}
                      disabled={sending || !newMessage.trim()}
                      className="px-6 py-2 bg-[#deb887] text-white rounded-lg hover:bg-[#c9a877] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                      {sending ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <Send className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-gray-500">
                <div className="text-center">
                  <MessageSquare className="w-16 h-16 mx-auto mb-4 opacity-50" />
                  <p>Selecciona una conversación para comenzar</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
