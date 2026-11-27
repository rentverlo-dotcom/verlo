# VERLO — CIERRE DEFINITIVO QA → MAIN → PRODUCCIÓN → META ADS

**Fecha:** 27/11/2026  
**Prioridad:** salir cuanto antes, sin nuevas funcionalidades.  
**Alcance congelado:** 44 tareas originales. Este documento agrupa lo verdaderamente bloqueante en **7 hitos de cierre**; NO son siete ítems nuevos ni equivale a calcular X/44. **Este checklist REEMPLAZA la anterior enumeración de 34 verificaciones**.

## Avances comprobados; NO repetir salvo fallo concreto

- `feature/signatura-qa-integration` HEAD `f6f9dc0018e6bb30b7744bd977fdd118c7a80769`: Vercel Preview **READY**, workflow GitHub Actions focalizado **SUCCESS** para el mismo SHA.
- Signatura: biometría inicial validada anteriormente en QA. Titular confirma créditos acreditados. **No crear otra declaración de identidad para volver a probar lo ya probado**.
- Garante y firma 2/3 actores desarrollados en rama Signatura, con gates; **falta E2E real**, no marcar como lanzado.
- `qa/verlo-e2e` y `main` continúan separadas; **no fusionar QA masivamente**.
- No interpretar READY como E2E. Última lectura QA disponible: 0 `signatura_contract_signings`, 0 `contract_guarantors`.
- Conservación de datos de producción obligatoria: pagos históricos temporarios de ARS 29.900; nueva tarifa ARS 49.999. No copiar base QA sobre producción.

## Los SIETE hitos pendientes de lanzamiento

- [ ] **1. Integrar rama Signatura + garantes en QA principal.** Revisar diffs y seleccionar cambios funcionales de `feature/signatura-qa-integration` sobre `qa/verlo-e2e`; confirmar que no faltan rutas y que compila en SHA consolidado. No arrastrar herramientas de diagnóstico a producción.
- [ ] **2. CERTIFICAR Signatura real y contrato.** Completar un solo expediente de prueba legítimo con owner/tenant/garante y pago/garantía aprobados; verificar identidad ↔ enlace de cada persona, cláusula de fianza legalmente apta, firma, webhooks y PDF final privado. Una única creación paga autorizada después de preflight gratuito; **no reintentos automáticos**, no repetir biometría previamente validada.
- [ ] **3. COMUNICACIONES funcionando.** Configurar y probar una entrega real autorizada ZeptoMail, remitente VERLO y acceso Auth del garante; verificar que el correo y Push operativos lleguen a Mi VERLO, con deduplicación. Deshabilitados GHL/WhatsApp. No hacer campaña masiva de prueba.
- [ ] **4. POWERMARKET / CAUCIÓN.** Obtener la prueba operativa con socio (precalificación/aceptación, confirmación de operación/pago, registro contable para VERLO); asegurar que sin pago/aprobación no se habilita firma. Bloqueo externo si socio no responde; no fabricar aprobación.
- [ ] **5. ÚNICA REGRESIÓN COMERCIAL FINAL.** Un recorrido válido por Tradicionales + Mi VERLO + MP, otro por Temporarios + reserva/contrato/tarifa ARS 49.999, y escenarios negativos críticos (pago rechazado, duplicación, acceso ajeno). Recuperar evidencia ya aprobada y no repetir más pruebas pagas por rutina. Arreglar solo defectos demostrables.
- [ ] **6. MIGRACIÓN SELECTIVA A MAIN Y PRODUCCIÓN.** Preparar PR/corte sin `/api/qa/*` ni mocks; corregir solo vulnerabilidad/Node-lockfile incompatible que impida un release seguro; backup; presentar SQL/migraciones productivas al titular para revisar, preservar datos existentes y monto histórico de temporarios, rollback. Aprobar merge a `main`, build de producción y flags tras certificar QA. No ejecutar cambios productivos silenciosos.
- [ ] **7. GO-LIVE + META ADS.** Smoke supervisado de `verlo.lat` (publicación, búsqueda, Mi VERLO, pagos, firma, comunicaciones), verificar eventos básicos PostHog y Meta Lead/Purchase para medir dinero real; habilitar campañas cuando el destino anunciado efectivamente funcione. Monitorear las primeras captaciones y compras; arreglar solo bloqueos reales.

## Qué NO agregamos antes del lanzamiento

- No nuevos paneles/dashboard, no nuevas integraciones, no nuevos journeys, no mejoras cosméticas, no refactorizaciones preventivas.
- No convertir SEO avanzado, tests extra hipotéticos, cambios de copy optativos o reportes exhaustivos en bloqueantes.
- No prometer porcentaje ni X/44; falta la enumeración canónica original por ítem, y el conteo de **7 hitos** representa el **camino restante**, no 7 tareas históricas.
- Cuando falte PowerMarket, reportar exclusivamente ese **bloqueo externo**; continuar los otros hitos. **Meta Ads no debe prometer un servicio cobrado o firmado que aún no funciona en producción.**

## Regla de finalización

**GO** al completar los siete hitos, con un único SHA liberable, operaciones reales sin fallos críticos, retorno de Signatura correcto, cobros vinculados y datos productivos preservados. **NO GO** mientras no funcione la oferta que se va a publicitar. Las pruebas de QA que ya tienen evidencia aprobada no se repiten. Ninguna modificación de `main`, Supabase producción o Vercel Production fue autorizada por este documento.
