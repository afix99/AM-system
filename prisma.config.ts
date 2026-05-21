import path from 'node:path'
import { defineConfig } from '@prisma/config'
import { PrismaLibSQL } from '@prisma/adapter-libsql'
import { createClient } from '@libsql/client'

export default defineConfig({
  earlyAccess: true,
  schema: path.join(__dirname, 'prisma/schema.prisma'),
  datasource: {
    url: process.env.DATABASE_URL ?? 'file:./dev.db',
  },
  migrate: {
    adapter: async () => {
      const client = createClient({ url: process.env.DATABASE_URL ?? 'file:./dev.db' })
      return new PrismaLibSQL(client)
    },
  },
})
