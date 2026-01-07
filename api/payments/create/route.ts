import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { MercadoPagoConfig, Preference } from "mercadopago";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const mp = new MercadoPagoConfig({
  accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN!,
});

export async function POST(req: Request) {
  try {
    const { contractId } = await req.json();

    if (!contractId) {
      return NextResponse.json(
        { error: "contractId required" },
        { status: 400 }
      );
    }

    const { data: contract, error: contractError } = await supabase
      .from("contracts")
      .select("id")
      .eq("id", contractId)
      .single();

    if (contractError || !contract) {
      return NextResponse.json(
        { error: "Contract not found" },
        { status: 404 }
      );
    }

    const amount = Number(process.env.CONTRACT_UNLOCK_FEE);

    const preference = new Preference(mp);

    const result = await preference.create({
      body: {
        items: [
          {
            id: contract.id,
            title: "Desbloqueo de contrato VERLO",
            quantity: 1,
            currency_id: "ARS",
            unit_price: amount,
          },
        ],
        metadata: {
          contract_id: contract.id,
        },
        back_urls: {
          success: `${process.env.NEXT_PUBLIC_BASE_URL}/contracts/${contract.id}?payment=success`,
          failure: `${process.env.NEXT_PUBLIC_BASE_URL}/contracts/${contract.id}?payment=failure`,
          pending: `${process.env.NEXT_PUBLIC_BASE_URL}/contracts/${contract.id}?payment=pending`,
        },
        auto_return: "approved",
      },
    });

    return NextResponse.json({
      init_point: result.init_point,
    });
  } catch (err) {
    console.error("PAYMENT CREATE ERROR", err);
    return NextResponse.json(
      { error: "Internal error" },
      { status: 500 }
    );
  }
}

