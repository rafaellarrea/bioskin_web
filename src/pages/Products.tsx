
import React, { useState } from 'react';
import ProductCard from '../components/ProductCard';
import Footer from '../components/Footer';

const Products = () => {
  const [activeCategory, setActiveCategory] = useState<'all' | 'equipment' | 'cosmetic'>('all');

  const products = [
    {
      name: "ANALIZADOR FACIAL INTELIGENTE CON PANTALLA DE 21 pulgadas",
      description: "Experiencia de análisis de piel profesional con tecnología de 	vanguardia: esta máquina analizadora de piel inteligente Bitmoji 3D AI utiliza 	tecnología RGB+UV+PL para proporcionar un análisis de piel integral. Detecta y 	analiza diversas afecciones de la piel, como acné, arrugas, poros, manchas y 	niveles de hidratación, proporcionando informes detallados para el cuidado 	personalizado de la piel.",
      price: 3100,
      images: [
        "/images/productos/dispositivos/analizador/analizador1.jpg",
	"/images/productos/dispositivos/analizador/analizador2.jpg",
	"/images/productos/dispositivos/analizador/analizador3.jpg",
	"/images/productos/dispositivos/analizador/analizador4.jpg"
      ],
      category: "equipment"
    },
    {
      name: "3 en 1 IPL + LASER YAG + RADIOFRECUENCIA",
      description: "Equipo estético de alta tecnología que integra IPL, ND YAG láser y 	radiofrecuencia para ofrecer soluciones faciales y corporales completas. 	Permite realizar depilación permanente con IPL, incluso en vello fino y claro. 	Trata pecas, melasma, manchas solares y marcas de acné mediante luz pulsada intensa 	(IPL). La radiofrecuencia mejora la textura, poros dilatados, arrugas finas y 	estimula la elasticidad de la piel. Corrige enrojecimiento y rubor facial (rosácea 	leve) y unifica el tono con luz intensa. El láser ND YAG elimina tatuajes de 	múltiples colores (rojo, marrón, azul, negro) y micropigmentaciones en cejas, 	labios y ojos. También trata lesiones pigmentadas como lunares, manchas de la edad 	y marcas de nacimiento con precisión. Ideal para clínicas que buscan tecnología 	versátil, eficaz y rentable.",
      price: 3800,
      images: [
        "/images/productos/dispositivos/multifuncional/multifuncional1.jpg",
	"/images/productos/dispositivos/multifuncional/multifuncional2.jpg",
	"/images/productos/dispositivos/multifuncional/multifuncional3.jpg"
      ],
      category: "equipment"
    },
    {
      name: "MEDICUBE DEEP VITA C CAPSULE CREAM",
      description: "Cápsulas de liposomas con vitamina C, niacinamida, vitaminas y ácido 	ferúlico para una piel más brillante e hidratada. \n Contenido: 55g",
      price: 35,
      images: [
	"/images/productos/cosmeticos/medicubeCapsuleVitaC.jpg"
      ],
      category: "cosmetic"
    },
	{
      name: "MEDICUBE PDRN PINK COLLAGEN CAPSULE CREAM",
      description: "PDRN y DNA de Salmón encapsulado en crema facial que ayuda a hidratar, 	unificar el tono, da firmeza, mejora el brillo natural y la resistencia de la piel.  \n Contenido: 55g",
      price: 35,
      images: [
	"/images/productos/cosmeticos/medicubeCapsulePDRN.jpg"
      ],
      category: "cosmetic"
    },
	{
      name: "MEDICUBE KOJID ACID GEL MASK",
      description: "Mascarillas de gel con ácido kójico, niacinamida y cúrcuma que ayudan 	al brillo natural de la piel, dejando un efecto glass glow. Mejora la elasticidad y 	la hidratación. \n Contenido: 4 gel mask / 28g c/u",
      price: 35,
      images: [
	"/images/productos/cosmeticos/medicubeMask.jpg"
      ],
      category: "cosmetic"
    },
	{
      name: "ABIB COLLAGEN EYE PATCH",
      description: "Parches con colágeno y niacinamida que hidrata, reafirma y reduce 	signos de fatiga en el contorno de ojos. \n Contenido: 90g / 30 pares",
      price: 30,
      images: [
	"/images/productos/cosmeticos/abibParchesOjos.jpg",
        "/images/productos/cosmeticos/abibParchesOjos2.jpg"
      ],
      category: "cosmetic"
    },
	{
      name: "COSRX PETIDE BOOSTER TONER",
      description: "Peptide booster toner: mejora la luminosidad y elasticidad de la 	piel. \n Contenido> 150ml",
      price: 30,
      images: [
	"/images/productos/cosmeticos/cosrxPeptide.jpg"
      ],
      category: "cosmetic"
    },
	{
      name: "COSRX SNAIL 96% MUCIN ESSENCE",
      description: "Snail 96% Mucin Essence: rejuvenece piel dañada, ayuda a reparar 	manchas oscuras y promueve la vitalidad de la piel. \n Contenido> 100ml",
      price: 30,
      images: [
	"/images/productos/cosmeticos/cosrxMucina.jpg"
      ],
      category: "cosmetic"
    },
	{
      name: "COSRX ADVANCE SNAIL MUCIN GLASS GLOW HYDROGEL MASK",
      description: "Máscara de gel de mucina de caracol + colageno y niacinamida, hidrata 	profundamente la piel, mejorando la luminosidad, calma la piel sensible y suaviza 	la textura de la piel. \n Contenido: 3 hydrogel mask / 34g c/u",
      price: 25,
      images: [
	"/images/productos/cosmeticos/cosrxMask.jpg"
      ],
      category: "cosmetic"
    },
	{
      name: "COSRX ACNE PIMPLE MASTER PATCH",
      description: "Parches hidrocoloides para granitos o acné. Ayudan a contrarestar la 	inflamación, la rojez y las bacterias (no para tratamiento definitivo del acné). 	\n Contenido: 24 parches (7mmx10/10mmx5/12mmx9)",
      price: 5,
      images: [
	"/images/productos/cosmeticos/cosrxParcheAcne.jpg",
        "/images/productos/cosmeticos/cosrxParcheAcne2.jpg"
      ],
      category: "cosmetic"
    },
	{
      name: "CERAVE JABÓN HIDRATANTE PARA PIEL NORMAL A SECA",
      description: "Limpiador facial hidratante ideal para piel normal a seca. Contiene 3 	ceramidas, ácido hialurónico y glicerina para una piel más suave e hidratada. 	\n Contenido: 473ml",
      price: 20,
      images: [
	"/images/productos/cosmeticos/ceraveLimpiadorDry.jpg",
        "/images/productos/cosmeticos/ceraveLimpiadorDry2.jpg"
      ],
      category: "cosmetic"
    },
	{
      name: "CERAVE FOAMING CLEANSER PARA PIEL NORMAL A GRASA",
      description: "Jabón espumoso en gel ideal para piel grasa o mixta, elimina el exceso 	de sebo e hidrata a la piel. Contiene ceramidas, ácido hialurónico y niacinamida.	\n Contenido: 473ml",
      price: 20,
      images: [
	"/images/productos/cosmeticos/ceraveLimpiadorOily.jpg",
        "/images/productos/cosmeticos/ceraveLimpiadorOily2.jpg"
      ],
      category: "cosmetic"
    },
	{
      name: "CERAVE RETINOL SERUM",
      description: "Serum de retinol anti-edad con ácido hialurónico, niacinamida y 	ceramidas. Ayuda a suavizar arrugas y líneas finas; ilumina la piel. \n Contenido: 30ml",
      price: 30,
      images: [
	"/images/productos/cosmeticos/ceraveRetinol.jpg"
      ],
      category: "cosmetic"
    },
	{
      name: "CERAVE ACNE FOAMING CREAM CLEANSER",
      description: "Jabón espumoso formulado con peróxido de benzoílo al 4%, este limpiador 	ataca y trata eficazmente el acné, ayudando a eliminar los brotes existentes y 	previniendo los futuros. \n Contenido: 150 ml",
      price: 20,
      images: [
	"/images/productos/cosmeticos/ceraveAcneCleanser.jpg"
      ],
      category: "cosmetic"
    }, 
	{
      name: "#OOTD VELOS FACIALES DE COLAGENO, CERAMIDAS O CENTELLA ASIATICA 2x$5",
      description: "Velos faciales de uso nocturno para mejorar la elasticidad, hidratación 	y luminosidad en la piel, con ingredientes de origen vegano. Marca coreana. \n Contenido: 25g c/u",
      price: 3,
      images: [
	"/images/productos/cosmeticos/ootdCeramideMask.jpg",
        "/images/productos/cosmeticos/ootdCicaMask.jpg",
	"/images/productos/cosmeticos/ootdCollagenMask.jpg",
	"/images/productos/cosmeticos/ootdHyaluronMask.jpg",
	"/images/productos/cosmeticos/ootdRetinolMask.jpg",
      ],
      category: "cosmetic"
    }, 
	{
      name: "NEUTRÓGENA CLEAR FACE PROTECTOR SOLAR",
      description: "Protector solar con FPS 50+ para piel grasa o mixta, libre de 	aceites/no comedogénico. Textura ligera. \n Contenido: 88ml",
      price: 20,
      images: [
	"/images/productos/cosmeticos/neutrogenaSolar1.jpg",
        "/images/productos/cosmeticos/neutrogenaSolar2.jpg"
      ],
      category: "cosmetic"
    }, 
	{
      name: "TOCOBO ESPUMA LIMPIADORA ARCILLOSA DE COCO",
      description: "Espuma limpiadora de arcilla de coco con burbujas finas que limpia el 	rostro, eliminando impurezas y sebo. Además, hidrata y cuida la piel sensible. \n 	Contenido: 204g",
      price: 18,
      images: [
	"/images/productos/cosmeticos/tocoboEspumaLimpiadora.jpg",
        "/images/productos/cosmeticos/tocoboEspumaLimpiadora2.jpg"
      ],
      category: "cosmetic"
    }, 
	{
      name: "TOCOBO GEL DE CONTORNO DE OJOS",
      description: "Gel de contorno de ojos con colágeno, retinol y niacinamida para 	aportar firmeza, reducir arrugas y brindar claridad en la piel alrededor de los 	ojos. Cuidado calmante e hidratante. \n Contenido: 30ml",
      price: 18,
      images: [
	"/images/productos/cosmeticos/tocoboContornoOjos.jpg",
        "/images/productos/cosmeticos/tocoboContornoOjos2.jpg"
      ],
      category: "cosmetic"
    },
	 {
      name: "LA ROCHE POSAY HYALU B5 SERUM",
      description: "Serum antiarrugas que hidrata, repara y rellena la piel al mismo tiempo 	que suaviza arrugas y líneas de expresión. Fórmula única a base de ácido 	hialurónico y Vitamina B5 que repara tu dermis desde el interior. \n Contenido: 	204g",
      price: 38,
      images: [
	"/images/productos/cosmeticos/rocheHialuronico.jpg",
        "/images/productos/cosmeticos/neutrogenaSolar2.jpg"
      ],
      category: "cosmetic"
    },


	{
      name: "LA ROCHE POSAY MELA B3 SERUM",
      	description: "Ideal para piel con manchas o hiperpigmentaciones. Ayuda a unificar 	el tono de la piel aportando luminosidad por su contenido de Niacinamida. \n 	Contenido: 30ml",
      price: 40,
      images: [
	"/images/productos/cosmeticos/rocheMelaB3.jpg",
        "/images/productos/cosmeticos/rocheMelaB3_2.jpg"
      ],
      category: "cosmetic"
    }, 
	{
      name: "LA ROCHE POSAY VITAMIN C SERUM",
      	description: "Serum renovador anti-arrugas y antioxidante para pieles sensibles. 	Ayuda a controlar poros visibles en la piel. \n Contenido: 30ml",
      price: 40,
      images: [
	"/images/productos/cosmeticos/rocheVitaminaC.jpg"
      ],
      category: "cosmetic"
    }, 
	{
      name: "LA ROCHE POSAY NIACINAMIDE SERUM",
      	description: "Ideal para piel normal a grasa, ayuda a limpiar los poros, control de 	grasa en la piel. Además, ayuda a correguir manchas e hidrata la piel sin dejar 	sensación grasa/rápida absorción. \n Contenido: 30ml",
      price: 40,
      images: [
	"/images/productos/cosmeticos/rocheNiacinamida.jpg",
        "/images/productos/cosmeticos/rocheNiacinamida2.jpg"
      ],
      category: "cosmetic"
    }, 
	{
      name: "EUCERIN PROTECTOR SOLAR FPS 50+ OIL CONTROL",
      	description: "Protector solar con FPS 50+ para piel mixta a grasa, anti-brillo, 	toque seco. \n Contenido: 50ml",
      price: 26.50,
      images: [
	"/images/productos/cosmeticos/eucerinSolarToqueSeco.jpg"
      ],
      category: "cosmetic"
    }, 
	{
      name: "EUCERIN PROTECTOR SOLAR FPS 50+ PIGMENT CONTROL",
      	description: "Protector solar con FPS 50+ para piel con manchas. Textura ligera. 	\n Contenido: 50ml",
      price: 26.50,
      images: [
	"/images/productos/cosmeticos/EucerinSolarAntimanchas.jpg"
      ],
      category: "cosmetic"
    },
	{
      name: "EUCERIN PROTECTOR SOLAR FPS 50+ ANTIEDAD",
      	description: "Advanced Spectral Technology: protección UVA/UVB y defensa contra la 	luz HEVIS. Para todo tipo de piel. Disminuye visiblemente las arrugas y mejora la 	apariencia de la piel. Humecta de manera intensiva. \n Contenido: 50ml",
      price: 26.50,
      images: [
	"/images/productos/cosmeticos/EucerinSolarAntiedad.jpg"
      ],
      category: "cosmetic"
    },
	 {
      name: "MADAGASCAR CENTELLA AMPOULE SKIN1004 ",
      description: "La ampolla exclusiva de SKIN1004 ofrece propiedades hidratantes, 	antiinflamatorias, fortalecedoras de barrera, calmantes y antioxidantes. La 	centella asiática de Madagascar contiene 7 veces más activos calmantes que otras 	centella asiáticas. Calma e hidrata inmediatamente la piel sensible. \n Contenido: 100ml",
      price: 35,
      images: [
        "/images/productos/cosmeticos/skin1004Centella.jpg",
	"/images/productos/cosmeticos/skin1004Centella2.jpg",
	
      ],
      category: "cosmetic"
    },
	

    {
      name: "SKIN1004 MADAGASCAR CENTELLA POREMIZING FRESH AMPOULE",
      description: "Esta línea de Madagascar Centella esta formluada con sal rosa del 	Himalaya que remueve las impurezas de los poros y reduce la apariencia de los 	mismos. Además, controla la producción de sebo en la piel. También exfolia 	gentilmente, calma y promueve la firmeza  de los poros dilatados. \n Contenido: 100ml",
      price: 35,
      images: [
        "/images/productos/cosmeticos/skin1004CentellaAmpoule.jpg",
	"/images/productos/cosmeticos/skin1004CentellaAmpoule2.jpg"
	
      ],
      category: "cosmetic"
    }, 
	{
      name: "skin1004 PROBIO-CICA BAKUCHIOL EYE CREAM",
      description: "Una crema suave para el contorno de ojos con centella fermentada y 	bakuchiol (retinol vegano) que estimula la producción de colágeno y reduce la 	apariencia de líneas de expresión y arrugas. \n Contenido: 20ml",
      price: 20,
      images: [
        "/images/productos/cosmeticos/skin1004Contorno.jpg",
	"/images/productos/cosmeticos/skin1004Contorno2.jpg",
	
      ],
      category: "cosmetic"
    }
  ];

  const filteredProducts = activeCategory === 'all' 
    ? products 
    : products.filter(product => product.category === activeCategory);

  return (
<>
    <section id="products" className="py-24 bg-gray-50">
      <div className="container-custom">
        <div className="text-center mb-16">
          <h2 className="section-title">Nuestros Productos</h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Descubre nuestra selección de equipos profesionales y productos cosméticos de alta calidad.
          </p>
        </div>

        <div className="flex justify-center mb-12">
          <div className="inline-flex rounded-md shadow-sm" role="group">
            <button
              onClick={() => setActiveCategory('all')}
              className={`px-4 py-2 text-sm font-medium rounded-l-lg ${
                activeCategory === 'all'
                  ? 'bg-[#deb887] text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              } border border-gray-200`}
            >
              Todos
            </button>
            <button
              onClick={() => setActiveCategory('equipment')}
              className={`px-4 py-2 text-sm font-medium ${
                activeCategory === 'equipment'
                  ? 'bg-[#deb887] text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              } border-t border-b border-gray-200`}
            >
              Aparatología
            </button>
            <button
              onClick={() => setActiveCategory('cosmetic')}
              className={`px-4 py-2 text-sm font-medium rounded-r-lg ${
                activeCategory === 'cosmetic'
                  ? 'bg-[#deb887] text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              } border border-gray-200`}
            >
              Cosméticos
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredProducts.map((product, index) => (
            <ProductCard
              key={index}
              name={product.name}
              description={product.description}
              price={product.price}
              images={product.images}
              category={product.category}
            />
          ))}
        </div>

        <div className="mt-16 text-center">
          <p className="text-gray-600 mb-8">
            ¿Interesado en nuestros productos? Contáctanos para más información sobre disponibilidad y opciones de financiamiento.
          </p>
          <a
            href="https://wa.me/593969890689"
            target="_blank"
            rel="noopener noreferrer"
            className="btn-primary"
          >
            Consultar por WhatsApp
          </a>
        </div>
      </div>
    </section>
 <Footer />
    </>

  );
};

export default Products;
