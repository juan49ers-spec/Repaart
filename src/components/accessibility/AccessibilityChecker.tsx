import { useEffect, useRef } from 'react';
import { AxeResults } from 'axe-core';

interface AccessibilityCheckerProps {
  children: React.ReactNode;
  enabled?: boolean;
  onResults?: (results: AxeResults) => void;
}

export function AccessibilityChecker({ 
  children, 
  enabled = import.meta.env.DEV,
  onResults 
}: AccessibilityCheckerProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!enabled || !ref.current) return;

    // Dynamic import of axe-core
    import('axe-core').then((axe) => {
      axe.default.run(ref.current!, {
        runOnly: {
          type: 'tag',
          values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']
        }
      }, (error, results) => {
        if (error) {
          console.error('Accessibility check failed:', error);
          return;
        }

        if (results.violations.length > 0) {
          console.group('🎯 Accessibility Violations');
          results.violations.forEach((violation, index) => {
            console.warn(`${index + 1}. ${violation.id}: ${violation.description}`);
            console.warn(`   Impact: ${violation.impact}`);
            console.warn(`   Help: ${violation.helpUrl}`);
            console.warn(`   Elements: ${violation.nodes.length}`);
            
            violation.nodes.forEach((node) => {
              console.warn(`   - ${node.html}`);
            });
          });
          console.groupEnd();

          // Send to Sentry if available
          if (typeof window !== 'undefined' && (window as any).Sentry) {
            (window as any).Sentry.captureException(
              new Error('Accessibility violations detected'),
              {
                extra: {
                  violations: results.violations.map(v => ({
                    id: v.id,
                    impact: v.impact,
                    description: v.description,
                    nodes: v.nodes.length,
                  })),
                  passes: results.passes.length,
                  incomplete: results.incomplete.length,
                },
              }
            );
          }
        } else {
          console.log('✅ No accessibility violations detected');
        }

        // Callback with results
        if (onResults) {
          onResults(results);
        }
      });
    });
  }, [enabled, onResults]);

  return <div ref={ref}>{children}</div>;
}

// HOC for wrapping components with accessibility checking
export function withAccessibility<P extends object>(
  Component: React.ComponentType<P>,
  enabled = import.meta.env.DEV
) {
  return function AccessibilityWrapped(props: P) {
    return (
      <AccessibilityChecker enabled={enabled}>
        <Component {...props} />
      </AccessibilityChecker>
    );
  };
}

// Utility to create accessible elements
export const createAccessibleElement = (
  element: 'button' | 'input' | 'a' | 'img',
  props: Record<string, any>
) => {
  const accessibleProps = { ...props };

  switch (element) {
    case 'button':
      if (!accessibleProps['aria-label'] && !accessibleProps.children) {
        accessibleProps['aria-label'] = 'Button';
      }
      break;
    case 'input':
      if (accessibleProps.type !== 'hidden' && !accessibleProps.id) {
        console.warn('Input should have an id for label association');
      }
      break;
    case 'a':
      if (!accessibleProps['aria-label'] && !accessibleProps.children) {
        console.warn('Link should have accessible text or aria-label');
      }
      break;
    case 'img':
      if (!accessibleProps.alt && accessibleProps.alt !== '') {
        accessibleProps.alt = '';
        console.warn('Image should have alt text');
      }
      break;
  }

  return accessibleProps;
};

// Focus trap utility for modals
export const useFocusTrap = (enabled: boolean, containerRef: React.RefObject<HTMLElement>) => {
  useEffect(() => {
    if (!enabled || !containerRef.current) return;

    const container = containerRef.current;
    const focusableElements = container.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const firstElement = focusableElements[0] as HTMLElement;
    const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

    const handleTabKey = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;

      if (e.shiftKey) {
        // Shift + Tab
        if (document.activeElement === firstElement) {
          lastElement.focus();
          e.preventDefault();
        }
      } else {
        // Tab
        if (document.activeElement === lastElement) {
          firstElement.focus();
          e.preventDefault();
        }
      }
    };

    container.addEventListener('keydown', handleTabKey);
    firstElement.focus();

    return () => {
      container.removeEventListener('keydown', handleTabKey);
    };
  }, [enabled, containerRef]);
};

// Skip link component for keyboard navigation
export const SkipLink = ({ 
  targetId = 'main-content', 
  children = 'Skip to main content' 
}: { 
  targetId?: string; 
  children?: React.ReactNode; 
}) => (
  <a
    href={`#${targetId}`}
    className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-blue-600 focus:text-white focus:rounded focus:shadow-lg focus:outline-none"
  >
    {children}
  </a>
);
