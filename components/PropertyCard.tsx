//components/PropertyCard.tsx
"use client";

type Property = {
  id: string;
  title: string;
  city: string;
  price: number;
  currency: string;
  image_url: string | null;
};

export default function PropertyCard({
  property,
  onLike,
  onSkip,
}: {
  property: Property;
  onLike: () => void;
  onSkip: () => void;
}) {
  return (
    <div className="max-w-sm mx-auto bg-white rounded-2xl shadow-xl overflow-hidden">
      {property.image_url && (
        <img
          src={property.image_url}
          className="h-64 w-full object-cover"
        />
      )}

      <div className="p-4">
        <h2 className="text-xl font-bold">{property.title}</h2>
        <p className="text-gray-600">{property.city}</p>
        <p className="text-lg font-semibold mt-2">
          {property.price} {property.currency}
        </p>

        <div className="flex justify-between mt-4">
          <button
            onClick={onSkip}
            className="px-4 py-2 bg-gray-200 rounded-xl"
          >
            ❌ Paso
          </button>
          <button
            onClick={onLike}
            className="px-4 py-2 bg-black text-white rounded-xl"
          >
            ❤️ Me interesa
          </button>
        </div>
      </div>
    </div>
  );
}
