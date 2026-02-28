import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

// Supabase con service role (necesario para saltar RLS)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  try {
    const body = await req.json();

    // Mercado Pago manda esto
    const paymentId = body?.data?.id;
    const eventType = body?.type;

    if (eventType !== "payment" || !paymentId) {
      return NextResponse.json({ ok: true });
    }

    // 1️⃣ Pedimos el payment real a MP
    const mpRes = await fetch(
      `https://api.mercadopago.com/v1/payments/${paymentId}`,
      {
        headers: {
          Authorization: `Bearer ${process.env.MERCADOPAGO_ACCESS_TOKEN}`,
        },
      }
    );

    const payment = await mpRes.json();

    const status = payment.status; // approved | pending | rejected
    const contractId = payment.external_reference;

    if (!contractId) {
      return NextResponse.json({ ok: true });
    }

    // 2️⃣ Actualizamos payment en DB
    await supabase
      .from("payments")
      .update({
        status,
        provider_payment_id: payment.id,
      })
      .eq("provider_payment_id", payment.id);

    // 3️⃣ Si está aprobado → desbloqueamos contrato
    if (status === "approved") {
      await supabase
        .from("contracts")
        .update({
          locked: false,
          status: "ready_to_sign",
        })
        .eq("id", contractId);
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("MP webhook error:", error);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
