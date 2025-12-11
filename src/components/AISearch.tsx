import React, { useState, useRef, useEffect } from 'react';
import { Search, X, ArrowRight, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { slugify } from '../utils/slugify';
import products from '../data/products';
import { services } from '../data/services';

interface SearchResult {
  name: string;
  type: 'product' | 'service';
  description: string;
  url?: string;
}

export default function AISearch() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [answer, setAnswer] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [suggestion, setSuggestion] = useState<string | null>(null);
  const [localSuggestions, setLocalSuggestions] = useState<SearchResult[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Local Autocomplete
  useEffect(() => {
    if (!query.trim()) {
      setLocalSuggestions([]);
      return;
    }

    const lowerQuery = query.toLowerCase();
    
    const matchedProducts = products
      .filter(p => p.name.toLowerCase().includes(lowerQuery))
      .map(p => ({
        name: p.name,
        type: 'product' as const,
        description: p.shortDescription,
        url: `/products/${slugify(p.name)}`
      }))
      .slice(0, 3);

    const matchedServices = services
      .filter(s => s.title.toLowerCase().includes(lowerQuery))
      .map(s => ({
        name: s.title,
        type: 'service' as const,
        description: s.shortDescription,
        url: `/services#${s.id}`
      }))
      .slice(0, 3);

    setLocalSuggestions([...matchedProducts, ...matchedServices]);
  }, [query]);

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setResults([]);
    setAnswer(null);
    setSuggestion(null);
    // Clear local suggestions to show AI results
    setLocalSuggestions([]);

    try {
      const response = await fetch('/api/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query }),
      });

      if (!response.ok) throw new Error('Search failed');

      const data = await response.json();
      setResults(data.results || []);
      setAnswer(data.answer);
      setSuggestion(data.suggestion);
    } catch (error) {
      console.error('Search error:', error);
      setAnswer('Lo siento, hubo un error al buscar. Por favor intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  const handleNavigate = (result: SearchResult) => {
    setIsOpen(false);
    if (result.url) {
      if (result.url.includes('#')) {
        const [path, hash] = result.url.split('#');
        navigate(path);
        // Small delay to allow navigation to complete before scrolling
        setTimeout(() => {
          const element = document.getElementById(hash);
          if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'center' });
            // Add highlight effect
            element.classList.add('ring-4', 'ring-gold-400', 'transition-all', 'duration-500');
            setTimeout(() => element.classList.remove('ring-4', 'ring-gold-400'), 2000);
          }
        }, 100);
      } else {
        navigate(result.url);
      }
    } else {
      // Fallback logic
      if (result.type === 'product') {
        navigate(`/products/${slugify(result.name)}`);
      } else if (result.type === 'service') {
        navigate(`/services`);
      }
    }
  };

  if (window.location.pathname.startsWith('/admin')) return null;

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className={`fixed bottom-6 right-6 z-40 p-4 rounded-full shadow-lg transition-all duration-300 hover:scale-110 group ${
          isOpen ? 'bg-gray-200 text-gray-600 scale-0 opacity-0' : 'bg-gold-500 text-white scale-100 opacity-100'
        }`}
        aria-label="Buscar"
      >
        <Search className="w-6 h-6" />
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4 bg-black/50 backdrop-blur-sm transition-opacity">
          <div 
            ref={modalRef}
            className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh] animate-in fade-in zoom-in duration-200"
          >
            <div className="p-4 border-b border-gray-100 flex items-center gap-3 bg-gray-50/50">
              <Search className="w-6 h-6 text-gold-500" />
              <form onSubmit={handleSearch} className="flex-1 relative">
                <input
                  ref={inputRef}
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Buscar tratamientos, productos..."
                  className="w-full bg-transparent border-none outline-none text-lg text-gray-800 placeholder-gray-400"
                />
                {query && (
                  <button 
                    type="button"
                    onClick={() => setQuery('')}
                    className="absolute right-0 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </form>
              <button 
                onClick={handleSearch}
                disabled={loading || !query.trim()}
                className="p-2 bg-gold-500 text-white rounded-lg hover:bg-gold-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5" />}
              </button>
            </div>

            <div className="overflow-y-auto p-4 space-y-6">
              
              {answer && (
                <div className="bg-gold-50/50 p-4 rounded-xl border border-gold-100">
                  <div className="flex items-start gap-3">
                    <Search className="w-5 h-5 text-gold-500 mt-1 flex-shrink-0" />
                    <p className="text-gray-700 leading-relaxed">{answer}</p>
                  </div>
                </div>
              )}

              {/* Local Suggestions (Autocomplete) */}
              {!loading && !answer && localSuggestions.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider">Sugerencias</h3>
                  <div className="grid gap-3">
                    {localSuggestions.map((result, index) => (
                      <button
                        key={index}
                        onClick={() => handleNavigate(result)}
                        className="flex items-start gap-4 p-3 rounded-xl hover:bg-gray-50 transition-colors text-left group border border-transparent hover:border-gray-100"
                      >
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                          result.type === 'product' ? 'bg-blue-50 text-blue-500' : 'bg-purple-50 text-purple-500'
                        }`}>
                          {result.type === 'product' ? '🛍️' : '💆‍♀️'}
                        </div>
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900 group-hover:text-gold-600 transition-colors">
                            {result.name}
                          </h4>
                          <p className="text-sm text-gray-500 line-clamp-2">{result.description}</p>
                        </div>
                        <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-gold-500 mt-1" />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* AI Results */}
              {results.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider">Resultados</h3>
                  <div className="grid gap-3">
                    {results.map((result, index) => (
                      <button
                        key={index}
                        onClick={() => handleNavigate(result)}
                        className="flex items-start gap-4 p-3 rounded-xl hover:bg-gray-50 transition-colors text-left group border border-transparent hover:border-gray-100"
                      >
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                          result.type === 'product' ? 'bg-blue-50 text-blue-500' : 'bg-purple-50 text-purple-500'
                        }`}>
                          {result.type === 'product' ? '🛍️' : '💆‍♀️'}
                        </div>
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900 group-hover:text-gold-600 transition-colors">
                            {result.name}
                          </h4>
                          <p className="text-sm text-gray-500 line-clamp-2">{result.description}</p>
                        </div>
                        <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-gold-500 mt-1" />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {suggestion && (
                <div className="text-center py-4">
                  <p className="text-gray-500 text-sm">
                    ¿Quisiste decir <button onClick={() => { setQuery(suggestion); handleSearch(); }} className="text-gold-600 font-medium hover:underline">{suggestion}</button>?
                  </p>
                </div>
              )}

              {!loading && !answer && results.length === 0 && localSuggestions.length === 0 && (
                <div className="text-center py-12 text-gray-400">
                  <Search className="w-12 h-12 mx-auto mb-3 opacity-20" />
                  <p>Escribe tu consulta para buscar</p>
                  <div className="mt-4 flex flex-wrap justify-center gap-2">
                    {['Tratamientos faciales', 'Cremas hidratantes', 'Depilación láser', 'Rejuvenecimiento'].map(tag => (
                      <button
                        key={tag}
                        onClick={() => { setQuery(tag); handleSearch(); }}
                        className="px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded-full text-xs text-gray-600 transition-colors"
                      >
                        {tag}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
