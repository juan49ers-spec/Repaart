# Plan ETAPA: Profundización en Container Queries

## E - Especificación

### Objetivo
Implementar características avanzadas de Container Queries en Repaart:
1. Breakpoints específicos optimizados
2. Migrar componentes adicionales (Cards, Modals, Tables)
3. Fluid Typography con clamp()
4. Safe Area para iPhone X+

### Breakpoints a Implementar

| Breakpoint | Tamaño | Descripción |
|------------|--------|-------------|
| `@xs` | 300px | Móvil pequeño (iPhone SE) |
| `@sm` | 480px | Móvil grande |
| `@md` | 768px | Tablet vertical |
| `@lg` | 1024px | Tablet horizontal / Desktop pequeño |
| `@xl` | 1280px | Desktop estándar |
| `@2xl` | 1536px | Desktop grande |

### Componentes a Migrar

#### Prioridad Alta
- [ ] Card components (src/components/ui/primitives/Card.tsx)
- [ ] Modal components (src/components/ui/modals/*.tsx)
- [ ] Table components (src/components/ui/tables/*.tsx)

#### Prioridad Media
- [ ] Form inputs
- [ ] Navigation components
- [ ] Dashboard widgets

### Fluid Typography

Implementar escala tipográfica fluida:
```css
--font-size-fluid-xs: clamp(0.75rem, 1.5vw + 0.5rem, 0.875rem);
--font-size-fluid-sm: clamp(0.875rem, 2vw + 0.5rem, 1rem);
--font-size-fluid-base: clamp(1rem, 2.5vw + 0.5rem, 1.125rem);
--font-size-fluid-lg: clamp(1.125rem, 3vw + 0.5rem, 1.5rem);
--font-size-fluid-xl: clamp(1.25rem, 4vw + 0.5rem, 2rem);
```

### Safe Area (iPhone X+)

Implementar soporte para notch y áreas seguras:
```css
padding-top: env(safe-area-inset-top);
padding-bottom: env(safe-area-inset-bottom);
padding-left: env(safe-area-inset-left);
padding-right: env(safe-area-inset-right);
```

## T - Tareas

### Fase 1: Configuración de Breakpoints
- [ ] 1.1 Definir container queries en design-tokens.css
- [ ] 1.2 Crear utilidades CSS para breakpoints
- [ ] 1.3 Documentar uso de cada breakpoint

### Fase 2: Componentes Cards
- [ ] 2.1 Crear tests para Card component
- [ ] 2.2 Implementar @container en Card
- [ ] 2.3 Agregar variantes responsive
- [ ] 2.4 Verificar en diferentes tamaños

### Fase 3: Componentes Modals
- [ ] 3.1 Crear tests para modales
- [ ] 3.2 Implementar @container en modales
- [ ] 3.3 Agregar safe-area-inset
- [ ] 3.4 Verificar en móvil

### Fase 4: Componentes Tables
- [ ] 4.1 Crear tests para tablas
- [ ] 4.2 Implementar scroll horizontal responsive
- [ ] 4.3 Agregar container queries para columnas
- [ ] 4.4 Verificar en móvil y tablet

### Fase 5: Fluid Typography
- [ ] 5.1 Definir escala tipográfica fluida
- [ ] 5.2 Implementar en design-tokens.css
- [ ] 5.3 Crear componente Text fluido
- [ ] 5.4 Migrar componentes existentes

### Fase 6: Safe Area
- [ ] 6.1 Configurar viewport meta tag
- [ ] 6.2 Implementar safe-area-inset en layouts
- [ ] 6.3 Verificar en iPhone simulado
- [ ] 6.4 Documentar uso

## A - Análisis

### Riesgos
1. **Cambios en muchos componentes** - Podría introducir regresiones
2. **Compatibilidad con navegadores antiguos** - Container queries requieren navegadores modernos
3. **Testing en dispositivos reales** - Necesario verificar en iPhone X+, iPad, etc.

### Mitigación
- Implementar gradualmente (un componente a la vez)
- Mantener tests exhaustivos
- Usar feature detection si es necesario
- Documentar cambios para el equipo

### Dependencias
- Tailwind CSS 4.1.18 (ya instalado)
- @tailwindcss/container-queries (ya instalado)
- Meta viewport configurado

## P - Plan de Ejecución

### Orden de Implementación
1. **Breakpoints** - Base para todo lo demás
2. **Cards** - Componentes más simples, buen punto de partida
3. **Modals** - Incluye safe-area
4. **Tables** - Más complejos, necesitan scroll
5. **Fluid Typography** - Afecta a todos los componentes
6. **Safe Area** - Final, verificación en dispositivos

### Estrategia de Testing
- TDD estricto: tests primero, luego implementación
- Tests visuales: verificar en múltiples viewports
- Tests E2E: flujos críticos en móvil

## A - Aseguramiento

### Checklist de Verificación
- [ ] Todos los tests pasan
- [ ] TypeScript sin errores
- [ ] ESLint sin errores nuevos
- [ ] Build exitoso
- [ ] Visualmente correcto en:
  - [ ] iPhone SE (375px)
  - [ ] iPhone 14 Pro (393px)
  - [ ] iPad (768px)
  - [ ] Desktop (1920px)
- [ ] Safe area funciona en iPhone X+
- [ ] Fluid typography se adapta correctamente

### Criterios de Done
1. Todos los componentes principales usan container queries
2. La app funciona correctamente en todos los tamaños de pantalla
3. No hay regresiones visuales
4. Documentación actualizada

---

**Fecha de Creación:** 2026-02-02  
**Versión:** 2.0  
**Estado:** En Progreso
