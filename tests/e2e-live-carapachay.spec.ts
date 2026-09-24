import {
  test,
  expect,
} from "@playwright/test"

test(
  "LIVE Carapachay: match real + GHL",
  async ({
    request,
  }) => {
    test.setTimeout(
      60_000
    )

    const tenantEmail =
      "juanoddone29@gmail.com"

    const tenantPhone =
      "1133614865"

    const ownerEmail =
      "juanmanueloddone74@gmail.com"

    const ownerPhone =
      "1176518605"

    const tenantResponse =
      await request.post(
        "/api/lead-intake",
        {
          data: {
            full_name:
              "Juan Oddone Test Tenant",

            email:
              tenantEmail,

            phone:
              tenantPhone,

            role:
              "tenant",

            intent:
              "tenant_search",

            zone:
              "Carapachay",

            area_macro:
              "gba_norte",

            neighborhood_labels:
              [
                "Carapachay",
              ],

            neighborhood_slugs:
              [
                "carapachay",
              ],

            neighborhood_slug:
              "carapachay",

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
              "e2e_live_carapachay",
          },
        }
      )

    expect(
      tenantResponse.status()
    ).toBe(
      200
    )

    const tenantData =
      await tenantResponse
        .json()

    expect(
      tenantData?.ok
    ).toBe(
      true
    )

    expect(
      tenantData?.lead_id
    ).toBeTruthy()

    console.log(
      "LIVE tenant lead:",
      tenantData.lead_id
    )

    const ownerResponse =
      await request.post(
        "/api/lead-intake",
        {
          data: {
            full_name:
              "Juan Manuel Oddone Test Owner",

            email:
              ownerEmail,

            phone:
              ownerPhone,

            role:
              "owner",

            intent:
              "owner_new_listing",

            zone:
              "Carapachay",

            area_macro:
              "owner_landing",

            neighborhood_labels:
              [
                "Carapachay",
              ],

            neighborhood_slugs:
              [
                "carapachay",
              ],

            neighborhood_slug:
              "carapachay",

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
              "e2e_live_carapachay",
          },
        }
      )

    expect(
      ownerResponse.status()
    ).toBe(
      200
    )

    const ownerData =
      await ownerResponse
        .json()

    expect(
      ownerData?.ok
    ).toBe(
      true
    )

    expect(
      ownerData?.lead_id
    ).toBeTruthy()

    expect(
      Number(
        ownerData
          ?.match_result
          ?.created ||
        0
      )
    ).toBeGreaterThanOrEqual(
      1
    )

    console.log(
      "LIVE owner lead:",
      ownerData.lead_id
    )

    console.log(
      "LIVE owner match result:",
      JSON.stringify(
        ownerData.match_result
      )
    )

    console.log(
      "LIVE owner response:",
      JSON.stringify(
        ownerData
      )
    )
  }
)
