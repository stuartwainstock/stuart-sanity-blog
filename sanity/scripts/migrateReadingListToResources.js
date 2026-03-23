import { getCliClient } from 'sanity/cli'

function normalizeUrl(value) {
  if (!value) return ''

  try {
    const parsed = new URL(value)
    parsed.hash = ''
    if (parsed.pathname !== '/' && parsed.pathname.endsWith('/')) {
      parsed.pathname = parsed.pathname.slice(0, -1)
    }
    return parsed.toString()
  } catch {
    return ''
  }
}

function getSourceDomain(value) {
  if (!value) return ''
  try {
    return new URL(value).hostname.replace(/^www\./, '')
  } catch {
    return ''
  }
}

async function run() {
  const client = getCliClient({ apiVersion: '2023-05-03' })

  const pages = await client.fetch(
    `*[_type == "page" && slug.current == "reading-list"]{
      _id,
      title,
      readingList[]{
        _key,
        title,
        author,
        category,
        url,
        description
      }
    }`
  )

  if (!pages.length) {
    console.log('No reading-list page found. Nothing to migrate.')
    return
  }

  const books = pages.flatMap((page) => page.readingList || [])
  if (!books.length) {
    console.log('No legacy readingList books found. Nothing to migrate.')
    return
  }

  let createdCount = 0
  let skippedCount = 0

  for (const book of books) {
    const normalizedUrl = normalizeUrl(book.url)
    const sourceDomain = getSourceDomain(normalizedUrl)
    const dedupeKey = normalizedUrl || `${book.title || ''}::${book.author || ''}`.toLowerCase()

    const existing = await client.fetch(
      `*[_type == "resource" && (normalizedUrl == $normalizedUrl || lower(title) == $titleLower)][0]{_id}`,
      {
        normalizedUrl: normalizedUrl || '__none__',
        titleLower: (book.title || '').toLowerCase(),
      }
    )

    if (existing) {
      skippedCount += 1
      console.log(`Skipped (exists): ${book.title || 'Untitled'}`)
      continue
    }

    await client.create({
      _type: 'resource',
      title: book.title || 'Untitled',
      url: normalizedUrl || 'https://example.com',
      summary: book.description || '',
      image: '',
      addedDate: new Date().toISOString(),
      mediaType: 'book',
      status: 'published',
      sourceDomain: sourceDomain || '',
      normalizedUrl: normalizedUrl || dedupeKey,
      tags: book.category ? [book.category] : [],
    })

    createdCount += 1
    console.log(`Created: ${book.title || 'Untitled'}`)
  }

  console.log(`Migration complete. Created: ${createdCount}, Skipped: ${skippedCount}`)
}

run().catch((err) => {
  console.error('Migration failed:', err)
  process.exit(1)
})
