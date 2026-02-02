import React from 'react';

/**
 * VisuallyHidden - Oculta visualmente pero mantiene accesible para screen readers
 * 
 * Usage:
 * ```tsx
 * <button>
 *   <Icon />
 *   <VisuallyHidden>Cerrar menú</VisuallyHidden>
 * </button>
 * ```
 */
interface VisuallyHiddenProps {
  children: React.ReactNode;
}

export const VisuallyHidden: React.FC<VisuallyHiddenProps> = ({ children }) => {
  return (
    <span
      style={{
        position: 'absolute',
        width: '1px',
        height: '1px',
        padding: '0',
        margin: '-1px',
        overflow: 'hidden',
        clip: 'rect(0, 0, 0, 0)',
        whiteSpace: 'nowrap',
        border: '0'
      }}
    >
      {children}
    </span>
  );
};

export default VisuallyHidden;
