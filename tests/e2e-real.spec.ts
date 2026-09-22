import { test, expect } from "@playwright/test"

const PNG_1X1 = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Y9Zx7sAAAAASUVORK5CYII=",
  "base64"
)

const RUN_ID = Date.now().toString()
const OWNER_EMAIL = `e2e-owner-${RUN_ID}@example.com`
const TENANT_EMAIL = `e2e-tenant-${RUN_ID}@example.com`
const TENANT_NAME = `Tenant E2E ${RUN_ID}`

const OWNER_PHOTO_1 = `verlo-owner-${RUN_ID}-1.png`
const OWNER_PHOTO_2 = `verlo-owner-${RUN_ID}-2.png`
const OWNER_PHOTO_3 = `verlo-owner-${RUN_ID}-3.png`

test(
  "Owner media selector acumula y evita duplicados en /propietarios",
  async ({ page }) => {
    await page.goto("/propietarios", {
      waitUntil: "domcontentloaded",
    })

    await expect(
      page.getByText(
        "Subí al menos 1 foto. Si tenés un match, después vas a poder agregar todas las fotos y videos que quieras."
      )
    ).toBeVisible()

    const input =
      page.locator(
        'input[type="file"][accept="image/*,video/*"]'
      )

    await input.setInputFiles({
      name: "propietarios-a.png",
      mimeType: "image/png",
      buffer: PNG_1X1,
    })

    await expect(
      page.getByText("1 archivo seleccionado")
    ).toBeVisible()

    await input.setInputFiles([
      {
        name: "propietarios-b.png",
        mimeType: "image/png",
        buffer: PNG_1X1,
      },
      {
        name: "propietarios-c.png",
        mimeType: "image/png",
        buffer: PNG_1X1,
      },
    ])

    await expect(
      page.getByText("3 archivos seleccionados")
    ).toBeVisible()

    await input.setInputFiles({
      name: "propietarios-b.png",
      mimeType: "image/png",
      buffer: PNG_1X1,
    })

    await expect(
      page.getByText("3 archivos seleccionados")
    ).toBeVisible()
  }
)

test(
  "Mismo owner puede publicar dos propiedades y ambas matchean al mismo tenant",
  async ({ request }) => {
    const id =
      Date.now().toString()

    const ownerEmail =
      `multi-owner-${id}@example.com`

    const tenantEmail =
      `multi-tenant-${id}@example.com`

    const ownerPayload = {
      full_name:
        "Owner Multi E2E",

      email:
        ownerEmail,

      phone:
        "1133333333",

      role:
        "owner",

      intent:
        "owner_new_listing",

      zone:
        "Munro",

      area_macro:
        "owner_landing",

      neighborhood_labels:
        [
          "Munro",
        ],

      neighborhood_slugs:
        [
          "munro",
        ],

      neighborhood_slug:
        "munro",

      property_type:
        "Departamento",

      property_rooms:
        "2 ambientes",

      approx_price:
        "700001-900000",

      availability_status:
        "En 1 a 3 meses",

      accepted_income_proof_types:
        [
          "salary_receipt",
        ],

      min_income_ratio:
        2,

      accepted_guarantee_types:
        [
          "surety_insurance",
        ],

      source:
        "e2e_multi_property",
    }

    const firstOwnerResponse =
      await request.post(
        "/api/lead-intake",
        {
          data:
            ownerPayload,
        }
      )

    expect(
      firstOwnerResponse.status()
    ).toBe(200)

    const firstOwner =
      await firstOwnerResponse.json()

    expect(
      firstOwner?.ok
    ).toBe(true)

    expect(
      firstOwner?.lead_id
    ).toBeTruthy()

    const tenantResponse =
      await request.post(
        "/api/lead-intake",
        {
          data: {
            full_name:
              "Tenant Multi E2E",

            email:
              tenantEmail,

            phone:
              "1144444444",

            role:
              "tenant",

            intent:
              "tenant_search",

            zone:
              "Munro",

            area_macro:
              "gba_norte",

            neighborhood_labels:
              [
                "Munro",
              ],

            neighborhood_slugs:
              [
                "munro",
              ],

            desired_property_type:
              "Departamento",

            desired_rooms:
              "2 ambientes",

            budget_range:
              "700001-900000",

            move_timing:
              "En 1 a 3 meses",

            income_proof_type:
              "salary_receipt",

            income_range:
              "2000001-3000000",

            guarantee_types:
              [
                "surety_insurance",
              ],

            source:
              "e2e_multi_property",
          },
        }
      )

    expect(
      tenantResponse.status()
    ).toBe(200)

    const tenant =
      await tenantResponse.json()

    expect(
      tenant?.ok
    ).toBe(true)

    expect(
      Number(
        tenant?.match_result?.created ||
        0
      )
    ).toBeGreaterThanOrEqual(1)

    const secondOwnerResponse =
      await request.post(
        "/api/lead-intake",
        {
          data: {
            ...ownerPayload,

            // Mismo usuario, otra propiedad.
            // La identidad inmobiliaria debe ser distinta.
            metadata: {
              e2e_property:
                "second",
            },
          },
        }
      )

    expect(
      secondOwnerResponse.status()
    ).toBe(200)

    const secondOwner =
      await secondOwnerResponse.json()

    expect(
      secondOwner?.ok
    ).toBe(true)

    expect(
      secondOwner?.lead_id
    ).toBeTruthy()

    expect(
      secondOwner.lead_id
    ).not.toBe(
      firstOwner.lead_id
    )

    expect(
      Number(
        secondOwner?.match_result?.created ||
        0
      )
    ).toBeGreaterThanOrEqual(1)

    const tokenResponse =
      await request.post(
        "/api/tenant-matches-token",
        {
          data: {
            tenant_lead_id:
              tenant.lead_id,
          },
        }
      )

    expect(
      tokenResponse.status()
    ).toBe(200)

    const tokenData =
      await tokenResponse.json()

    const viewResponse =
      await request.get(
        `/api/tenant-matches-view?token=${encodeURIComponent(
          tokenData.token
        )}`
      )

    expect(
      viewResponse.status()
    ).toBe(200)

    const viewData =
      await viewResponse.json()

    const ownerLeadIds =
      new Set(
        (
          viewData.matches ||
          []
        ).map(
          (
            match: any
          ) =>
            match.owner_lead_id
        )
      )

    expect(
      ownerLeadIds.has(
        firstOwner.lead_id
      )
    ).toBe(true)

    expect(
      ownerLeadIds.has(
        secondOwner.lead_id
      )
    ).toBe(true)
  }
)

test(
  "E2E REAL Verlo completo hasta alquiler activo",
  async ({ page, context, request }) => {
    test.setTimeout(240_000)

    await context.grantPermissions(
      ["notifications"],
      { origin: "https://verlo.lat" }
    )

    // =========================================================
    // 1. OWNER — JUAN
    // =========================================================

    await page.goto("/", {
      waitUntil: "domcontentloaded",
    })

    await page
      .locator("button.path-card")
      .filter({ hasText: "Tengo una propiedad" })
      .click()

    await page
      .locator('input[name="full_name"]')
      .fill("Owner E2E Test")

    await page
      .locator('input[name="phone"]')
      .fill("1111111111")

    await page
      .locator('input[name="email"]')
      .fill(OWNER_EMAIL)

    await page
      .locator('select[name="owner_neighborhood"]')
      .selectOption({ label: "Munro" })

    await page
      .locator('select[name="property_type"]')
      .selectOption({ label: "Departamento" })

    await page
      .locator('select[name="property_rooms"]')
      .selectOption({ label: "2 ambientes" })

    await page
      .locator('select[name="approx_price"]')
      .selectOption("700001-900000")

    await page
      .locator('select[name="availability_status"]')
      .selectOption("En 1 a 3 meses")

    await page
      .locator(
        'input[name="accepted_income_proof_types"][value="salary_receipt"]'
      )
      .check()

    await page
      .locator('select[name="min_income_ratio"]')
      .selectOption("2")

    await page
      .locator(
        'input[name="accepted_guarantee_types"][value="surety_insurance"]'
      )
      .check()

    const ownerMediaInput =
      page.locator(
        'input[type="file"][accept="image/*,video/*"]'
      )

    await expect(
      page.getByText(
        "Subí al menos 1 foto. Si tenés un match, después vas a poder agregar todas las fotos y videos que quieras."
      )
    ).toBeVisible()

    // Primera selección: 1 archivo.
    await ownerMediaInput.setInputFiles({
      name: OWNER_PHOTO_1,
      mimeType: "image/png",
      buffer: PNG_1X1,
    })

    await expect(
      page.getByText("1 archivo seleccionado")
    ).toBeVisible()

    // Segunda selección: se SUMA a la anterior.
    await ownerMediaInput.setInputFiles([
      {
        name: OWNER_PHOTO_2,
        mimeType: "image/png",
        buffer: PNG_1X1,
      },
      {
        name: OWNER_PHOTO_3,
        mimeType: "image/png",
        buffer: PNG_1X1,
      },
    ])

    await expect(
      page.getByText("3 archivos seleccionados")
    ).toBeVisible()

    // Repetimos una foto: no debe duplicarla.
    await ownerMediaInput.setInputFiles({
      name: OWNER_PHOTO_2,
      mimeType: "image/png",
      buffer: PNG_1X1,
    })

    await expect(
      page.getByText("3 archivos seleccionados")
    ).toBeVisible()

    await expect(
      page.getByText(OWNER_PHOTO_1)
    ).toBeVisible()

    await expect(
      page.getByText(OWNER_PHOTO_2)
    ).toBeVisible()

    await expect(
      page.getByText(OWNER_PHOTO_3)
    ).toBeVisible()

    const ownerIntakePromise =
      page.waitForResponse(
        (response) =>
          response.url().includes("/api/lead-intake") &&
          response.request().method() === "POST"
      )

    await page
      .locator('button.submit[type="submit"]')
      .click()

    const ownerIntakeResponse =
      await ownerIntakePromise

    expect(ownerIntakeResponse.status()).toBe(200)

    const ownerData =
      await ownerIntakeResponse.json()

    expect(ownerData?.ok).toBe(true)
    expect(ownerData?.lead_id).toBeTruthy()

    console.log("OWNER LEAD:", ownerData.lead_id)

    await page.waitForTimeout(4000)

    // =========================================================
    // 2. TENANT — ALEJANDRO
    // =========================================================

    await page.goto("/", {
      waitUntil: "domcontentloaded",
    })

    await page
      .locator("button.path-card")
      .filter({ hasText: "Busco alquilar" })
      .click()

    await page
      .locator('input[name="full_name"]')
      .fill(TENANT_NAME)

    await page
      .locator('input[name="phone"]')
      .fill("1122222222")

    await page
      .locator('input[name="email"]')
      .fill(TENANT_EMAIL)

    await page
      .locator("button.area-tab")
      .filter({ hasText: "GBA Norte" })
      .click()

    await page
      .locator(
        'input[name="tenant_neighborhoods"][value="Munro"]'
      )
      .check()

    await page
      .locator(
        'select[name="desired_property_type"]'
      )
      .selectOption({ label: "Departamento" })

    await page
      .locator('select[name="desired_rooms"]')
      .selectOption({ label: "2 ambientes" })

    await page
      .locator('select[name="budget_range"]')
      .selectOption("700001-900000")

    await page
      .locator('select[name="move_timing"]')
      .selectOption("En 1 a 3 meses")

    await page
      .locator('select[name="income_proof_type"]')
      .selectOption("salary_receipt")

    await page
      .locator('select[name="income_range"]')
      .selectOption("2000001-3000000")

    await page
      .locator(
        'input[name="guarantee_types"][value="surety_insurance"]'
      )
      .check()

    const tenantIntakePromise =
      page.waitForResponse(
        (response) =>
          response.url().includes("/api/lead-intake") &&
          response.request().method() === "POST"
      )

    await page
      .locator('button.submit[type="submit"]')
      .click()

    const tenantIntakeResponse =
      await tenantIntakePromise

    expect(tenantIntakeResponse.status()).toBe(200)

    const tenantData =
      await tenantIntakeResponse.json()

    expect(tenantData?.ok).toBe(true)
    expect(tenantData?.lead_id).toBeTruthy()

    expect(
      Number(
        tenantData?.match_result?.created || 0
      )
    ).toBeGreaterThan(0)

    console.log("TENANT LEAD:", tenantData.lead_id)

    // =========================================================
    // 3. TOKEN DE MATCHES TENANT
    // =========================================================

    const tokenResponse =
      await request.post(
        "/api/tenant-matches-token",
        {
          data: {
            tenant_lead_id:
              tenantData.lead_id,
          },
        }
      )

    expect(tokenResponse.status()).toBe(200)

    const tokenData =
      await tokenResponse.json()

    expect(tokenData?.ok).toBe(true)
    expect(tokenData?.token).toBeTruthy()

    // =========================================================
    // 4. ENCONTRAR MATCH EXACTO DE JUAN
    // =========================================================

    const viewResponse =
      await request.get(
        `/api/tenant-matches-view?token=${encodeURIComponent(
          tokenData.token
        )}`
      )

    expect(viewResponse.status()).toBe(200)

    const viewData =
      await viewResponse.json()

    const juanMatchIndex =
      (viewData.matches || []).findIndex(
        (match: any) =>
          (match.media || []).some(
            (media: any) =>
              media.filename ===
              OWNER_PHOTO_1
          )
      )

    expect(
      juanMatchIndex
    ).toBeGreaterThanOrEqual(0)

    const juanMatch =
      viewData.matches[juanMatchIndex]

    expect(juanMatch?.id).toBeTruthy()

    console.log(
      "MATCH JUAN/ALEJANDRO:",
      juanMatch.id
    )

    // =========================================================
    // 5. ALEJANDRO ELIGE ESA PROPIEDAD
    // =========================================================

    await page.goto(
      tokenData.matches_url,
      {
        waitUntil: "domcontentloaded",
      }
    )

    const cards =
      page.locator("article.card")

    await cards
      .nth(juanMatchIndex)
      .locator("button.select")
      .click()

    await page
      .locator("section.bottom button")
      .click()

    await expect(page).toHaveURL(
      new RegExp(
        `/tenant/validacion/${tokenData.token}\\?matches=`
      )
    )

    // =========================================================
    // 6. VALIDACIÓN TENANT FICTICIA
    // =========================================================

    const validationForm =
      page.locator("form.tenant-form")

    await validationForm
      .getByLabel("DNI / documento")
      .fill("30999999")

    await validationForm
      .getByLabel("Situación laboral")
      .selectOption(
        "Relación de dependencia"
      )

    await validationForm
      .getByLabel("Rango de ingresos")
      .selectOption(
        "Más de $2.500.000"
      )

    await validationForm
      .getByLabel("Garantía / respaldo")
      .selectOption(
        "Seguro de caución"
      )

    await validationForm
      .getByLabel("DNI frente")
      .setInputFiles({
        name: "dni-frente-test.png",
        mimeType: "image/png",
        buffer: PNG_1X1,
      })

    await validationForm
      .getByLabel("DNI dorso")
      .setInputFiles({
        name: "dni-dorso-test.png",
        mimeType: "image/png",
        buffer: PNG_1X1,
      })

    await validationForm
      .getByLabel("Selfie")
      .setInputFiles({
        name: "selfie-test.png",
        mimeType: "image/png",
        buffer: PNG_1X1,
      })

    await validationForm
      .getByLabel("Comprobante de ingresos")
      .setInputFiles({
        name: "ingresos-test.png",
        mimeType: "image/png",
        buffer: PNG_1X1,
      })

    await validationForm
      .getByLabel(
        "Garantía / seguro / caución"
      )
      .setInputFiles({
        name: "garantia-test.png",
        mimeType: "image/png",
        buffer: PNG_1X1,
      })

    await validationForm
      .getByLabel("Notas adicionales")
      .fill("Datos E2E ficticios.")

    const verificationPromise =
      page.waitForResponse(
        (response) =>
          response.url().includes(
            "/api/tenant-verification"
          ) &&
          response.request().method() === "POST"
      )

    await validationForm
      .getByRole("button", {
        name: "Enviar validación",
      })
      .click()

    const verificationResponse =
      await verificationPromise

    expect(
      verificationResponse.status()
    ).toBe(200)

    const verificationData =
      await verificationResponse.json()

    expect(verificationData?.ok).toBe(true)

    const juanNotification =
      (
        verificationData.owner_notifications ||
        []
      ).find(
        (item: any) =>
          item.owner_lead_id ===
          ownerData.lead_id
      )

    expect(juanNotification).toBeTruthy()

    const candidatesUrl =
      juanNotification.candidates_url

    // =========================================================
    // 7. OWNER VE AL TENANT DE ESTA CORRIDA
    // =========================================================

    await page.goto(
      candidatesUrl,
      {
        waitUntil: "domcontentloaded",
      }
    )

    const tenantCard =
      page
        .locator("article.candidate-card")
        .filter({ hasText: TENANT_NAME })

    await expect(
      tenantCard
    ).toHaveCount(1)

    // =========================================================
    // 8. OWNER DA OK
    // =========================================================

    const ownerInterestPromise =
      page.waitForResponse(
        (response) =>
          response.url().includes(
            "/api/owner-interest"
          ) &&
          response.request().method() === "POST"
      )

    await tenantCard
      .locator("button.accept-button")
      .click()

    const ownerInterestResponse =
      await ownerInterestPromise

    expect(
      ownerInterestResponse.status()
    ).toBe(200)

    const ownerInterestData =
      await ownerInterestResponse.json()

    expect(
      ownerInterestData?.ready_to_connect
    ).toBe(true)

    expect(
      ownerInterestData?.contract_id
    ).toBeTruthy()

    expect(
      ownerInterestData?.tenant_closing_url
    ).toBeTruthy()

    expect(
      ownerInterestData?.owner_closing_url
    ).toBeTruthy()

    expect(
      ownerInterestData?.tenant_push
    ).not.toBeNull()

    const tenantClosingUrl =
      ownerInterestData.tenant_closing_url

    const ownerClosingUrl =
      ownerInterestData.owner_closing_url

    const tenantClosingToken =
      tenantClosingUrl.split("/").pop()

    const ownerClosingToken =
      ownerClosingUrl.split("/").pop()

    console.log(
      "CONTRACT:",
      ownerInterestData.contract_id
    )

    // =========================================================
    // 9. DOBLE OK #2 POST-VISITA
    // =========================================================

    const tenantPostVisitResponse =
      await request.post(
        "/api/post-visit-decision",
        {
          data: {
            token:
              tenantClosingToken,
            decision:
              "yes",
          },
        }
      )

    const tenantPostVisitData =
      await tenantPostVisitResponse.json()

    expect(
      tenantPostVisitResponse.status()
    ).toBe(200)

    expect(
      tenantPostVisitData?.ok
    ).toBe(true)

    expect(
      tenantPostVisitData?.tenant_decision
    ).toBe("yes")

    expect(
      tenantPostVisitData?.second_double_ok
    ).toBe(false)

    expect(
      tenantPostVisitData?.push?.owner
    ).not.toBeNull()

    const ownerPostVisitResponse =
      await request.post(
        "/api/post-visit-decision",
        {
          data: {
            token:
              ownerClosingToken,
            decision:
              "yes",
          },
        }
      )

    const ownerPostVisitData =
      await ownerPostVisitResponse.json()

    expect(
      ownerPostVisitResponse.status()
    ).toBe(200)

    expect(
      ownerPostVisitData?.ok
    ).toBe(true)

    expect(
      ownerPostVisitData?.owner_decision
    ).toBe("yes")

    expect(
      ownerPostVisitData?.second_double_ok
    ).toBe(true)

    expect(
      ownerPostVisitData?.can_accept_contract
    ).toBe(true)

    expect(
      ownerPostVisitData?.push?.tenant
    ).not.toBeNull()

    expect(
      ownerPostVisitData?.push?.owner
    ).not.toBeNull()

    // =========================================================
    // 10. DATOS LEGALES TENANT
    // =========================================================

    const tenantLegalResponse =
      await request.post(
        "/api/closing-legal-data",
        {
          data: {
            token:
              tenantClosingToken,

            tenant: {
              dni:
                "30999999",

              civil_status:
                "Soltero",

              legal_address:
                "Calle Test 123",

              city:
                "Vicente López",

              province:
                "Buenos Aires",

              country:
                "Argentina",

              postal_code:
                "1636",
            },
          },
        }
      )

    const tenantLegalData =
      await tenantLegalResponse.json()

    console.log(
      "TENANT LEGAL:",
      JSON.stringify(
        tenantLegalData,
        null,
        2
      )
    )

    expect(
      tenantLegalResponse.status()
    ).toBe(200)

    expect(
      tenantLegalData?.ok
    ).toBe(true)

    // =========================================================
    // 11. DATOS LEGALES OWNER + INMUEBLE
    // =========================================================

    const ownerLegalResponse =
      await request.post(
        "/api/closing-legal-data",
        {
          data: {
            token:
              ownerClosingToken,

            owner: {
              dni:
                "20999999",

              tax_id:
                "20209999997",

              civil_status:
                "Soltero",

              legal_address:
                "Owner Test 456",

              city:
                "Vicente López",

              province:
                "Buenos Aires",

              country:
                "Argentina",

              postal_code:
                "1636",

              acting_as:
                "owner",

              power_details:
                "",
            },

            property: {
              street:
                "Mitre",

              number:
                "1234",

              floor:
                "2",

              unit:
                "A",

              city:
                "Munro",

              province:
                "Buenos Aires",

              country:
                "Argentina",

              postal_code:
                "1605",
            },

            signing_place: {
              city:
                "Vicente López",

              province:
                "Buenos Aires",

              country:
                "Argentina",
            },

            furnishing: {
              status:
                "unfurnished",

              inventory:
                "",

              condition_notes:
                "Buen estado general.",
            },
          },
        }
      )

    const ownerLegalData =
      await ownerLegalResponse.json()

    console.log(
      "OWNER LEGAL:",
      JSON.stringify(
        ownerLegalData,
        null,
        2
      )
    )

    expect(
      ownerLegalResponse.status()
    ).toBe(200)

    expect(
      ownerLegalData?.ok
    ).toBe(true)

    // =========================================================
    // 12. GENERAR CONTRATO
    // SOLO OWNER
    // =========================================================

    const generateResponse =
      await request.post(
        "/api/closing-generate",
        {
          data: {
            token:
              ownerClosingToken,

            monthly_price:
              800000,

            deposit:
              800000,

            start_date:
              "2026-10-01",

            end_date:
              "2028-09-30",

            adjustment_method:
              "IPC",

            expenses:
              "A cargo del inquilino según liquidación.",

            services:
              "Servicios a cargo del inquilino.",

            payment_method:
              "Transferencia bancaria",

            payment_details:
              "Del 1 al 10 de cada mes.",

            guarantee_type:
              "Seguro de caución",

            guarantee_details:
              "Seguro de caución aprobado.",

            pets_policy:
              "Permitidas previo acuerdo.",

            insurance_terms:
              "Seguro según corresponda.",

            special_conditions:
              "Contrato generado automáticamente por E2E.",
          },
        }
      )

    const generateData =
      await generateResponse.json()

    console.log(
      "GENERATE CONTRACT:",
      JSON.stringify(
        generateData,
        null,
        2
      )
    )

    expect(
      generateResponse.status()
    ).toBe(200)

    expect(
      generateData?.ok
    ).toBe(true)

    expect(
      generateData?.push?.tenant
    ).not.toBeNull()

    expect(
      generateData?.push?.owner
    ).not.toBeNull()

    // =========================================================
    // 13. TENANT ACEPTA
    // =========================================================

    const tenantAgreeResponse =
      await request.post(
        "/api/closing-agree",
        {
          data: {
            token:
              tenantClosingToken,
          },
        }
      )

    const tenantAgreeData =
      await tenantAgreeResponse.json()

    console.log(
      "TENANT AGREE:",
      JSON.stringify(
        tenantAgreeData,
        null,
        2
      )
    )

    expect(
      tenantAgreeResponse.status()
    ).toBe(200)

    expect(
      tenantAgreeData?.ok
    ).toBe(true)

    expect(
      tenantAgreeData?.tenant_agreed
    ).toBe(true)

    expect(
      tenantAgreeData?.both_agreed
    ).toBe(false)

    expect(
      tenantAgreeData?.push?.owner
    ).not.toBeNull()

    // =========================================================
    // 14. OWNER ACEPTA
    // =========================================================

    const ownerAgreeResponse =
      await request.post(
        "/api/closing-agree",
        {
          data: {
            token:
              ownerClosingToken,
          },
        }
      )

    const ownerAgreeData =
      await ownerAgreeResponse.json()

    console.log(
      "OWNER AGREE:",
      JSON.stringify(
        ownerAgreeData,
        null,
        2
      )
    )

    expect(
      ownerAgreeResponse.status()
    ).toBe(200)

    expect(
      ownerAgreeData?.ok
    ).toBe(true)

    expect(
      ownerAgreeData?.tenant_agreed
    ).toBe(true)

    expect(
      ownerAgreeData?.owner_agreed
    ).toBe(true)

    expect(
      ownerAgreeData?.both_agreed
    ).toBe(true)

    expect(
      ownerAgreeData?.contract_status
    ).toBe("agreed")

    expect(
      ownerAgreeData?.rental_id
    ).toBeTruthy()

    expect(
      ownerAgreeData?.push?.tenant
    ).not.toBeNull()

    expect(
      ownerAgreeData?.push?.owner
    ).not.toBeNull()

    console.log(
      "RENTAL ACTIVE:",
      ownerAgreeData.rental_id
    )

    console.log(
      "======================================"
    )

    console.log(
      "E2E COMPLETO VERLO OK"
    )

    console.log(
      "MATCH → DOBLE OK → CONTRATO → RENTAL"
    )

    console.log(
      "======================================"
    )
  }
)
