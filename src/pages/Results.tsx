import React from 'react';
import BeforeAfterCard from '../components/BeforeAfterCard';
import TestimonialCard from '../components/TestimonialCard';
import Footer from '../components/Footer';

const Results = () => {
  const beforeAfterResults = [
    {
      beforeImage: "/images/results/manchas/manchasAntes.jpg",
      afterImage: "/images/results/manchas/manchasDespues.jpg",
      title: "Tratamiento Antimanchas",
      description: "Reducción de hiperpigmentación y mejora en el tono de piel después de 4 sesiones."
    },
    {
      beforeImage: "/images/results/antiaging/antiagingAntes.jpg",
      afterImage: "/images/results/antiaging/antiagingDespues.jpg",
      title: "Tratamiento Antiaging",
      description: "Disminución de líneas de expresión y mejora en la firmeza cutánea."
    },
    {
      beforeImage: "/images/results/hidratacion/hidratacionAntes.jpg",
      afterImage: "/images/results/hidratacion/hidratacionDespues.jpg",
      title: "Hidratación Profunda",
      description: "Incremento notable en la hidratación y luminosidad de la piel."
    },
  ];

  const testimonials = [
    {
      name: "Carolina Méndez",
      testimonial: "Después de 3 sesiones del tratamiento antimanchas, mi piel se ve mucho más uniforme y luminosa. El personal es muy profesional y el ambiente es relajante.",
      treatment: "Tratamiento Antimanchas",
      rating: 5
    },
    {
      name: "Martín Rojas",
      testimonial: "Excelente servicio y resultados. Me realicé la limpieza facial profunda y la hidratación, mi piel se siente completamente renovada y fresca.",
      treatment: "Limpieza Facial e Hidratación",
      rating: 5
    },
    {
      name: "Laura Vega",
      testimonial: "El tratamiento antiaging superó mis expectativas. Noté resultados desde la primera sesión y después del paquete completo, las líneas de expresión se redujeron notablemente.",
      treatment: "Tratamiento Antiaging",
      rating: 4
    },
  ];

  return (
	 <>

    <section id="results" className="py-24">
      <div className="container-custom">
        <div className="text-center mb-16">
          <h2 className="section-title">Resultados Reales</h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Conoce los cambios visibles que nuestros clientes han experimentado con nuestros tratamientos faciales personalizados.
          </p>
        </div>



        <div className="mb-20">
          <h3 className="text-2xl font-semibold text-center mb-10">Antes y Después</h3>
          <p className="text-center font-semibold text-gray-600 max-w-2xl mx-auto mb-6">
  	Toca la imagen para ver el después.
	</p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {beforeAfterResults.map((result, index) => (
              <BeforeAfterCard
                key={index}
                beforeImage={result.beforeImage}
                afterImage={result.afterImage}
                title={result.title}
                description={result.description}
              />
            ))}
          </div>
          <p className="text-sm text-gray-500 text-center mt-6">
            *Fotos con fines ilustrativos. Los resultados pueden variar según las características individuales.
          </p>
        </div>

        <div>
          <h3 className="text-2xl font-semibold text-center mb-10">Testimonios de Clientes</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <TestimonialCard
                key={index}
                name={testimonial.name}
                testimonial={testimonial.testimonial}
                treatment={testimonial.treatment}
                rating={testimonial.rating}
              />
            ))}
          </div>
        </div>
      </div>
    </section>

 <Footer />
    </>

  );
};

export default Results;
