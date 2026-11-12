# VERLO — Puerta de salida a producción (preparación, sin ejecución)

Fecha: 2026-11-12. Alcance MVP congelado. Este documento es la lista de verificación técnica, **no** una autorización para hacer deploy de producción.

## Evidencia comprobada en QA
- Supabase QA: `anptswspguyotnasoacq`; producción: `bmgrpcqrdvwculrisasi`. Bases diferentes. No copiar datos de QA sobre producción.
- Identik Sandbox documento 33: `completed`. Su registro referencia **ambos** objetos privados del bucket `identik-contracts`: `signed.pdf` (913230 bytes, application/pdf) y `certificate.bin` (734572 bytes, application/octet-stream), verificado en `storage.objects` y `identik_electronic_documents` el 12/11/2026. El documento 32 permanece `pending`.
- GitHub Actions QA #194, segundo intento: QA E2E, Identik preflight y archive-completed aprobados. La mera aceptación del proveedor o el estado `completed` no certifica permisos de descarga: propietario e inquilino deben comprobarla.
- ZeptoMail: `verlo.lat` verificado en CPaaS; código usa `notificaciones@verlo.lat`, Reply-To `hola@verlo.lat`. En las variables de Vercel consultadas el 12/11/2026 no figuraban las llaves de ZeptoMail ni los flags de corte. **No** habilitar cola ni envíos hasta probar un único correo real y confirmar recepción y estados.
- El proyecto Vercel usa Node 24.x y el workflow QA instala Node 20. La instalación vía `npm ci` falló al intentar Node 24 por inconsistencias del `package-lock.json`. No improvisar el cambio; normalizar los lockfiles y probar la misma versión durante la certificación.
- `next` fijado en **14.0.0**, versión con advertencia de seguridad en logs de build de Vercel: actualizar a una versión corregida y evaluar impacto en una rama aislada; ejecutar tests y build antes de promulgar el release.

## Diferencias reales de datos y restricciones que NO se pueden ignorar
Lectura SQL únicamente, 12/11/2026:
- Producción `temporary_payment_attempts`: **2 registros `approved` con ARS 29.900**. QA tiene 0. Producción limita `amount_ars=29900`; QA limita `amount_ars=49999`.
- Producción `temporary_matches`: **2 registros `accepted`**. Su CHECK de `status` no permite `rejected`; QA sí.
- Producción `identik_electronic_documents`: 0 registros; QA: 2 registros.

**Bloqueo de migración:** no reemplazar el CHECK productivo de importes directamente con `amount_ars=49999`, porque invalidaría los dos pagos aprobados. Preparar migración **aditiva y transaccional** que preserve el monto histórico y fije el nuevo para altas; validar en copia o en transacción reversible antes de aplicar a producción. Evitar reescribir `approved`, fechas o importes históricos.

## Criterios bloqueantes por responsabilidad

| Bloque | Responsable | Evidencia antes de aprobar |
|---|---|---|
| Identik, firma | VERLO + Identik | Ambas partes firman; estado recuperable; webhooks + reconciliación sin pérdida; PDF + constancia recuperados con permisos reales; proveedor interrumpido sin pérdida |
| Namirial Onboarding | Namirial (credenciales) + VERLO | DNI frente/dorso, selfie, vivacidad, rechazo, error y reintento verificados con credenciales autorizadas |
| ZeptoMail | VERLO + Zoho | Un correo real recibido; sender/reply-to; estados de outbox y deduplicación; ningún envío masivo anterior a la habilitación |
| PowerMarket | VERLO + PowerMarket | Cotización vinculante, revisión, aprobación, cobro por socio, póliza y combinación con contrato; bloqueo de firma y 50 % de bonificación confirmados |
| Temporarios + Mercado Pago | VERLO | Pago sandbox, webhook autenticado, idempotencia y montos; reserva recibida por propietario; restricción migratoria compatible con históricos |
| Seguridad + dependencias | VERLO | Node/lockfile compatibles; Next.js corregido; permisos, RLS, archivos y secretos verificados; QA smoke en SHA exacto |
| Migración + lanzamiento | VERLO | Lista revisada de commits funcionales; **sin** rutas y mocks exclusivos QA; migraciones verificadas con respaldo; preproducción; rollback; smoke producción y PostHog |

## Orden operativo
1. Seguir construyendo/certificando código interno mientras Namirial y los datos fiscales se gestionan externamente.
2. Cerrar prueba privada de descarga de contratos y persistencia durable; no crear nuevos documentos Sandbox sin motivo.
3. Activar **prueba aislada** de ZeptoMail tras tener credenciales; no habilitar cutover total hasta recibirla.
4. Asegurar migración compatible con históricos. Separar commits QA puros de commits funcionales.
5. Corregir vulnerabilidades/lockfiles y repetir suite en versión definitiva.
6. Al recibir las credenciales/propuestas externas, ejecutar únicamente las E2E reales faltantes.
7. Revisión de producción, backups, migraciones revisadas, deploy staged, smoke, lanzamiento y medición.

**Regla:** CI verde != entregabilidad real, cobro real, archivo autorizado, ni lanzamiento seguro. No hacer merge indiscriminado de `qa/verlo-e2e`.
