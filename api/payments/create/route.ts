import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  const { contract_id } = await req.json();

  const { data: contract } = await supabase
    .from("contracts")
    .select("id, locked")
    .eq("id", contract_id)
    .single();

  if (!contract || !contract.locked) {
    return NextResponse.json({ error: "Contrato inválido" }, { status: 400 });
  }

  const amount = Number(process.env.CONTRACT_UNLOCK_FEE);

  const mpRes = await fetch("https://api.mercadopago.com/checkout/preferences", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.MERCADOPAGO_ACCESS_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      items: [
        {
          title: "Desbloqueo de firma de contrato",
          quantity: 1,
          unit_price: amount,
          currency_id: "ARS",
        },
      ],
      external_reference: contract_id,
      back_urls: {
        success: `${process.env.NEXT_PUBLIC_BASE_URL}/contracts/${contract_id}?paid=1`,
        failure: `${process.env.NEXT_PUBLIC_BASE_URL}/contracts/${contract_id}?paid=0`,
      },
      auto_return: "approved",
    }),
  });

  const preference = await mpRes.json();

  await supabase.from("payments").insert({
    contract_id,
    provider: "mercadopago",
    provider_payment_id: preference.id,
    amount,
    currency: "ARS",
    status: "pending",
  });

  return NextResponse.json({ init_point: preference.init_point });
}

