# Beads (bd) - Referencia Rápida

Issue tracker distribuido para agentes de IA, potenciado por Dolt.

## ¿Cuándo usarlo?

- ✅ Proyectos complejos con múltiples dependencias
- ✅ Varios agentes trabajando en paralelo
- ✅ Proyectos >10K líneas donde el contexto se pierde entre sesiones
- ❌ Proyectos pequeños/medianos con workflow funcional ya establecido

## Instalación

Ya instalado en: `C:/Users/Usuario/.local/bin/bd.exe`

```bash
# Verificar instalación
bd version
```

## Inicialización en un proyecto

```bash
cd tu-proyecto
bd init
# O modo stealth (no commitea al repo):
bd init --stealth
```

## Comandos esenciales

```bash
# Ver tareas disponibles (sin bloqueos)
bd ready --json

# Crear tarea
bd create "Título" -t bug|feature|task -p 0-4 --json

# Reclamar tarea (atómico)
bd update <id> --claim

# Actualizar tarea
bd update <id> --description "Nueva descripción"
bd update <id> --priority 1

# Completar tarea
bd close <id> --reason "Completado"

# Agregar dependencias
bd dep add <hijo> <padre>
```

## Issue types

- `bug` - Algo roto
- `feature` - Nueva funcionalidad
- `task` - Tarea de trabajo (tests, docs, refactoring)
- `epic` - Feature grande con subtareas
- `chore` - Mantenimiento (dependencias, tooling)

## Prioridades

- `0` - Crítica (seguridad, pérdida de datos, builds rotos)
- `1` - Alta (features mayores, bugs importantes)
- `2` - Media (default, nice-to-have)
- `3` - Baja (pulimento, optimización)
- `4` - Backlog (ideas futuras)

## Workflow típico para agentes

1. `bd ready` - Ver qué está disponible
2. `bd update <id> --claim` - Reclamar tarea atómicamente
3. Trabajar en la tarea
4. `bd close <id> --reason "Hecho"` - Completar

## Importante

- Siempre usar `--json` para uso programático
- Usar stdin para descripciones con caracteres especiales:
  ```bash
  echo 'Descripción con `backticks`' | bd create "Título" --description=-
  ```
- Usar `discovered-from` para trabajo hallado durante otra tarea:
  ```bash
  bd create "Bug encontrado" --deps discovered-from:bd-123
  ```

## Documentación

- [GitHub](https://github.com/steveyegge/beads)
- [Quickstart](https://github.com/steveyegge/beads/blob/main/docs/QUICKSTART.md)
