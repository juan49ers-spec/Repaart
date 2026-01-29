import { useEffect } from 'react';
import { getAnalytics, logEvent, Analytics, EventParams } from 'firebase/analytics';
import { initializeApp } from 'firebase/app';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

let analytics: Analytics | null = null;

export function useAnalytics() {
  useEffect(() => {
    if (typeof window === 'undefined' || analytics) return;

    try {
      const app = initializeApp(firebaseConfig);
      analytics = getAnalytics(app);
      console.log('Firebase Analytics initialized');
    } catch (error) {
      console.error('Failed to initialize Firebase Analytics:', error);
    }
  }, []);

  return analytics;
}

// Track page views
export const trackPageView = (pageName: string, params?: EventParams) => {
  if (!analytics) return;
  logEvent(analytics, 'page_view', {
    page_title: pageName,
    page_location: window.location.pathname,
    ...params,
  });
};

// Track user engagement
export const trackEvent = (eventName: string, params?: EventParams) => {
  if (!analytics) return;
  logEvent(analytics, eventName, params);
};

// Academy analytics
export const trackAcademyEvent = {
  moduleView: (moduleId: string, moduleTitle: string) => {
    trackEvent('academy_module_view', {
      module_id: moduleId,
      module_title: moduleTitle,
    });
  },
  lessonStart: (lessonId: string, lessonTitle: string) => {
    trackEvent('academy_lesson_start', {
      lesson_id: lessonId,
      lesson_title: lessonTitle,
    });
  },
  lessonComplete: (lessonId: string, lessonTitle: string, duration: number) => {
    trackEvent('academy_lesson_complete', {
      lesson_id: lessonId,
      lesson_title: lessonTitle,
      duration_seconds: duration,
    });
  },
  moduleComplete: (moduleId: string, moduleTitle: string) => {
    trackEvent('academy_module_complete', {
      module_id: moduleId,
      module_title: moduleTitle,
    });
  },
};

// Admin analytics
export const trackAdminEvent = {
  userCreate: (role: string) => {
    trackEvent('admin_user_create', {
      user_role: role,
    });
  },
  userDelete: (role: string) => {
    trackEvent('admin_user_delete', {
      user_role: role,
    });
  },
  moduleCreate: () => {
    trackEvent('admin_module_create');
  },
  moduleUpdate: () => {
    trackEvent('admin_module_update');
  },
  moduleDelete: () => {
    trackEvent('admin_module_delete');
  },
  lessonCreate: () => {
    trackEvent('admin_lesson_create');
  },
  lessonUpdate: () => {
    trackEvent('admin_lesson_update');
  },
  lessonDelete: () => {
    trackEvent('admin_lesson_delete');
  },
};

// Dashboard analytics
export const trackDashboardEvent = {
  financialView: (franchiseId: string) => {
    trackEvent('dashboard_financial_view', {
      franchise_id: franchiseId,
    });
  },
  scheduleView: (franchiseId: string) => {
    trackEvent('dashboard_schedule_view', {
      franchise_id: franchiseId,
    });
  },
  exportData: (type: string) => {
    trackEvent('dashboard_export', {
      export_type: type,
    });
  },
};

// User analytics
export const trackUserEvent = {
  login: (method: string) => {
    trackEvent('login', {
      method,
    });
  },
  logout: () => {
    trackEvent('logout');
  },
  signUp: (method: string) => {
    trackEvent('sign_up', {
      method,
    });
  },
  profileUpdate: () => {
    trackEvent('profile_update');
  },
  search: (query: string, category: string) => {
    trackEvent('search', {
      search_term: query,
      search_category: category,
    });
  },
};

// Performance analytics
export const trackPerformance = {
  pageLoad: (pageName: string, duration: number) => {
    trackEvent('page_load', {
      page_name: pageName,
      duration_ms: duration,
    });
  },
  apiCall: (endpoint: string, duration: number, success: boolean) => {
    trackEvent('api_call', {
      api_endpoint: endpoint,
      duration_ms: duration,
      success,
    });
  },
};

// Error analytics
export const trackError = (error: Error, context?: string) => {
  trackEvent('error', {
    error_message: error.message,
    error_stack: error.stack,
    error_context: context,
  });
};

// Hook for page view tracking
export const usePageViewTracking = () => {
  const analytics = useAnalytics();

  useEffect(() => {
    if (!analytics) return;

    const handleRouteChange = () => {
      trackPageView(window.location.pathname);
    };

    // Initial page view
    trackPageView(window.location.pathname);

    // Listen for route changes
    window.addEventListener('popstate', handleRouteChange);

    return () => {
      window.removeEventListener('popstate', handleRouteChange);
    };
  }, [analytics]);
};

// Hook for event tracking
export const useEventTracking = () => {
  return {
    trackEvent,
    trackAcademyEvent,
    trackAdminEvent,
    trackDashboardEvent,
    trackUserEvent,
    trackPerformance,
    trackError,
  };
};
