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

## Bloque comunicaciones — auditoria de cierre 16/11/2026

- **Fuente revisada (solo codigo QA):** `lib/email.ts`, `lib/push.ts`, `lib/notifications/zeptomail.ts`, `lib/notifications/verlo-email-outbox.ts`, `lib/notifications/verlo-email-templates.ts`, `app/api/qa/notifications/preflight/route.ts` y `app/qa/notificaciones/page.tsx`.
- **Hallazgo verificado:** Zoho SMTP legacy y ZeptoMail coexisten con compuertas de activacion. No afirmar que ZeptoMail este cortado ni que emails hayan sido recibidos; no hay prueba de entrega real en esta auditoria.
- **Hallazgo verificado:** `sendPushToLead` distingue aceptacion de proveedor y fallos, pero ninguna lectura de codigo certifica recepcion de Push en dispositivo.
- **Correccion de copy en QA:** commit `aeeecd5`, reemplaza tres menciones comerciales explicitas a PowerMarket en plantillas transaccionales. No afecta la semantica de eventos, pagos ni rutas. **PENDIENTE verificar CI para SHA**; no declarar aprobado anticipadamente.
- **Pendiente real para cerrar bloque:** prueba supervisada de recepcion en casilla de email por cada flujo necesario y un dispositivo real con suscripcion Push; cotejar contenido, destino y registro por canal. No hacer disparos masivos ni usar datos sintéticos con destinatarios reales.
- **Alcance de este control:** auditoria estatica + ajuste de copy, no certificacion global de entregabilidad. Conservar evidencias anteriores de #273 sin repetirlas.

## Actualizacion 16/11/2026 — QA #274 / autenticacion intermitente

- [Actions #274](https://github.com/rentverlo-dotcom/verlo/actions/runs/43946593056), SHA `aeeecd5`: preflight Identik **APROBADO**; QA E2E **INTERRUMPIDO por HTTP 403 en el paso de Mi VERLO con dos usuarios QA**.
- Antes del 403 aprobaron: webhook QA de Identik, contrato sintetico tradicional y doble OK, solicitud sintetica de caucion e idempotencia, ciclo de Temporarios con Auth QA y PDF contractual. No volver a ejecutarlos aisladamente: evidencia de #273 cubre la suite completa.
- El HTTP 403 se produjo al invocar `/api/qa/mi-verlo/isolation`, antes de ejecutar sus aserciones. **No es evidencia de un defecto de autorizacion de usuarios reales**; tampoco constituye exito de Mi VERLO para #274. Mi VERLO ya habia pasado en #273.
- Correccion de CI `913a9fb`: unicamente para esta invocacion, hasta tres intentos si hay HTTP 403 antes de crear usuarios sinteticos, con GitHub OIDC nuevo por intento; falla cerrada para otros codigos. **PENDIENTE EVIDENCIA de una nueva ejecucion**. No cambia controles de acceso a produccion ni validacion de tokens.
- El commit `aeeecd5` es un ajuste de redaccion de emails: no modifica autenticacion ni lógica de matching o contratos. Mantener aprobado previo por alcance. No confundir Vercel Ready con QA verde.

## Actualizacion 16/11/2026 — QA #275: test de email desactualizado

- [Actions #275](https://github.com/rentverlo-dotcom/verlo/actions/runs/43947634453), commit `913a9fb`: los jobs de preflight Identik aprobaron; en el job QA se supero la autenticacion de Mi VERLO y falló **1 de 112 tests Playwright** en `tests/qa/zeptomail-transport.spec.ts` por una asercion desactualizada que exigia literalmente `PowerMarket` en el email `policy_payment_pending`.
- La redaccion de marca blanca de la plantilla se habia cambiado deliberadamente en `aeeecd5`. No es un defecto de entrega de email ni del pago: es inconsistencia entre test y requisito. Los otros 111 tests Playwright finalizaron aprobados en esa ejecucion.
- Correccion `816a5c9`: el test verifica pago directo con la entidad correspondiente, enlace a Mi VERLO y ausencia del nombre del socio; conserva comprobaciones independientes del correo de propietario. **PENDIENTE** CI de este commit.
- Evidencia previa #273 sigue siendo valida para recorridos comerciales; no relanzar pruebas de clientes reales ni deshacer la decision de marca blanca para satisfacer un test.

## Actualizacion 16/11/2026 — QA #277 y separacion de pruebas

- [Actions #277](https://github.com/rentverlo-dotcom/verlo/actions/runs/43950315925), SHA `2f84d4f`: `identik-sandbox-preflight` **APROBADO**, suite Playwright **111/112 aprobadas**; la restante fue `tests/qa/contracts-security-preflight.spec.ts` por HTTP 409 de `/api/qa/contracts/preflight`.
- Respuesta observada del preflight: `invalidTenantTokenRejected: true`, `invalidOwnerTokenRejected: true`, `invalidContractTokenRejected: true`, `contractRecords: 127`, `compatibleMatches: 0`. Por tanto la prueba de **rechazo de tokens falsificados SI comprobo las tres defensas**, pero el endpoint no devolvio 200 por una exigencia adicional de cantidad de matches.
- Analisis de codigo: el preflight de **seguridad** consultaba `lead_matches` con `score >= 80` y condicionaba `ok` a `count > 0`. Esto acopla seguridad a datos variables de QA. **No demuestra fallo del algoritmo**. La prueba independiente de ciclo contractual crea una pareja sintética y verifica match con `score >= 80`, doble OK y contrato, y aprobo en #277.
- Correccion aislada: `cef0003` elimina la consulta de conteos del preflight de seguridad; conserva los tres rechazos reales de tokens. `6228166` actualiza el test para verificar especificamente el invariante de autorizacion y no depender de fixtures de matching.
- **PENDIENTE** aprobar esta correccion en CI sobre el SHA definitivo. No se tocaron algoritmos de matching, SQL, clientes, ni credenciales. La evidencia historica #273 continua valida para los casos probados.

## Cierre comprobado 16/11/2026 — Actions #280 y comunicaciones QA

**SHA fijo certificado:** `e3be0be827874ebc9c950f2501254c043031a592`. [Actions #280](https://github.com/rentverlo-dotcom/verlo/actions/runs/43954940970) = **SUCCESS**, jobs `qa-e2e` e `identik-sandbox-preflight` aprobados. Los jobs opcionales de envio/conciliacion Identik se omitieron por diseño y no estan aprobados en esta ejecucion.

**Verificaciones completadas en el run #280:** rama/DB/SHA de QA; webhook de Identik accesible; matching sintetico real + doble OK + generacion/acuerdo contractual; solicitud de caucion/idempotencia; flujo de Temporarios con dos identidades QA; PDF contractual; aislamiento de roles en Mi VERLO; controles de firma y enlaces privados; tests automatizados de webhooks Mercado Pago, descuento de caucion 50%, PostHog, y suite Playwright aislada. **No equivalen a cobro real, entrega real, poliza emitida ni biometria real.**

**Comunicaciones: consulta independiente de solo lectura, 16/11/2026:** `GET /api/qa/notifications/preflight` sobre el preview cuyo `/api/qa/status` reporta exactamente `e3be0be827874ebc9c950f2501254c043031a592`. Resultado HTTP 200:
- `ok: true`, `qaOnly: true`, `noExternalDelivery: true`
- `matchedNotificationEvents: 322`
- `matchedEmailIntents: 322`
- `sentPushEvents: 0`, `nonPendingEmailIntents: 0`.

**Interpretacion aprobada:** auditoria de 322 eventos QA con 322 intenciones de email y cero entregas externas, consistente con bloqueo QA. No prueba entrega a casilla ni dispositivo.

**Vista previa de email y push:** `GET /qa/notificaciones` retorno HTTP 200 en el mismo Preview; muestra textos sin enviar nada ni acceder a datos de clientes. Vista previa NO certifica recepción.

**Pendiente sin duplicar pruebas:** una entrega real supervisada de correo con remitente y Reply-To correctos; al menos una suscripcion y notificacion Push en dispositivo compatible con acuse de recepcion; confirmar enlaces a Mi VERLO. No activar envios masivos ni alterar clientes para esta prueba.

**Riesgos de release detectados en lectura de codigo/documentacion:** `package.json` mantiene `next: 14.0.0`, Vercel usa Node 24.x mientras Actions usa 20; reconciliar dependencias y lockfile con build y pruebas en version final. Preparar migraciones aditivas que conserven pagos historicos de $29.900 antes de permitir nuevas altas de $49.999. No mover indiscriminadamente QA a main, ni SQL sin revision/ejecucion del propietario.

**Estado del historial:** los errores de los runs #274-279 quedan registrados como incidentes historicos, supersedidos para el alcance funcional cubierto por el #280. Las certificaciones reales pendientes siguen abiertas.

## Cierre operativo
- **Cierre funcional QA confirmado en Actions #280**. No repetir la suite sintetica por defecto.
- Prioridad siguiente: certificacion real y controlada de entrega Email + Push, auditoria de dependencia Next/Node y plan de migraciones sin tocar datos productivos.
- La lectura de enlaces de Identik ya tiene evidencia real de dos URLs; no volver a exigirle el mismo caso salvo cambio relevante o regresion final.
- Antes de liberar: revision de compatibilidad de Supabase (sin overwrite), actualizacion segura de Next.js/Node si sigue pendiente, prueba de permisos de descarga por ambos actores, notificaciones y pagos reales controlados, y E2E Namirial.
- No hay merge autorizado a `main` ni aprobacion para activar biometria sin Namirial.
