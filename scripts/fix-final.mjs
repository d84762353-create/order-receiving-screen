import postgres from 'postgres'

const url = process.env.DATABASE_URL
const sql = postgres(url, { prepare: false, ssl: 'require', max: 1 })

// Check vehicles column names  
const cols = await sql.unsafe(`
  SELECT a.attname FROM pg_catalog.pg_attribute a
  WHERE a.attrelid = '"vehicles"'::regclass
    AND a.attnum > 0 AND NOT a.attisdropped
  ORDER BY a.attnum
`)
console.log('Current vehicles columns:')
cols.forEach(c => console.log(`  ${c.attname}`))

// Drop wrong-cased stnknumber column if exists, add correct one
await sql.unsafe(`ALTER TABLE "vehicles" DROP COLUMN IF EXISTS "stnknumber"`)
console.log('\nDropped stnknumber (lowercase)')
await sql.unsafe(`ALTER TABLE "vehicles" ADD COLUMN IF NOT EXISTS "stnkNumber" TEXT`)
console.log('Added stnkNumber (camelCase)')

// Verify driver_profiles has all columns
const dpCols = await sql.unsafe(`
  SELECT a.attname FROM pg_catalog.pg_attribute a
  WHERE a.attrelid = '"driver_profiles"'::regclass
    AND a.attnum > 0 AND NOT a.attisdropped
  ORDER BY a.attnum
`)
console.log('\nAll driver_profiles columns:')
dpCols.forEach(c => console.log(`  ${c.attname}`))

// Verify vehicles columns after fix
const vCols = await sql.unsafe(`
  SELECT a.attname FROM pg_catalog.pg_attribute a
  WHERE a.attrelid = '"vehicles"'::regclass
    AND a.attnum > 0 AND NOT a.attisdropped
  ORDER BY a.attnum
`)
console.log('\nAll vehicles columns after fix:')
vCols.forEach(c => console.log(`  ${c.attname}`))

await sql.end()
