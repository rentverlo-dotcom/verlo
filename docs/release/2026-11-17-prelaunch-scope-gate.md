# VERLO — Corte de release, 17/11/2026 (solo lectura)

**Estado: análisis, NO autorización de merge ni despliegue productivo.**

## Fuente de verdad y ramas

- `main`: producción actual, no tocar hasta certificación final.
- `qa/verlo-e2e`: QA comercial, **402 commits por delante de `main` y 0 por detrás** al realizar esta comparación; 147 archivos reportados como modificados o agregados.
- `release/qa-safe-integration-2026-11-16`: propuesta técnica selectiva con actualización Next15/React19, cerraduras API legacy y pruebas automatizadas; [PR #29](https://github.com/rentverlo-dotcom/verlo/pull/29) permanece **draft/no merge**.
- [PR #28](https://github.com/rentverlo-dotcom/verlo/pull/28): cerrado sin merge por historial divergente.

## Bloqueo real del merge masivo

El diff entre `main` y QA incluye **23 endpoints de prueba `app/api/qa/*`**, además de workflows manuales de QA:

```
app/api/qa/contracts/{lifecycle,preflight}
app/api/qa/identik/{archive-completed,connectivity,create-signing,readiness,reconcile-completed,reconcile-pending,schema-preflight,signed-artifact,signing-url-check,webhook-probe}
app/api/qa/mi-verlo/{isolation,preflight}
app/api/qa/notifications/preflight
app/api/qa/powermarket/{access,invite,submission}
app/api/qa/temporarios/lifecycle
app/api/qa/tradicionales/{media,notify,preflight,result}
.github/workflows/identik-manual-signing-qa.yml
.github/workflows/verlo-qa-isolation.yml
```

**Regla de release:** no copiar estas herramientas a producción por defecto. Revisar dependencias y excepciones explícitas antes de crear el paquete productivo. El hecho de que las rutas `/api/qa/*` tengan guardas de entorno no las convierte automáticamente en parte del release.

## Evidencia comprobada

- GitHub Actions [#43994592714](https://github.com/rentverlo-dotcom/verlo/actions/runs/43994592714): **SUCCESS**, build y 10 tests de seguridad focalizados, sin proveedores.
- Vercel Preview READY comprobado para `3cbe0bc`, `3ff6fe3`, `9db5bfa`. **No se había localizado un Preview para `b1b4343` en la lista inspeccionada**; no inferir que está listo.
- Test de dos usuarios de `/guardadas` ejecuta handler real con Supabase Auth y consultas simuladas. **No equivalen a dos sesiones reales contra Supabase QA**.

## Condiciones para pasar a `main`

1. Resolver PR #29 sobre QA sin arrastrar los workflows de diagnóstico temporal a producción; revisar diffs y estado Vercel del commit final.
2. Crear un corte de release explícito con solo rutas y funcionalidades comerciales, omitiendo `app/api/qa/*` y workflows QA, con evidencia de build y pruebas acotadas.
3. Revisión de base productiva mediante SQL **solo lectura**; mostrar cualquier migración necesaria al propietario para que la aplique él mismo; nunca copiar la base QA sobre producción.
4. Certificación externa según checklist congelado: Namirial, Identik (firma/finalización), ZeptoMail (entrega real), PowerMarket (decisiones/operación) y pagos; no declarar todo aprobado por tests simulados.
5. Revisión explícita de destino y última aprobación antes de integrar `main` o desplegar en producción.

No ejecutar tareas de proveedores pagas ni ampliar alcance. Esta nota registra un corte prudente del MVP, no crea nuevas funcionalidades.
