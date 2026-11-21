// node test.mjs: runs background.js against a fake chrome API and fake fetch responses.
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import vm from 'node:vm'

const code = readFileSync(new URL('extension/background.js', import.meta.url), 'utf8')

async function run(response, stored = {}) {
  let refresh
  const on = { addListener: (f) => (refresh = f) }
  const chrome = {
    runtime: { onInstalled: on, onStartup: on },
    alarms: { get: async () => null, create() {}, onAlarm: on },
    storage: { local: { set: async (v) => Object.assign(stored, v) } },
  }
  const fetch = async () => {
    if (response instanceof Error) throw response
    return { ok: response.ok ?? true, headers: new Headers({ 'content-type': response.type ?? 'text/plain' }), text: async () => response.body }
  }
  vm.runInNewContext(code, { chrome, fetch, Date, Headers })
  await refresh()
  return stored
}

let s = await run({ body: 'Foo_Bar\r\nbaz\n\n<html>\nnot a handle!\nwaytoolonghandle123\n' })
assert.deepEqual([...s.names], ['foo_bar', 'baz'])

const old = { names: ['keep'] }
assert.deepEqual([...(await run({ body: '' }, old)).names], ['keep'])
assert.deepEqual([...(await run({ body: 'x', ok: false }, old)).names], ['keep'])
assert.deepEqual([...(await run({ body: 'x', type: 'text/html' }, old)).names], ['keep'])
assert.deepEqual([...(await run(new Error('offline'), old)).names], ['keep'])
console.log('ok')
