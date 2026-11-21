const LIST = 'https://blockedforaireply.levels.io/api/usernames.txt'

async function refresh() {
  try {
    const res = await fetch(LIST, { cache: 'no-cache' })
    if (!res.ok || !res.headers.get('content-type')?.startsWith('text/plain')) return
    const names = (await res.text())
      .split('\n')
      .map((s) => s.trim().toLowerCase())
      .filter((s) => /^[a-z0-9_]{1,15}$/.test(s))
    // Keep the cached list when the fetch comes back empty or broken.
    if (names.length) await chrome.storage.local.set({ names, updated: Date.now() })
  } catch {}
}

chrome.runtime.onInstalled.addListener(refresh)
chrome.runtime.onStartup.addListener(refresh)
// Creating it on every wake-up would restart the 6-hour countdown.
chrome.alarms.get('refresh').then((a) => a || chrome.alarms.create('refresh', { periodInMinutes: 360 }))
chrome.alarms.onAlarm.addListener(refresh)
