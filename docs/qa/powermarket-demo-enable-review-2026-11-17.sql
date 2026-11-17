-- VERLO-QA ONLY - Supabase: anptswspguyotnasoacq (NUNCA producción).
-- TRES casos falsos previamente cargados, sin clientes ni datos reales.
-- Este script SOLO:
--   1. Actualiza el texto mínimo de los 3 contratos de demostración a
--      un ejemplo completo de varias cláusulas, claramente NO VINCULANTE.
--   2. Cambia las 3 cauciones demo submitted -> under_review
--      (estado de evaluación, NO aprobación).
-- DESPUÉS: ejecutar workflow QA "VERLO QA - publish three PowerMarket demo PDFs",
-- que genera PDFs privados reales mediante createCaucionContractPdf y publica
-- las revisiones con caucion_publish_contract_review.
-- Advertencia: modificar el estado activa eventos push internos QA pendientes.
BEGIN;
DO $qa$
DECLARE
  expected uuid[] := ARRAY[
    'af0ac065-89d3-4630-8f60-053f5ae13766'::uuid,
    '4e911018-6185-4beb-83ee-559c916d330c'::uuid,
    'c0c4e8ba-5be6-4f3c-b0be-44df3453cb7a'::uuid
  ];
  found_count integer;
  updated_count integer;
  r record;
  demo_text text;
BEGIN
  SELECT COUNT(*) INTO found_count
  FROM public.caucion_applications a
  JOIN public.lead_intake l ON l.id=a.tenant_lead_id
  WHERE a.id = ANY(expected)
    AND a.status IN ('submitted','under_review')
    AND l.source = 'qa_demo_powermarket'
    AND (
      (a.id=expected[1] AND l.email='demo-powermarket-20261116@example.com')
      OR (a.id=expected[2] AND l.email='qa-powermarket-low-income@example.com')
      OR (a.id=expected[3] AND l.email='qa-powermarket-dual-income@example.com')
    )
    AND (
      SELECT COUNT(*) FROM public.lead_contracts c
      WHERE c.tenant_lead_id=a.tenant_lead_id AND c.status='generated'
        AND c.content LIKE '%SIN VALIDEZ COMERCIAL%'
        AND c.content LIKE '%VERLO QA%'
    )=1
    AND NOT EXISTS (
      SELECT 1 FROM public.caucion_contract_reviews x WHERE x.application_id=a.id
    );
  IF found_count <> 3 THEN
    RAISE EXCEPTION 'STOP: demo QA fixture expected 3 intact cases, found %', found_count;
  END IF;

  FOR r IN
    SELECT a.id,a.tenant_lead_id,a.requested_rent_ars,a.estimated_expenses_ars,
      a.duration_months,l.full_name
    FROM public.caucion_applications a
    JOIN public.lead_intake l ON l.id=a.tenant_lead_id
    WHERE a.id=ANY(expected)
  LOOP
    demo_text := concat_ws(E'\n',
      'CONTRATO DE LOCACIÓN DE VIVIENDA',
      'VERLO QA - CONTRATO DE PRUEBA - SIN VALIDEZ COMERCIAL',
      'DOCUMENTO DEMOSTRATIVO PARA REVISIÓN DE POWERMARKET. NO ES UN CONTRATO FIRMADO.',
      '',
      'DATOS PRINCIPALES DEL CONTRATO',
      'LOCADOR: Persona propietaria ficticia, exclusivamente de prueba.',
      'LOCATARIO: ' || r.full_name || ', identidad ficticia de QA.',
      'INMUEBLE: Departamento ficticio de dos ambientes, ubicado en una dirección ficticia de Buenos Aires, Argentina.',
      'ALQUILER MENSUAL INICIAL: ARS ' || r.requested_rent_ars::text || '.',
      'EXPENSAS ESTIMADAS: ARS ' || r.estimated_expenses_ars::text || '.',
      'PLAZO: ' || r.duration_months || ' meses a partir de una fecha a convenir.',
      'DEPÓSITO: ARS ' || r.requested_rent_ars::text || ' (importe ilustrativo sujeto a acuerdo).',
      '',
      'PRIMERA - OBJETO Y DESTINO',
      'La parte locadora da en locación a la parte locataria el inmueble ficticio indicado. El destino previsto es exclusivamente habitacional. La identificación de las partes y el domicilio son inventados, por lo que este texto no produce obligación jurídica alguna.',
      '',
      'SEGUNDA - PLAZO DE LA LOCACIÓN',
      'La duración de referencia es de ' || r.duration_months || ' meses. La fecha de entrega, la posesión y la restitución del inmueble deberán surgir de un futuro contrato comercial real que sea aceptado por las partes, con la normativa aplicable.',
      '',
      'TERCERA - PRECIO Y FORMA DE PAGO',
      'El canon mensual demostrativo se fija en ARS ' || r.requested_rent_ars::text || '. Las expensas estimadas son ARS ' || r.estimated_expenses_ars::text || '. Los pagos, fechas y medios definitivos se establecerían en el contrato firmado. Este documento de prueba no solicita, efectúa ni acredita ningún pago.',
      '',
      'CUARTA - ACTUALIZACIÓN DEL CANON',
      'Las partes deberán pactar expresamente en el contrato real la periodicidad y el índice de actualización que corresponda. Este modelo no establece aumentos automáticos ni representa una cláusula jurídica definitiva.',
      '',
      'QUINTA - SERVICIOS Y EXPENSAS',
      'El reparto de servicios, impuestos, tasas y gastos comunes deberá detallar las obligaciones de cada parte según el inmueble y las disposiciones aplicables. Los importes aquí indicados tienen únicamente valor ilustrativo.',
      '',
      'SEXTA - CONSERVACIÓN Y REPARACIONES',
      'El uso, mantenimiento, reparación y conservación se ajustarán a las obligaciones convenidas entre las partes y la legislación vigente. No se presume la entrega de bienes muebles ni la existencia de un inventario verificado.',
      '',
      'SÉPTIMA - GARANTÍA DE CAUCIÓN',
      'La parte locataria podrá solicitar, por separado, la evaluación de un seguro de caución. PowerMarket evaluará ingresos, riesgos, documentación y límites de cobertura. Ninguna decisión está preaprobada por este contrato demostrativo.',
      '',
      'OCTAVA - DOCUMENTACIÓN Y CONTROL DE IDENTIDAD',
      'Los comprobantes económicos y la acreditación de identidad están sujetos a revisión y consentimiento válidos de cada persona. Todos los datos utilizados en este ejemplo son ficticios; no representan una persona física verificable.',
      '',
      'NOVENA - REVISIÓN DE CONTRATO POR POWERMARKET',
      'El operador autorizado de PowerMarket puede revisar esta versión del PDF desde su panel privado de VERLO. Una modificación posterior del texto requiere publicar otra versión y, si corresponde, una aprobación nueva asociada al contenido vigente.',
      '',
      'DÉCIMA - FIRMA Y EFECTOS',
      'La operación real requiere consentimiento de ambas partes y firma electrónica por el circuito habilitado en VERLO. ESTE DOCUMENTO NO ESTÁ FIRMADO, NO ES UNA PÓLIZA Y NO ACREDITA CAUCIÓN, PAGO NI COBERTURA.',
      '',
      'CIERRE DE DEMOSTRACIÓN',
      'VERLO QA - SIN VALIDEZ COMERCIAL - TODOS LOS NOMBRES, DATOS Y DOMICILIOS SON FICTICIOS.'
    );
    UPDATE public.lead_contracts
      SET content=demo_text, updated_at=now()
      WHERE tenant_lead_id=r.tenant_lead_id
        AND status='generated'
        AND content LIKE '%SIN VALIDEZ COMERCIAL%'
        AND content LIKE '%VERLO QA%';
    GET DIAGNOSTICS updated_count=ROW_COUNT;
    IF updated_count <> 1 THEN
      RAISE EXCEPTION 'STOP: expected one QA contract per tenant, updated %',updated_count;
    END IF;
  END LOOP;

  UPDATE public.caucion_applications
     SET status='under_review',updated_at=now()
   WHERE id=ANY(expected) AND status='submitted';
  -- Idempotent: already-under_review is allowed, but no other state is.
  IF EXISTS (
    SELECT 1 FROM public.caucion_applications
    WHERE id=ANY(expected) AND status<>'under_review'
  ) THEN
    RAISE EXCEPTION 'STOP: some demo statuses were not updated; rolling back';
  END IF;
END $qa$;
COMMIT;

-- Expected: 3 records in under_review, 3 generated text contracts,
-- and PDF reviews 0 until the authorized publishing workflow runs.
SELECT a.id,a.status,l.full_name,
  (SELECT count(*) FROM public.lead_contracts c
   WHERE c.tenant_lead_id=a.tenant_lead_id) AS contracts,
  (SELECT count(*) FROM public.caucion_contract_reviews cr
   WHERE cr.application_id=a.id) AS published_pdf_reviews
FROM public.caucion_applications a
JOIN public.lead_intake l ON l.id=a.tenant_lead_id
WHERE a.id IN (
 'af0ac065-89d3-4630-8f60-053f5ae13766',
 '4e911018-6185-4beb-83ee-559c916d330c',
 'c0c4e8ba-5be6-4f3c-b0be-44df3453cb7a'
)
ORDER BY a.id;
