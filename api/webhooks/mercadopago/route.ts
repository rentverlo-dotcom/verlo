// app/api/webhooks/mercadopago/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

function verifySignature(req: Request, body: string) {
  const signature = req.headers.get("x-signature");
  if (!signature) return false;

  const expected = crypto
    .createHmac("sha256", process.env.MERCADOPAGO_WEBHOOK_SECRET!)
    .update(body)
    .digest("hex");

  return signature === expected;
}

export async function POST(req: Request) {
  const body = await req.text();

  if (!verifySignature(req, body)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  const event = JSON.parse(body);

  if (event.type !== "payment") {
    return NextResponse.json({ ok: true });
  }

  const mpPaymentId = event.data.id;

  // 1. Buscar payment
  const { data: payment } = await supabase
    .from("payments")
    .select("*")
    .eq("provider_payment_id", mpPaymentId)
    .single();

  if (!payment) return NextResponse.json({ ok: true });

  // 2. Actualizar payment
  await supabase
    .from("payments")
    .update({ status: "paid" })
    .eq("id", payment.id);

  // 3. Desbloquear contrato
  await supabase
    .from("contracts")
    .update({
      locked: false,
      status: "ready_to_sign",
      payment_id: payment.id,
    })
    .eq("id", payment.contract_id);

  return NextResponse.json({ ok: true });
}
