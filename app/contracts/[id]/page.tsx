"use client";

import { PayButton } from "@/components/PayButton";

export default function ContractPage({
  params,
}: {
  params: { id: string };
}) {
  return (
    <div>
      <h1>Contrato {params.id}</h1>
      <PayButton contractId={params.id} />
    </div>
  );
}
