import { test, expect } from "@playwright/test"

const PNG_1X1 = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Y9Zx7sAAAAASUVORK5CYII=",
  "base64"
)

const RUN_ID = Date.now().toString()

const OWNER_PHOTO_1 = `verlo-owner-${RUN_ID}-1.png`
const OWNER_PHOTO_2 = `verlo-owner-${RUN_ID}-2.png`
const OWNER_PHOTO_3 = `verlo-owner-${RUN_ID}-3.png`

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
      .fill("Juan Manuel Oddone")

    await page
      .locator('input[name="phone"]')
      .fill("1133614865")

    await page
      .locator('input[name="email"]')
      .fill("juancho12oddone@gmail.com")

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

    await page
      .locator(
        'input[type="file"][accept="image/*,video/*"]'
      )
      .setInputFiles([
        {
          name: OWNER_PHOTO_1,
          mimeType: "image/png",
          buffer: PNG_1X1,
        },
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
      .fill("Alejandro Devincenzi")

    await page
      .locator('input[name="phone"]')
      .fill("1154217300")

    await page
      .locator('input[name="email"]')
      .fill("aedevincenzi@gmail.com")

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
      .fill("30123456")

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
    // 7. OWNER VE A ALEJANDRO
    // =========================================================

    await page.goto(
      candidatesUrl,
      {
        waitUntil: "domcontentloaded",
      }
    )

    const alejandroCard =
      page
        .locator("article.candidate-card")
        .filter({ hasText: "Alejandro" })

    await expect(
      alejandroCard
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

    await alejandroCard
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
    // 9. DATOS LEGALES TENANT
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
                "30123456",

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
    // 10. DATOS LEGALES OWNER + INMUEBLE
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
                "20123456",

              tax_id:
                "20201234567",

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
    // 11. GENERAR CONTRATO
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

    // =========================================================
    // 12. TENANT ACEPTA
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

    // =========================================================
    // 13. OWNER ACEPTA
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
