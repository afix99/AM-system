import { prisma } from "@/lib/prisma";
import { createClient } from "@libsql/client";
import { NextResponse } from "next/server";

export async function GET() {
  const url = process.env.TURSO_DATABASE_URL;
  const authToken = process.env.TURSO_AUTH_TOKEN;

  if (!url) {
    return NextResponse.json({ error: "TURSO_DATABASE_URL is not set" }, { status: 500 });
  }

  try {
    const db = createClient({ url, authToken });

    await db.batch([
      `CREATE TABLE IF NOT EXISTS "Store" ("id" TEXT NOT NULL PRIMARY KEY, "name" TEXT NOT NULL, "location" TEXT NOT NULL, "phone" TEXT NOT NULL, "managerName" TEXT NOT NULL, "status" TEXT NOT NULL DEFAULT 'active', "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP)`,
      `CREATE TABLE IF NOT EXISTS "Staff" ("id" TEXT NOT NULL PRIMARY KEY, "name" TEXT NOT NULL, "phone" TEXT NOT NULL, "storeId" TEXT NOT NULL, "role" TEXT NOT NULL DEFAULT 'Staff', "hireDate" DATETIME NOT NULL, "status" TEXT NOT NULL DEFAULT 'active', "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP)`,
      `CREATE TABLE IF NOT EXISTS "Attendance" ("id" TEXT NOT NULL PRIMARY KEY, "staffId" TEXT NOT NULL, "storeId" TEXT NOT NULL, "date" DATETIME NOT NULL, "status" TEXT NOT NULL DEFAULT 'Present', "notes" TEXT, "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP)`,
      `CREATE TABLE IF NOT EXISTS "Task" ("id" TEXT NOT NULL PRIMARY KEY, "title" TEXT NOT NULL, "storeId" TEXT, "priority" INTEGER NOT NULL DEFAULT 3, "status" TEXT NOT NULL DEFAULT 'pending', "dueDate" DATETIME, "notes" TEXT, "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP)`,
      `CREATE TABLE IF NOT EXISTS "WeeklyChecklist" ("id" TEXT NOT NULL PRIMARY KEY, "weekStartDate" DATETIME NOT NULL, "items" TEXT NOT NULL DEFAULT '[]', "completedItems" TEXT NOT NULL DEFAULT '[]', "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP)`,
      `CREATE TABLE IF NOT EXISTS "ScheduleImage" ("id" TEXT NOT NULL PRIMARY KEY, "storeId" TEXT NOT NULL, "weekStartDate" DATETIME NOT NULL, "imageUrl" TEXT NOT NULL, "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP)`,
      `CREATE UNIQUE INDEX IF NOT EXISTS "ScheduleImage_storeId_weekStartDate_key" ON "ScheduleImage"("storeId", "weekStartDate")`,
      `CREATE TABLE IF NOT EXISTS "Visit" ("id" TEXT NOT NULL PRIMARY KEY, "storeId" TEXT NOT NULL, "visitDate" DATETIME NOT NULL, "notes" TEXT NOT NULL, "photoUrls" TEXT NOT NULL DEFAULT '[]', "actionItems" TEXT NOT NULL DEFAULT '[]', "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP)`,
      `CREATE TABLE IF NOT EXISTS "LibraryEntry" ("id" TEXT NOT NULL PRIMARY KEY, "category" TEXT NOT NULL, "title" TEXT NOT NULL, "content" TEXT NOT NULL, "attachmentUrls" TEXT NOT NULL DEFAULT '[]', "isTraining" BOOLEAN NOT NULL DEFAULT false, "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP)`,
      `CREATE TABLE IF NOT EXISTS "ChecklistTemplate" ("id" TEXT NOT NULL PRIMARY KEY, "storeId" TEXT NOT NULL, "type" TEXT NOT NULL, "items" TEXT NOT NULL DEFAULT '[]', "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP)`,
      `CREATE UNIQUE INDEX IF NOT EXISTS "ChecklistTemplate_storeId_type_key" ON "ChecklistTemplate"("storeId", "type")`,
      `CREATE TABLE IF NOT EXISTS "ChecklistRun" ("id" TEXT NOT NULL PRIMARY KEY, "storeId" TEXT NOT NULL, "type" TEXT NOT NULL, "date" DATETIME NOT NULL, "completedItems" TEXT NOT NULL DEFAULT '[]', "notes" TEXT, "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP)`,
      `CREATE UNIQUE INDEX IF NOT EXISTS "ChecklistRun_storeId_type_date_key" ON "ChecklistRun"("storeId", "type", "date")`,
      `CREATE TABLE IF NOT EXISTS "TrainingRecord" ("id" TEXT NOT NULL PRIMARY KEY, "staffId" TEXT NOT NULL, "libraryEntryId" TEXT NOT NULL, "completedDate" DATETIME NOT NULL, "notes" TEXT, "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP)`,
      `CREATE UNIQUE INDEX IF NOT EXISTS "TrainingRecord_staffId_libraryEntryId_key" ON "TrainingRecord"("staffId", "libraryEntryId")`,
    ], "write");

    const storeCount = await prisma.store.count();
    return NextResponse.json({
      success: true,
      message: `✅ Tables ready. ${storeCount} stores in database.`,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Setup failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
