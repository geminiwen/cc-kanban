import { runMigrations } from './db'

let initialized = false

export async function ensureDb() {
  if (!initialized) {
    await runMigrations()
    initialized = true
  }
}
