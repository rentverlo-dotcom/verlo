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

## Cierre operativo
- Prioridad inmediata: resolver 403 intermitente del test CONTRACT-LIFECYCLE con reintento acotado y **OIDC fresco/verificado**. Sin relajar identidad ni cambiar datos de usuarios.
- Despues: inspeccionar evidencia de esa ejecucion; si llego al circuito comercial, registrar **cada asercion efectivamente aprobada** y no ejecutar una bateria mas amplia por inercia.
- La lectura de enlaces de Identik ya tiene evidencia real de dos URLs; no volver a exigirle el mismo caso salvo cambio relevante o regresion final.
- Antes de liberar: revision de compatibilidad de Supabase (sin overwrite), actualizacion segura de Next.js/Node si sigue pendiente, prueba de permisos de descarga por ambos actores, notificaciones y pagos reales controlados, y E2E Namirial.
- No hay merge autorizado a `main` ni aprobacion para activar biometria sin Namirial.
