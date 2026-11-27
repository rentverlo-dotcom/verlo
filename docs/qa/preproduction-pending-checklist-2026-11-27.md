# VERLO — checklist pendiente de QA antes del pase a producción

**Fecha:** 27/11/2026  
**Fuente:** `docs/qa/mvp-closure-2026-11.md`, `docs/qa/release-readiness-2026-11-12.md`, `docs/qa/mvp-evidence-register-2026-11.md` y verificación puntual del SHA `f6f9dc0`.

**Regla:** pertenece al alcance congelado de **44 tareas**, pero esta fuente NO enumera ni permite auditar individualmente qué n/44 están completas. Estas son **34 comprobaciones pendientes**, no nuevas funciones ni “34 de las 44”. Las casillas permanecen vacías hasta reunir evidencia del escenario exacto.

**Ya verificado (no repetir pruebas pagas):** Signatura QA `f6f9dc0` Preview READY y Actions offline SUCCESS; biometría inicial real previa; ramas y DB QA aisladas. Créditos disponibles según confirmación del titular; creación de documentos contractuales Signatura en QA y garantes registrados = 0 al último control. No consume créditos la preparación.

## 1. Seguridad e infraestructura

- [ ] Auditar Auth, RLS y permisos de archivos entre owner, tenant y garante
- [ ] Corregir versión Next.js 14.0.0 vulnerable; alinear Node 20/24 y package-lock; recompilar
- [ ] Certificar variables/flags, URL, buckets, secretos y aislamiento QA vs prod
- [ ] Regresión completa de seguridad y CI en SHA final

## 2. Tradicionales y Mi VERLO

- [ ] E2E visual del wizard owner, búsqueda tenant, ubicación y multimedia privada
- [ ] E2E matching mismo barrio/adyacente, casos incompatibles y duplicados
- [ ] E2E owner+tenant desde interés/visita a contrato y estados Mi VERLO
- [ ] Permisos por rol, URLs permanentes y acceso ajeno denegado

## 3. Email y Push

- [ ] Verificar dominio, remitente, cuenta y capacidad real de ZeptoMail
- [ ] Prueba aislada y autorizada: correo VERLO entregado y enlace correcto
- [ ] Certificar SMTP Supabase Auth remitente VERLO y acceso real del garante
- [ ] Probar dispatcher/crons, cola, duplicación/reintentos y errores de transporte
- [ ] Push opt-in en dispositivo de prueba; GHL/WhatsApp deshabilitados

## 4. Contratos, garantía y Signatura

- [ ] Preparar contrato QA legítimo de owner/tenant/garante y pago validado
- [ ] Invitación/activación segura desde formulario tenant y Mi VERLO del garante
- [ ] Subida privada escritura; owner revisa, descarga, adjunta informes y decide
- [ ] Rechazo/cambio documentación bloquea acuerdo y firma
- [ ] Validar legalmente cláusula de fianza y datos del inmueble en PDF
- [ ] Certificar mapeo inequívoco identidad/DNI/URL de cada firmante sin consumir crédito
- [ ] Ejecutar una sola prueba paga autorizada tras aprobar preflight
- [ ] Verificar biometrías, webhooks DS, reconciliación y PDF final descargable por 3
- [ ] MP tradicional: aprobado, rechazado y callback duplicado; firma bloqueada sin cobro

## 5. Temporarios

- [ ] E2E propietario/inquilino: propiedad, fechas, no solape, aceptación, reserva, contrato
- [ ] Tarifa ARS 49.999 y MP Sandbox: webhook, estado y emails
- [ ] Diseñar migración aditiva que preserve pagos históricos ARS 29.900 y estados

## 6. PowerMarket caución

- [ ] Prueba externa solicitada a PowerMarket: precalificación/propuesta/rechazo
- [ ] Confirmación de operación, pago, emisión y registro de comisión VERLO
- [ ] Bloqueo firma, bonificación 50 % contrato y notificación por email/push

## 7. Medición y preparación de release

- [ ] PostHog eventos/funnels Tradicionales Temporarios Caución errores
- [ ] Meta CAPI Purchase real/deduplicado; no confundir con test
- [ ] Regresión móvil, rutas críticas, SEO mínimo
- [ ] Auditar diff QA vs main y excluir rutas /api/qa, mocks y herramientas solo QA
- [ ] Backup + migraciones compatibles y reversibles sin borrar historial de producción
- [ ] Certificar SHA liberable y plan de smoke posterior a promoción de producción

## Puerta de salida (GO / NO GO)

- [ ] Todos los E2E bloqueantes acreditados con test, observación de usuario y datos persistidos de QA.
- [ ] Única prueba pagada Signatura autorizada, solo tras preflight gratuito y certificación de costo/mapeo. No reintentos automáticos ni uso de documentos históricos.
- [ ] PowerMarket, ZeptoMail, MP y firma final real certificados; si alguno falla: NO GO.
- [ ] Paquete de commits de negocio revisado y separado de QA; migraciones de producción presentadas al titular para revisión.
- [ ] Backup y rollback preparados; smoke supervisado posterior a despliegue y autorización final de release.

**Advertencia:** la preparación de producción no equivale a autorización de merge o escritura en Supabase producción. Prohibido copiar datos de QA sobre producción o borrar pagos históricos. No reactivar Identik/Namirial ni GHL: flujo elegido Signatura + ZeptoMail + Push.
