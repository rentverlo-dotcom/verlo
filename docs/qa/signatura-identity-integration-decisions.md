# VERLO / Signatura - reglas de integracion QA

## Flujo confirmado
1. Primera solicitud de visita: solo el tenant firma UNA declaracion de identidad VERLO, con DNI frente/dorso y selfie obligatorios. Owner no valida ni firma en esa etapa.
2. VERLO asocia esa identidad validada a la cuenta tenant para reutilizarla en distintas visitas mientras este vigente. Esa reutilizacion es logica propia de VERLO.
3. Al contrato de alquiler: AMBAS partes (tenant y owner) se validan y firman el contrato. Es un documento y un acto juridico distinto de la declaracion inicial.
4. El propietario nunca paga. Esto no significa que el proveedor no le facture a VERLO una validacion biometrica del owner.
5. Mi VERLO es el punto de entrada, retorno y consulta del estado; no compartir DNI, selfie ni certificado con datos sensibles con owners.
6. Costos Signatura pendientes de conversacion con Rodrigo. No asumir plan ni cambiar precios.

## Implementacion tecnica ya verificada
- Rama feature/signatura-qa-integration, Supabase QA anptswspguyotnasoacq, sin cambios a main ni produccion.
- lib/signatura/client.ts ya tiene POST /documents/create con BI y complete_url; el helper para declaracion inicial no envia invite_channel EM ni PH.
- Webhook QA con validacion HMAC: document_signed y document_status_changed persistidos en signatura_webhook_events.
- El receptor de webhooks NO valida automaticamente identidad ni marca contratos firmados: falta reconciliacion contra API y asociacion a la cuenta autenticada.

## Pendiente clave antes de conectar el CTA
- Confirmar como obtener URL de FIRMA por API (no confundirla con complete_url, que es solo el regreso a VERLO). La respuesta documentada de POST /documents/create muestra IDs pero no un enlace.
- Aprobar contenido definitivo del PDF de declaracion de identidad (no reutilizar contrato de alquiler).
- Crear ruta QA autenticada con aislamiento y proteccion anti-duplicados, persistir tenant-document-signature, verificar estado real con API, reconciliar webhooks, habilitar CTA en Mi VERLO.
- Comprobar consentimiento explicito en UX y ejecutar E2E con primera validacion, varias visitas, firma contractual de ambas partes.
- Mantener intactos Identik, Mercado Pago, PowerMarket y los circuitos actuales de produccion.
