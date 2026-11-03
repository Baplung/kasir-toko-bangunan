// Seed non-sensitive default store settings on first run
import { db } from './database'
export async function seedDatabase() {
  // Never create an account with a hard-coded PIN. The first-run setup screen
  // requires the owner to choose an administrator username and PIN.

  // Seed store settings
  const settingCount = await db.storeSettings.count()
  if (settingCount === 0) {
    await db.storeSettings.bulkAdd([
      { key: 'store_name', value: 'Toko Bangunan Jaya' },
      { key: 'store_address', value: 'Jl. Raya No. 1, Malang' },
      { key: 'store_phone', value: '0341-000000' },
    ])
  }
}
