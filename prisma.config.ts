import path from 'node:path'
import { defineConfig } from '@prisma/config'

// For Turso, the CLI needs the auth token embedded in the URL
function getDatasourceUrl() {
  const url = process.env.TURSO_DATABASE_URL
  const token = process.env.TURSO_AUTH_TOKEN
  if (url && token) return `${url}?authToken=${token}`
  return process.env.DATABASE_URL ?? 'file:./dev.db'
}

export default defineConfig({
  schema: path.join(__dirname, 'prisma/schema.prisma'),
  datasource: {
    url: getDatasourceUrl(),
  },
})
