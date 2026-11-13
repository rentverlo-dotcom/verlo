import { redirect } from "next/navigation"

/**
 * Historic placeholder for a property detail. It used a fake user identity,
 * hardcoded contact data and direct WhatsApp links, and could not represent
 * a genuine saved listing. Do not display synthetic properties to customers.
 * The real saved-listings experience lives at /guardadas.
 */
export default function LegacySavedPropertyRedirect() {
  redirect("/guardadas")
}
