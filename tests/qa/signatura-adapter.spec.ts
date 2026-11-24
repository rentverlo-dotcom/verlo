import { test, expect } from "@playwright/test"
import { createHmac } from "node:crypto"
import {
  parseSignaturaNotification,
  verifySignaturaWebhook,
} from "../../lib/signatura/client"

const secret = "ab".repeat(32)

test("Signatura webhook authenticates exactly the raw bytes", () => {
  const payload = Buffer.from('{"document_id":"123e4567-e89b-42d3-a456-426614174000","notification_action":"DC","new_status":"CO"}')
  const hmac = createHmac("sha256", Buffer.from(secret, "hex")).update(payload).digest("hex")
  expect(verifySignaturaWebhook(payload, hmac, secret)).toBe(true)
  expect(verifySignaturaWebhook(Buffer.concat([payload, Buffer.from(" ")]), hmac, secret)).toBe(false)
  expect(verifySignaturaWebhook(payload, null, secret)).toBe(false)
  expect(verifySignaturaWebhook(payload, hmac, "")).toBe(false)
  expect(verifySignaturaWebhook(payload, "bad", secret)).toBe(false)
})

test("Signatura webhook is parsed but never treated as proof of completed signature", () => {
  expect(parseSignaturaNotification({
    document_id: "123e4567-e89b-42d3-a456-426614174000",
    notification_action: "DC",
    new_status: "CO",
  })).toMatchObject({ notification_action: "DC", new_status: "CO" })
  expect(() => parseSignaturaNotification({ notification_action: "DC" })).toThrow()
  expect(() => parseSignaturaNotification({
    notification_action: "DC", document_id: "../../other",
  })).toThrow()
})
