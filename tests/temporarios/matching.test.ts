import assert from "node:assert/strict"
import { test } from "node:test"
import {
  canRequestBilateralBlock,
  evaluateTemporaryMatch,
  overlaps,
  stayNights,
  type TemporaryDemand,
  type TemporaryProperty,
} from "../../lib/temporarios/matching"

const property: TemporaryProperty = {
  locality: "Mar Azul",
  nightlyPriceArs: 100000,
  availabilityStart: "2027-01-01",
  availabilityEnd: "2027-02-01",
  maxGuests: 4,
  status: "published",
}
const demand: TemporaryDemand = {
  locality: "Mar Azul",
  checkIn: "2027-01-16",
  checkOut: "2027-01-25",
  maxTotalBudgetArs: 1000000,
  guests: 2,
}

test("matches available nine-night stay and calculates total", () => {
  assert.deepEqual(evaluateTemporaryMatch(demand, property), {
    compatible: true, nights: 9, totalPriceArs: 900000,
  })
})

test("allows one night, rejects zero and 91 nights", () => {
  assert.equal(stayNights({ checkIn: "2027-01-01", checkOut: "2027-01-02" }), 1)
  assert.equal(stayNights({ checkIn: "2027-01-01", checkOut: "2027-01-01" }), null)
  assert.equal(stayNights({ checkIn: "2027-01-01", checkOut: "2027-04-02" }), null)
  assert.equal(stayNights({ checkIn: "2027-02-29", checkOut: "2027-03-01" }), null)
  assert.equal(stayNights({ checkIn: "2028-02-28", checkOut: "2028-03-01" }), 2)
})

test("rejects reversed and malformed stay dates", () => {
  assert.equal(stayNights({ checkIn: "2027-01-25", checkOut: "2027-01-16" }), null)
  assert.equal(stayNights({ checkIn: "2027-13-01", checkOut: "2027-13-02" }), null)
  assert.deepEqual(evaluateTemporaryMatch({ ...demand, checkOut: "2027-01-16" }, property), {
    compatible: false, reason: "invalid_stay",
  })
})

test("blocks intersecting periods, not adjacent checkout and checkin", () => {
  const block = { checkIn: "2027-01-01", checkOut: "2027-01-16" }
  assert.equal(overlaps(demand, block), false)
  assert.equal(overlaps(demand, { checkIn: "2027-01-24", checkOut: "2027-01-27" }), true)
  assert.deepEqual(evaluateTemporaryMatch(demand, property, [block]), {
    compatible: true, nights: 9, totalPriceArs: 900000,
  })
  assert.deepEqual(evaluateTemporaryMatch(demand, property, [
    { checkIn: "2027-01-24", checkOut: "2027-01-27" },
  ]), { compatible: false, reason: "blocked_dates" })
})

test("rejects dates outside publication availability", () => {
  assert.deepEqual(evaluateTemporaryMatch({ ...demand, checkOut: "2027-02-02" }, property), {
    compatible: false, reason: "unavailable_dates",
  })
})

test("rejects insufficient budget, with exact budget allowed", () => {
  assert.deepEqual(evaluateTemporaryMatch({ ...demand, maxTotalBudgetArs: 899999 }, property), {
    compatible: false, reason: "over_budget",
  })
  assert.equal(evaluateTemporaryMatch({ ...demand, maxTotalBudgetArs: 900000 }, property).compatible, true)
})

test("rejects a paused property, different location, excess guests or bad price", () => {
  assert.deepEqual(evaluateTemporaryMatch(demand, { ...property, status: "paused" }), {
    compatible: false, reason: "unpublished",
  })
  assert.deepEqual(evaluateTemporaryMatch(demand, { ...property, locality: "Pinamar" }), {
    compatible: false, reason: "different_locality",
  })
  assert.deepEqual(evaluateTemporaryMatch({ ...demand, guests: 5 }, property), {
    compatible: false, reason: "insufficient_capacity",
  })
  assert.deepEqual(evaluateTemporaryMatch(demand, { ...property, nightlyPriceArs: 0 }), {
    compatible: false, reason: "invalid_price",
  })
})

test("normalizes accents and whitespace in locality names", () => {
  const normalized = { ...demand, locality: "  MÁR   AZUL " }
  assert.equal(evaluateTemporaryMatch(normalized, property).compatible, true)
})

test("bilateral acceptance and received deposit are necessary for blocking", () => {
  const base = {
    tenantAccepted: true, ownerAccepted: true,
    depositRequired: true, depositReceivedConfirmed: false,
  }
  assert.equal(canRequestBilateralBlock(base), false)
  assert.equal(canRequestBilateralBlock({ ...base, depositReceivedConfirmed: true }), true)
  assert.equal(canRequestBilateralBlock({ ...base, depositRequired: false }), true)
  assert.equal(canRequestBilateralBlock({ ...base, depositRequired: false, ownerAccepted: false }), false)
  assert.equal(canRequestBilateralBlock({ ...base, depositRequired: false, tenantAccepted: false }), false)
})
