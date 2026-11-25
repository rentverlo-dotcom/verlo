# ACTUALIZACION MAESTRA — 25/11/2026 | Cierre MVP VERLO, hilo 4

**Prioridad:** esta seccion es la fotografia mas reciente; las entradas debajo son historial y pueden contener decisiones superadas. **Alcance congelado en 44 tareas / siete grupos**, sin tareas nuevas. **NO** tocar main ni produccion antes de aprobar QA. Ninguna prueba se declara aprobada solo por tener un deploy READY.

## Auditoria de cierre — 25/11/2026, contratos y caucion (lectura sin mutaciones)

- **Hallazgo RESUELTO en DB QA:** se consulto `pg_get_functiondef` de `public.caucion_confirm_partner_operation(uuid,uuid)`. La funcion **actual** ya NO exige un registro `caucion_contract_reviews.status='approved'`: la variable `v_review` permanece declarada pero **no es usada**. Esto corrige la anotacion historica inferior que decia que ese veto estaba aun activo. No se ejecuto ninguna migracion nueva en esta auditoria.
- El RPC actual exige operador PowerMarket activo, poliza en `payment_pending`, caucion `prequalified` o `alternative_offered` vigente, cotizacion `accepted` vigente y contrato correspondiente al mismo `tenant_lead_id` con contenido; tras confirmar guarda `payment_confirmed_at`, `payment_confirmed_by` e inserta evento `policy_payment_confirmed`. Es idempotente para `payment_confirmed`. **Revision estatica/SQL APROBADA, E2E pendiente**.
- `lib/powermarket/signing-approval.ts` en `qa/verlo-e2e` contiene `checkPowerMarketSigningApproval`: para caucion exige exactamente una poliza ligada al contrato en `payment_confirmed` o `issued`, con fecha y operador de confirmacion. **Aun falta verificar que el endpoint real que expone la firma invoque este control servidor**; no confundir la existencia del helper con proteccion E2E certificada.
- `app/api/powermarket/policies/route.ts` controla cotizacion aceptada/vigente, mismo inquilino/contrato y estados de caucion para crear/avanzar poliza. `app/api/powermarket/confirm-operation/route.ts` exige bearer autenticado, operador socio activo y llama RPC, ademas intenta encolar emails para ambas partes despues de confirmacion sin revertir el cobro si falla la notificacion.
- Supabase QA al momento de la lectura: `select count(*) from public.caucion_policies` devolvio **0**. **NO** se ejecuto `Confirmar operacion` real ni simulada en esta tanda. La prueba con Maxi continua pendiente. Sin escrituras en SQL, sin deploy funcional, sin produccion.
- `app/api/closing-agree/route.ts` implementa consumo idempotente de `lead_payments` aprobados asociado al alquiler. **No** constituye por si solo prueba de que el proveedor de firma esta bloqueado si falta el cobro VERLO; hace falta inspeccionar y certificar el gate especifico de firma.

---

## Auditoria estatica adicional — 25/11/2026, gate de aceptacion/firma

- Se inspecciono `app/api/closing-agree/route.ts` en `feature/signatura-qa-integration`: valida que ambos actores hayan marcado «si» luego de la visita y, cuando el token pertenece al **tenant**, impide aceptar si `lead_matches.tenant_paid_at` es nulo. Posteriormente busca `lead_payments` aprobados y los consume de modo idempotente por alquiler, segun evidencia del archivo. **Aprobado solo para la accion de aceptar contrato**, NO para emitir enlace de firma.
- Se inspecciono `app/contracts/[id]/page.tsx`: pagina de **visualizacion** de estado `ready_to_sign`/`signed`; no emite invitaciones ni implementa guardas de pago. No confundir esta pagina con un endpoint de firma.
- Se inspecciono `lib/powermarket/signing-approval.ts`: la funcion `checkPowerMarketSigningApproval` requiere confirmacion de cobro de caucion ligada al contrato, pero la busqueda disponible en el repositorio (rama por defecto) solo muestra llamadas en rutas de **polizas y certificado**, no demuestra invocacion por un endpoint que cree enlace de firma. **Sin identificar y auditar la ruta real que inicia firma, el bloqueo de firma NO esta certificado**, ni para pago VERLO ni para caucion.
- **Estado:** auditoria parcial sin codigo ni DB modificados; PROXIMO GATE: identificar en el flujo vigente el handler que crea/abre la sesion real de firma (Signatura/contrato) y demostrar que consulta guardas servidor antes de crear o exponer enlaces. No implementar soluciones alternativas ni asumir que una comprobacion en UI basta. Esto pertenece a la tarea de seguridad existente, no agrega alcance.


## Correccion de seguridad del endpoint real de firma — 25/11/2026

- Se siguio el boton **«Firmar contrato»** en `components/identik/MyIdentikSigning.tsx` hasta `GET/POST /api/identik/my-signing`. El `POST` hace `checkTraditionalSigningReadiness(db, contractId)` **antes** de reservar y crear el documento en Identik; el `GET` repite la misma prevalidacion antes de exponer la URL personal ya registrada. Este es el endpoint vigente de firma contractual Identik en Mi VERLO, **distinto** de la primera declaracion de identidad Signatura.
- La prevalidacion comprueba `lead_contracts.status='agreed'`, conformidad de ambas partes, `lead_matches.tenant_paid_at`, decisiones posteriores a visita y elegibilidad de la caucion. `checkPowerMarketSigningApproval` requiere caucion vigente y registro de poliza `payment_confirmed/issued` con fecha y operador asociado al **mismo contrato**; para contratos sin caucion no exige PowerMarket.
- **HALLAZGO:** `tenant_paid_at` por si solo no garantiza un pago aprobado. Consulta read-only de Supabase QA: 132 contratos `agreed`, 132 alquileres ligados, **131** con prueba de pago aprobado y **1** contrato `ab9620ad-71f6-4654-ad2c-0739c9115861` con `tenant_paid_at` pero **sin `lead_payments` aprobado para el inquilino**. No se borro ni modifico ese dato.
- **CORRECCION EN QA:** `lib/identik/traditional-signing-preflight.ts` exige ahora el alquiler especifico asociado al contrato+match+inquilino y, adicionalmente, un `lead_payments.status='approved'` del mismo inquilino ligado al contrato/match, o un credito ya consumido por ese alquiler. Si falta prueba, retorna `verlo_payment_not_verified` y **no crea ni expone** enlace Identik. La comprobacion corre junto al requisito existente de `tenant_paid_at` y antes del gate PowerMarket. Commits: `818d3911` en `qa/verlo-e2e` y `ccdbf1a3` en `feature/signatura-qa-integration`.
- **EVIDENCIA:** lectura de ambos archivos del repositorio confirmo presencia de los nuevos controles y conservacion de `checkPowerMarketSigningApproval`. Query SQL de solo lectura con la misma logica de asociacion: **132** contratos, **131** con prueba y **1** bloqueado; ninguno sin alquiler. NO se ejecutaron firmas ni pagos al comprobar esta correccion.
- **ESTADO DE CERTIFICACION:** correccion implementada en codigo QA y cotejada contra datos QA. Faltan build READY, test de rechazo/aceptacion en endpoint y E2E con firma/tercero antes de marcarlo APROBADO integralmente. No se toco `main`, Supabase ni produccion. No hacer nuevos deploys manuales si Vercel ya esta construyendo automaticamente. Alcance existente: control de firma y pagos, **no** tarea nueva.

---

## Signatura — evidencia y pendientes

- **Tecnica YA PROBADA (24/11):** documento demo firmado con DNI frente/dorso, selfie y firma; certificado generado. Eventos `document_signed` y `document_status_changed` recibidos en Supabase QA (`signatura_webhook_events`, 2 registros observados). `GET /documents/{id}` y HTTPS `signatures[].url` comprobados. **NO repetir desde cero** biometria, firma ni webhooks sin motivo de regresion.
- **Integracion inicial en QA, NO E2E:** rama `feature/signatura-qa-integration`; commits `50c12179`, `174e33c1`, `e4761d64`, `814de6d9`, `a1ce0e25`, `316cf9c3`, `c291a411`, `248a69c`. Control de tenant basado en usuario autenticado y lead; rutas `identity-start`, `identity-reconcile`, `my-signing-url`; UI Mi VERLO, PDF provisional **solo de prueba**, webhooks. Falta probar que la primera declaracion se asocia a `auth.users.id` y se reutiliza en multiples solicitudes sin nueva validacion. Al ultimo control `signatura_tenant_identity_bindings`: **0 registros**. El PDF provisional no es texto legal comercial.
- **Acceso bloqueado:** Supabase Auth QA tenia Site URL erronea `localhost:3000`; se cambio a `https://verlopunto0-git-feature-signatu-009bb9-verlos-projects-b9e9c595.vercel.app` y redirect `/**`. Login posteriormente recibio `429 over_email_send_rate_limit`. Commit `920efe7` informa correctamente el limite; **dos deploys READY del mismo commit** (un automatico y otro manual), no dos cambios. Cambiar de correo no resolvio bloqueo de proyecto. No insistir con OTP mientras 429, no contratar SMTP, no deshabilitar login. La espera de una hora es **estimacion, no restablecimiento confirmado**.
- **Tenant de ensayo QA:** existia el auth user `rentverlo@gmail.com` sin lead; se creo un solo `lead_intake` exclusivo QA, `id=1a386b86-e19a-4adc-8305-520dddba135e`, `role=tenant`, `intent=tenant_search`, `source=qa_signatura_identity_test`. Verificado sin `lead_matches`. Falta sesion de navegador y recorrido end-to-end.

## PowerMarket — evidencia y pendientes

- **Panel desplegado:** rama `qa/verlo-e2e` commits `a59497e`, `09e5089` READY; cambios en Signatura `ca6e9ca`, `5742ea7`. Ficha privada presenta nombre, contacto y DNI desde `user_contract_data` (por `tenant_user_id`) o `tenant_verifications` (por lead), sin archivos biometricos. Las solicitudes sin documento mostraban «No informado».
- **DB QA verificada (25/11):** **91 solicitudes**: 88 automatizadas `submitted` (`source=qa_e2e_caucion_submission`) y **3 demos `under_review`** (`source=qa_demo_powermarket`). Las 91 tenian `tenant_user_id=NULL` en ese control. No confundir 88 solicitudes de test con usuarios reales.
- **Tres demos:** «Inquilino de prueba»: solicitud `af0ac065-89d3-4630-8f60-053f5ae13766`, alquiler ARS 800.000, expensas ARS 120.000, ingresos ARS 2.800.000, 24 meses. «Ingresos bajos»: alquiler 980.000, expensas 120.000, ingresos 1.300.000. «Monotributista y co-inquilino»: alquiler 660.000, expensas 100.000, ingresos 1.900.000. Todas en evaluacion al control.
- **Identificacion exclusivamente demo:** para la primera solicitud se inserto en Supabase **QA** `tenant_verifications` un `document_number=QA-DNI-0001 (DATO DE PRUEBA)`, `status=pending`, asociado a lead `1a87a179-9059-441e-bd55-bd5b9d70fee3`; registro `b7ef6c10-5224-4390-a569-a2dc6555069a`. Se leyo nuevamente y se verifico que no hay frente/dorso/selfie. **No es DNI real ni validacion de identidad**; falta comprobar visualizacion en navegador del panel.
- **Operador Maxi:** `mpagoto@pmb.com.ar` en `caucion_partner_users` con `active=true` y `partner=powermarket` (Supabase QA). Panel: `https://verlopunto0-git-qa-verlo-e2e-verlos-projects-b9e9c595.vercel.app/powermarket`. El propietario envio instrucciones el 25/11 para abrir tres fichas y probar precalificar, rechazar y proponer monto alternativo. **No consta aun** inicio real de sesion ni devolucion de Maxi; limite de emails Supabase QA puede afectar acceso.
- **Segundo tramo SIN certificar:** inquilino acuerda contrato en VERLO; PowerMarket revisa, cobra caucion y presiona `Confirmar operacion` solo tras acreditarse el cobro; VERLO registra confirmacion y habilita firma **solo** si se cumplen todas las condiciones (contrato VERLO pagado, caucion aprobada/vigente cuando corresponda, identidades y firma). La UI de `Confirmar operacion` existe para poliza `payment_pending`, pero **no** se ha certificado el E2E. Las anotaciones historicas de la funcion SQL `caucion_confirm_partner_operation` y revisiones contractuales contienen decisiones contradictorias: leer funcion real actual antes de aprobar. No confirmar pagos, emitir polizas ni contactar proveedor en nombre del usuario.
- **Simulador:** existe captacion/persistencia de solicitudes y tres demos precargadas; **simulador comercial completo NO terminado/certificado**, falta formula de PowerMarket. No afirmar que las demos salieron de un simulador operativo.

## Resto del alcance congelado: estado de continuidad

- **Contratos y pagos:** falta auditar/confirmar bloqueo de firma sin pago de contrato VERLO y, para caucion, sin aprobacion/pago vigente segun condiciones. No dar por aprobado hasta prueba y evidencia.
- **Email, Push, analitica:** falta certificar contenidos y entrega reales, PostHog y Meta CAPI `Purchase` para tradicionales, temporarios, caucion y combos; ver evidencia historica y evitar duplicados.
- **QA/regresion y migracion:** preservar datos productivos; aplicar migraciones aprobadas y no copiar DB QA; no merge a `main` ni lanzamiento sin gate final.
- **Continuidad en nuevo hilo:** recuperar esta seccion, verificar repos/QA antes de cambiar estados, actualizar evidencia con SHA + fecha + entorno + resultado, no repetir ensayos acreditados, **no abrir tareas fuera de las 44**.
- **Seguridad:** no guardar accesos, tokens, documentos reales ni selfies en el registro. Solo URLs publicas de entornos QA.

---

## PowerMarket: acceso externo y contrato de consulta — 17/11/2026

- El propietario solicitó retirar exclusivamente las acciones de aprobación o solicitud de cambios de versión contractual del panel PowerMarket. **Commit `461ac4d`** en `qa/verlo-e2e`: eliminados ambos botones y el callback cliente `reviewDecision` del dashboard `app/powermarket/page.tsx`; queda acceso privado para leer el PDF. Se modificó copy para indicar que los términos contractuales son responsabilidad de las partes del alquiler. **Ninguna plantilla ni generador de contrato real fue modificada.**
- Los PDF de los tres casos QA fueron generados a partir de **texto ficticio de demostración** contenido en `lead_contracts` QA; no representan el contrato completo comercial de VERLO. Los contratos reales y el generador comercial no se sobrescribieron, ni se tocó Supabase producción.
- La ruta backend `PATCH /api/powermarket/contract-reviews` y reglas internas de aprobación contractual **siguen presentes**. Requieren análisis separado de dependencias antes de deshabilitarse, porque podrían condicionar firma y confirmación de operación. **No atribuir a estos cambios la eliminación completa de la capacidad de aprobar desde API ni un E2E definitivo.**
- Acceso del operador de PowerMarket: `https://verlopunto0-git-qa-verlo-e2e-verlos-projects-b9e9c595.vercel.app/powermarket`, utilizar únicamente `mpagoto@pmb.com.ar`, botón `Enviar acceso desde VERLO`. El servidor envía un enlace personal vía `/api/qa/powermarket/invite`, restringido a destinatarios permitidos, que exige que el operador VERLO haya sido habilitado antes. **No se certificó entrega efectiva del correo a PowerMarket.**
- [Actions #44135281443](https://github.com/rentverlo-dotcom/verlo/actions/runs/44135281443): **SUCCESS** de pruebas de lectura/visualización QA para el commit de UI. Vercel Preview del mismo SHA estaba BUILDING durante la consulta; verificar READY antes de informar que el cambio está visible.


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

## Mercado Pago — consolidacion historica (16/11/2026, sin ejecutar nuevas pruebas)

La documentacion de release del 12/11 confirma dos pagos historicos de Temporarios en **Supabase produccion** con estado `approved` e importe ARS 29.900. En el historial de pruebas del proyecto se identificaron los pagos Sandbox siguientes:
- Pago MP `182802783071` — ARS 29.900, 12/10/2026, aprobado (historico).
- Pago MP `183768078988` — ARS 29.900, 12/10/2026, aprobado (historico).
- Pago MP `189434035796` — ARS 49.999, 13/11/2026, aprobado por Mercado Pago Sandbox segun registro de trabajo previo. **La ultima evidencia recuperada no acredita por si sola transicion de reserva a `fee_paid`**; no repetir la compra. Validar el estado final por lectura de evidencia existente/DB, sin cobro nuevo.
- [Actions QA #280](https://github.com/rentverlo-dotcom/verlo/actions/runs/43954940970), SHA `e3be0be`: pruebas automaticas de estados y duplicados de webhook de contrato Mercado Pago y calculo del 50% de bonificacion aprobadas **sin efectuar pagos ni llamar al proveedor**. Incluye escenarios de rechazo de montos y divisas incorrectas y replay.
- Los dos historicos de ARS 29.900 son intocables. Falta preparar migracion compatible con nuevos importes de ARS 49.999; **no** modificar ni repetir las operaciones historicas para cumplir una nueva restriccion.
- **Clasificacion:** pagos históricos y el pago Sandbox 49.999 **YA EJECUTADOS**; controles de webhook en QA **APROBADOS COMO PRUEBAS AUTOMATICAS**; conciliacion final del pago 49.999 **POR VERIFICAR MEDIANTE LECTURA, SIN REPETIR PAGO**. Evitar etiquetar "Mercado Pago entero no probado" o reclamar otra compra sin evidencia concreta de un bloqueo.
- El cobro de poliza de caucion corresponde al socio, no a Mercado Pago de VERLO. No confundir con cobro del contrato digital.

## Identik — alcance y costos de pruebas

- QA #280 solo leyo documentos y enlaces existentes; los trabajos opcionales de envio, conciliacion y archivado quedaron SKIPPED. No se autorizaron nuevos sobres de firma ni nuevos envios en esta tanda.
- La documentacion publica de Identik describe firma electronica vendida por documento en packs y biometria opcional por firma verificada, pero la facturacion de sandbox y contratos empresariales depende del acuerdo concreto; **no declarar que el sandbox es gratis ni que genera cargos sin factura/condiciones contractuales**.
- Antes de volver a crear/distribuir un documento o activar biometria, revisar credito y condiciones reales; pruebas de lectura y automatizadas no sustituyen esa comprobacion.

## Cierre de conciliacion de pagos — lectura Supabase 16/11/2026

**Verificacion de solo lectura, sin nuevos cobros, ni SQL de escritura.** Se consulto directamente `temporary_payment_attempts` agregado por `amount_ars,status,provider`, unido por `reservation_id` a `temporary_reservations` para comparar su estado. Proyectos separados: produccion `bmgrpcqrdvwculrisasi`; QA `anptswspguyotnasoacq`. No se extrajeron datos de identidad.

| Entorno | Importe | Proveedor | Pagos `approved` | Reservas vinculadas |
|---|---:|---|---:|---|
| Produccion | ARS 29.900 | mercadopago | **2** | **1 `fee_paid` + 1 `confirmed`** |
| QA | ARS 49.999 | mercadopago | **1** | **1 `confirmed`** |

**Conclusion limitada:** queda acreditada la existencia de un pago Sandbox de ARS 49.999 aprobado en QA cuya reserva esta `confirmed` y los dos pagos reales historicos de ARS 29.900, sin repetir transacciones. El estado presente `confirmed` no demuestra por si solo la secuencia historica de todos los webhooks; la seguridad de transiciones, reintentos e idempotencia se cubre por pruebas automatizadas aprobadas en [Actions #280](https://github.com/rentverlo-dotcom/verlo/actions/runs/43954940970). No declarar un nuevo cobro de produccion de ARS 49.999.

**Implicacion obligatoria para release:** la migracion del CHECK de montos debe admitir registros historicos de ARS 29.900 y nuevas operaciones a ARS 49.999 sin alterar ningun pago aprobado. Toda propuesta SQL de escritura debe presentarse al propietario; el agente no la ejecuta.

## Auditoria independiente de pagos tradicionales — 16/11/2026

**Solo lectura en Supabase, proyectos separados. No hubo nuevas operaciones de Mercado Pago ni modificaciones SQL.** Esta seccion NO se refiere a Temporarios ni a cauciones.

- En **produccion** (`bmgrpcqrdvwculrisasi`), `public.lead_payments` presenta **0 registros** al momento de la consulta. Esto no descarta cobros contabilizados en otros circuitos/tablas.
- En **QA** (`anptswspguyotnasoacq`), `public.lead_payments` contiene **125 registros**, todos `qa-synthetic`, `approved`, importe **ARS 119.000**. No representan transacciones reales ni ingresos.
- **124** registros tienen `consumed_at` y `consumed_rental_id`; **1** registro permanece `approved` sin consumo. La consulta al contrato asociado muestra `status='generated'`; fue creado el 16/11/2026 a las 11:22:02 UTC. Por sí solo no indica un defecto comercial: requiere evaluar si corresponde a una ejecución sintética incompleta.
- Las comprobaciones de webhook de Mercado Pago, bloqueo de cobro e idempotencia continúan **APROBADAS EN PRUEBAS AUTOMATICAS** según [Actions #280](https://github.com/rentverlo-dotcom/verlo/actions/runs/43954940970). Este resultado no certifica una transacción real tradicional en Mercado Pago.
- **Regla:** no volver a generar pagos ni alterar el registro sin reproducir una falla concreta. Mantener separado del cierre verificado de ARS 49.999 de Temporarios.

## Verificacion de identidad de firmantes VERLO → Identik — 16/11/2026

**Auditoria estatica de codigo del recorrido comercial en `app/api/identik/my-signing/route.ts` y `lib/identik/electronic-v2.ts`, sin enviar nada a Identik ni modificar DB.**

- `POST /api/identik/my-signing` valida token Supabase Auth y email confirmado, recupera `lead_contracts.owner_lead_id` y `tenant_lead_id`, y carga `lead_intake.id,email,full_name` para esos IDs.
- Encuentra `owner` y `tenant` mediante igualdad con sus respectivos IDs y exige que el solicitante tenga un correo de uno de los participantes, con comprobacion adicional de readiness del contrato.
- Inserta `identik_electronic_documents.owner_email = owner.email.trim().toLowerCase()` y `tenant_email = tenant.email.trim().toLowerCase()`.
- El arreglo `recipients` pasado a `makeIdentikElectronicClient().createDocument()` utiliza exactamente las mismas expresiones `owner.email.trim().toLowerCase()` y `tenant.email.trim().toLowerCase()`, respectivamente, con orden 1 propietario y 2 inquilino. El transporte envía ese payload por `POST /document/create` a Identik sin reemplazar correos.
- **Resultado: correspondencia de emails entre participantes VERLO, registro local Identik y solicitud HTTP a Identik CERTIFICADA POR INSPECCION DEL CODIGO ACTUAL.** No supone que se haya observado un envío real nuevo. Los documentos QA 32 y 33 históricos tienen destinatarios Gmail reales frente a leads `@example.com`, por lo que no sirven para certificar descarga autenticada de ambos participantes. No tocar estos registros ni desactivar la comprobacion de identidad para hacer pasar la prueba.
- **Falta únicamente, cuando se certifique un contrato real con los proveedores disponibles, observar el resultado de su entrega/descarga con identidades coincidentes**. No crear ni distribuir documentos nuevos solo para repetir esta correspondencia ya comprobada en código. La identidad biométrica Namirial continúa bloqueada por credenciales externas.

## Seguridad legacy: cierre aislado de escrituras no autenticadas — 16/11/2026

**Estado: validado en rama aislada, NO desplegado aun en la rama QA oficial ni en main.** Rama `security/legacy-property-api-closure`, ultimo SHA `bb94eccbe916ea7e9076065a4c404d48b90b74af`.

- `app/api/likes/create/route.ts` y `app/api/property-like/route.ts` anteriormente aceptaban `tenant_id` y otros IDs suministrados por el cliente y realizaban inserciones con clave de servicio sin comprobar la identidad. En la rama aislada sus handlers POST devuelven **HTTP 410**, `LEGACY_ENDPOINT_DISABLED`, `Cache-Control: no-store`, sin acceso a Supabase ni escritura.
- `tests/qa/legacy-property-api-closure.spec.ts` comprueba que ambas rutas estan desactivadas, sin referencia a service role, `insert`, `update` o `delete`; además protege que `app/api/property-action/route.ts` mantenga `auth.getUser(token)` y que el dashboard vigente continue usando `lead_matches`.
- [GitHub Actions de validacion aislada #43969091004](https://github.com/rentverlo-dotcom/verlo/actions/runs/43969091004) — **SUCCESS** en `bb94ecc`; instalación reproducible `npm ci` con Node 20 y pruebas específicas Playwright ejecutadas correctamente. No se volvieron a ejecutar los E2E comerciales, no hubo cobros ni firmas.
- **Pendiente de integracion deliberada:** incorporar solo estos cambios acotados en `qa/verlo-e2e` despues de revisar el impacto. La aprobacion de esta rama no equivale a un cambio en produccion. No crear nuevos merges indiscriminados.
- `GET /api/guardadas` conserva una identidad simulada y la pagina `/guardadas` aun lo consume: **pendiente de correccion autenticada separada**, no bloquear la pantalla hasta resolver su origen de sesion. Se han verificado referencias de `/api/property-action` desde el `MatchDeck` viejo; dicho endpoint exige token autentico; no se toco.
- **Depuraciones pospuestas:** `react-tinder-card`, `@react-spring/web`, pantallas swipe y migracion de Next/Node/lockfiles. Ninguna eliminacion de tablas, filas, views, auth, datos o claves; cero SQL de escritura. Alcance MVP congelado.

## Guardadas: correccion aislada de acceso por usuario — 16/11/2026

**Alcance:** solo rama aislada `security/legacy-property-api-closure`; NO integrado a `qa/verlo-e2e` ni `main`, NO probado por usuarios reales. SHA `e2c2a246d55b3aef4a5d4d226ec5c427ee3baa9e`.

- Se inspeccionaron sin modificar las columnas reales de `public.property_likes`, `properties` y `property_media` en Supabase produccion. `property_likes.tenant_id` tiene tipo `uuid`; `property_media` contiene `url,position,type`. La vista antigua esperaba `properties.cover_url`, columna que NO existe en `properties`.
- `GET /api/guardadas`: se elimino el identificador hardcodeado `00000000-0000-0000-0000-000000000001`; exige `Authorization: Bearer` y confirma el JWT con `auth.getUser()`; aplica `.eq('tenant_id', data.user.id)` antes de leer usando el cliente privilegiado; devuelve HTTP 401 para solicitudes no autenticadas, sin divulgar errores internos. La portada sale de `property_media` (primera foto ordenada por posicion), manteniendo la forma anterior de respuesta.
- `app/guardadas/page.tsx` obtiene la sesion local mediante el cliente Supabase existente y envia el Bearer de la sesion al endpoint; maneja ausencia de sesion, errores y lista vacia. No se modificaron matching actual, lead_matches, contratos ni pagos.
- `tests/qa/legacy-property-api-closure.spec.ts` ahora incluye aserciones de seguridad de `guardadas`, autenticacion, filtro por usuario y reemplazo de columna inexistente. **Aserciones estaticas**: no constituyen una descarga efectiva de las guardadas de dos usuarios distintos.
- [Actions #43971435716](https://github.com/rentverlo-dotcom/verlo/actions/runs/43971435716) fallo por un chequeo global `npx tsc --noEmit` sobre un `tsconfig.json` historico minimo (sin JSX/esModuleInterop). El chequeo de seguridad no se ejecuto en ese intento. Este es un **bloqueo de configuracion TypeScript global**, no prueba de un fallo en las nuevas rutas. No se modifico `tsconfig.json`.
- [Actions #43971612245](https://github.com/rentverlo-dotcom/verlo/actions/runs/43971612245) **SUCCESS**, tras separar la verificacion global TypeScript de las pruebas acotadas: `npm ci` Node 20 y pruebas de endpoints legacy + `guardadas` aprobadas en el SHA aislado `e2c2a24`.
- **Pendiente previo a integracion y release:** comprobar compilacion de produccion bajo la version de Node/Next definitiva y, cuando haya un entorno con login de prueba, probar autenticacion y aislamiento de dos sesiones. No declarar certificacion completa de guardadas basandose solo en lectura estatica.
- No se escribieron filas ni esquema en Supabase, no se alteraron clientes, y no se borraron registros `property_likes` historicos. Garante fuera de alcance hasta pos-lanzamiento.

## Limpieza de dependencias swipe legacy — 16/11/2026

**Estado: validada en rama aislada; NO incorporada aun a `qa/verlo-e2e` ni a `main`.** Rama `security/legacy-dependency-cleanup`, SHA final `d6707e3a5b87f34ff759691154f3577a3edb33cf`.

- Sin imports de runtime en `app/`, `components/`, `lib/` u `owner/`: `react-tinder-card` y `@react-spring/web` solamente figuraban como dependencias antiguas. Se quitaron de `package.json` y de los lockfiles `package-lock.json` y `pnpm-lock.yaml`. No se tocaron componentes o rutas del matching, ni codigo de negocio, ni React ni Next.
- El lockfile pnpm tenia una **inconsistencia preexistente**: faltaba `web-push` (ya en `package.json`). La primera prueba fue roja por esta discrepancia; se regenero y sincronizo el lockfile en rama aislada por CI, preservando su dependencia. No se retiro `web-push`.
- [Actions #43972699803](https://github.com/rentverlo-dotcom/verlo/actions/runs/43972699803) **SUCCESS**: ausencia de imports legacy en fuentes, `npm ci` limpio Node 20, regeneracion pnpm con `--lockfile-only --no-frozen-lockfile`, luego instalación `pnpm --frozen-lockfile --ignore-scripts`, y pruebas Playwright especificas de seguridad legacy + guardadas. El push final de la normalizacion de pnpm queda como `d6707e3` y fue precedido por la validacion del archivo generado en esa ejecucion.
- Los intentos #43972513395 y #43972542297 fallaron antes de poder validar pnpm por el lockfile desactualizado; **no representan un error funcional de VERLO**, y su causa queda cerrada en el archivo regenerado.
- **Limitaciones:** esta tanda no prueba build con Next.js 15, ni TypeScript global (tsconfig original incompleto), ni completa regresion comercial. No ejecutar nuevas pruebas de pagos/Identik por esta limpieza. El retiro de pantallas y tablas swipe antiguas es independiente y queda fuera del corte minimo de lanzamiento.
- **Sin cambios en producción, Supabase, main o QA funcional**; solamente ramas de seguridad aisladas y documentación de evidencia en QA. Evitar integrar estas ramas sin la prueba final de build y la lista de archivos de release.

## Framework seguro Next.js 15 — validacion aislada 16/11/2026

**Resultado: ACTUALIZACION DE NEXT.JS PREPARADA Y COMPILADA EN RAMA AISLADA, NO INTEGRADA A QA COMERCIAL NI A MAIN.** Rama `security/next15-patched-upgrade`, SHA final con paquetes fijados y lockfiles `c01c8c914f0ecb849e90e4449e02d3a427e1930e`. `qa/verlo-e2e` y `main` mantienen sus versiones anteriores; este apartado NO certifica una promocion a produccion.

- **Versiones exactas:** Next.js `15.5.29` (parche de seguridad de 03/11/2026), React y React DOM `19.3.1`, tipos React y React DOM `19.3.0`, entorno de prueba Node `24`.
- Las librerias legacy de swipe `react-tinder-card` y `@react-spring/web` continuan excluidas. Se fijaron las nuevas versiones en `package.json`; `package-lock.json` y `pnpm-lock.yaml` se regeneraron y validaron; `tsconfig.json` normalizado por Next durante el build, manteniendo `tests` fuera del chequeo TypeScript del **build de aplicacion** (se ejecutan por separado con Playwright).
- **Cambios acotados de compatibilidad:** `params` asincronos en `app/alquileres/[zona]/page.tsx`, `app/temporarios/[localidad]/page.tsx`, `app/api/enums/[name]/route.ts`, `app/api/matches/[id]/approve-guarantee/route.ts`, `app/api/temporarios/media/view/[id]/route.ts`; `searchParams` asincronos en `app/mockup-lab/page.tsx`; boundary React Suspense en `app/success/page.tsx`, `app/tenant/validacion/[token]/page.tsx`, `app/temporarios/success/inquilino/page.tsx` y `app/temporarios/success/propietario/page.tsx`; tipado explicito para listas de usuarios Supabase en dos endpoints QA PowerMarket. Sin modificaciones intencionales de logica de matching, precios, pagos ni firmas.
- [Actions #43975876881](https://github.com/rentverlo-dotcom/verlo/actions/runs/43975876881) **SUCCESS**: instalacion temporal de Next/React, build completo y pruebas aisladas de seguridad. Los previos diagnosticos fallaron por `npm ci` antiguo con Node24, nuevas firmas asincronas de rutas, tipado, exigencia de Suspense y variables faltantes en el entorno CI, sin demostrar defectos comerciales.
- [Actions #43976150025](https://github.com/rentverlo-dotcom/verlo/actions/runs/43976150025) **SUCCESS** en SHA `e63aa44`: regeneracion del lock npm, `npm ci` limpio, regeneracion pnpm, instalacion `pnpm --frozen-lockfile`, comprobacion de versiones exactas, build de produccion Next 15 y pruebas Playwright acotadas, todas aprobadas. Tras esas verificaciones, el mismo job **escribio los lockfiles y tsconfig probados** mediante commit bot `c01c8c9` en la rama aislada. El SHA exacto de certificacion del run es `e63aa44`; los archivos generados y certificados quedaron guardados en `c01c8c9` sin volver a ejecutar el workflow sobre ese SHA.
- Durante el build aislado se usaron URL/keys Supabase de prueba, claves R2 ficticias y VAPID efimeras generadas por CI. No se consultaron clientes reales, no hubo acceso a cuentas R2, Push, Mercado Pago, Identik o Namirial; no se expusieron secretos reales.
- **NO certificar aun:** despliegue Vercel con estas nuevas versiones, regresion E2E de flujos comerciales bajo Next15, comportamiento real de auth/email/push, ni fusion selectiva QA→main. El hecho de que el build y las pruebas especificas pasen NO equivale a release aprobada.
- **Deuda de pruebas documentada:** `tests/seo-regression.spec.ts` tenia error TS de sintaxis, y `tests/qa/zeptomail-transport.spec.ts` presenta tipado `ProcessEnv` al incluir tests en el tsconfig de la aplicacion. Estos archivos NO fueron editados; se excluyen del typecheck del build de aplicacion y se ejecutan por su runner correspondiente cuando procede. No fingir que estos tests estan certificados por el build.
- **Nuevo riesgo de seguridad encontrado durante la migracion:** `app/api/matches/[id]/approve-guarantee/route.ts` contiene un POST legacy que actualiza `match_guarantee_reviews` utilizando service role sin comprobacion de actor visible en el handler. Requiere clasificacion de usos y cierre/seguridad especifica antes de promover release. La adaptacion de `params` fue solamente de tipo, NO corrige esa autorizacion.
- **Siguiente paso:** revisar diffs y el estado del Preview de la rama aislada; validar seguridad de endpoints legacy y hacer una regresion comercial acotada, sin repetir cobros ni firmas externas. No pasar las ramas aisladas enteras a `main` sin seleccionar los archivos de release. No modificar Supabase sin la revision previa y ejecucion por el propietario.

## Cierre aislado de aprobaciones de garantia legacy — 16/11/2026

**Estado: correccion de seguridad probada en rama aislada, NO integrada en `qa/verlo-e2e` ni `main`, NO promocionada a produccion.** Rama `security/legacy-guarantee-api-closure`; SHA de certificacion `996e042adf8f5d9a3cc823147be4b3e76172a52c`.

- Inspeccion de referencias del repositorio: `match_guarantee_reviews` aparece como escritura en **dos rutas antiguas**, `app/api/matches/approve/route.ts` y `app/api/matches/[id]/approve-guarantee/route.ts`. La primera tambien alteraba `matches` mediante `transition_match_status` y usaba un envio historico de WhatsApp. Ambas aceptaban solicitudes POST sin verificacion de identidad, y empleaban `SUPABASE_SERVICE_ROLE_KEY` para aprobar. No se encontraron llamadas internas a esas URLs en la busqueda de codigo. Esto NO prueba ausencia de clientes externos o links previamente emitidos.
- Se reemplazaron **solo los POST de esas dos rutas** por respuestas `410 LEGACY_ENDPOINT_DISABLED` con `Cache-Control: no-store`, sin inicializar clientes Supabase ni realizar escrituras. No se eliminaron tablas, filas ni policies; la rama aislada hereda la migracion Next 15 ya certificada.
- El flujo actual separado del socio usa `app/api/powermarket/applications/route.ts` con Supabase `auth.getUser`, validacion de usuario activo en `caucion_partner_users` y decision atomica `caucion_record_partner_decision`. Ninguna ruta de PowerMarket, firma de contratos o pagos fue modificada por esta tanda.
- `tests/qa/legacy-guarantee-closure.spec.ts` fija aserciones de codigo: ambos endpoints sin escrituras y con 410; la ruta vigente mantiene autenticacion y decision atomica. Se corrieron tambien `tests/qa/legacy-property-api-closure.spec.ts`.
- [GitHub Actions #43979926490](https://github.com/rentverlo-dotcom/verlo/actions/runs/43979926490): **SUCCESS** en `996e042`, con `npm ci` sobre Next15/React19/Node24 y pruebas acotadas de seguridad aprobadas. Sin envio de notificaciones, nuevos pagos ni firmas a proveedores.
- **Pendiente antes del release:** integrar selectivamente estos cambios, comprobar que los endpoints 410 no sean utilizados por navegacion real, validar Preview del paquete definitivo y respetar la evidencia E2E comercial existente. No se autoriza considerar esto probado end-to-end con PowerMarket por el solo hecho de aprobar estas aserciones estaticas.
- **Datos y ambientes:** ningun SQL de escritura ni alteracion en Supabase, `main` o `qa/verlo-e2e` funcional. La unica modificacion en QA es esta evidencia documental.

## Integracion controlada: PR draft #28 y divergencia QA — 16/11/2026

**Estado: PR abierto como DRAFT, SIN MERGE NI CAMBIO DE LA RAMA QA FUNCIONAL O PRODUCCION.** [PR #28](https://github.com/rentverlo-dotcom/verlo/pull/28): `security/legacy-guarantee-api-closure` → `qa/verlo-e2e`. Su estado inicial: `mergeable=false`; no aprobar hasta revisar divergencia.

- Comparacion exacta al momento del registro: rama de seguridad **48 commits por delante y 5 por detras** de `qa/verlo-e2e` (divergieron). El diff muestra **28 archivos**, incluyendo **5 workflows de diagnostico/seguridad** que no deberian promocionarse ciegamente a `main`; incluye tambien `package.json`, `package-lock.json`, `pnpm-lock.yaml`, `tsconfig.json`, handlers deshabilitados y cambios de compatibilidad Next15/React19.
- QA actual vs `main`: **397 commits adelante y 0 atras**. Hay cambios comerciales requeridos en Identik/mercadopago/PowerMarket/Temporarios, pero tambien rutas y workflows exclusivos de QA. **Prohibido fusionar sin separar** o se arriesga a promover infraestructura de prueba.
- PR #28 es solamente una superficie de revision; **NO se ha incorporado** a QA comercial ni a `main`. No autorizar merge automatico o deploy productivo por el estado de Actions verdes de una rama aislada.
- Dependencias cerradas: Next15 `15.5.29`, React19 `19.3.1`, Node24, lockfiles; CI #43976150025 SUCCESS; API garantías antiguas HTTP410 y CI #43979926490 SUCCESS. Todo esto se obtuvo en rama aislada.
- **Pendientes internos verificables:** reconciliar los cinco commits nuevos QA sin sobrescribirlos; revisar si rutas bloqueadas tienen consumidores externos; validar Preview final y `/guardadas` con dos sesiones reales; probar un conjunto minimo de rutas comerciales en Next15; preparar release selectivo de los cambios de QA sin incluir endpoints `/api/qa/*` ni workflows de prueba.
- **Pendientes externos** (no dar por certificados por los tests actuales): credenciales y validacion real Namirial; resolucion/aprobacion/certificado de PowerMarket; primer correo de ZeptoMail realmente recibido; operativa final Identik produccion y eventuales verificaciones Mercado Pago segun preflight.
- **Criterio para seguir:** cierre de riesgos de seguridad y paquete de release, sin nuevas funcionalidades, sin nuevas pruebas pagas externas, sin tocar Supabase sin SQL y revision previa por el propietario.

## Integracion selectiva de seguridad y Next15 — 16/11/2026 (PR #29)

**Estado: rama de release aislada + PR draft, SIN MERGE A QA NI MAIN, SIN CAMBIOS EN SUPABASE.** Se reemplazo el PR #28 (cerrado sin fusionar) por [PR #29](https://github.com/rentverlo-dotcom/verlo/pull/29).

- Rama creada desde `qa/verlo-e2e` en commit `393e2b19d883b04a10e86026265f12b984c64531`: `release/qa-safe-integration-2026-11-16`. El commit selectivo `ad09532bc9493a0fbeed7cefb1b6de768061c871` incorpora **23 archivos** exactos desde la rama `security/legacy-guarantee-api-closure` sin merge de historias: handlers legacy bloqueados, `/guardadas` protegido por JWT/filtro de actor, compatibilidad Next15, `package.json`, ambos lockfiles y `tsconfig.json`, dos specs Playwright.
- Se excluyeron **cinco workflows de diagnostico** de las ramas aisladas y se preservaron **todos los archivos de QA que no forman parte del paquete**, incluido este registro; no se borraron datos ni archivos comerciales existentes. Se agrego un solo workflow temporal de certificacion `.github/workflows/qa-safe-release-gate.yml` en commit `9eb733a2e6c91a61c87fc82cf6d1fdbfa7fbc383` para revisar este paquete en la nueva rama. No debe promocionarse automaticamente a `main`.
- PR #28 `security/legacy-guarantee-api-closure → qa/verlo-e2e`: **CERRADO, NO MERGEADO** por divergencia (48 commits adelante y 6 atras de QA al verificar). **No usar PR #28** para integrar. PR #29 `release/qa-safe-integration-2026-11-16 → qa/verlo-e2e`: **DRAFT, ABIERTO, NO MERGEADO**.
- [Actions #43984890186](https://github.com/rentverlo-dotcom/verlo/actions/runs/43984890186): **SUCCESS** en commit `9eb733a` de release selectivo: versiones fijadas, `npm ci`, `pnpm --frozen-lockfile`, generacion efimera de VAPID para compilacion offline, **`next build` de produccion exitoso** y tests Playwright especificos sobre endpoints legacy y preservacion de PowerMarket, todos aprobados. Esto no certifica sesiones reales, entrega email, pagos ni firmas.
- Vercel Preview del commit `9eb733a`: al consultar su estado figuraba **pending**, no afirmar despliegue aprobado hasta comprobarlo. PR #29 permanecia **draft y sin merge**.
- Compromisos pendientes: revisar y aprobar compilacion build Next15 en QA base actual, tests de endpoints 410, Preview Vercel y regresion acotada con login (especialmente aislamiento `/guardadas` para dos sesiones). Solo luego plantear fusion a QA, nunca a `main` sin autorizacion y preflight de datos.
- **Mantener alcance congelado:** no sumar features, no repetir pagos/firmas de terceros, preservar la base productiva y no ejecutar SQL de escritura sin que el propietario lo vea previamente.

## Aislamiento automatizado de guardadas — 17/11/2026

**Estado: prueba ejecutada y APROBADA en rama de release aislada, NO integrada en QA ni main.** [Actions #43993031911](https://github.com/rentverlo-dotcom/verlo/actions/runs/43993031911), SHA `3cbe0bc`, **SUCCESS**: build Next15/React19 con Node24 y **9 tests aprobados**, incluidos dos tests nuevos de aislamiento de guardadas. Sin credenciales reales ni cambios Supabase.

- Se creo `tests/qa/guardadas-session-isolation.spec.ts` en la rama `release/qa-safe-integration-2026-11-16` (`c3d24cc`). El test **transpila y ejecuta el GET real** de `app/api/guardadas/route.ts` en un contexto aislado con reemplazo en memoria de los adaptadores Supabase Auth y de lectura en base. Usa dos identidades UUID ficticias y tokens de prueba, no sesiones reales ni cuentas persistidas.
- Comprueba que una solicitud anonima recibe HTTP 401 sin consultar el cliente privilegiado; que un token invalido recibe HTTP 401 sin consultas; que token A solo obtiene la propiedad A, token B solo la B, las consultas llevan `.eq('tenant_id', identidad_validada)`, y se retorna `Cache-Control: no-store`.
- **Alcance real:** se certifico el flujo de autorizacion y filtro a nivel handler mediante un test dinamico aislado, mas fuerte que aserciones estaticas. **NO es un E2E con Supabase QA real ni prueba entrega/validacion criptografica de JWT por servidor de Supabase**: el adaptador `auth.getUser` esta simulado. No declarar acceso real certificado ni prometer que dos usuarios reales fueron creados/probados.
- La restriccion del propietario se respeto: **cero escritura sobre Supabase QA o produccion**, cero creacion de usuarios, cero datos de guardadas adicionales y ningun envio de proveedores. Para una prueba real de Auth+DB se necesitan cuentas de prueba ya provisionadas en QA, sin crear datos sin revision/permiso explicitos.
- Siguiente puerta: verificar Preview del ultimo SHA del PR #29 y decidir si la prueba automatizada a nivel handler cubre el corte MVP o se habilita una prueba independiente de integracion con credenciales QA ya existentes. Mantener PR #29 draft, sin merge a `main`.

## Verificacion final de consumidores legacy — 17/11/2026

**Estado:** control nuevo aprobado en rama aislada `release/qa-safe-integration-2026-11-16`, commit `b1b434320a4952661d4802bd8adf79fd3057f17d`; **sin fusion a QA ni main ni cambios de Supabase**.

- [GitHub Actions #43994592714](https://github.com/rentverlo-dotcom/verlo/actions/runs/43994592714): **SUCCESS** con **10/10 tests** aprobados, instalacion reproducible npm y pnpm, build de produccion Next15 y suite acotada de seguridad.
- Se agrego un test que recorre los archivos versionados bajo `app/`, `components/`, `lib/` y `scripts/` para detectar consumidores internos de las URLs legacy `/api/matches/approve` y `approve-guarantee`, excluyendo los dos handlers obsoletos. **No se encontraron consumidores de esas rutas en codigo de aplicacion versionado**. Esto no certifica ausencia de consumidores externos que puedan conservar URLs anteriores.
- Las pruebas anteriores de `/guardadas` con dos identidades simuladas y bloqueo de llamadas anonimas siguen verdes. **No hubo autenticacion en vivo en Supabase QA** ni se crearon o alteraron cuentas/likes.
- Preview Vercel READY previamente confirmado en `3cbe0bc` (build aislado; no prod). El ultimo commit `b1b4343` tiene Actions SUCCESS, y Vercel se debe comprobar por commit antes de integracion.
- Se mantiene PR #29 **DRAFT**, sin fusion. Siguiente control: comprobar Preview del SHA de test y decidir la integracion QA selectiva siguiendo las barreras de release. No promover a `main` solo por este estado verde.

## Prelaunch: inventario de exclusiones de QA — 17/11/2026

**Accion completada:** documento de corte selectivo [`docs/release/2026-11-17-prelaunch-scope-gate.md`](https://github.com/rentverlo-dotcom/verlo/blob/qa/verlo-e2e/docs/release/2026-11-17-prelaunch-scope-gate.md) agregado en QA, commit `68dc47e`.

- Comparacion `main...qa/verlo-e2e`: **402 commits adelante de main** (sin atras), **147 archivos** de diff. **23 endpoints de pruebas `app/api/qa/*`** y dos workflows de QA presentes. **No fusionar QA integra a produccion.**
- Integracion aislada PR #29 no se fusiono; el workflow de diagnostico de release tampoco se incorpora automaticamente a main.
- La certificacion automatizada más reciente de seguridad: [Actions #43994592714](https://github.com/rentverlo-dotcom/verlo/actions/runs/43994592714) **10/10 passed**, Next15 build SUCCESS. Vercel READY confirmado para versiones anteriores de la rama, **no afirmar Ready del ultimo commit sin inspeccion explicita**.
- Proxima accion: construir paquete comercial de release selectivo, excluyendo utilidades QA por defecto; solo despues verificar migraciones necesarias con SQL mostrado al propietario, y completar proveedores reales.
- Solo evidencia/documentacion cambiada en QA; `main` y Supabase no tocados.

## PowerMarket: preparación de tres casos con contratos — 17/11/2026

- Verificado **solo lectura** en Supabase `VERLO-QA` (ref `anptswspguyotnasoacq`): solicitud DEMO `af0ac065-89d3-4630-8f60-053f5ae13766`, inquilino `1a87a179-9059-441e-bd55-bd5b9d70fee3`, ingreso $2.800.000, alquiler $800.000, expensas $120.000, estado `submitted`, **sin `lead_contracts` y sin `caucion_contract_reviews`**. No se cambió ningún dato.
- Inspeccionados esquemas y restricciones reales de `lead_intake`, `lead_matches`, `lead_contracts`, `caucion_applications`, `caucion_contract_reviews`. Cada contrato requiere `lead_match_id`, tenant y owner relacionados. El trigger `caucion_push_application_trigger` genera eventos/entregas QA al insertar solicitudes.
- SQL **SOLO PROPUESTO Y NO EJECUTADO**: [`docs/qa/powermarket-three-scenarios-draft-2026-11-17.sql`](https://github.com/rentverlo-dotcom/verlo/blob/qa/verlo-e2e/docs/qa/powermarket-three-scenarios-draft-2026-11-17.sql) (commit `220abf5`), crea 2 nuevas solicitudes sintéticas y 3 contratos textuales de QA ligados a matches, conserva la DEMO existente, protege contra dobles inserciones y valida el entorno mediante referencia DEMO. Se ofrece **al propietario para revisión y ejecución manual en Supabase QA**, NUNCA sobre producción. No crear datos de forma automática.
- **IMPORTANTE:** ningún PDF fue publicado ni se puede declarar acceso a contratos probado. Los PDFs requieren subida al bucket privado `tenant-documents` y publicación mediante `caucion_publish_contract_review` usando el flujo `/api/powermarket/contract-reviews/publish`; solo permitido cuando la solicitud pase a `under_review`, `prequalified` o `alternative_offered` de forma legítima. El SQL propuesto no cambia decisiones ni simula aprobación de PowerMarket. Aún falta probar la apertura real por el operador autorizado.
- En la UI, el PDF vigente se obtiene con URL firmada de 60 segundos; puede generarse una nueva. Las versiones `superseded` se bloquean por diseño y su conservación/consulta histórica debe acordarse expresamente si PowerMarket exige ver todas las versiones.
- Se mantiene alcance congelado; no hubo merge a `main`, acciones de proveedores, escrituras Supabase ni impacto en producción.

## PowerMarket: publisher de tres PDFs privados — 17/11/2026

**Estado: solución QA implementada, publicación NO ejecutada y SQL pendiente de ejecutar por el propietario; nada publicado aún.** Commits `5b0a8d5`, `7931312`, `f036144`, `c1e6a7c`, `d345f24`.

- Lectura Supabase VERLO-QA `anptswspguyotnasoacq`: las 3 solicitudes son `submitted`, con 1 contrato `generated` cada una, contenido breve de 407 bytes, 0 `caucion_contract_reviews`; bucket `tenant-documents` existe y es privado. No se consultó/escribió producción.
- **SQL de revisión obligatoria:** [`docs/qa/powermarket-demo-enable-review-2026-11-17.sql`](https://github.com/rentverlo-dotcom/verlo/blob/qa/verlo-e2e/docs/qa/powermarket-demo-enable-review-2026-11-17.sql). Cambia solamente las 3 solicitudes DEMO `submitted` a `under_review` y reemplaza el texto mínimo por documentos contractuales de demostración con varias cláusulas, debidamente identificados como NO FIRMADOS y SIN VALIDEZ COMERCIAL. Exige 3 IDs/e-mails/source exactos, contratos generados y 0 reviews; dentro de transacción con rollback por inconsistencias. **NO EJECUTADO POR EL ASISTENTE.** Efectos secundarios QA esperados: eventos y entregas push de cambio de estado.
- **Publicador QA implementado:** [`app/api/qa/powermarket/demo-pdfs/route.ts`](https://github.com/rentverlo-dotcom/verlo/blob/qa/verlo-e2e/app/api/qa/powermarket/demo-pdfs/route.ts). Requiere ambiente preview/QA exacto + token GitHub OIDC firmado, atado a nombre workflow, rama y SHA desplegado; rechaza cualquier UUID o cuenta fuera de las 3 DEMO. Verifica los 3 contratos antes de escribir, genera PDFs con el generador VERLO, sube a bucket privado sin overwrite, publica via RPC transaccional `caucion_publish_contract_review`, vuelve a descargar y compara hash SHA256 del archivo y registro por caso; tolera reintentos tras interrupciones para el mismo contenido. No simula aprobaciones, documentos de ingresos, pagos ni pólizas.
- Workflow manual bajo demanda [`.github/workflows/powermarket-demo-pdf-qa.yml`](https://github.com/rentverlo-dotcom/verlo/blob/qa/verlo-e2e/.github/workflows/powermarket-demo-pdf-qa.yml) valida QA commit exacto antes de emitir OIDC y ejecutar la publicación. **No ejecutar hasta SQL confirmado**, evita clientes y cron/productivo.
- `middleware.ts` permite la ruta exclusivamente en preview QA (commit `d345f24`); funciones previas se preservan. Validar Vercel READY del SHA final antes del workflow. Mientras tanto, el dashboard mostrará "Todavía no hay contratos vinculados" correctamente.
- **Prueba pendiente de cierre:** verificar 3 revisiones publicadas y 3 PDFs privados SHA verificados por Actions; luego abrir con el operador autorizado o probar descarga con sesión partner, sin afirmar que ya fue validada. Esta preparación no equivale a E2E completado.
- No se tocó `main`, no hubo SQL de escritura ni se ejecutó ninguna operación con proveedores. El alcance comercial sigue congelado.

## PowerMarket: TRES PDFs publicados y verificados — 17/11/2026

**RESULTADO APROBADO EN VERLO-QA**, no en producción. El operador ejecutó SQL exclusivamente en Supabase QA para completar los tres contratos demo y poner sus solicitudes en `under_review`. Después corrigió el `search_path` de las tres funciones `caucion_publish_contract_review`, `caucion_decide_contract_review`, `caucion_confirm_partner_operation` a `public, extensions, pg_temp` (pgcrypto.d igest reside en schema extensions). El asistente validó los valores mediante consultas solo lectura; no ejecutó SQL de escritura.

- [GitHub Actions #44095262499](https://github.com/rentverlo-dotcom/verlo/actions/runs/44095262499), segundo intento de job `publish-and-verify`: **SUCCESS**; exigió correspondencia QA Preview exacta y token GitHub OIDC, publicó tres PDFs privados con el generador VERLO, volvió a descargarlos y validó SHA256 de bytes y de registros.
- La **primera ejecución del mismo workflow** falló por `PUBLICATION_FAILED` en la primera solicitud (un archivo se había subido al bucket antes del fallo RPC). Se confirmó que el handler soportaba reintento del mismo contenido sin overwrite. La corrección fue en Supabase QA, no en producción.
- Verificación SQL **solo lectura tras la ejecución aprobada**: tres registros de `caucion_contract_reviews`, todos `version=1`, `status=pending`, con claves privadas `powermarket/contracts/{application}/{contract}/v1.pdf`. Identificadores de revisión: demo inicial `f51b5bf2-1b8f-4c03-8a89-9b006be2c8e9`; ingresos bajos `1142632c-d061-40b8-bc5f-92c5de053a7d`; monotributista `7adfd4d1-bd9b-41a8-85b3-9d560ea052c2`. No hubo cambio de estado a aprobado, cobro ni emisión de póliza.
- **Pendiente de prueba**: que el usuario partner con sesión real pueda cargar las 3 fichas, pulsar `Consultar contratos pendientes` y abrir sus PDF desde la ruta privada firmada. No afirmar prueba UI/sesión final completada hasta observar esa evidencia.
- `qa/verlo-e2e` fue la única rama funcional modificada para el publisher. `main` y Supabase producción permanecen sin cambios.

## Poder contractual de PowerMarket removido: gate de caucion — 17/11/2026

**Usuario confirmó alcance:** en contratos con caución PowerMarket solamente evalúa la caución, NO aprueba contenido contractual ni exige revisión contractual para firma/póliza; el PDF queda disponible para consulta. En contratos sin caución se conserva flujo habitual.

**Cambios implementados solo en `qa/verlo-e2e`**:
- `lib/powermarket/signing-approval.ts` commit `d5165c7`: deja de consultar `caucion_contract_reviews`; acepta cauciones `prequalified` o `alternative_offered` vigentes y sin ambigüedad; bloquea estados pendientes, rechazados y vencidos; sin caución retorna `no_caucion`.
- `app/api/powermarket/policies/route.ts` commit `456fde1`: crear/avanzar póliza requiere caución aprobada, contrato asociado al mismo inquilino y cotización vigente; elimina exigencia `approval.reviewId`.
- `app/api/powermarket/policy-certificate/route.ts` commit `e1fb38e`: no exige revisión aprobada del PDF; conserva guardas de operador, estado `payment_confirmed`, relación caución/contrato y bucket privado.
- `app/api/powermarket/contract-reviews/route.ts` commit `cfccb43`: GET de consulta intacto; PATCH que aprobaba/sugería cambios pasa a `410 CONTRACT_REVIEW_DECISIONS_DISABLED`. Botones ya eliminados de UI PowerMarket en `461ac4d`.
- `tests/qa/powermarket-no-contract-authorization.spec.ts` `e4d6b45` y gate Actions [#44137707281](https://github.com/rentverlo-dotcom/verlo/actions/runs/44137707281) **SUCCESS** (sin servicios externos ni mutaciones de DB). CI commit `84a6f10`.

**BLOQUEO PENDIENTE DE SQL QA:** la función real `public.caucion_confirm_partner_operation(uuid,uuid)` (verificada por lectura `pg_get_functiondef` en Supabase VERLO-QA) todavía consulta `caucion_contract_reviews` y exige `v_review.status='approved'`, de modo que la confirmación de operación de caución permanecerá bloqueada mientras no se reemplace esta función de forma atómica por una versión sin veto contractual. **EL ASISTENTE NO EJECUTÓ SQL DE ESCRITURA.** El SQL exacto debe mostrarse al propietario para que lo aplique en VERLO-QA, verificar con `pg_get_functiondef` luego de aplicarlo, y solo posteriormente migrar de modo controlado a producción. **NO declarar circuito E2E de pago/caución confirmado hasta entonces.**

**Compatibilidad:** no se alteraron los PDFs existentes ni el generador de contratos. La función `checkPowerMarketSigningApproval` solo tenía como consumidores de código identificados las rutas de pólizas/certificado; la certificación directa del endpoint del proveedor de firma no se ha realizado en esta tanda. No se tocó `main` ni Supabase producción.

## Cierre operativo
- **Cierre funcional QA confirmado en Actions #280**. No repetir la suite sintetica por defecto.
- Prioridad siguiente: certificacion real y controlada de entrega Email + Push, auditoria de dependencia Next/Node y plan de migraciones sin tocar datos productivos.
- La lectura de enlaces de Identik ya tiene evidencia real de dos URLs; no volver a exigirle el mismo caso salvo cambio relevante o regresion final.
- Antes de liberar: revision de compatibilidad de Supabase (sin overwrite), actualizacion segura de Next.js/Node si sigue pendiente, prueba de permisos de descarga por ambos actores, notificaciones y pagos reales controlados, y E2E Namirial.
- No hay merge autorizado a `main` ni aprobacion para activar biometria sin Namirial.
