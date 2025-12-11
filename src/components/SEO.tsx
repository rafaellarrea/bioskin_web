import React from 'react';
import { Helmet } from 'react-helmet-async';

interface SEOProps {
  title: string;
  description: string;
  keywords?: string;
  image?: string;
  url?: string;
  type?: string;
  schema?: object;
}

export const SEO: React.FC<SEOProps> = ({ 
  title, 
  description, 
  keywords, 
  image = '/images/logo-bioskin.png', 
  url = 'https://bioskin.ec', 
  type = 'website',
  schema
}) => {
  const siteTitle = 'BIOSKIN - Clínica Estética en Cuenca';
  const fullTitle = title === siteTitle ? title : `${title} | BIOSKIN Cuenca`;

  return (
    <Helmet>
      {/* Standard metadata tags */}
      <title>{fullTitle}</title>
      <meta name='description' content={description} />
      {keywords && <meta name='keywords' content={keywords} />}
      
      {/* Open Graph tags */}
      <meta property='og:type' content={type} />
      <meta property='og:title' content={fullTitle} />
      <meta property='og:description' content={description} />
      <meta property='og:image' content={image} />
      <meta property='og:url' content={url} />
      
      {/* Twitter tags */}
      <meta name='twitter:card' content='summary_large_image' />
      <meta name='twitter:title' content={fullTitle} />
      <meta name='twitter:description' content={description} />
      <meta name='twitter:image' content={image} />
      
      {/* Geo tags for Local SEO (Cuenca, Ecuador) */}
      <meta name="geo.region" content="EC-A" />
      <meta name="geo.placename" content="Cuenca" />
      <meta name="geo.position" content="-2.900128;-79.005896" />
      <meta name="ICBM" content="-2.900128, -79.005896" />

      {/* Structured Data (JSON-LD) */}
      {schema && (
        <script type="application/ld+json">
          {JSON.stringify(schema)}
        </script>
      )}
    </Helmet>
  );
};
