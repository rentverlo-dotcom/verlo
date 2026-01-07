// app/api/payments/create/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import MercadoPago from "mercadopago";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // server only
);

MercadoPago.configure({
  access_token: process.env.MERCADOPAGO_ACCESS_TOKEN!,
});

export async function POST(req: Request) {
  const { contract_id } = await req.json();

  // 1. Traer contrato
  const { data: contract, error } = await supabase
    .from("contracts")
    .select("id, locked, tenant_id, status")
    .eq("id", contract_id)
    .single();

  if (error || !contract) {
    return NextResponse.json({ error: "Contrato no encontrado" }, { status: 404 });
  }

  if (!contract.locked) {
    return NextResponse.json({ error: "Contrato ya desbloqueado" }, { status: 400 });
  }

  // 2. Ver si hay payment pending
  const { data: existing } = await supabase
    .from("payments")
    .select("*")
    .eq("contract_id", contract_id)
    .eq("status", "pending")
    .maybeSingle();

  if (existing) {
    // Reutilizar preferencia (volver a pagar)
    return NextResponse.json({ init_point: existing.init_point });
  }

  // 3. Crear payment pending
  const { data: payment } = await supabase
    .from("payments")
    .insert({
      contract_id,
      provider: "mercadopago",
      amount: Number(process.env.CONTRACT_UNLOCK_FEE),
      currency: "ARS",
      status: "pending",
    })
    .select()
    .single();

  // 4. Preferencia MP
  const preference = await MercadoPago.preferences.create({
    items: [
      {
        title: "Desbloqueo de firma de contrato",
        quantity: 1,
        unit_price: Number(process.env.CONTRACT_UNLOCK_FEE),
        currency_id: "ARS",
      },
    ],
    external_reference: contract_id,
    back_urls: {
      success: `${process.env.NEXT_PUBLIC_BASE_URL}/contracts/${contract_id}?paid=1`,
      failure: `${process.env.NEXT_PUBLIC_BASE_URL}/contracts/${contract_id}?paid=0`,
    },
    auto_return: "approved",
  });

  // 5. Guardar provider_payment_id + init_point
  await supabase
    .from("payments")
    .update({
      provider_payment_id: preference.body.id,
      init_point: preference.body.init_point,
    })
    .eq("id", payment.id);

  return NextResponse.json({ init_point: preference.body.init_point });
}
