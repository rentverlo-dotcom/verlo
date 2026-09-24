const { test } = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const vm = require('node:vm')
const path = require('node:path')

const script = fs.readFileSync(
  path.join(__dirname, '../public/sw.js'),
  'utf8'
)

async function clickNotification({ windows, ack }) {
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
        return { async focus() { calls.push(['focus opened']) } }
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
    'close', 'open', 'focus opened', 'ack',
  ])
  assert.equal(calls[1][1], 'https://verlo.lat/matches/private-token')
})

test('push click falls back when an existing tab cannot navigate', async () => {
  const calls = await clickNotification({
    windows: [{
      url: 'https://verlo.lat/',
      async navigate() { return null },
    }],
    ack: {},
  })
  assert.equal(calls.find(([name]) => name === 'open')[1],
    'https://verlo.lat/matches/private-token')
})
