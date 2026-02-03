import React from 'react';
import { motion } from 'framer-motion';
import { Settings, Wrench, Shield, Cpu, Award, Clock, CheckCircle, ArrowRight, Zap, Target } from 'lucide-react';
import { SEO } from '../components/SEO';

const BioskinTech = () => {
  const fadeInUp = {
    initial: { opacity: 0, y: 30 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true },
    transition: { duration: 0.8, ease: "easeOut" }
  };

  const whatsappNumber = "593984232889";

  return (
    <>
      <SEO 
        title="BIOSKIN TECH - Bioingeniería Estética"
        description="Centro de Bioingeniería Estética especializado en mantenimiento preventivo, reparaciones y venta de aparatología médica-estética en Cuenca."
        keywords="mantenimiento equipos estéticos, reparación láser, bioingeniería estética cuenca, venta equipos estéticos, laser co2, bioskin tech"
      />

      {/* Hero Section Futuristic */}
      <section className="relative h-[75vh] flex items-center justify-center overflow-hidden bg-[#0a0a0a] text-white">
        {/* Dynamic Background */}
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20 animate-pulse"></div>
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.1 }}
            transition={{ duration: 2 }}
            className="absolute inset-0 bg-gradient-to-r from-[#deb887]/10 via-transparent to-[#deb887]/10"
          ></motion.div>
          <div className="absolute inset-0 bg-gradient-to-b from-black via-black/80 to-black z-10" />
          
          {/* Animated Tech Lines */}
          <div className="absolute w-full h-full overflow-hidden opacity-30">
            <div className="absolute top-1/4 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-[#deb887] to-transparent animate-slide-right"></div>
            <div className="absolute bottom-1/4 right-0 w-full h-[1px] bg-gradient-to-l from-transparent via-[#deb887] to-transparent animate-slide-left animation-delay-2000"></div>
          </div>
        </div>

        <div className="container-custom relative z-20 text-center px-6">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1 }}
          >
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: "100px" }}
              transition={{ delay: 0.5, duration: 1 }}
              className="h-1 bg-[#deb887] mx-auto mb-6 shadow-[0_0_10px_#deb887]"
            />
            
            <span className="block text-[#deb887] text-sm md:text-base uppercase tracking-[0.3em] mb-4 font-mono">
              System Online /// Bioingeniería Estética
            </span>
            
            <h1 className="text-5xl md:text-7xl lg:text-8xl font-sans font-bold mb-8 tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-white to-gray-500 relative">
              BIOSKIN <span className="text-[#deb887] drop-shadow-[0_0_15px_rgba(222,184,135,0.5)]">TECH</span>
              <span className="absolute -top-4 -right-8 text-xs text-[#deb887] font-mono border border-[#deb887] px-2 py-1 rounded hidden md:block opacity-70">
                v2.0 ACTIVE
              </span>
            </h1>

            <p className="text-lg md:text-xl text-gray-400 max-w-2xl mx-auto font-light leading-relaxed mb-10 border-l-2 border-[#deb887]/50 pl-6 text-left">
              Analítica avanzada, soporte técnico de precisión y tecnología biomédica para maximizar el rendimiento de tu clínica.
            </p>

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 }}
              className="flex justify-center gap-6"
            >
              <a href="#services" className="group relative px-8 py-3 bg-transparent border border-[#deb887] text-[#deb887] uppercase tracking-widest font-mono text-sm hover:bg-[#deb887] hover:text-black transition-all duration-300">
                <span className="relative z-10">Iniciar Diagnóstico</span>
                <div className="absolute inset-0 bg-[#deb887]/20 blur-md opacity-0 group-hover:opacity-100 transition-opacity"></div>
              </a>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Profile Section - Cyber Clean Style */}
      <section className="py-24 bg-[#0a0a0a] relative border-b border-gray-900">
        <div className="container-custom px-6">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <motion.div {...fadeInUp} className="relative z-10">
              <div className="absolute -left-10 top-0 w-1 h-32 bg-gradient-to-b from-[#deb887] to-transparent"></div>
              <h2 className="text-4xl md:text-5xl font-sans font-bold text-white mb-2 tracking-tight">
                INGENIERÍA <br /> <span className="text-[#deb887]">DE PRECISIÓN</span>
              </h2>
              <p className="text-gray-500 font-mono text-sm mb-8">/// AUTHORIZED PERSONNEL ONLY</p>
              
              <div className="bg-gray-900/50 backdrop-blur-sm p-8 border border-gray-800 rounded-sm relative overflow-hidden group hover:border-[#deb887]/50 transition-colors duration-500">
                <div className="absolute top-0 right-0 p-2 opacity-20 group-hover:opacity-100 transition-opacity">
                  <Cpu className="w-12 h-12 text-[#deb887]" />
                </div>
                
                <h4 className="font-sans text-2xl text-white mb-1 tracking-wide">Ing. Rafael Larrea</h4>
                <p className="text-[#deb887] font-mono text-xs mb-4 uppercase tracking-widest">Ingeniero Mecatrónico</p>
                
                <p className="text-gray-400 leading-relaxed text-sm border-t border-gray-800 pt-4 mt-4">
                  Especialista con amplia trayectoria en el área de la bioingeniería estética. 
                  Lidera la división técnica garantizando que cada equipo opere bajo estándares clínicos rigurosos, 
                  fusionando la mecánica de precisión con la electrónica avanzada.
                </p>
              </div>
            </motion.div>

            <motion.div 
              {...fadeInUp}
              transition={{ delay: 0.2 }}
              className="relative"
            >
              <div className="relative aspect-square md:aspect-[4/5] bg-gray-900 rounded-sm overflow-hidden border border-gray-800 group">
                <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1581093458791-9f3c3900df4b?auto=format&fit=crop&q=80')] bg-cover bg-center opacity-40 mix-blend-overlay transition-opacity duration-700 group-hover:opacity-20 pointer-events-none"></div>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <div className="w-32 h-32 rounded-full border-2 border-[#deb887] flex items-center justify-center mb-6 relative animate-[spin_10s_linear_infinite]">
                    <div className="w-28 h-28 rounded-full border border-dashed border-[#deb887]/50"></div>
                    <div className="absolute -top-1 left-1/2 w-2 h-2 bg-[#deb887] shadow-[0_0_10px_#deb887]"></div>
                  </div>
                  <Settings className="w-16 h-16 text-[#deb887] mb-4 relative z-10" />
                  <p className="text-white font-mono uppercase tracking-widest text-sm relative z-10">Lab. de Operaciones</p>
                  <p className="text-xs text-gray-500 mt-2 font-mono">STATUS: ONLINE</p>
                </div>
                
                {/* HUD Elements */}
                <div className="absolute top-4 left-4 border-l-2 border-t-2 border-[#deb887] w-8 h-8"></div>
                <div className="absolute bottom-4 right-4 border-r-2 border-b-2 border-[#deb887] w-8 h-8"></div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Data Visualization Section */}
      <section className="py-24 bg-black text-white relative">
        <div className="container-custom px-6">
          <div className="flex flex-col md:flex-row justify-between items-end mb-16 border-b border-gray-800 pb-8">
            <div>
              <h2 className="text-3xl font-bold uppercase tracking-tighter mb-2">Análisis de <span className="text-red-500">Riesgo</span></h2>
              <p className="text-gray-400 font-mono text-xs">/// ERROR LOG_01: IMPACTO FINANCIERO</p>
            </div>
            <div className="hidden md:block">
              <div className="flex space-x-2">
                <div className="w-2 h-2 bg-red-500 animate-pulse"></div>
                <div className="w-2 h-2 bg-gray-700"></div>
                <div className="w-2 h-2 bg-gray-700"></div>
              </div>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <TechCard 
              icon={<Clock className="w-8 h-8 text-red-500" />}
              title="TIEMPO MUERTO"
              subtitle="Lucro Cesante"
              description="Un día sin operar genera pérdidas exponenciales. La inactividad es el enemigo silencioso de la rentabilidad."
              borderColor="border-red-500/30"
            />
            <TechCard 
              icon={<Wrench className="w-8 h-8 text-orange-500" />}
              title="FALLO TÉCNICO"
              subtitle="Riesgo Empírico"
              description="La intervención no calificada compromete la integridad del hardware y anula garantías de fabricante."
              borderColor="border-orange-500/30"
            />
            <TechCard 
              icon={<Target className="w-8 h-8 text-[#deb887]" />}
              title="SOLUCIÓN ACTIVA"
              subtitle="Protocolo Bioskin"
              description="Ingeniería certificada, repuestos críticos en stock y validación de operatividad inmediata."
              borderColor="border-[#deb887]/50"
              glow
            />
          </div>
        </div>
      </section>

      {/* Services Grid - Motherboard Style */}
      <section id="services" className="py-24 bg-white relative overflow-hidden">
        {/* Circuit Pattern Background (CSS) */}
        <div className="absolute inset-0 opacity-5 pointer-events-none" style={{ backgroundImage: 'radial-gradient(#999 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>
        
        <div className="container-custom px-6 relative z-10">
          <div className="text-center mb-20">
            <h2 className="text-4xl font-sans font-bold text-black mb-2 tracking-tight">SISTEMAS & <span className="text-[#deb887]">PROTOCOLOS</span></h2>
            <div className="w-20 h-1 bg-[#deb887] mx-auto"></div>
          </div>

          <div className="grid lg:grid-cols-2 gap-12">
            
            {/* Maintenance Module */}
            <div className="space-y-6">
              <motion.div 
                whileHover={{ x: 10 }}
                className="group bg-gray-50 p-8 border-l-4 border-gray-200 hover:border-[#deb887] transition-all duration-300 shadow-sm"
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="bg-gray-200 p-3 rounded text-gray-700 group-hover:bg-[#deb887] group-hover:text-white transition-colors">
                    <Shield className="w-6 h-6" />
                  </div>
                  <span className="font-mono text-xs text-gray-400">SYS_PROTECT</span>
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-3">Mantenimiento Preventivo</h3>
                <p className="text-gray-600 mb-4 text-sm leading-relaxed">
                  Protocolos semestrales de optimización y calibración. Aseguramos la precisión de disparo en láseres y la estabilidad de frecuencia en sistemas RF.
                </p>
                <ul className="space-y-2 font-mono text-xs text-gray-500">
                  <li className="flex items-center"><span className="text-[#deb887] mr-2">ᐳ</span> Calibración energética</li>
                  <li className="flex items-center"><span className="text-[#deb887] mr-2">ᐳ</span> Limpieza de óptica interna</li>
                  <li className="flex items-center"><span className="text-[#deb887] mr-2">ᐳ</span> Certificación de estado</li>
                </ul>
              </motion.div>

              <motion.div 
                whileHover={{ x: 10 }}
                className="group bg-gray-50 p-8 border-l-4 border-gray-200 hover:border-red-500 transition-all duration-300 shadow-sm"
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="bg-gray-200 p-3 rounded text-gray-700 group-hover:bg-red-500 group-hover:text-white transition-colors">
                    <Zap className="w-6 h-6" />
                  </div>
                  <span className="font-mono text-xs text-gray-400">SYS_REPAIR</span>
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-3">Reparaciones Técnicas</h3>
                <p className="text-gray-600 mb-4 text-sm leading-relaxed">
                  Diagnóstico profundo y sustitución de componentes dañados con rigor técnico. Soluciones duraderas para equipos críticos.
                </p>
                <ul className="space-y-2 font-mono text-xs text-gray-500">
                  <li className="flex items-center"><span className="text-red-500 mr-2">ᐳ</span> Microelectrónica</li>
                  <li className="flex items-center"><span className="text-red-500 mr-2">ᐳ</span> Ajuste de cavidades láser</li>
                  <li className="flex items-center"><span className="text-red-500 mr-2">ᐳ</span> Recuperación de enfriamiento</li>
                </ul>
              </motion.div>
            </div>

            {/* Sales Module - Futuristic Box */}
            <motion.div 
              className="bg-[#111] text-white p-10 relative overflow-hidden border border-gray-800 flex flex-col justify-between"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              transition={{ duration: 1 }}
            >
              {/* Decorative Background */}
              <div className="absolute top-0 right-0 w-64 h-64 bg-[#deb887]/5 rounded-full blur-3xl pointer-events-none"></div>
              <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
              
              <div className="relative z-10">
                <div className="flex items-center gap-3 mb-8">
                  <Award className="w-10 h-10 text-[#deb887]" />
                  <div>
                    <h3 className="text-3xl font-bold italic tracking-wide">BIOSKIN TECH <span className="text-[#deb887]">SALES</span></h3>
                    <p className="text-xs font-mono text-gray-500 tracking-widest">AUTHORIZED DISTRIBUTOR</p>
                  </div>
                </div>

                <div className="bg-white/5 border border-white/10 p-6 mb-8 backdrop-blur-sm">
                  <h4 className="text-xl font-bold mb-2 flex items-center">
                    <span className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></span>
                    Láser CO2 Fraccionado
                  </h4>
                  <p className="text-gray-400 text-sm mb-4">
                    Disponible bajo pedido. La referencia estándar en tratamientos ablativos.
                  </p>
                  <p className="text-[#deb887] text-xs font-mono border-t border-white/10 pt-2">
                    + OTRA APARATOLOGÍA BAJO DEMANDA
                  </p>
                </div>

                <div className="space-y-4 mb-10">
                  <p className="font-bold border-b border-gray-800 pb-2 text-sm uppercase">El Modelo de Negocio Incluye:</p>
                  <ul className="space-y-3 font-mono text-xs text-gray-400">
                    <li className="flex items-center gap-2">
                      <Cpu className="w-4 h-4 text-[#deb887]" /> Hardware de última generación
                    </li>
                    <li className="flex items-center gap-2">
                      <Settings className="w-4 h-4 text-[#deb887]" /> Instalación y calibración in-situ
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-[#deb887]" /> Capacitación Técnica (Ing. Larrea)
                    </li>
                    <li className="flex items-center gap-2">
                      <Award className="w-4 h-4 text-[#deb887]" /> Capacitación Clínica (Dra. Daniela)
                    </li>
                  </ul>
                </div>
              </div>

              <a 
                href={`https://wa.me/${whatsappNumber}?text=Hola,%20me%20interesa%20información%20sobre%20ventas%20BIOSKIN%20TECH`}
                target="_blank"
                rel="noopener noreferrer"
                className="relative z-10 w-full py-4 bg-[#deb887] text-black font-bold text-center uppercase tracking-widest hover:bg-white transition-colors duration-300"
              >
                Solicitar Cotización <ArrowRight className="inline-block w-4 h-4 ml-2" />
              </a>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Footer CTA - Gamer Style */}
      <section className="py-20 bg-[#050505] border-t border-gray-900 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-[#deb887]/5 to-transparent"></div>
        <div className="container-custom px-6 text-center relative z-10">
          <h2 className="text-3xl md:text-5xl font-bold text-white mb-8 tracking-tighter">
            INICIA EL <span className="text-[#deb887]">DIAGNÓSTICO</span>
          </h2>
          
          <div className="flex flex-col md:flex-row items-center justify-center gap-6">
            <a 
              href={`https://wa.me/${whatsappNumber}?text=Hola,%20necesito%20soporte%20técnico%20BIOSKIN%20TECH`} 
              className="group relative px-10 py-4 bg-transparent border border-[#deb887] text-[#deb887] font-mono uppercase tracking-widest transition-all duration-300 overflow-hidden hover:text-black"
            >
              <span className="relative z-10 flex items-center gap-2">
                <Wrench className="w-4 h-4" /> Agendar Soporte
              </span>
              <div className="absolute inset-0 bg-[#deb887] translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out"></div>
            </a>

            <a 
              href={`https://wa.me/${whatsappNumber}?text=Hola,%20me%20interesa%20comprar%20equipos%20médicos`}
              className="group relative px-10 py-4 bg-gray-900 text-gray-300 font-mono uppercase tracking-widest transition-all duration-300 hover:bg-gray-800"
            >
              <span className="flex items-center gap-2">
                Consultar Ventas <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </span>
            </a>
          </div>
        </div>
      </section>
    </>
  );
};

// Cyber Card Component
const TechCard = ({ icon, title, subtitle, description, borderColor, glow = false }) => (
  <motion.div 
    whileHover={{ y: -5 }}
    className={`bg-[#0f0f0f] p-8 border border-gray-800 relative group overflow-hidden ${glow ? 'shadow-[0_0_30px_rgba(222,184,135,0.15)]' : ''}`}
  >
    <div className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-current to-transparent opacity-50 ${borderColor.replace('border-', 'text-')}`}></div>
    
    <div className="mb-6 relative z-10">
      <div className="bg-gray-900/50 w-16 h-16 rounded flex items-center justify-center border border-gray-800 group-hover:border-gray-600 transition-colors">
        {icon}
      </div>
    </div>
    
    <h3 className="text-2xl font-bold text-white mb-1 tracking-tight relative z-10">{title}</h3>
    <p className={`text-xs font-mono mb-4 uppercase tracking-widest ${glow ? 'text-[#deb887]' : 'text-gray-500'}`}>{subtitle}</p>
    
    <p className="text-gray-400 text-sm leading-relaxed relative z-10">{description}</p>
    
    {/* Hover Effect Background */}
    <div className={`absolute inset-0 bg-gradient-to-br ${glow ? 'from-[#deb887]/5' : 'from-white/5'} to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none`}></div>
  </motion.div>
);

export default BioskinTech;
