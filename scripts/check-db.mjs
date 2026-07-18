import postgres from 'postgres'

const url = process.env.DATABASE_URL
const sql = postgres(url, { prepare: false, ssl: 'require', max: 1 })

// Check driver_profiles columns
const cols = await sql.unsafe(`SELECT column_name, data_type, is_nullable, column_default 
  FROM information_schema.columns 
  WHERE table_name = 'driver_profiles' 
  ORDER BY ordinal_position`)

console.log('driver_profiles columns:')
for (const c of cols) {
  console.log(`  ${c.column_name} (${c.data_type}) nullable=${c.is_nullable} default=${c.column_default || '-'}`)
}

// Check user columns
const userCols = await sql.unsafe(`SELECT column_name, data_type, is_nullable 
  FROM information_schema.columns 
  WHERE table_name = 'user' 
  ORDER BY ordinal_position`)

console.log('\nuser columns:')
for (const c of userCols) {
  console.log(`  ${c.column_name} (${c.data_type}) nullable=${c.is_nullable}`)
}

// Check all table names
const tables = await sql.unsafe(`SELECT table_name FROM information_schema.tables 
  WHERE table_schema = 'public' ORDER BY table_name`)
console.log('\nAll tables:')
for (const t of tables) {
  console.log(`  ${t.table_name}`)
}

await sql.end()
