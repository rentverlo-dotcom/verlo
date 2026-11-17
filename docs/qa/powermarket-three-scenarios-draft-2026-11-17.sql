-- VERLO QA ONLY | Fixture de tres casos PowerMarket | 2026-11-17
-- PARA REVISAR Y EJECUTAR SOLO EN EL EDITOR SQL DE VERLO-QA (anptswspguyotnasoacq).
-- NO ejecutar en produccion, NO pegar en GitHub Actions, NO usar con datos reales.
-- Resultado: conserva la solicitud DEMO original, crea SOLO 2 solicitudes
-- adicionales y vincula 3 contratos TEXTUALES de prueba a matches sinteticos.
-- LIMITACION IMPORTANTE: NO publica PDFs ni crea caucion_contract_reviews.
-- La publicacion del PDF privado requiere la ruta de negocio autenticada
-- /api/powermarket/contract-reviews/publish, almacenamiento privado y
-- que la solicitud pase de 'submitted' a 'under_review', 'prequalified'
-- o 'alternative_offered'. No inventar archivos ni hashes.
-- Efectos colaterales esperados en QA: trigger caucion_push_application_trigger
-- inserta eventos y entregas PUSH en tablas QA por 2 solicitudes nuevas.
-- NO usar emails reales, solo example.com.
BEGIN;
DO $qa$
DECLARE
  v_demo_tenant uuid := '1a87a179-9059-441e-bd55-bd5b9d70fee3';
  v_demo_application uuid := 'af0ac065-89d3-4630-8f60-053f5ae13766';
  v_owner uuid;
  v_low uuid;
  v_dual uuid;
  v_low_app uuid;
  v_dual_app uuid;
  v_match uuid;
  v_case text;
  v_tenant uuid;
  v_rent numeric;
  v_app uuid;
BEGIN
  -- Abort if anything differs from the QA-only reference inspected on 17/11.
  IF NOT EXISTS (
    SELECT 1 FROM public.lead_intake l
    JOIN public.caucion_applications a ON a.tenant_lead_id=l.id
    WHERE l.id=v_demo_tenant AND a.id=v_demo_application
      AND l.email='demo-powermarket-20261116@example.com'
      AND l.source='qa_demo_powermarket'
  ) THEN
    RAISE EXCEPTION 'STOP: QA demo reference not found; no changes were applied';
  END IF;
  IF EXISTS (
    SELECT 1 FROM public.lead_intake
    WHERE email IN (
      'qa-powermarket-owner-3cases@example.com',
      'qa-powermarket-low-income@example.com',
      'qa-powermarket-dual-income@example.com'
    )
  ) THEN
    RAISE EXCEPTION 'STOP: fixture already exists; refusing duplicates';
  END IF;
  INSERT INTO public.lead_intake(full_name,email,phone,role,intent,source)
  VALUES ('DEMO POWERMARKET - Propietario ficticio','qa-powermarket-owner-3cases@example.com','1100000000','owner','owner_new_listing','qa_demo_powermarket')
  RETURNING id INTO v_owner;
  INSERT INTO public.lead_intake(full_name,email,phone,role,intent,source)
  VALUES ('DEMO POWERMARKET - Ingresos bajos','qa-powermarket-low-income@example.com','1100000001','tenant','tenant_search','qa_demo_powermarket')
  RETURNING id INTO v_low;
  INSERT INTO public.lead_intake(full_name,email,phone,role,intent,source)
  VALUES ('DEMO POWERMARKET - Monotributista y co-inquilino','qa-powermarket-dual-income@example.com','1100000002','tenant','tenant_search','qa_demo_powermarket')
  RETURNING id INTO v_dual;
  INSERT INTO public.caucion_applications(
    tenant_lead_id,requested_rent_ars,estimated_expenses_ars,duration_months,
    monthly_income_ars,employment_type,has_co_tenant,co_tenant_income_ars,
    status,submitted_at,consent_version
  ) VALUES (
    v_low,980000,120000,24,1300000,'salary_receipt',false,null,
    'submitted',now(),'qa-demo-fixture'
  ) RETURNING id INTO v_low_app;
  INSERT INTO public.caucion_applications(
    tenant_lead_id,requested_rent_ars,estimated_expenses_ars,duration_months,
    monthly_income_ars,employment_type,has_co_tenant,co_tenant_income_ars,
    status,submitted_at,consent_version
  ) VALUES (
    v_dual,660000,100000,24,1900000,'monotributo',true,850000,
    'submitted',now(),'qa-demo-fixture'
  ) RETURNING id INTO v_dual_app;

  -- Contracts are VALID QA records, not signed commercial contracts.
  -- Every lead_contract must reference a matching synthetic lead_match.
  FOR v_case,v_tenant,v_app,v_rent IN
    SELECT * FROM (VALUES
       ('A',v_demo_tenant,v_demo_application,800000::numeric),
       ('B',v_low,v_low_app,980000::numeric),
       ('C',v_dual,v_dual_app,660000::numeric)
    ) AS demo(case_id,tenant_id,application_id,rent_amount)
  LOOP
    INSERT INTO public.lead_matches(
      tenant_lead_id,owner_lead_id,status,score,reasons
    ) VALUES (
      v_tenant,v_owner,'new',0,
      jsonb_build_object('qa_only',true,'qa_fixture','powermarket_three_cases','case',v_case)
    ) RETURNING id INTO v_match;
    INSERT INTO public.lead_contracts(
      lead_match_id,tenant_lead_id,owner_lead_id,status,monthly_price,
      deposit,terms_json,content
    ) VALUES (
      v_match,v_tenant,v_owner,'generated',v_rent,v_rent,
      jsonb_build_object('qa_only',true,'scenario',v_case,'not_commercially_valid',true),
      'VERLO QA - CONTRATO DE PRUEBA - SIN VALIDEZ COMERCIAL' || E'\n'
      || 'Caso ' || v_case || E'\n'
      || 'Contrato demostrativo ficticio para evaluar la vista privada de PowerMarket.' || E'\n'
      || 'Propietario y locatario: IDENTIDADES FICTICIAS - SIN DNI NI DATOS REALES.' || E'\n'
      || 'Canon mensual de referencia: ARS ' || v_rent::text || E'\n'
      || 'Plazo demostrativo: 24 meses.' || E'\n'
      || 'Documento de QA exclusivamente. No firmado, no vinculante, no se cobra.' || E'\n'
      || 'Prohibido usar como documento de una operación real.'
    );
  END LOOP;
END
$qa$;
COMMIT;

-- Control posterior no destructivo: deben aparecer 3 casos en QA,
-- los 3 con contrato TEXTUAL generado; NO implica PDFs publicados.
SELECT
  l.full_name,a.id AS application_id,a.status,
  a.requested_rent_ars+a.estimated_expenses_ars AS rent_and_expenses,
  a.monthly_income_ars,a.co_tenant_income_ars,
  (SELECT count(*) FROM public.lead_contracts c WHERE c.tenant_lead_id=l.id) AS text_contracts,
  (SELECT count(*) FROM public.caucion_contract_reviews r WHERE r.application_id=a.id) AS private_pdf_reviews
FROM public.lead_intake l
JOIN public.caucion_applications a ON a.tenant_lead_id=l.id
WHERE l.source='qa_demo_powermarket'
ORDER BY a.created_at;
