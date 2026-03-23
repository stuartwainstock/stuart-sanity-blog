import { getCliClient } from 'sanity/cli'

async function run() {
  const client = getCliClient({ apiVersion: '2023-05-03' })

  const docs = await client.fetch(
    `*[
      defined(seo.noIndex) &&
      (seo.noIndex == "true" || seo.noIndex == "false")
    ]{
      _id,
      "noIndex": seo.noIndex
    }`
  )

  if (!docs.length) {
    console.log('No documents require seo.noIndex migration.')
    return
  }

  console.log(`Migrating ${docs.length} document(s)...`)

  for (const doc of docs) {
    const booleanValue = doc.noIndex === 'true'
    await client.patch(doc._id).set({ 'seo.noIndex': booleanValue }).commit()
    console.log(`- Updated ${doc._id}: ${doc.noIndex} -> ${booleanValue}`)
  }

  console.log('Migration complete.')
}

run().catch((err) => {
  console.error('Migration failed:', err)
  process.exit(1)
})
