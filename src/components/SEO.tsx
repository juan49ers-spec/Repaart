import { useEffect } from 'react';

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

import { defaultSEO } from '../utils/seoUtils';

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

// Generate structured data moved to seoUtils.ts

// Component for structured data
export function StructuredData({ data }: { data: Record<string, unknown> }) {
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

// SEOPresets moved to seoUtils.ts
