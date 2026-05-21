import path from 'node:path'
import { defineConfig } from '@prisma/config'
import { PrismaLibSql } from '@prisma/adapter-libsql'

export default defineConfig({
  schema: path.join(__dirname, 'prisma/schema.prisma'),
  datasource: {
    url: process.env.DATABASE_URL ?? 'file:./dev.db',
  },
  migrate: {
    adapter: async () => new PrismaLibSql({ url: process.env.DATABASE_URL ?? 'file:./dev.db' }),
  },
})
