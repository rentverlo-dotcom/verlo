# VERLO Temporarios — reutilización del cierre de VERLO tradicional

## Fuentes revisadas de `main`
- `app/cierre/[token]/page.tsx`: interfaz de cierre con vista diferenciada para dueño/inquilino.
- `app/api/closing-view/route.ts`: vista privada del cierre; acceso con token y documentos.
- `app/api/closing-legal-data/route.ts`: captura y persistencia de datos legales.
- `app/api/closing-generate/route.ts`: armado del contenido contractual tras las aprobaciones; notificación diferenciada.
- `app/api/closing-agree/route.ts`: aceptación independiente; cierre bilateral.
- `app/api/payments/create/route.ts`: Checkout Pro del producto tradicional.
- `app/api/webhooks/mercadopago/route.ts`: verificación de firma y pago del producto tradicional.

## Reutilización propuesta (con adaptación, SIN redirigir a rutas legacy)
1. **Identidad y acceso:** conservar autenticación verificada en Temporarios; cada actor ve solamente su expediente. El acceso legacy por token de lead NO sirve directamente para `temporary_*`.
2. **Datos contractuales:** trasladar los campos y validaciones de `closing-legal-data` a tablas temporarias. No consultar ni escribir `lead_contracts`, `lead_matches`, `lead_intake` o `lead_contract_access_tokens`.
3. **Generación:** reutilizar el método de ensamblar contenido de `closing-generate`, pero con contrato para estadía temporal: partes, identidad, inmueble, ingreso/salida, noches, ocupantes, precio total, entrega, depósito opcional acordado directamente, condiciones de cancelación y restitución. No copiar cláusulas de plazo de alquiler permanente ni renovación/actualizaciones.
4. **Aceptación:** separar `agreed_terms_*_at` de aceptación del DOCUMENTO CONTRACTUAL; registrar versión exacta, actor, fecha, huella y evidencia verificable por separado. El `terms_accepted` de la reserva no equivale a contrato firmado.
5. **Pago:** usar exclusivamente `temporary_payment_attempts`, importe ARS 29.900 por contrato digital; webhook y reconciliación específicos. Nunca usar `lead_payments` ni la preferencia ARS 89.000.
6. **Reserva:** un match aceptado o pago no bloquea calendario. Sólo una operación atómica de confirmación bilateral con validación de pago/seña y restricción de superposición en `temporary_availability_blocks`. Revisar la migración existente antes de ejecutarla.
7. **Testigo digital y PDF:** registrar evidencia de cada consentimiento y producir documento final inmutable. Las rutas de contrato tradicional actualmente inspeccionadas muestran generación de texto y acuerdo; NO se ha comprobado que aporten una firma digital o PDF final reutilizable. No afirmarlo hasta verificar implementaciones reales.
8. **Avisos:** reusar transporte y workflows GHL, no eventos tradicionales. `product=temporarios`, `event_key` idempotente por evento/rol, enlaces `/temporarios/...`; agregan evento `dates_blocked`.
9. **QA:** cuentas owner/tenant distintas, aislamiento de información, documentos, dos consentimientos, pago válido/rechazado/repetido, cruces de fechas, webhook duplicado y vuelta a panel.

## Orden de implementación
- A. Modelo aislado de contrato/versión/aceptaciones/evidencias en SQL revisado manualmente.
- B. Vista del documento basado en expediente `temporary_reservations`, campos legales y generación inmutable.
- C. Acuerdo independiente + identidad + evidencia.
- D. Cobro y cierre con calendario; notificaciones.
- E. E2E y despliegue sólo al final.

## Estado
Este archivo es un mapeo de integración; **NO implementa todavía las firmas, el PDF ni el cierre contractual.**
No ejecutar automáticamente SQL ni disparar notificaciones en la base de datos compartida.
