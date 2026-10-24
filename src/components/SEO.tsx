import React from 'react';
import { Helmet } from 'react-helmet-async';

export interface SEOProps {
  title?: string;
  description?: string;
  canonical?: string;
  image?: string;
  imageAlt?: string;
  type?: 'website' | 'game' | 'article';
  keywords?: string;
  jsonLd?: Record<string, any>;
}

export const DEFAULT_TITLE = 'Handball Manager Sim – Career & Strategy Game';
export const DEFAULT_DESC = 'Lead your handball club to glory. Manage transfers, master tactical systems, expand your arena, and compete in domestic leagues, national cups, and the EHF Champions League.';
export const DEFAULT_IMAGE = 'https://handballmanagersim.com/handballsim_official.png';
export const DEFAULT_CANONICAL = 'https://handballmanagersim.com/';
export const DEFAULT_KEYWORDS = 'handball manager, handball manager online, free handball manager, handball simulation, handball game, handball tactics, EHF Champions League game, european handball manager, sports management sim, handball career mode, browser sports game';

export const SEO: React.FC<SEOProps> = ({
  title = DEFAULT_TITLE,
  description = DEFAULT_DESC,
  canonical = DEFAULT_CANONICAL,
  image = DEFAULT_IMAGE,
  imageAlt = 'Handball Manager Sim Official Crest',
  type = 'website',
  keywords = DEFAULT_KEYWORDS,
  jsonLd,
}) => {
  return (
    <Helmet>
      {/* Title & Description */}
      <title>{title}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords} />
      <link rel="canonical" href={canonical} />

      {/* Multilingual alternates */}
      <link rel="alternate" hrefLang="x-default" href="https://handballmanagersim.com/" />
      <link rel="alternate" hrefLang="en" href="https://handballmanagersim.com/" />
      <link rel="alternate" hrefLang="de" href="https://handballmanagersim.com/?lang=de" />
      <link rel="alternate" hrefLang="es" href="https://handballmanagersim.com/?lang=es" />
      <link rel="alternate" hrefLang="fr" href="https://handballmanagersim.com/?lang=fr" />
      <link rel="alternate" hrefLang="da" href="https://handballmanagersim.com/?lang=da" />
      <link rel="alternate" hrefLang="pl" href="https://handballmanagersim.com/?lang=pl" />

      {/* OpenGraph / Facebook / Discord preview cards */}
      <meta property="og:type" content={type} />
      <meta property="og:site_name" content="Handball Manager Sim" />
      <meta property="og:url" content={canonical} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={image} />
      <meta property="og:image:alt" content={imageAlt} />
      <meta property="og:image:width" content="400" />
      <meta property="og:image:height" content="400" />

      {/* Twitter Cards */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:url" content={canonical} />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />
      <meta name="twitter:image:alt" content={imageAlt} />

      {/* Dynamic JSON-LD structured data when provided */}
      {jsonLd && (
        <script type="application/ld+json">
          {JSON.stringify(jsonLd)}
        </script>
      )}
    </Helmet>
  );
};
