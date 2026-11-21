// Loads the real extension into Chromium, lets it download the live list, and checks the hiding on a fake x.com page.
// npm i --no-save playwright@1.65.1 && npx playwright install chromium && node e2e.mjs
import assert from 'node:assert/strict'
import { chromium } from 'playwright'

const ext = new URL('extension', import.meta.url).pathname
const ctx = await chromium.launchPersistentContext('', { channel: 'chromium', args: [`--disable-extensions-except=${ext}`, `--load-extension=${ext}`] })
try {
  const worker = ctx.serviceWorkers()[0] || (await ctx.waitForEvent('serviceworker'))
  let names = []
  for (let i = 0; i < 30 && names.length < 1000; i++) {
    names = (await worker.evaluate(() => chrome.storage.local.get('names'))).names || []
    await new Promise((r) => setTimeout(r, 500))
  }
  assert.ok(names.length > 1000, `list downloaded (${names.length})`)
  assert.ok(names.includes('eliadele') && !names.includes('levelsio'))

  // eliadele and piercelilholt are on the list; levelsio and dannypostma are not.
  const av = (h) => `<div data-testid="UserAvatar-Container-${h}"></div>`
  const tweet = (h, inner = '') => `<article data-testid="tweet">${av(h)}${inner}</article>`
  const cells = {
    human: tweet('levelsio'),
    bot: tweet('EliaDeLe'),
    quotesBot: tweet('levelsio', tweet('eliadele')),
    botRepost: `<article data-testid="tweet"><a href="/PierceLilholt"><span data-testid="socialContext">reposted</span></a>${av('levelsio')}</article>`,
    userRow: `<div data-testid="UserCell">${av('eliadele')}</div>`,
    allBotsLiked: `<article data-testid="notification">${av('eliadele')}${av('piercelilholt')}</article>`,
    mixedLiked: `<article data-testid="notification">${av('eliadele')}${av('dannypostma')}</article>`,
    notAPost: `<div>${av('eliadele')}</div>`,
  }
  const html = Object.entries(cells).map(([id, c]) => `<div data-testid="cellInnerDiv" id="${id}">${c}</div>`).join('')
  await ctx.route('https://x.com/**', (r) => r.fulfill({ contentType: 'text/html', body: `<!doctype html><body>${html}</body>` }))
  const page = await ctx.newPage()
  await page.goto('https://x.com/home')
  await page.waitForTimeout(500)
  const hidden = () => page.$$eval('[data-testid="cellInnerDiv"]', (cs) => cs.filter((c) => c.style.display === 'none').map((c) => c.id))
  assert.deepEqual(await hidden(), ['bot', 'botRepost', 'userRow', 'allBotsLiked'])

  // X reuses cells for other posts: a hidden cell that now shows a human post comes back.
  await page.evaluate(() => (document.getElementById('bot').innerHTML = '<article data-testid="tweet"><div data-testid="UserAvatar-Container-dannypostma"></div></article>'))
  await page.waitForTimeout(300)
  assert.deepEqual(await hidden(), ['botRepost', 'userRow', 'allBotsLiked'])

  // A listed account's own profile still shows their posts.
  await page.goto('https://x.com/eliadele')
  await page.waitForTimeout(500)
  assert.deepEqual(await hidden(), ['botRepost'])
  console.log('ok')
} finally {
  await ctx.close()
}
