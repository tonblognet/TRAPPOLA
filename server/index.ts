import { createApp } from './app.js'
import { loadConfig } from './config.js'
import { createDatabase } from './db.js'
import { runMigrations } from './migrate.js'

const config = loadConfig()
const db = createDatabase(config)

await runMigrations(db)
await db.query('DELETE FROM admin_sessions WHERE expires_at <= NOW()')

const server = createApp(db, config).listen(config.port, () => {
  console.log(`TRAPPOLA API: http://localhost:${config.port}`)
})

const shutdown = async () => {
  server.close()
  await db.end()
  process.exit(0)
}
process.on('SIGINT', shutdown)
process.on('SIGTERM', shutdown)
