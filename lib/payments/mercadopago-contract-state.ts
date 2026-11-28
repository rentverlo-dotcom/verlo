/** Decisions for a verified Mercado Pago contract payment, before DB writes.
 * Do not let late notifications downgrade an approved payment.
 */
export type MpContractStateDecision = "apply" | "duplicate" | "reject_reference" | "reject_amount" | "ignore_status"

export function decideMpContractPayment(args: {
  storedProvider: string
  storedStatus: string
  storedProviderPaymentId: string | null
  storedAmount: number
  storedCurrency: string
  notificationId: string
  paymentId: string | number
  paymentAmount: number
  paymentCurrency: string
  paymentStatus: string
}): MpContractStateDecision {
  const verifiedId = String(args.paymentId).trim()
  if (args.storedProvider !== "mercadopago" ||
      verifiedId !== args.notificationId ||
      (args.storedProviderPaymentId && args.storedProviderPaymentId !== verifiedId)) {
    return "reject_reference"
  }
  if (args.storedStatus === "approved") return "duplicate"
  if (!Number.isFinite(args.paymentAmount) ||
      args.paymentAmount !== args.storedAmount ||
      args.paymentCurrency !== args.storedCurrency) {
    return "reject_amount"
  }
  if (!["approved", "rejected", "cancelled", "pending", "in_process"].includes(args.paymentStatus)) {
    return "ignore_status"
  }
  return "apply"
}
