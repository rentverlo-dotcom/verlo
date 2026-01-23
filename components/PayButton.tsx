"use client";
import { useState } from "react";

export function PayButton({ contractId }: { contractId: string }) {
  const [loading, setLoading] = useState(false);

  const pay = async () => {
    setLoading(true);
    const res = await fetch("/api/payments/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contract_id: contractId }),
    });

    const data = await res.json();
    window.location.href = data.init_point;
  };

  return (
    <button onClick={pay} disabled={loading}>
      {loading ? "Redirigiendo..." : "Pagar para firmar"}
    </button>
  );
}
