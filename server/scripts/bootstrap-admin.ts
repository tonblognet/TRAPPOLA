import { randomUUID } from 'node:crypto'
import { hash } from 'bcryptjs'
import { z } from 'zod'
import { loadConfig } from '../config.js'
import { createDatabase } from '../db.js'
import { runMigrations } from '../migrate.js'

const input = z.object({
  ADMIN_EMAIL: z.email().trim().toLowerCase(),
  ADMIN_PASSWORD: z.string().min(12).max(128),
  ADMIN_NAME: z.string().trim().min(1).max(120).default('Елена'),
}).parse(process.env)

const db = createDatabase(loadConfig())
await runMigrations(db)
const passwordHash = await hash(input.ADMIN_PASSWORD, 12)
await db.query(`INSERT INTO admins(id,email,password_hash,display_name)
  VALUES ($1,$2,$3,$4)
  ON CONFLICT (LOWER(email)) DO UPDATE SET password_hash=EXCLUDED.password_hash,
    display_name=EXCLUDED.display_name, active=TRUE, updated_at=NOW()`,
  [randomUUID(), input.ADMIN_EMAIL, passwordHash, input.ADMIN_NAME])
await db.end()
console.log(`Администратор ${input.ADMIN_EMAIL} создан или обновлён.`)
