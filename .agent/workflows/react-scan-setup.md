---
description: react-scan-setup
---

// turbo-all

# Protocolo Estándar de Performance: React Scan

Este workflow instalará y preparará `react-scan` en un proyecto React para detectar renders en cascada y problemas de rendimiento (Drop-in Linter de Renders). Está completamente automatizado.

## 📌 Reglas de Cumplimiento (PRIME DIRECTIVE v2.0)

1. **Uso Exclusivo DEV (Sin Wrappers HelL):** React-scan debe usarse exclusivamente para escudriñar ineficiencias críticas antes de fusionar. No fuerces a la aplicación a pasar por procesos intrusivos de "Profiler" a menos que existan problemas cuantificados (Muerte al YAGNI).
2. **Atomicidad Funcional (Solo Optimiza Cuellos de Botella):** Un render en React es barato. Sólo introduce memoización (\`useMemo\`/\`useCallback\`) cuando **veas el componente arder en rojo** a través de React Scan, jamás de forma preventiva perdiendo tiempo.
3. **Muta sólo localmente:** Soluciona las caídas de performance mutando propiedades costosas en scopes locales antes de recurrir a propagaciones globales de estado.

## 🚀 Instalación Automatizada

Se lanzará en modo \`-y\` (Silencioso para Aceptar todo) y delegará en su script de inicialización oficial.

\`\`\`bash
npx -y react-scan@latest init ./
\`\`\`

> NOTA: El instalador añadirá la configuración en el bundler (ej: \`vite.config.ts\` o \`next.config.ts\`). Verifica posteriormente que *solo* actúe en el entorno de desarrollo usando flags de \`process.env.NODE_ENV !== "production"\`.
