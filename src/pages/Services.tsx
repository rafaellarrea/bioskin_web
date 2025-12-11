import ServiceCard from '../components/ServiceCard';
import Footer from '../components/Footer';
import { services as servicesData } from '../data/services';
import { SEO } from '../components/SEO';

const Services = () => {
  // Mapear servicios desde la fuente centralizada
  const services = servicesData.map(service => ({
    id: service.id,
    title: service.title,
    description: service.description,
    price: service.price,
    image: service.image
  }));

  return (
<>
    <SEO 
      title="Servicios Estéticos"
      description="Conoce nuestros tratamientos faciales y corporales en BIOSKIN Cuenca. Tecnología avanzada para el cuidado de tu piel."
      keywords="Servicios estéticos Cuenca, tratamientos faciales, corporales, láser, BIOSKIN"
    />
    <section id="services" className="py-24 bg-gray-50">
      <div className="container-custom">
        <div className="text-center mb-12">
          <h2 className="section-title">Nuestros Servicios en Cuenca</h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Ofrecemos tratamientos personalizados con tecnología de vanguardia para resolver tus necesidades específicas en nuestra clínica en Cuenca, Ecuador.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {services.map((service, index) => (
            <ServiceCard
              key={index}
              id={service.id}
              title={service.title}
              description={service.description}
              price={service.price}
              image={service.image}
              index={index}
            />
          ))}
        </div>

        {/* PROMOCION DEL MES */}       
        <div className="mt-16 text-center">
          <h3 className="text-2xl font-semibold mb-4">Promoción del Mes</h3>
          <div className="card mx-auto max-w-md p-6 border-2 border-[#deb887] mb-12">
            <h4 className="text-xl font-semibold mb-2">Hollywood Peel + Hidratación Profunda</h4>
            <p className="text-gray-500 text-sm mb-4">Unifica tono, revitaliza y nutre tu piel profundamente en una sola sesión.</p>
            <p className="text-3xl font-bold text-[#deb887] mb-4">$50 USD</p>
            <p className="text-green-600 font-medium mb-4">Precio especial</p>
            <a href="#appointment" className="btn-primary block text-center">Agendar Promo</a>
          </div>
        </div>

        {/* PACKS PROMOS */}    
        <div className="mt-16 text-center">
          <h3 className="text-2xl font-semibold mb-4">Packs Promocionales</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mt-8">
            <div className="card p-6 border-2 border-[#deb887]">
              <h4 className="text-xl font-semibold mb-2">Pack Rejuvenecimiento</h4>
              <p className="text-gray-500 text-sm mb-4">1 DIAGNÓSTICO FACIAL COMPUTARIZADO + 1 SESIÓN HIFU 7D + LIMPIEZA FACIAL PROFUNDA</p>
              <p className="text-3xl font-bold text-[#deb887] mb-4">$100 USD</p>
              <p className="text-green-600 font-medium mb-4">Ahorra $20 USD</p>
              <a href="#appointment" className="btn-primary block text-center">Agendar Ahora</a>
            </div>

            <div className="card p-6 border-2 border-[#deb887]">
              <h4 className="text-xl font-semibold mb-2">Pack Luminosidad</h4>
              <p className="text-gray-500 text-sm mb-4">1 Hollywood Peel + 1 Hidratación Profunda con Dermapen + 1 Sesión Exosomas</p>
              <p className="text-3xl font-bold text-[#deb887] mb-4">$170 USD</p>
              <p className="text-green-600 font-medium mb-4">Ahorra $20 USD</p>
              <a href="#appointment" className="btn-primary block text-center">Agendar Ahora</a>
            </div>

            <div className="card p-6 border-2 border-[#deb887]">
              <h4 className="text-xl font-semibold mb-2">Pack Completo</h4>
              <p className="text-gray-500 text-sm mb-4">Diagnóstico + Limpieza + 2 sesiones personalizadas</p>
              <p className="text-3xl font-bold text-[#deb887] mb-4">$90 USD</p>
              <p className="text-green-600 font-medium mb-4">Ahorra $15 USD</p>
              <a href="#appointment" className="btn-primary block text-center">Agendar Ahora</a>
            </div>
          </div>
        </div>
      </div>
    </section>

 <Footer />
    </>

  );
};

export default Services;
