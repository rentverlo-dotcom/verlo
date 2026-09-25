const { test } = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const vm = require('node:vm')
const path = require('node:path')

const script = fs.readFileSync(
  path.join(__dirname, '../public/sw.js'),
  'utf8'
)

async function clickNotification({ windows, ack, openWindow }) {
  const handlers = new Map()
  const calls = []
  const context = {
    self: {
      location: { origin: 'https://verlo.lat' },
      addEventListener(name, handler) {
        handlers.set(name, handler)
      },
    },
    clients: {
      async matchAll() { return windows },
      async openWindow(url) {
        calls.push(['open', url])
        if (openWindow) return openWindow(calls)
        return { url, async focus() { calls.push(['focus opened']) } }
      },
    },
    fetch: async () => { calls.push(['ack']); return ack },
    URL,
    console,
  }
  vm.runInNewContext(script, context)

  let work
  handlers.get('notificationclick')({
    notification: {
      data: { url: '/matches/private-token', delivery_id: 'delivery' },
      close() { calls.push(['close']) },
    },
    waitUntil(promise) { work = promise },
  })
  await work
  return calls
}

test('push click opens its private link before sending the ACK', async () => {
  const calls = await clickNotification({ windows: [], ack: {} })
  assert.deepEqual(calls.map(([name]) => name), [
    'open', 'focus opened', 'close', 'ack',
  ])
  assert.equal(calls[0][1], 'https://verlo.lat/matches/private-token')
})

test('push click navigates an existing tab before claiming the click', async () => {
  let navigatedTo
  const calls = await clickNotification({
    windows: [{
      url: 'https://verlo.lat/',
      async navigate(url) {
        navigatedTo = url
        return { async focus() {} }
      },
    }],
    ack: {},
  })
  assert.equal(navigatedTo, 'https://verlo.lat/matches/private-token')
  assert.deepEqual(calls.map(([name]) => name), ['close', 'ack'])
})

test('reused installed-app window navigates to the push destination', async () => {
  const calls = await clickNotification({
    windows: [],
    ack: {},
    openWindow: (record) => ({
      url: 'https://verlo.lat/',
      async navigate(url) {
        record.push(['navigate opened', url])
        return { async focus() { record.push(['focus opened']) } }
      },
    }),
  })
  assert.deepEqual(calls.map(([name]) => name), [
    'open', 'navigate opened', 'focus opened', 'close', 'ack',
  ])
  assert.equal(calls[1][1], 'https://verlo.lat/matches/private-token')
})

test('failed navigation keeps the notification visible and does not claim a click', async () => {
  const calls = await clickNotification({
    windows: [],
    ack: {},
    openWindow: () => null,
  })
  assert.deepEqual(calls.map(([name]) => name), ['open'])
})
