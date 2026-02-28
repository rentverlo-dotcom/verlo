export async function notifyOwner({
  phone,
  propertyTitle,
}: {
  phone: string;
  propertyTitle: string;
}) {
  // MOCK WHATSAPP (por ahora)
  console.log("📲 WhatsApp al owner:", phone);
  console.log(`Nuevo interesado en tu propiedad: ${propertyTitle}`);

  // Acá después enchufás:
  // fetch("https://api.whatsapp.com/....")
}
