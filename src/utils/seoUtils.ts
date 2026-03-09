export const defaultSEO = {
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

export const generateStructuredData = (type: 'WebSite' | 'Organization' | 'Article') => {
    const data: Record<string, unknown> = {
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
