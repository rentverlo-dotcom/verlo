import {
  NextRequest,
  NextResponse,
} from "next/server"

import {
  createClient,
} from "@supabase/supabase-js"

import {
  notifyLeadOnce,
} from "@/lib/lead-notifications"

export const runtime =
  "nodejs"

export const dynamic =
  "force-dynamic"

function clean(
  value: unknown
) {
  return String(
    value || ""
  ).trim()
}

export async function POST(
  request: NextRequest
) {
  try {
    const supabaseUrl =
      process.env
        .NEXT_PUBLIC_SUPABASE_URL

    const serviceRoleKey =
      process.env
        .SUPABASE_SERVICE_ROLE_KEY

    if (
      !supabaseUrl ||
      !serviceRoleKey
    ) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "Missing configuration",
        },
        {
          status: 500,
        }
      )
    }

    const supabase =
      createClient(
        supabaseUrl,
        serviceRoleKey,
        {
          auth: {
            persistSession:
              false,

            autoRefreshToken:
              false,
          },
        }
      )

    const body =
      await request
        .json()
        .catch(
          () => ({})
        )

    const token =
      clean(
        body?.token
      )

    if (
      !token
    ) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "Missing token",
        },
        {
          status: 400,
        }
      )
    }

    // =========================================================
    // 1. VALIDAR TOKEN DE CIERRE
    // =========================================================

    const {
      data:
        accessToken,

      error:
        tokenError,
    } =
      await supabase
        .from(
          "lead_contract_access_tokens"
        )
        .select(`
          id,
          contract_id,
          lead_id,
          role,
          expires_at,
          revoked_at
        `)
        .eq(
          "token",
          token
        )
        .single()

    if (
      tokenError ||
      !accessToken
    ) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "Invalid token",
        },
        {
          status: 404,
        }
      )
    }

    if (
      accessToken
        .revoked_at
    ) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "Token revoked",
        },
        {
          status: 403,
        }
      )
    }

    if (
      accessToken
        .expires_at &&
      new Date(
        accessToken
          .expires_at
      ).getTime() <
        Date.now()
    ) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "Expired token",
        },
        {
          status: 403,
        }
      )
    }

    if (
      accessToken.role !==
        "tenant" &&
      accessToken.role !==
        "owner"
    ) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "Invalid role",
        },
        {
          status: 403,
        }
      )
    }

    // =========================================================
    // 2. CONTRATO
    // =========================================================

    const {
      data:
        contract,

      error:
        contractError,
    } =
      await supabase
        .from(
          "lead_contracts"
        )
        .select(`
          id,
          lead_match_id,
          tenant_lead_id,
          owner_lead_id,
          status,
          content,
          start_date,
          end_date,
          tenant_agreed_at,
          owner_agreed_at,
          updated_at
        `)
        .eq(
          "id",
          accessToken
            .contract_id
        )
        .single()

    if (
      contractError ||
      !contract
    ) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "Contract not found",
        },
        {
          status: 404,
        }
      )
    }

    if (
      !contract.content ||
      (
        contract.status !==
          "generated" &&
        contract.status !==
          "agreed"
      )
    ) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "Contract has not been generated yet",
        },
        {
          status: 409,
        }
      )
    }

    if (
      !contract
        .start_date ||
      !contract
        .end_date
    ) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "Contract dates are missing",
        },
        {
          status: 409,
        }
      )
    }

    // =========================================================
    // 3. TOKEN DEBE PERTENECER A ESA PARTE
    // =========================================================

    if (
      accessToken.role ===
        "tenant" &&
      accessToken.lead_id !==
        contract
          .tenant_lead_id
    ) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "Invalid tenant access",
        },
        {
          status: 403,
        }
      )
    }

    if (
      accessToken.role ===
        "owner" &&
      accessToken.lead_id !==
        contract
          .owner_lead_id
    ) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "Invalid owner access",
        },
        {
          status: 403,
        }
      )
    }

    // =========================================================
    // 4. VALIDAR MATCH
    // =========================================================

    const {
      data:
        match,

      error:
        matchError,
    } =
      await supabase
        .from(
          "lead_matches"
        )
        .select(`
          id,
          tenant_lead_id,
          owner_lead_id,
          ready_to_connect_at,
          tenant_post_visit_decision,
          tenant_post_visit_decided_at,
          owner_post_visit_decision,
          owner_post_visit_decided_at,
          status
        `)
        .eq(
          "id",
          contract
            .lead_match_id
        )
        .single()

    if (
      matchError ||
      !match
    ) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "Match not found",
        },
        {
          status: 404,
        }
      )
    }

    if (
      match
        .tenant_lead_id !==
        contract
          .tenant_lead_id ||
      match
        .owner_lead_id !==
        contract
          .owner_lead_id
    ) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "Contract and match do not correspond",
        },
        {
          status: 409,
        }
      )
    }

    if (
      !match
        .ready_to_connect_at
    ) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "Match is not ready to close",
        },
        {
          status: 409,
        }
      )
    }

    // =========================================================
    // 5. DOBLE OK #2 OBLIGATORIO
    // =========================================================

    const tenantPostVisitYes =
      match
        .tenant_post_visit_decision ===
      "yes"

    const ownerPostVisitYes =
      match
        .owner_post_visit_decision ===
      "yes"

    if (
      !tenantPostVisitYes ||
      !ownerPostVisitYes
    ) {
      return NextResponse.json(
        {
          ok: false,

          error:
            "Both parties must confirm after the visit before accepting the contract",

          post_visit: {
            tenant:
              match
                .tenant_post_visit_decision ||
              null,

            owner:
              match
                .owner_post_visit_decision ||
              null,
          },
        },
        {
          status: 409,
        }
      )
    }

    // =========================================================
    // 6. REGISTRAR ACEPTACIÓN
    // =========================================================

    const now =
      new Date()
        .toISOString()

    const contractVersion =
      clean(
        contract
          .updated_at
      ) ||
      contract.id

    const previouslyAgreed =
      accessToken.role ===
      "tenant"
        ? Boolean(
            contract
              .tenant_agreed_at
          )
        : Boolean(
            contract
              .owner_agreed_at
          )

    const tenantAgreedAt =
      accessToken.role ===
      "tenant"
        ? contract
            .tenant_agreed_at ||
          now
        : contract
            .tenant_agreed_at

    const ownerAgreedAt =
      accessToken.role ===
      "owner"
        ? contract
            .owner_agreed_at ||
          now
        : contract
            .owner_agreed_at

    const previouslyBothAgreed =
      Boolean(
        contract
          .tenant_agreed_at &&
        contract
          .owner_agreed_at
      )

    const bothAgreed =
      Boolean(
        tenantAgreedAt &&
        ownerAgreedAt
      )

    const becameBothAgreed =
      bothAgreed &&
      !previouslyBothAgreed

    if (
      !previouslyAgreed
    ) {
      const {
        error:
          contractUpdateError,
      } =
        await supabase
          .from(
            "lead_contracts"
          )
          .update({
            tenant_agreed_at:
              tenantAgreedAt,

            owner_agreed_at:
              ownerAgreedAt,

            status:
              bothAgreed
                ? "agreed"
                : "generated",

            updated_at:
              now,
          })
          .eq(
            "id",
            contract.id
          )

      if (
        contractUpdateError
      ) {
        throw new Error(
          contractUpdateError
            .message
        )
      }
    }

    let rentalId:
      string | null =
      null

    // =========================================================
    // 7. AMBOS ACEPTARON → CREAR ALQUILER
    // =========================================================

    if (
      bothAgreed
    ) {
      const {
        data:
          existingRental,

        error:
          existingRentalError,
      } =
        await supabase
          .from(
            "rentals"
          )
          .select(`
            id,
            lead_contract_id
          `)
          .eq(
            "lead_contract_id",
            contract.id
          )
          .maybeSingle()

      if (
        existingRentalError
      ) {
        throw new Error(
          existingRentalError
            .message
        )
      }

      if (
        existingRental
      ) {
        rentalId =
          existingRental.id
      } else {
        const {
          data:
            createdRental,

          error:
            rentalInsertError,
        } =
          await supabase
            .from(
              "rentals"
            )
            .insert({
              lead_contract_id:
                contract.id,

              lead_match_id:
                contract
                  .lead_match_id,

              tenant_lead_id:
                contract
                  .tenant_lead_id,

              owner_lead_id:
                contract
                  .owner_lead_id,

              status:
                "active",

              start_date:
                contract
                  .start_date,

              end_date:
                contract
                  .end_date,

              activated_at:
                now,

              updated_at:
                now,
            })
            .select(
              "id"
            )
            .single()

        if (
          rentalInsertError ||
          !createdRental
        ) {
          throw new Error(
            rentalInsertError
              ?.message ||
              "Could not create rental"
          )
        }

        rentalId =
          createdRental.id
      }

      // =======================================================
      // 7A. MATCH ELEGIDO = CONVERTED
      // =======================================================

      const {
        error:
          convertedError,
      } =
        await supabase
          .from(
            "lead_matches"
          )
          .update({
            status:
              "converted",
          })
          .eq(
            "id",
            contract
              .lead_match_id
          )

      if (
        convertedError
      ) {
        throw new Error(
          convertedError
            .message
        )
      }

      // =======================================================
      // 7B. DESCARTAR OTROS MATCHES DEL TENANT
      // =======================================================

      const {
        error:
          tenantMatchesError,
      } =
        await supabase
          .from(
            "lead_matches"
          )
          .update({
            status:
              "discarded",
          })
          .eq(
            "tenant_lead_id",
            contract
              .tenant_lead_id
          )
          .neq(
            "id",
            contract
              .lead_match_id
          )
          .in(
            "status",
            [
              "new",
              "reviewed",
              "contacted",
            ]
          )

      if (
        tenantMatchesError
      ) {
        throw new Error(
          tenantMatchesError
            .message
        )
      }

      // =======================================================
      // 7C. DESCARTAR OTROS MATCHES DEL OWNER
      // =======================================================

      const {
        error:
          ownerMatchesError,
      } =
        await supabase
          .from(
            "lead_matches"
          )
          .update({
            status:
              "discarded",
          })
          .eq(
            "owner_lead_id",
            contract
              .owner_lead_id
          )
          .neq(
            "id",
            contract
              .lead_match_id
          )
          .in(
            "status",
            [
              "new",
              "reviewed",
              "contacted",
            ]
          )

      if (
        ownerMatchesError
      ) {
        throw new Error(
          ownerMatchesError
            .message
        )
      }

      // =======================================================
      // 7D. CERRAR PANEL DE MATCHES TENANT
      // =======================================================

      const {
        error:
          tenantTokenError,
      } =
        await supabase
          .from(
            "tenant_matches_access_tokens"
          )
          .update({
            revoked_at:
              now,
          })
          .eq(
            "tenant_lead_id",
            contract
              .tenant_lead_id
          )
          .is(
            "revoked_at",
            null
          )

      if (
        tenantTokenError
      ) {
        throw new Error(
          tenantTokenError
            .message
        )
      }

      // =======================================================
      // 7E. CERRAR PANEL DE CANDIDATOS OWNER
      // =======================================================

      const {
        error:
          ownerCandidatesTokenError,
      } =
        await supabase
          .from(
            "owner_candidates_access_tokens"
          )
          .update({
            revoked_at:
              now,
          })
          .eq(
            "owner_lead_id",
            contract
              .owner_lead_id
          )
          .is(
            "revoked_at",
            null
          )

      if (
        ownerCandidatesTokenError
      ) {
        throw new Error(
          ownerCandidatesTokenError
            .message
        )
      }

      // =======================================================
      // 7F. CERRAR TOKEN DE CARGA DE PROPIEDAD
      // =======================================================

      const {
        error:
          ownerPropertyTokenError,
      } =
        await supabase
          .from(
            "owner_property_access_tokens"
          )
          .update({
            revoked_at:
              now,
          })
          .eq(
            "owner_lead_id",
            contract
              .owner_lead_id
          )
          .is(
            "revoked_at",
            null
          )

      if (
        ownerPropertyTokenError
      ) {
        throw new Error(
          ownerPropertyTokenError
            .message
        )
      }
    }

    // =========================================================
    // 8. TOKENS DE CIERRE
    // =========================================================

    const {
      data:
        contractTokens,

      error:
        contractTokensError,
    } =
      await supabase
        .from(
          "lead_contract_access_tokens"
        )
        .select(`
          token,
          lead_id,
          role,
          expires_at,
          revoked_at
        `)
        .eq(
          "contract_id",
          contract.id
        )
        .is(
          "revoked_at",
          null
        )

    if (
      contractTokensError
    ) {
      throw new Error(
        contractTokensError
          .message
      )
    }

    const nowMs =
      Date.now()

    const usableTokens =
      (
        contractTokens ||
        []
      ).filter(
        item =>
          !item.expires_at ||
          new Date(
            item.expires_at
          ).getTime() >
            nowMs
      )

    const tenantToken =
      usableTokens.find(
        item =>
          item.role ===
            "tenant" &&
          item.lead_id ===
            contract
              .tenant_lead_id
      )

    const ownerToken =
      usableTokens.find(
        item =>
          item.role ===
            "owner" &&
          item.lead_id ===
            contract
              .owner_lead_id
      )

    const tenantClosingUrl =
      tenantToken?.token
        ? `/cierre/${encodeURIComponent(
            tenantToken.token
          )}`
        : null

    const ownerClosingUrl =
      ownerToken?.token
        ? `/cierre/${encodeURIComponent(
            ownerToken.token
          )}`
        : null

    const tenantFinalUrl =
      tenantToken?.token
        ? `/final/${encodeURIComponent(
            tenantToken.token
          )}`
        : null

    const ownerFinalUrl =
      ownerToken?.token
        ? `/final/${encodeURIComponent(
            ownerToken.token
          )}`
        : null

    // =========================================================
    // 9. PUSH
    // =========================================================

    let tenantPush:
      unknown =
      null

    let ownerPush:
      unknown =
      null

    // =========================================================
    // 9A. UNA PARTE ACEPTÓ → AVISAR A LA OTRA
    //
    // Solo si esta aceptación ocurrió AHORA.
    // =========================================================

    if (
      !previouslyAgreed &&
      !bothAgreed
    ) {
      if (
        accessToken.role ===
          "tenant" &&
        ownerClosingUrl
      ) {
        try {
          ownerPush =
            await notifyLeadOnce({
              eventKey:
                `contract_accept_waiting:owner:${contract.id}:tenant:${contractVersion}`,

              eventType:
                "contract_accept_waiting",

              leadId:
                contract
                  .owner_lead_id,

              entityType:
                "contract",

              entityId:
                contract.id,

              title:
                "Falta tu aceptación",

              body:
                "El inquilino ya aceptó el contrato. Revisalo y confirmá tu aceptación para cerrar el alquiler.",

              url:
                ownerClosingUrl,
            })
        } catch (
          pushError
        ) {
          console.error(
            "closing-agree owner waiting push error:",
            pushError
          )
        }
      }

      if (
        accessToken.role ===
          "owner" &&
        tenantClosingUrl
      ) {
        try {
          tenantPush =
            await notifyLeadOnce({
              eventKey:
                `contract_accept_waiting:tenant:${contract.id}:owner:${contractVersion}`,

              eventType:
                "contract_accept_waiting",

              leadId:
                contract
                  .tenant_lead_id,

              entityType:
                "contract",

              entityId:
                contract.id,

              title:
                "Falta tu aceptación",

              body:
                "El propietario ya aceptó el contrato. Revisalo y confirmá tu aceptación para cerrar el alquiler.",

              url:
                tenantClosingUrl,
            })
        } catch (
          pushError
        ) {
          console.error(
            "closing-agree tenant waiting push error:",
            pushError
          )
        }
      }
    }

    // =========================================================
    // 9B. AMBOS ACEPTARON → ALQUILER CONFIRMADO
    //
    // Solo cuando pasa de uno a ambos.
    // =========================================================

    if (
      becameBothAgreed
    ) {
      if (
        tenantFinalUrl
      ) {
        try {
          tenantPush =
            await notifyLeadOnce({
              eventKey:
                `rental_confirmed:tenant:${contract.id}:${contractVersion}`,

              eventType:
                "rental_confirmed",

              leadId:
                contract
                  .tenant_lead_id,

              entityType:
                "rental",

              entityId:
                rentalId ||
                contract.id,

              title:
                "🎉 Alquiler confirmado",

              body:
                "Las dos partes aceptaron el contrato. Gracias por usar Verlo.",

              url:
                tenantFinalUrl,
            })
        } catch (
          pushError
        ) {
          console.error(
            "closing-agree tenant final push error:",
            pushError
          )
        }
      }

      if (
        ownerFinalUrl
      ) {
        try {
          ownerPush =
            await notifyLeadOnce({
              eventKey:
                `rental_confirmed:owner:${contract.id}:${contractVersion}`,

              eventType:
                "rental_confirmed",

              leadId:
                contract
                  .owner_lead_id,

              entityType:
                "rental",

              entityId:
                rentalId ||
                contract.id,

              title:
                "🎉 Alquiler confirmado",

              body:
                "Las dos partes aceptaron el contrato. Gracias por usar Verlo.",

              url:
                ownerFinalUrl,
            })
        } catch (
          pushError
        ) {
          console.error(
            "closing-agree owner final push error:",
            pushError
          )
        }
      }
    }

    // =========================================================
    // 10. RESPONSE
    // =========================================================

    return NextResponse.json({
      ok:
        true,

      role:
        accessToken.role,

      agreed:
        true,

      already_agreed:
        previouslyAgreed,

      tenant_agreed:
        Boolean(
          tenantAgreedAt
        ),

      owner_agreed:
        Boolean(
          ownerAgreedAt
        ),

      both_agreed:
        bothAgreed,

      became_both_agreed:
        becameBothAgreed,

      contract_status:
        bothAgreed
          ? "agreed"
          : "generated",

      match_status:
        bothAgreed
          ? "converted"
          : match.status,

      flow_closed:
        bothAgreed,

      rental_id:
        rentalId,

      post_visit: {
        tenant:
          match
            .tenant_post_visit_decision,

        owner:
          match
            .owner_post_visit_decision,
      },

      push: {
        tenant:
          tenantPush,

        owner:
          ownerPush,
      },
    })
  } catch (
    error
  ) {
    console.error(
      "closing-agree error:",
      error
    )

    return NextResponse.json(
      {
        ok:
          false,

        error:
          error instanceof
            Error
            ? error.message
            : "Unexpected server error",
      },
      {
        status: 500,
      }
    )
  }
}
