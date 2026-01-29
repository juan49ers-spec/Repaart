import React, { useEffect } from 'react';

interface SEOProps {
  title?: string;
  description?: string;
  keywords?: string;
  image?: string;
  url?: string;
  type?: 'website' | 'article';
  author?: string;
  publishedTime?: string;
  modifiedTime?: string;
  section?: string;
  tags?: string[];
  noindex?: boolean;
  nofollow?: boolean;
  canonical?: string;
  locale?: string;
  siteName?: string;
  twitterCard?: 'summary' | 'summary_large_image' | 'app' | 'player';
}

const defaultSEO = {
  title: 'Repaart - Plataforma de Gestión de Franquicias',
  description: 'Gestión completa de franquicias, finanzas, programación y academía para riders. Optimiza tu negocio con Repaart.',
  image: '/og-image.png',
  url: 'https://repaartfinanzas.web.app',
  type: 'website' as const,
  siteName: 'Repaart',
  locale: 'es_ES',
  twitterCard: 'summary_large_image' as const,
  keywords: 'repaart, gestión de franquicias, finanzas, programación, academía, riders, delivery',
};

export function SEO({
  title,
  description,
  keywords,
  image,
  url,
  type,
  author,
  publishedTime,
  modifiedTime,
  section,
  tags,
  noindex,
  nofollow,
  canonical,
  locale,
  siteName,
  twitterCard,
}: SEOProps) {
  const fullTitle = title ? `${title} | Repaart` : defaultSEO.title;
  const fullDescription = description || defaultSEO.description;
  const fullImage = image || defaultSEO.image;
  const fullUrl = url || defaultSEO.url;
  const fullLocale = locale || defaultSEO.locale;
  const fullSiteName = siteName || defaultSEO.siteName;
  const fullTwitterCard = twitterCard || defaultSEO.twitterCard;
  const fullType = type || defaultSEO.type;
  const fullKeywords = keywords || defaultSEO.keywords;

  useEffect(() => {
    // Update document title
    document.title = fullTitle;

    // Set meta tags
    setMetaTag('description', fullDescription);
    setMetaTag('keywords', fullKeywords);
    
    // Open Graph
    setMetaProperty('og:type', fullType);
    setMetaProperty('og:title', fullTitle);
    setMetaProperty('og:description', fullDescription);
    setMetaProperty('og:image', fullImage);
    setMetaProperty('og:url', fullUrl);
    setMetaProperty('og:locale', fullLocale);
    setMetaProperty('og:site_name', fullSiteName);
    
    // Article meta
    if (publishedTime) {
      setMetaProperty('article:published_time', publishedTime);
    }
    if (modifiedTime) {
      setMetaProperty('article:modified_time', modifiedTime);
    }
    if (author) {
      setMetaProperty('article:author', author);
    }
    if (section) {
      setMetaProperty('article:section', section);
    }
    tags?.forEach((tag) => {
      setMetaProperty('article:tag', tag);
    });
    
    // Twitter
    setMetaTag('twitter:card', fullTwitterCard);
    setMetaTag('twitter:title', fullTitle);
    setMetaTag('twitter:description', fullDescription);
    setMetaTag('twitter:image', fullImage);
    
    // Robots
    if (noindex && nofollow) {
      setMetaTag('robots', 'noindex, nofollow');
    } else if (noindex) {
      setMetaTag('robots', 'noindex');
    } else if (nofollow) {
      setMetaTag('robots', 'nofollow');
    } else {
      removeMetaTag('robots');
    }
    
    // Canonical
    if (canonical) {
      setCanonicalLink(canonical);
    }

  }, [fullTitle, fullDescription, fullKeywords, fullImage, fullUrl, fullLocale, 
      fullSiteName, fullTwitterCard, fullType, publishedTime, modifiedTime, 
      author, section, tags, noindex, nofollow, canonical]);

  return null; // This component doesn't render anything
}

// Helper functions for managing meta tags
function setMetaTag(name: string, content: string) {
  let meta = document.querySelector(`meta[name="${name}"]`);
  if (!meta) {
    meta = document.createElement('meta');
    meta.setAttribute('name', name);
    document.head.appendChild(meta);
  }
  meta.setAttribute('content', content);
}

function setMetaProperty(property: string, content: string) {
  let meta = document.querySelector(`meta[property="${property}"]`);
  if (!meta) {
    meta = document.createElement('meta');
    meta.setAttribute('property', property);
    document.head.appendChild(meta);
  }
  meta.setAttribute('content', content);
}

function removeMetaTag(name: string) {
  const meta = document.querySelector(`meta[name="${name}"]`);
  if (meta) {
    meta.remove();
  }
}

function setCanonicalLink(href: string) {
  let link = document.querySelector('link[rel="canonical"]');
  if (!link) {
    link = document.createElement('link');
    link.setAttribute('rel', 'canonical');
    document.head.appendChild(link);
  }
  link.setAttribute('href', href);
}

// Generate structured data for specific pages
export const generateStructuredData = (type: 'WebSite' | 'Organization' | 'Article') => {
  const data: Record<string, any> = {
    '@context': 'https://schema.org',
    '@type': type,
  };

  switch (type) {
    case 'WebSite':
      return {
        ...data,
        name: 'Repaart',
        url: 'https://repaartfinanzas.web.app',
        description: defaultSEO.description,
        potentialAction: {
          '@type': 'SearchAction',
          target: 'https://repaartfinanzas.web.app/search?q={search_term_string}',
          'query-input': 'required name=search_term_string',
        },
      };

    case 'Organization':
      return {
        ...data,
        name: 'Repaart',
        url: 'https://repaartfinanzas.web.app',
        logo: 'https://repaartfinanzas.web.app/logo.png',
        description: defaultSEO.description,
        contactPoint: {
          '@type': 'ContactPoint',
          telephone: '+1-XXX-XXX-XXXX',
          contactType: 'customer service',
        },
      };

    case 'Article':
      return data;

    default:
      return data;
  }
};

// Component for structured data
export function StructuredData({ data }: { data: any }) {
  useEffect(() => {
    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.text = JSON.stringify(data);
    document.head.appendChild(script);

    return () => {
      script.remove();
    };
  }, [data]);

  return null;
}

// SEO presets for common pages
export const SEOPresets = {
  home: {
    title: 'Inicio',
    description: defaultSEO.description,
  },
  dashboard: {
    title: 'Dashboard',
    description: 'Panel de control principal de Repaart',
  },
  academy: {
    title: 'Academia',
    description: 'Plataforma de aprendizaje para riders y franquicias',
  },
  admin: {
    title: 'Admin',
    description: 'Panel de administración de Repaart',
    noindex: true,
  },
  login: {
    title: 'Login',
    description: 'Inicia sesión en tu cuenta de Repaart',
    noindex: true,
  },
  signup: {
    title: 'Registro',
    description: 'Regístrate en Repaart y empieza a gestionar tu franquicia',
    noindex: true,
  },
};
