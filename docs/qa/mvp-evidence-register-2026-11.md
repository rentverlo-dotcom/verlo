# VERLO — Registro maestro de certificacion del MVP (alcance congelado)

**Actualizado:** 2026-11-16. **Rama de trabajo:** `qa/verlo-e2e`. **Objetivo:** lanzamiento inmediatamente despues de aprobar Namirial. Este documento es un registro de evidencia, NO una autorizacion de deploy.

## Reglas permanentes
1. Registrar por componente: caso, SHA exacto, Actions/run/job, entorno, evidencia y clasificacion (APROBADO / FALLIDO / PENDIENTE / NO CERTIFICADO).
2. Una aprobacion es **por caso concreto y SHA**: no significa aprobacion global ni certificacion de produccion. Mantener un caso APROBADO como evidencia historica; cambios posteriores en el componente exigen evaluar impacto, no repetir pruebas indiscriminadamente.
3. No repetir una prueba aprobada excepto si cambia su implementacion/dependencia relevante, la regresion final del release exige el control, o hay falla reproducible.
4. Distinguir un fallo de infraestructura/autenticacion del workflow de un fallo de negocio; no declarar que se rompio un circuito sin haberlo ejecutado.
5. No modificar Supabase ni datos reales sin SQL revisado y ejecutado por el propietario; no enviar emails o invitaciones a usuarios reales desde QA.
6. CI verde, Vercel Ready y tests con dobles no equivalen a experiencia real, entrega efectiva, pagos reales ni firma con biometria.

## Evidencia confirmada de los runs de 16/11/2026

| ID | Caso y alcance preciso | Estado | SHA | Evidencia | Observaciones / siguiente paso |
|---|---|---|---|---|---|
| IDENTIK-URL-READ | GET Identik Sandbox de documento existente con `includeSigningUrls=true`: HTTP 200, 2 destinatarios coincidentes y **2 URLs HTTPS validas**; sin nuevas invitaciones | **APROBADO (lectura del proveedor)** | `e95049a` | [Actions #272 / identik-sandbox-preflight](https://github.com/rentverlo-dotcom/verlo/actions/runs/43876226867) | Los logs muestran `recipientsMatched:2`, `validSigningUrls:2`. NO certifica apertura efectiva de iframe por los dos usuarios ni uso en produccion |
| IDENTIK-WEBHOOK-QA | Endpoint publico QA de webhook accesible por HTTP 200 autenticado, sin crear documento de proveedor | **APROBADO** | `e95049a` | [Actions #272 / qa-e2e](https://github.com/rentverlo-dotcom/verlo/actions/runs/43876226867) | Es prueba de conectividad; no certifica que Identik haya emitido todos los eventos reales |
| QA-DEPLOY-SHA | QA identifica rama/DB correctas y SHA exacto del deploy | **APROBADO** | `e95049a` | [Actions #272](https://github.com/rentverlo-dotcom/verlo/actions/runs/43876226867) | Control puntual del entorno, no release |
| CONTRACT-LIFECYCLE | API QA de matching, doble OK, contrato, bloqueo de pagos, PDF | **NO EJECUTADO / BLOQUEADO** | `e95049a` | [Actions #272 / qa-e2e](https://github.com/rentverlo-dotcom/verlo/actions/runs/43876226867) | HTTP 403 antes de ejercitar aserciones: comprobar autenticacion GitHub OIDC; no declarar fallo de contratos |
| IDENTIK-URL-READ-OLD | GET anterior sin parametro explicitado: 2 firmantes, 0 URLs | **FALLIDO; causa de regresion identificada** | `2e54766` | [Actions #265](https://github.com/rentverlo-dotcom/verlo/actions/runs/43872990804) | Regresion corregida por GET con parametro, ver IDENTIK-URL-READ |
| QA-STATIC-TEST | Test textual de orden de guardado/notificacion | **FALLIDO POR DEFECTO DEL TEST** | `0e4b3f4` | [Actions #268](https://github.com/rentverlo-dotcom/verlo/actions/runs/43874989618) | Comprobaba la primera ocurrencia del nombre de la funcion importada, no su invocacion. Ajustado en `e95049a`; no equivale a certificacion funcional |

## Evidencia historica documentada, no revalidada en esta actualizacion

| ID | Caso | Estado documentado | Fuente |
|---|---|---|---|
| IDENTIK-ARCHIVE-33 | Documento Sandbox 33 completed; PDF firmado y constancia en almacenamiento privado QA | **APROBADO HISTORICO para existencia de artefactos** | [Release readiness 12/11](release-readiness-2026-11-12.md), referencia a QA #194, 2do intento; requiere autorizacion real de descarga por cada parte |
| IDENTIK-ARCHIVE-32 | Documento Sandbox 32 | **PENDIENTE (documento)** | [Release readiness 12/11](release-readiness-2026-11-12.md) |
| TEMPORARIOS-MP | Pago, reserva, webhook e importe de $49.999 contra historicos de $29.900 | **NO CERTIFICADO para release** | [Release readiness 12/11](release-readiness-2026-11-12.md) |
| POWERMARKET-REAL | Cotizacion vinculante, aprobacion, cobro por socio y emision de poliza | **NO CERTIFICADO end-to-end real** | [Release readiness 12/11](release-readiness-2026-11-12.md) |
| EMAIL-PUSH-DELIVERY | Entrega real y recepcion de avisos por destinatario y canal | **NO CERTIFICADO globalmente** | [Release readiness 12/11](release-readiness-2026-11-12.md) |
| NAMIRIAL-BIOMETRIA | DNI frente/dorso, selfie, vivacidad, rechazo y reintento | **BLOQUEO EXTERNO** | [Release readiness 12/11](release-readiness-2026-11-12.md) |


## Actualizacion 16/11/2026 — QA #273 exitoso (commit `5d09b2f`)

**Fuente:** [GitHub Actions #273](https://github.com/rentverlo-dotcom/verlo/actions/runs/43916200119). Se inspeccionaron los pasos de los dos jobs. `qa-e2e` y `identik-sandbox-preflight` terminaron SUCCESS. `identik-reconcile-pending`, `identik-sandbox-reconcile`, `identik-sandbox-send` e `identik-archive-completed` quedaron SKIPPED segun su condicion de ejecucion (no se consideran fallos, ni pruebas aprobadas en este run).

| ID | Caso | Estado en #273 | Evidencia y limite |
|---|---|---|---|
| QA-DEPLOY-SHA | Comparacion exacta SHA, rama y DB QA | **APROBADO** | Ambos jobs verificaron commit desplegado |
| IDENTIK-URL-READ | Recuperar enlaces de firma existentes por lectura real Identik Sandbox | **APROBADO** | Preflight paso sin invitaciones, valida disponibilidad, no firma humana |
| IDENTIK-CONTRACT-PREFLIGHT | Verificar contrato sintetico autorizado sin efectos de proveedor | **APROBADO** | Preflight de contrato del job Identik; no genera documento |
| IDENTIK-WEBHOOK-QA | Alcanzabilidad y autenticacion del webhook QA | **APROBADO** | HTTP via test de QA; no certifica entrega real de eventos por Identik |
| CONTRACT-LIFECYCLE | Captacion sintetica, matching, doble OK, revisiones legales, generacion y acuerdo, pago sintetico y PDF | **APROBADO EN QA SIN COBROS REALES** | Paso `Exercise synthetic match interest and contract double OK`, ya no bloqueado por 403 |
| POWERMARKET-SUBMISSION | Solicitud QA, concurrencia e idempotencia | **APROBADO EN QA** | Paso `Exercise real QA caucion submissions and concurrent idempotency`; no prueba emision real del socio |
| TEMPORARIOS-LIFECYCLE | API QA con dos usuarios Auth, aceptacion, reserva y contrato | **APROBADO EN QA** | Paso `Exercise two real QA Auth users through Temporarios APIs, reservation and contract`; pago simulado |
| MI-VERLO-AUTH | Dos usuarios reales QA Auth y aislamiento de roles | **APROBADO EN QA** | Paso `Verify real QA Auth with two synthetic customer roles` |
| CONTRACT-PDF | Generador contractual PDF | **APROBADO EN PRUEBAS AUTOMATICAS** | Paso `Verify existing contractual PDF generator` |
| IDENTIK-RELEASE-GUARDS | Condiciones de firma e invariantes de seguridad | **APROBADO EN PRUEBAS AUTOMATICAS** | Paso `Verify Identik release and signing security gates without provider calls` |
| IDENTIK-LINK-SAFEGUARDS | Controles del codigo para enlaces privados | **APROBADO EN PRUEBAS AUTOMATICAS** | Paso `Verify private Identik personal signing link safeguards`; no prueba navegacion humana |
| MP-WEBHOOK-STATES | Transiciones de webhook y estado MP | **APROBADO EN PRUEBAS AUTOMATICAS** | Paso `Verify Mercado Pago contract webhook states without sending payments` |
| CAUCION-DISCOUNT | Calculo de tarifa/bonificacion del contrato | **APROBADO EN PRUEBAS AUTOMATICAS** | Paso `Verify contract fee and PowerMarket 50 percent discount without network or charges` |
| POSTHOG-FUNNEL | Instrumentacion de eventos, privacidad | **APROBADO EN PRUEBAS AUTOMATICAS** | Paso `Verify PostHog funnel instrumentation and privacy without delivery` |
| QA-PLAYWRIGHT | Suite aislada de pruebas QA | **APROBADO** | Paso `Run isolated QA Playwright suite` |
| IDENTIK-MANUAL-JOBS | Conciliacion y archivado manual, envio Sandbox | **NO EJECUTADOS EN #273** | Jobs SKIPPED intencionalmente; conservar evidencia historica independiente |

**Efecto sobre el bloqueo de 403 de #272:** la ruta de contratos ahora se ejecuto y aprobo en #273. El cambio fue reintento acotado ante 403 con OIDC fresco; no se relajaron permisos. Sin embargo, no se declara resuelta universalmente toda intermitencia de GitHub OIDC solo por este exito.

**Regla de no duplicacion:** conservar #273 como evidencia suficiente para estos escenarios sinteticos salvo cambio material/defecto concreto o verificacion final de release. No convertir pruebas simuladas en afirmaciones de cobro real, biometria Namirial o entrega efectiva de email/push.

## Cierre operativo
- Prioridad inmediata: resolver 403 intermitente del test CONTRACT-LIFECYCLE con reintento acotado y **OIDC fresco/verificado**. Sin relajar identidad ni cambiar datos de usuarios.
- Despues: inspeccionar evidencia de esa ejecucion; si llego al circuito comercial, registrar **cada asercion efectivamente aprobada** y no ejecutar una bateria mas amplia por inercia.
- La lectura de enlaces de Identik ya tiene evidencia real de dos URLs; no volver a exigirle el mismo caso salvo cambio relevante o regresion final.
- Antes de liberar: revision de compatibilidad de Supabase (sin overwrite), actualizacion segura de Next.js/Node si sigue pendiente, prueba de permisos de descarga por ambos actores, notificaciones y pagos reales controlados, y E2E Namirial.
- No hay merge autorizado a `main` ni aprobacion para activar biometria sin Namirial.
