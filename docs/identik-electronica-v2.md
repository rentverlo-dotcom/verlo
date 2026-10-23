# Identik Firma Electrónica v2 — fase 1 (aislada)

Rama: `feature/identik-electronica-v2`

## Alcance entregado
- Cliente HTTP servidor `lib/identik/electronic-v2.ts` contra `https://electronica.identik.me/api/v2`.
- Métodos: crear PDF + dos destinatarios, distribuir, consultar, descargar PDF firmado y constancia.
- Solo admite 2 firmantes en la creación de un contrato VERLO.
- Errores HTTP conservan únicamente código y `Retry-After`, sin registrar credenciales ni información privada.
- **No hay endpoints públicos ni conexiones con el flujo de pago/cierre existentes.**
- **No se ha ejecutado todavía una llamada real ni un E2E.**

## Configuración
`IDENTIK_ELECTRONIC_API_TOKEN` — secreto del sandbox electrónico, almacenado solo en el backend de Preview. No ponerlo en NEXT_PUBLIC_, logs ni repositorio.

## Reglas para la fase 2
1. Autorizar cada operación en servidor contra el expediente real en `lead_contracts` y el token de acceso correspondiente. No aceptar PDF arbitrarios desde clientes públicos.
2. Crear documento únicamente después de confirmación de Mercado Pago y PDF definitivo; exigir dos firmantes.
3. Guardar en Supabase el ID numérico devuelto **antes de intentar distribuir**. No repetir un create ante fallo ambiguo sin reconciliar por operación.
4. Generar dos enlaces individuales y tratarlos como secretos. Preferir envío de Identik inicialmente y sólo controlar distribución manual cuando tengamos flujos autenticados.
5. Webhook: comparar `X-Identik-Secret` de manera segura, almacenar evento idempotente, y validar estado real por API.
6. Reconciliación ante webhooks faltantes; sólo descargar PDF y constancia tras `COMPLETED`.
7. Guardar archivos en almacenamiento privado y limitar descargas por identidad/permiso.
8. No modificar `closing-agree` ni marcar contrato como firmado por un evento `SENT` o `SIGNED` individual.
9. Identidad previa a la visita queda fuera de este primer cliente: captura DNI Identik, y luego biometría por persona cuando avance a visita, sin consumo en cada match.

## E2E en sandbox (aún pendiente)
- PDF de prueba con firmante propietario e inquilino de QA, verificar posiciones.
- Crear, guardar ID, distribuir, firmar por separado, consultar estados.
- Descargar PDF/constancia y comprobar formato PDF.
- Webhook duplicado/no entregado y reconciliación.
- Respuestas 400, 401, 409 y 429; respetar Retry-After.
- Dos solicitudes simultáneas para una misma operación (evitar créditos duplicados).
