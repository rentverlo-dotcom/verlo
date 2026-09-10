    // =========================================================
    // 3. GENERAR LINK PRIVADO DE MATCHES DEL TENANT
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

    expect(
      tokenResponse.status()
    ).toBe(200)

    const tokenData =
      await tokenResponse.json()

    expect(tokenData?.ok).toBe(true)
    expect(tokenData?.token).toBeTruthy()
    expect(
      tokenData?.matches_url
    ).toBeTruthy()

    console.log(
      "TENANT MATCHES URL:",
      tokenData.matches_url
    )

    // =========================================================
    // 4. ABRIR MATCHES REALES
    // =========================================================

    await page.goto(
      tokenData.matches_url,
      {
        waitUntil:
          "domcontentloaded",
      }
    )

    await expect(
      page.getByText(
        "Encontramos opciones",
        {
          exact: false,
        }
      )
    ).toBeVisible()

    const cards =
      page.locator(
        "article.card"
      )

    expect(
      await cards.count()
    ).toBeGreaterThan(0)

    console.log(
      "MATCH CARDS:",
      await cards.count()
    )

    // =========================================================
    // 5. ALEJANDRO ELIGE LA PRIMERA PROPIEDAD
    // =========================================================

    await cards
      .first()
      .locator("button.select")
      .click()

    // =========================================================
    // 6. CONTINÚA A VALIDACIÓN
    // =========================================================

    await page
      .locator(
        "section.bottom button"
      )
      .click()

    await expect(page).toHaveURL(
      new RegExp(
        `/tenant/validacion/${tokenData.token}\\?matches=`
      )
    )

    console.log(
      "VALIDATION URL:",
      page.url()
    )
