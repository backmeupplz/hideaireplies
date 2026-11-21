// Every tweet, user row and notification on X renders the actor's avatar as
// [data-testid="UserAvatar-Container-<handle>"], so that is what we match on.
const AVATAR = '[data-testid^="UserAvatar-Container-"]'
let names = new Set()

const handleOf = (el) => el?.dataset.testid.slice(21).toLowerCase()

function shouldHide(cell) {
  const profile = location.pathname.split('/')[1]?.toLowerCase()
  const listed = (h) => h && h !== profile && names.has(h)
  const notification = cell.querySelector('article[data-testid="notification"]')
  if (notification) {
    // "A, B and 3 others liked your post": hide only when every actor is listed.
    const actors = [...notification.querySelectorAll(AVATAR)].map(handleOf)
    return actors.length > 0 && actors.every(listed)
  }
  // The first avatar is the author; later ones belong to quoted posts.
  if (listed(handleOf(cell.querySelector(AVATAR)))) return true
  const repost = cell.querySelector('[data-testid="socialContext"]')?.closest('a')
  return listed(repost?.getAttribute('href')?.slice(1).toLowerCase())
}

function scan() {
  // X recycles cells for other content, so re-check every cell both ways.
  for (const cell of document.querySelectorAll('[data-testid="cellInnerDiv"]')) {
    const hide = names.size > 0 && shouldHide(cell)
    if (hide !== (cell.style.display === 'none')) cell.style.display = hide ? 'none' : ''
  }
}

let queued = false
new MutationObserver(() => {
  if (queued) return
  queued = true
  requestAnimationFrame(() => {
    queued = false
    scan()
  })
}).observe(document, { childList: true, subtree: true })

const load = ({ names: list }) => {
  names = new Set(list || [])
  scan()
}
chrome.storage.local.get('names').then(load)
chrome.storage.onChanged.addListener((changes) => changes.names && load({ names: changes.names.newValue }))
