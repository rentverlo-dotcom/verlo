# VERLO QA — cierre del MVP, alcance congelado
Fecha: 2026-11-06. Rama EXCLUSIVA: `qa/verlo-e2e`.
Base QA EXCLUSIVA: `anptswspguyotnasoacq`. PROHIBIDO cambiar `main`, Supabase producción (`bmgrpcqrdvwculrisasi`) o Vercel Production desde QA.


## Congelamiento definitivo de alcance — 13/11/2026
Decisión del propietario: **NO sumar nuevas funciones, paneles, integraciones o cambios cosméticos antes del lanzamiento**. El MVP ya está construido. Solo se permiten correcciones demostrablemente necesarias para completar el recorrido de usuario, seguridad, estabilidad, cobros, identidad y entrega. Este congelamiento prevalece sobre propuestas de ampliación posteriores; no autoriza abrir trabajo nuevo por conveniencia.

**Tanda final de cierre, exactamente en este orden:**
1. **Email + Push existentes:** inspeccionar y presentar las plantillas reales para tenant/owner; verificar texto, branding, enlace a Mi VERLO, registros de estado, y probar entrega controlada cuando el proveedor esté habilitado. La vista previa no envía ni modifica datos.
2. **Temporarios existentes:** recorrer visualmente como propietario e inquilino, y certificar el flujo comercial, tarifa ARS 49.999, estados y contrato. Corregir solo fallas reproducibles.
3. **Seguridad y empaquetado:** actualizar solo dependencias vulnerables, alinear Node y lockfile, validar migraciones compatibles con QA y producción, separar rutas de prueba de `main`, ejecutar regresión completa y desplegar gradualmente sin destruir datos reales.

**Dependencias externas bloqueantes solamente para certificación final:** Identik/Namirial (onboarding y validación biométrica); PowerMarket (cotización/aprobación/pago/emisión); Zoho ZeptoMail (API key y una entrega real supervisada); Mercado Pago Sandbox cuando aplique. No inventar endpoints ni activar envíos/cobros para simular que están completados.

**No repetir pruebas ya aprobadas salvo como parte de la regresión final o ante un fallo concreto.** No seguir creando commits de instrumentación o fixtures sin una evidencia de falla. Todo código y evidencia de prueba en `qa/verlo-e2e`, ninguna modificación de DB/branch productivo, y ningún merge general a `main`.

**Criterio de FIN:** propietario e inquilino pueden completar los recorridos definidos y visualizar sus avisos; firma y archivo protegidos y disponibles; proveedor de identidad/caución/pago integrado y certificado; métricas mínimas de conversión y ventas verificables en dashboard ya creado; Vercel y CI verdes en un SHA liberable; migraciones y rollback aprobados. Mejoras de PostHog/investor/SEO/copy quedan para pos-lanzamiento salvo defecto comercial o de seguridad bloqueante.

## Regla de cierre
**Verde del deploy no significa E2E aprobado.** Una etapa queda APROBADA solo con Playwright + verificaciones persistidas en Supabase QA, aserciones de permisos/errores, evidencia de ejecución correspondiente al SHA exacto y cero envíos al mundo real. No etiquetar “integración real aprobada” cuando la respuesta de proveedor es simulada.
Secuencia: (1) pruebas y fixes internos aislados, (2) pruebas externas reales cuando haya acceso, (3) selección/revisión de commits FUNCIONALES; no merge general de la rama QA, (4) deploy de `main` por separado, (5) smoke supervisado de producción.
Cada prueba crea datos sintéticos propios con identificador por ejecución y, cuando sea posible, limpia sus fixtures. NO llamar a emails/teléfonos reales ni a endpoints reales de cobros con usuarios ficticios. Prohibidos secrets en Git, artefactos o respuestas.

## Matriz cerrada de trabajo propio
Estado inicial: **PENDIENTE**, salvo afirmaciones expresamente verificadas abajo. CI verde solo certifica las aserciones existentes.

| Fase | Alcance de código + pruebas E2E necesarias | Criterio de aprobación |
|---|---|---|
| 0 — Seguridad e infraestructura | Confirmar SHA exacto, DB QA y host; ramas y secrets por entorno, Auth QA, RLS por rol, aislamiento, compatibilidad de migraciones, proveedores bloqueados por defecto | Sin escrituras en prod; identidades ficticias sin acceso cruzado |
| 1 — Tradicionales | UI real propietario e inquilino, ubicación, campos, subida R2 **en bucket de QA separado** o stub con contrato de API, persistencia atómica, matching compatible/no compatible, alta duplicada, datos históricos ignorados, estados y Mi VERLO | Navegador + lectura QA verifica cada transición y fotos; acceso no autorizado denegado |
| 2 — Notificaciones | Eventos tenant/owner, plantilla VerloBrand, link correcto, Email y Push outbox por canal, reintento/dedup, cron, fallos y no entrega, pantalla Mi VERLO | Verificar cola/resultado sin mensajes reales; entrega real queda fuera |
| 3 — Contratos y pagos tradicionales | Aprobación de ambas partes, PDF sin revisión incremental/C2PA, firma habilitada solo según reglas, MP sandbox/mock controlado, callback repetido y fallido, estados y bonificación aplicable | Transiciones y PDF verificadas, pago no puede falsificarse; cobro real pendiente |
| 4 — Identik | Cliente exclusivamente Sandbox, 2 firmantes, PDF válido, enlaces privados e iframe, firma por actor, webhook secreto, idempotencia, reconciliación, PDF final, constancia y auditoría | Pruebas simuladas completas + E2E real únicamente tras verificación de credenciales, webhook y flujo Sandbox |
| 5 — Temporarios | Propiedad, demanda, fechas <=90 días, disponibilidad/no solape, match, aceptación doble, reserva, confirmación, contrato y notificaciones | Usuarios ficticios avanzan hasta estados finales; sin cobro procesado por VERLO |
| 6 — PowerMarket | Simulador en una URL para tráfico orgánico y Ads, opciones solo caución/caución+contrato, cálculo externo enchufable, solicitud, documentos, aprobación/rechazo/correcciones, confirmación operación, notificaciones, bloqueo de firma cuando hay caución VERLO y descuento 50% | Caminos felices y negativos, sin invocar proveedor real; matemática contractual final requiere fórmula de PowerMarket |
| 7 — PostHog, SEO y regresión | Eventos y funnels de todas las fases, publicidad bloqueada en QA, rutas/SEO geográfico, mobile y errores, restauración/smoke de Inicio y Propietarios, reejecución de toda la suite | CI completo verde con evidencia; datos analíticos externos solo si se puede aislar |
| 8 — Empaquetado para main | Auditoría de diff entre main y QA; separar código funcional vs guardas, mocks, datos, tests y secretos; migraciones y rollbacks; lista exacta de PRs | Selección revisada, sin llevar modificaciones exclusivas de QA a producción |

## Dependencias externas (NO bloquean el cierre interno)
- **Identik:** firma electrónica Sandbox disponible; pendiente demostrar acceso autenticado real, cierre con dos firmantes y recepción real de webhooks. Namirial Onboarding necesita credenciales de prueba; no sustituir por simulación a la hora de certificar identificación. RENAPER NO lo provee Identik.
- **PowerMarket:** fórmula/valores vinculantes para el simulador, confirmación operativa de emisión y cobro, decisiones reales de contraparte.
- **Zoho ZeptoMail:** dominio habilitado / DNS, token/cuenta habilitados y prueba de entrega real; pruebas de cola/plantillas pueden aprobarse sin ello.
- **Mercado Pago:** QA de callbacks y controles se realiza con simulación y/o credenciales Sandbox segregadas; prueba real de cobro requiere entorno/cuentas de prueba correctos.
- **Web Push:** probar consentimiento, soporte del navegador y suscripción QA aislada; iOS y entregas reales en dispositivos requieren pruebas de campo.
- **R2:** objetos y bucket separados de QA o mock del contrato de upload. Nunca usar bucket y credenciales productivas para cargas E2E.

## Evidencia ya disponible (parcial, NO certificación global)
- Pruebas de aislamiento QA, captación sintética de tenant + owner por API, matching persistido y notificación simulada idempotente con correo pendiente, bloqueo de proveedores.
- Pruebas de UI parcial y redirecciones de rutas históricas.
- Cliente Identik v2 y endpoint sandbox-only, webhook autenticado y readiness. La conectividad real contra Sandbox tiene test; **no afirmar aprobada** sin resultado verde del job exacto.
- No existen en `tests/qa` suites completas de contratos, temporarios, PowerMarket ni firma E2E real a la fecha de este inventario.

## Orden de ejecución y política de alcance
0 -> 1 -> 2 -> 3 -> 4 -> 5 -> 6 -> 7 -> 8. Para desbloquear fases con terceros, validar primero adaptadores/mocks seguros y dejar un test real marcado explícitamente como pendiente. Si un test descubre un defecto, corregir solo dentro del módulo correspondiente; no sumar funciones fuera de esta matriz.
