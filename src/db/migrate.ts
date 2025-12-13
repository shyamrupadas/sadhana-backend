import { config } from 'dotenv'
import { readFileSync } from 'fs'
import { join } from 'path'
import { Pool } from 'pg'

config()

const runMigrations = async () => {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  })

  try {
    const migrationPath = join(
      __dirname,
      '..',
      '..',
      'src',
      'db',
      'migrations',
      '001_create_users_table.sql'
    )
    const migrationSQL = readFileSync(migrationPath, 'utf-8')

    console.log('Running migration: 001_create_users_table.sql')
    await pool.query(migrationSQL)
    console.log('Migration completed successfully')
  } catch (error) {
    console.error('Migration failed:', error)
    process.exit(1)
  } finally {
    await pool.end()
  }
}

runMigrations()
