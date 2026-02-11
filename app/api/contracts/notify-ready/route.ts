import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sendWhatsApp } from "@/lib/notifications/whatsapp";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  const { match_id } = await req.json();

  // 1️⃣ Traer contrato
  const { data: contract } = await supabase
    .from("contracts")
    .select("id, tenant_id, owner_id")
    .eq("match_id", match_id)
    .single();

  if (!contract) {
    return NextResponse.json(
      { error: "Contract not found" },
      { status: 404 }
    );
  }

  // 2️⃣ Traer teléfonos
  const { data: tenant } = await supabase
    .from("profiles")
    .select("phone")
    .eq("id", contract.tenant_id)
    .single();

  const { data: owner } = await supabase
    .from("profiles")
    .select("phone")
    .eq("id", contract.owner_id)
    .single();

  // 3️⃣ Link contrato
  const contractUrl = `https://verlo.lat/contracts/${match_id}`;

  // 4️⃣ Notificar ambos
  if (tenant?.phone) {
    await sendWhatsApp({
      to: tenant.phone,
      template: "contract_ready",
      variables: {
        contract_url: contractUrl,
      },
      context: {
        trigger: "contract_ready",
        role: "tenant",
      },
    });
  }

  if (owner?.phone) {
    await sendWhatsApp({
      to: owner.phone,
      template: "contract_ready",
      variables: {
        contract_url: contractUrl,
      },
      context: {
        trigger: "contract_ready",
        role: "owner",
      },
    });
  }

  return NextResponse.json({ success: true });
}
