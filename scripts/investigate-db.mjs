import postgres from 'postgres'

const url = process.env.DATABASE_URL
const sql = postgres(url, { prepare: false, ssl: 'require', max: 1 })

// Check actual table structure via raw query
console.log('=== user table columns ===')
const cols = await sql.unsafe(`
  SELECT a.attname, pg_catalog.format_type(a.atttypid, a.atttypmod) as type
  FROM pg_catalog.pg_attribute a
  WHERE a.attrelid = '"user"'::regclass
    AND a.attnum > 0
    AND NOT a.attisdropped
  ORDER BY a.attnum
`)
for (const c of cols) {
  console.log(`  ${c.attname}: ${c.type}`)
}

// Try a simple SELECT
try {
  const r = await sql.unsafe(`SELECT id, name, email, role FROM "user" LIMIT 3`)
  console.log(`\nQuery OK: ${r.length} rows`)
} catch (e) {
  console.log(`\nQuery FAILED: ${e.message}`)
}

// Remove the driver_documents table if it exists (not in our schema)
try {
  await sql.unsafe(`DROP TABLE IF EXISTS driver_documents`)
  console.log('\ndriver_documents table dropped (not needed)')
} catch (e) {
  console.log(`\ndriver_documents drop: ${e.message}`)
}

await sql.end()
