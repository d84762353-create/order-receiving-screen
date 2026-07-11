import IPCIDR from 'ip-cidr'
import fs from 'fs'
import path from 'path'

// Load DB lazily into memory
let db: Record<string, string> | null = null

function loadDb() {
  if (!db) {
    try {
      const filePath = path.join(process.cwd(), 'data', 'indo-ip-db.json')
      const fileData = fs.readFileSync(filePath, 'utf8')
      db = JSON.parse(fileData)
    } catch (err) {
      console.error('Failed to load Indo IP DB:', err)
      db = {}
    }
  }
  return db
}

/**
 * Lacak operator seluler/ISP berdasarkan IP Address
 */
export function getOperatorByIp(ipAddress: string): string {
  const database = loadDb()
  
  // Karena ini bisa lambat jika dilooping jutaan kali di production besar,
  // di real world kita biasa pakai Interval Tree atau Radix Tree.
  // Untuk ukuran 6000+ CIDR, iterasi linear masih di bawah 1ms.
  for (const [cidr, operator] of Object.entries(database)) {
    try {
      const checker = new IPCIDR(cidr)
      if (checker.contains(ipAddress)) {
        return operator
      }
    } catch (e) {
      // Abaikan blok CIDR yang malformed
    }
  }

  return 'Unknown / IP Luar Negeri'
}
