import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { sendPushToLead } from '@/lib/push'

export const runtime = 'nodejs'

const ACTIVE_MATCH_STATUSES = [
  'new',
  'reviewed',
  'contacted',
]

async function postInternal(
  request: Request,
  path: string,
  body: Record<string, unknown>
) {
  const response = await fetch(
    new URL(path, request.url),
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    }
  )

  const data = await response
    .json()
    .catch(() => null)

  return {
    ok: response.ok && data?.ok !== false,
    status: response.status,
    data,
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()

    const leadId = String(
      body?.lead_id || ''
    ).trim()

    const role = String(
      body?.role || ''
    ).trim()

    const subscription =
      body?.subscription

    const endpoint = String(
      subscription?.endpoint || ''
    ).trim()

    const p256dh = String(
      subscription?.keys?.p256dh || ''
    ).trim()

    const auth = String(
      subscription?.keys?.auth || ''
    ).trim()

    if (!leadId) {
      return NextResponse.json(
        {
          ok: false,
          error: 'Missing lead_id',
        },
        {
          status: 400,
        }
      )
    }

    if (
      role !== 'tenant' &&
      role !== 'owner'
    ) {
      return NextResponse.json(
        {
          ok: false,
          error: 'Invalid role',
        },
        {
          status: 400,
        }
      )
    }

    if (
      !endpoint ||
      !p256dh ||
      !auth
    ) {
      return NextResponse.json(
        {
          ok: false,
          error:
            'Invalid push subscription',
        },
        {
          status: 400,
        }
      )
    }

    // =========================================================
    // 1. VER SI ESTA SUSCRIPCIÓN YA EXISTÍA
    // =========================================================

    const {
      data:
        existingSubscription,
      error:
        existingSubscriptionError,
    } =
      await supabaseAdmin
        .from(
          'push_subscriptions'
        )
        .select(
          'id, lead_id, role, revoked_at'
        )
        .eq(
          'endpoint',
          endpoint
        )
        .maybeSingle()

    if (
      existingSubscriptionError
    ) {
      throw existingSubscriptionError
    }

    const isNewSubscription =
      !existingSubscription

    // =========================================================
    // 2. GUARDAR / REACTIVAR SUSCRIPCIÓN
    // =========================================================

    const {
      error,
    } =
      await supabaseAdmin
        .from(
          'push_subscriptions'
        )
        .upsert(
          {
            lead_id:
              leadId,

            role,

            endpoint,

            p256dh,

            auth,

            user_agent:
              request.headers.get(
                'user-agent'
              ),

            updated_at:
              new Date()
                .toISOString(),

            revoked_at:
              null,
          },
          {
            onConflict:
              'endpoint',
          }
        )

    if (error) {
      throw error
    }

    const notifications:
      Array<{
        event: string
        lead_id: string
        role: string
        sent: boolean
        result?: unknown
      }> = []

    // =========================================================
    // 3. EVENTO 1: BIENVENIDA
    //
    // Solo la primera vez que este dispositivo queda suscripto.
    // Copy provisorio.
    // =========================================================

    if (
      isNewSubscription
    ) {
      try {
        const result =
          await sendPushToLead(
            leadId,
            {
              title:
                'Bienvenido a Verlo',

              body:
                'Ya estás adentro. Te vamos a avisar cuando haya novedades importantes.',

              url:
                '/',
            }
          )

        notifications.push({
          event:
            'welcome',

          lead_id:
            leadId,

          role,

          sent:
            true,

          result,
        })
      } catch (
        pushError
      ) {
        console.error(
          'welcome push error:',
          pushError
        )

        notifications.push({
          event:
            'welcome',

          lead_id:
            leadId,

          role,

          sent:
            false,
        })
      }
    }

    // =========================================================
    // 4. EVENTO 2: FORMULARIO RECIBIDO
    //
    // También solo en el alta inicial de esta suscripción.
    // Copy provisorio.
    // =========================================================

    if (
      isNewSubscription
    ) {
      try {
        const result =
          await sendPushToLead(
            leadId,
            {
              title:
                'Verlo · Datos recibidos',

              body:
                role ===
                'tenant'
                  ? 'Guardamos tu búsqueda correctamente.'
                  : 'Guardamos los datos de tu propiedad correctamente.',

              url:
                '/',
            }
          )

        notifications.push({
          event:
            'intake_completed',

          lead_id:
            leadId,

          role,

          sent:
            true,

          result,
        })
      } catch (
        pushError
      ) {
        console.error(
          'intake completed push error:',
          pushError
        )

        notifications.push({
          event:
            'intake_completed',

          lead_id:
            leadId,

          role,

          sent:
            false,
        })
      }
    }

    // =========================================================
    // 5. EVENTO 3 PARA TENANT:
    //    TIENE MATCH(ES) -> /matches/[token]
    // =========================================================

    if (
      role === 'tenant'
    ) {
      const {
        data: matches,
        error:
          matchesError,
      } =
        await supabaseAdmin
          .from(
            'lead_matches'
          )
          .select(
            'id, owner_lead_id, score, status'
          )
          .eq(
            'tenant_lead_id',
            leadId
          )
          .in(
            'status',
            ACTIVE_MATCH_STATUSES
          )
          .gte(
            'score',
            80
          )
          .order(
            'score',
            {
              ascending:
                false,
            }
          )

      if (
        matchesError
      ) {
        throw matchesError
      }

      if (
        matches &&
        matches.length >
          0
      ) {
        const tokenResult =
          await postInternal(
            request,
            '/api/tenant-matches-token',
            {
              tenant_lead_id:
                leadId,
            }
          )

        if (
          tokenResult.ok &&
          tokenResult.data
            ?.matches_url
        ) {
          try {
            const result =
              await sendPushToLead(
                leadId,
                {
                  title:
                    'Verlo · Tenés matches',

                  body:
                    matches.length ===
                    1
                      ? 'Encontramos una propiedad compatible. Entrá para verla y completar tus datos.'
                      : `Encontramos ${matches.length} propiedades compatibles. Entrá para verlas y completar tus datos.`,

                  url:
                    String(
                      tokenResult
                        .data
                        .matches_url
                    ),
                }
              )

            notifications.push({
              event:
                'match_available',

              lead_id:
                leadId,

              role:
                'tenant',

              sent:
                true,

              result,
            })
          } catch (
            pushError
          ) {
            console.error(
              'tenant match push error:',
              pushError
            )

            notifications.push({
              event:
                'match_available',

              lead_id:
                leadId,

              role:
                'tenant',

              sent:
                false,
            })
          }
        }

        // =====================================================
        // 6. EL TENANT NUEVO TAMBIÉN PUEDE HABER GENERADO
        //    MATCHES PARA OWNERS QUE YA ESTABAN SUSCRIPTOS.
        //
        // A cada owner involucrado:
        // - crear/reutilizar token de propiedad
        // - avisar que tiene matches
        // - CTA para completar/mejorar fotos y videos
        // =====================================================

        const ownerLeadIds =
          Array.from(
            new Set(
              matches
                .map(
                  (
                    match
                  ) =>
                    String(
                      match
                        .owner_lead_id ||
                        ''
                    ).trim()
                )
                .filter(
                  Boolean
                )
            )
          )

        for (
          const ownerLeadId
          of ownerLeadIds
        ) {
          const {
            count:
              subscriptionCount,
            error:
              ownerSubscriptionError,
          } =
            await supabaseAdmin
              .from(
                'push_subscriptions'
              )
              .select(
                'id',
                {
                  count:
                    'exact',
                  head:
                    true,
                }
              )
              .eq(
                'lead_id',
                ownerLeadId
              )
              .eq(
                'role',
                'owner'
              )
              .is(
                'revoked_at',
                null
              )

          if (
            ownerSubscriptionError
          ) {
            console.error(
              'owner subscription lookup error:',
              ownerLeadId,
              ownerSubscriptionError
            )

            continue
          }

          if (
            !subscriptionCount
          ) {
            continue
          }

          const ownerTokenResult =
            await postInternal(
              request,
              '/api/owner-property-token',
              {
                owner_lead_id:
                  ownerLeadId,
              }
            )

          if (
            !ownerTokenResult.ok ||
            !ownerTokenResult
              .data
              ?.property_url
          ) {
            console.error(
              'owner property token error:',
              ownerLeadId,
              ownerTokenResult
            )

            continue
          }

          try {
            const result =
              await sendPushToLead(
                ownerLeadId,
                {
                  title:
                    'Verlo · Tenés matches',

                  body:
                    'Encontramos personas compatibles con tu propiedad. Completá la publicación y sumá fotos o videos para avanzar.',

                  url:
                    String(
                      ownerTokenResult
                        .data
                        .property_url
                    ),
                }
              )

            notifications.push({
              event:
                'match_available',

              lead_id:
                ownerLeadId,

              role:
                'owner',

              sent:
                true,

              result,
            })
          } catch (
            pushError
          ) {
            console.error(
              'owner match push error:',
              ownerLeadId,
              pushError
            )

            notifications.push({
              event:
                'match_available',

              lead_id:
                ownerLeadId,

              role:
                'owner',

              sent:
                false,
            })
          }
        }
      }
    }

    // =========================================================
    // 7. EVENTO 3 PARA OWNER NUEVO
    //
    // Si el owner se registra y ya existen tenants compatibles,
    // generamos su token de propiedad y lo avisamos.
    //
    // También avisamos a los tenants ya suscriptos.
    // =========================================================

    if (
      role === 'owner'
    ) {
      const {
        data: matches,
        error:
          matchesError,
      } =
        await supabaseAdmin
          .from(
            'lead_matches'
          )
          .select(
            'id, tenant_lead_id, score, status'
          )
          .eq(
            'owner_lead_id',
            leadId
          )
          .in(
            'status',
            ACTIVE_MATCH_STATUSES
          )
          .gte(
            'score',
            80
          )
          .order(
            'score',
            {
              ascending:
                false,
            }
          )

      if (
        matchesError
      ) {
        throw matchesError
      }

      if (
        matches &&
        matches.length >
          0
      ) {
        const ownerTokenResult =
          await postInternal(
            request,
            '/api/owner-property-token',
            {
              owner_lead_id:
                leadId,
            }
          )

        if (
          ownerTokenResult.ok &&
          ownerTokenResult
            .data
            ?.property_url
        ) {
          try {
            const result =
              await sendPushToLead(
                leadId,
                {
                  title:
                    'Verlo · Tenés matches',

                  body:
                    'Encontramos personas compatibles con tu propiedad. Completá la publicación y sumá fotos o videos para avanzar.',

                  url:
                    String(
                      ownerTokenResult
                        .data
                        .property_url
                    ),
                }
              )

            notifications.push({
              event:
                'match_available',

              lead_id:
                leadId,

              role:
                'owner',

              sent:
                true,

              result,
            })
          } catch (
            pushError
          ) {
            console.error(
              'owner own match push error:',
              pushError
            )

            notifications.push({
              event:
                'match_available',

              lead_id:
                leadId,

              role:
                'owner',

              sent:
                false,
            })
          }
        }

        const tenantLeadIds =
          Array.from(
            new Set(
              matches
                .map(
                  (
                    match
                  ) =>
                    String(
                      match
                        .tenant_lead_id ||
                        ''
                    ).trim()
                )
                .filter(
                  Boolean
                )
            )
          )

        for (
          const tenantLeadId
          of tenantLeadIds
        ) {
          const {
            count:
              subscriptionCount,
            error:
              tenantSubscriptionError,
          } =
            await supabaseAdmin
              .from(
                'push_subscriptions'
              )
              .select(
                'id',
                {
                  count:
                    'exact',
                  head:
                    true,
                }
              )
              .eq(
                'lead_id',
                tenantLeadId
              )
              .eq(
                'role',
                'tenant'
              )
              .is(
                'revoked_at',
                null
              )

          if (
            tenantSubscriptionError
          ) {
            console.error(
              'tenant subscription lookup error:',
              tenantLeadId,
              tenantSubscriptionError
            )

            continue
          }

          if (
            !subscriptionCount
          ) {
            continue
          }

          const tenantTokenResult =
            await postInternal(
              request,
              '/api/tenant-matches-token',
              {
                tenant_lead_id:
                  tenantLeadId,
              }
            )

          if (
            !tenantTokenResult.ok ||
            !tenantTokenResult
              .data
              ?.matches_url
          ) {
            console.error(
              'tenant matches token error:',
              tenantLeadId,
              tenantTokenResult
            )

            continue
          }

          try {
            const result =
              await sendPushToLead(
                tenantLeadId,
                {
                  title:
                    'Verlo · Tenés matches',

                  body:
                    'Apareció una propiedad compatible con tu búsqueda. Entrá para verla y completar tus datos.',

                  url:
                    String(
                      tenantTokenResult
                        .data
                        .matches_url
                    ),
                }
              )

            notifications.push({
              event:
                'match_available',

              lead_id:
                tenantLeadId,

              role:
                'tenant',

              sent:
                true,

              result,
            })
          } catch (
            pushError
          ) {
            console.error(
              'existing tenant match push error:',
              tenantLeadId,
              pushError
            )

            notifications.push({
              event:
                'match_available',

              lead_id:
                tenantLeadId,

              role:
                'tenant',

              sent:
                false,
            })
          }
        }
      }
    }

    return NextResponse.json({
      ok: true,
      is_new_subscription:
        isNewSubscription,
      notifications,
    })
  } catch (error) {
    console.error(
      'push subscribe error',
      error
    )

    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : 'Unknown error',
      },
      {
        status: 500,
      }
    )
  }
}
