import Link from "next/link";

async function getFeed() {
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_BASE_URL}/api/properties/feed`,
    { cache: "no-store" }
  );
  return res.json();
}

export default async function MatchesPage() {
  const properties = await getFeed();

  return (
    <main className="p-6 grid grid-cols-1 md:grid-cols-3 gap-4">
      {properties.map((p: any) => (
        <Link
          key={p.id}
          href={`/properties/${p.id}`}
          className="border rounded overflow-hidden bg-white hover:shadow"
        >
          {p.cover_url && (
            <img
              src={p.cover_url}
              className="h-48 w-full object-cover"
            />
          )}
          <div className="p-3">
            <h2 className="font-semibold">{p.title}</h2>
            <p className="text-sm text-gray-500">{p.address}</p>
            <p className="mt-1 font-bold">
              ${p.price?.toLocaleString("es-AR")}
            </p>
          </div>
        </Link>
      ))}
    </main>
  );
}
