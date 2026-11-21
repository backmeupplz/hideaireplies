# Chrome Web Store listing

The first submission is made by hand in the [developer dashboard](https://chrome.google.com/webstore/devconsole) (the API can't create items). After that, every release goes out through CI once the item ID is in the `CHROME_ITEM_ID` repo variable and `STORE_CHROME_PAUSED` is `false`.

1. **New item:** upload `hideaireplies.zip` from the [latest release](https://github.com/backmeupplz/hideaireplies/releases/latest).
2. **Store listing**
   - Description: paste the text below.
   - Category: Social & Communication. Language: English.
   - Screenshot: `store/screenshot-1280x800.png`. Small promo tile: `store/promo-440x280.png`.
   - Homepage URL: https://hideaireplies.borodutch.com. Support URL: https://git.borodutch.com/backmeupplz/hideaireplies/issues
3. **Privacy**
   - Single purpose: Hides posts, replies, reposts and likes by accounts on the public blockedforaireply.levels.io list of AI reply bots while you browse X.
   - `storage`: Keeps the downloaded list of flagged usernames on the device so X pages can be filtered without downloading it every time.
   - `alarms`: Refreshes the list of flagged usernames every six hours.
   - Host permission (blockedforaireply.levels.io): Downloads the public list of flagged usernames from this one site.
   - Content script on x.com and twitter.com: Hides posts and rows written by listed accounts while you browse X.
   - Remote code: No.
   - Data usage: tick nothing, then certify the three statements.
   - Privacy policy URL: https://hideaireplies.borodutch.com/#privacy
4. **Distribution:** Public, all regions. Then submit for review.

## Description

Hides posts, replies, reposts and likes from AI reply bots on X (Twitter).

The extension downloads the public list of flagged accounts from blockedforaireply.levels.io, maintained by @levelsio and @ryanvogel, and refreshes it every six hours. While you browse x.com it hides every post and reply written by a listed account, every repost they make, and their rows on likes and repost lists. A notification is hidden only when every account in it is listed. Posts stay visible when you open a listed account's profile directly.

It collects no data: the only network request is the download of the public username list.

The list is a set of judgment calls by its maintainers, and this extension is not affiliated with them or with X. Source code: https://git.borodutch.com/backmeupplz/hideaireplies
