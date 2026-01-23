import PayButton from "@/components/PayButton";

export default function Page({
  params,
}: {
  params: { id: string };
}) {
  return (
    <main>
      <h1>Contrato {params.id}</h1>
      <PayButton contractId={params.id} />
    </main>
  );
}
