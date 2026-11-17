-- VERLO-QA ONLY — ejecutar en Supabase proyecto anptswspguyotnasoacq.
-- NO ejecutar en producción. Mostrar al propietario antes de aplicar.
-- Solo cambia 'submitted' -> 'under_review' para los TRES casos DEMO
-- ya existentes. NO aprueba ni rechaza la caución; NO confirma pagos.
-- Importante: el trigger caucion_push_application_trigger crea eventos QA
-- y entregas pendientes al cambiar el estado. No contiene datos reales.

BEGIN;

DO $demo$
DECLARE
  expected uuid[] := ARRAY[
    'af0ac065-89d3-4630-8f60-053f5ae13766'::uuid,
    '4e911018-6185-4beb-83ee-559c916d330c'::uuid,
    'c0c4e8ba-5be6-4f3c-b0be-44df3453cb7a'::uuid
  ];
  found_count integer;
  updated_count integer;
BEGIN
  SELECT COUNT(*) INTO found_count
  FROM public.caucion_applications a
  JOIN public.lead_intake l ON l.id = a.tenant_lead_id
  WHERE a.id = ANY(expected)
    AND a.status = 'submitted'
    AND l.source = 'qa_demo_powermarket'
    AND l.email IN (
      'demo-powermarket-20261116@example.com',
      'qa-powermarket-low-income@example.com',
      'qa-powermarket-dual-income@example.com'
    )
    AND (SELECT COUNT(*) FROM public.lead_contracts c
         WHERE c.tenant_lead_id = a.tenant_lead_id
           AND c.status = 'generated'
           AND c.content LIKE '%SIN VALIDEZ COMERCIAL%'
           AND c.content LIKE '%VERLO QA%') = 1
    AND NOT EXISTS (
      SELECT 1 FROM public.caucion_contract_reviews r
      WHERE r.application_id = a.id
    );
  IF found_count <> 3 THEN
    RAISE EXCEPTION 'STOP: expected exactly 3 isolated, unpublished QA demos, found %', found_count;
  END IF;

  UPDATE public.caucion_applications
  SET status = 'under_review', updated_at = now()
  WHERE id = ANY(expected) AND status = 'submitted';

  GET DIAGNOSTICS updated_count = ROW_COUNT;
  IF updated_count <> 3 THEN
    RAISE EXCEPTION 'STOP: only % of the 3 demo requests changed; rollback', updated_count;
  END IF;
END $demo$;

COMMIT;

-- Verify status, only reading after the transaction:
SELECT a.id AS application_id, l.full_name, a.status,
       (SELECT COUNT(*) FROM public.lead_contracts c
        WHERE c.tenant_lead_id=a.tenant_lead_id) AS contract_text_count,
       (SELECT COUNT(*) FROM public.caucion_contract_reviews r
        WHERE r.application_id=a.id) AS published_private_pdf_count
FROM public.caucion_applications a
JOIN public.lead_intake l ON l.id=a.tenant_lead_id
WHERE a.id IN (
  'af0ac065-89d3-4630-8f60-053f5ae13766',
  '4e911018-6185-4beb-83ee-559c916d330c',
  'c0c4e8ba-5be6-4f3c-b0be-44df3453cb7a'
)
ORDER BY a.id;
