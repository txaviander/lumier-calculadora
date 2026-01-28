# Nueva Tarea para Claude Code

> **IMPORTANTE**: Lee estos archivos ANTES de empezar cualquier tarea

## Lectura Obligatoria Previa

1. `.claude/project-context.md` - Contexto técnico del proyecto
2. `.claude/task-history.md` - Última sesión de trabajo
3. `.claude/decisions.md` - Decisiones técnicas importantes
4. `docs/known-issues.md` - Problemas conocidos (si existe)

## Información Crítica

### Dos Sistemas de Base de Datos
Este proyecto tiene DOS sistemas que NO están sincronizados:

| Sistema | Tablas | Usado por | Archivos |
|---------|--------|-----------|----------|
| ANTIGUO | `projects`, `project_versions` | Lista `/calculadora` | `lib/supabase.ts` |
| NUEVO | `projects_v2`, `calculator_snapshots` | Wizard, hooks | `lib/types.ts`, `hooks/useProjects.ts` |

> **NO intentes unificar estos sistemas sin un plan de migración completo.**

### Errores Conocidos a Evitar

1. **NO cambiar `app/calculadora/page.tsx` para usar `useProjects` o `projects_v2`**
   - Esto oculta proyectos existentes y rompe el delete
   - Ver decisión del 28/01/2026 en `decisions.md`

2. **NO usar objetos literales como defaults en hooks**
   ```typescript
   // MALO - causa re-renders infinitos
   function useHook({ filters = {} }) { ... }

   // BUENO
   const EMPTY = {}
   function useHook({ filters = EMPTY }) { ... }
   ```

3. **SIEMPRE validar inputs antes de cálculos**
   ```typescript
   // MALO
   const result = a / b

   // BUENO
   const result = b > 0 ? a / b : 0
   ```

## Checklist Pre-Tarea

- [ ] He leído `project-context.md`
- [ ] He revisado la última sesión en `task-history.md`
- [ ] He verificado si hay decisiones relevantes en `decisions.md`
- [ ] Entiendo qué sistema de datos afecta mi tarea (antiguo vs nuevo)
- [ ] He identificado qué archivos modificaré

## Checklist Post-Tarea

- [ ] He probado la funcionalidad completa (no solo el cambio específico)
- [ ] He verificado que no se rompió nada existente
- [ ] He hecho commits pequeños con mensajes descriptivos
- [ ] He actualizado `task-history.md` con lo que hice
- [ ] He documentado cualquier decisión importante en `decisions.md`

## Comandos Útiles

```bash
# Ver estado del repo
git status && git log --oneline -5

# Ejecutar en desarrollo
npm run dev

# Ejecutar tests
npm test

# Build de producción
npm run build

# Verificar tipos TypeScript
npx tsc --noEmit
```

## Estructura de Commits

Usar conventional commits:
```
feat: nueva funcionalidad
fix: corrección de bug
refactor: cambio de código sin cambiar comportamiento
docs: documentación
style: cambios de formato/estilo
test: añadir tests
chore: mantenimiento
```

Ejemplo:
```
feat(calculator): add new validation for purchase price
fix(wizard): resolve infinite spinner on step 3
refactor(hooks): extract common logic to useCalculatorBase
```

## Contacto

- **Owner del proyecto**: Javi (javier@lumier.es)
- **Contexto técnico**: Ver `project-context.md`

## Template de Mensaje para Nueva Tarea

```
## Tarea
[Descripción clara de lo que quiero lograr]

## Contexto adicional
[Información relevante que no está en los archivos de contexto]

## Restricciones
- [Limitaciones específicas]
- [Cosas que NO debo cambiar]

## Criterio de éxito
- [ ] [Qué debe funcionar cuando termine]
- [ ] [Tests que deben pasar]
```
