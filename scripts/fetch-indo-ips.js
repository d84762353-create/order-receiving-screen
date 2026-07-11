const fs = require('fs')
const path = require('path')

const operators = {
  'Telkomsel': ['AS23693', 'AS17974'],
  'Indosat Ooredoo Hutchison': ['AS4761', 'AS55660', 'AS9902'],
  'XL Axiata': ['AS23700', 'AS24203', 'AS17500'],
  'Smartfren': ['AS17646', 'AS18004'],
  'Telkom Indonesia (IndiHome)': ['AS7713'],
  'Biznet': ['AS17451'],
  'First Media': ['AS23696'],
  'MyRepublic': ['AS55688'],
  'Moratelindo (Oxygen)': ['AS23947']
}

async function fetchPrefixes(asn, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      const url = `https://stat.ripe.net/data/announced-prefixes/data.json?resource=${asn}`
      const response = await fetch(url, { signal: AbortSignal.timeout(15000) })
      if (!response.ok) throw new Error(`HTTP ${response.status}`)
      const data = await response.json()
      if (data && data.data && data.data.prefixes) {
        return data.data.prefixes.map(p => p.prefix)
      }
      return []
    } catch (error) {
      console.warn(`[Retry ${i+1}/${retries}] Failed to fetch ASN ${asn}:`, error.message)
      await new Promise(res => setTimeout(res, 2000)) // Wait 2s before retry
    }
  }
  console.error(`Gagal total mengambil ASN ${asn} setelah ${retries} percobaan.`)
  return []
}

async function main() {
  const db = {}
  console.log('Mulai mengunduh data rentang IP Operator Indonesia...')

  for (const [operator, asns] of Object.entries(operators)) {
    console.log(`\nMenarik data untuk ${operator}...`)
    let count = 0
    for (const asn of asns) {
      const prefixes = await fetchPrefixes(asn)
      prefixes.forEach(prefix => {
        db[prefix] = operator
      })
      count += prefixes.length
      console.log(` -> ${asn}: ${prefixes.length} blok IP ditemukan.`)
    }
    console.log(`Total ${operator}: ${count} blok IP.`)
  }

  // Tulis ke JSON
  const dirPath = path.join(__dirname, '../data')
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath)
  }

  const filePath = path.join(dirPath, 'indo-ip-db.json')
  fs.writeFileSync(filePath, JSON.stringify(db, null, 2))
  
  console.log(`\nBerhasil! Database IP Indonesia disimpan ke: ${filePath}`)
  console.log(`Total ${Object.keys(db).length} blok CIDR unik direkam.`)
}

main()
