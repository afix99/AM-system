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
    // Use libsql client directly to create tables (DDL)
    const db = createClient({ url, authToken });

    await db.batch([
      `CREATE TABLE IF NOT EXISTS "Store" ("id" TEXT NOT NULL PRIMARY KEY, "name" TEXT NOT NULL, "location" TEXT NOT NULL, "phone" TEXT NOT NULL, "managerName" TEXT NOT NULL, "targetMonthlySales" REAL NOT NULL DEFAULT 0, "status" TEXT NOT NULL DEFAULT 'active', "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP)`,
      `CREATE TABLE IF NOT EXISTS "Staff" ("id" TEXT NOT NULL PRIMARY KEY, "name" TEXT NOT NULL, "phone" TEXT NOT NULL, "storeId" TEXT NOT NULL, "role" TEXT NOT NULL DEFAULT 'Staff', "hireDate" DATETIME NOT NULL, "status" TEXT NOT NULL DEFAULT 'active', "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP)`,
      `CREATE TABLE IF NOT EXISTS "Schedule" ("id" TEXT NOT NULL PRIMARY KEY, "staffId" TEXT NOT NULL, "storeId" TEXT NOT NULL, "date" DATETIME NOT NULL, "shiftType" TEXT NOT NULL DEFAULT 'Morning', "notes" TEXT, "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP)`,
      `CREATE TABLE IF NOT EXISTS "Attendance" ("id" TEXT NOT NULL PRIMARY KEY, "staffId" TEXT NOT NULL, "storeId" TEXT NOT NULL, "date" DATETIME NOT NULL, "status" TEXT NOT NULL DEFAULT 'Present', "notes" TEXT, "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP)`,
      `CREATE TABLE IF NOT EXISTS "StorePerformance" ("id" TEXT NOT NULL PRIMARY KEY, "storeId" TEXT NOT NULL, "month" INTEGER NOT NULL, "year" INTEGER NOT NULL, "totalSales" REAL NOT NULL DEFAULT 0, "targetSales" REAL NOT NULL DEFAULT 0, "areaManagerNotes" TEXT, "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP)`,
      `CREATE TABLE IF NOT EXISTS "StaffPerformance" ("id" TEXT NOT NULL PRIMARY KEY, "staffId" TEXT NOT NULL, "storeId" TEXT NOT NULL, "month" INTEGER NOT NULL, "year" INTEGER NOT NULL, "rating" INTEGER NOT NULL DEFAULT 3, "notes" TEXT, "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP)`,
      `CREATE TABLE IF NOT EXISTS "StockItem" ("id" TEXT NOT NULL PRIMARY KEY, "storeId" TEXT NOT NULL, "productName" TEXT NOT NULL, "category" TEXT NOT NULL, "size" TEXT NOT NULL, "color" TEXT NOT NULL, "quantity" INTEGER NOT NULL DEFAULT 0, "minStockLevel" INTEGER NOT NULL DEFAULT 5, "sellingPrice" REAL NOT NULL DEFAULT 0, "lastRestocked" DATETIME, "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP)`,
      `CREATE TABLE IF NOT EXISTS "Task" ("id" TEXT NOT NULL PRIMARY KEY, "title" TEXT NOT NULL, "storeId" TEXT, "priority" INTEGER NOT NULL DEFAULT 3, "status" TEXT NOT NULL DEFAULT 'pending', "dueDate" DATETIME, "notes" TEXT, "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP)`,
      `CREATE TABLE IF NOT EXISTS "WeeklyChecklist" ("id" TEXT NOT NULL PRIMARY KEY, "weekStartDate" DATETIME NOT NULL, "items" TEXT NOT NULL DEFAULT '[]', "completedItems" TEXT NOT NULL DEFAULT '[]', "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP)`,
    ], "write");

    // Check if already seeded
    const storeCount = await prisma.store.count();
    if (storeCount > 0) {
      return NextResponse.json({ message: `Already set up — ${storeCount} stores found. App is ready!` });
    }

    // Seed stores
    const stores = await Promise.all([
      prisma.store.create({ data: { id: crypto.randomUUID(), name: "Sakura Store", location: "Lot 12, Pavilion KL, Bukit Bintang, Kuala Lumpur", phone: "03-2141 8800", managerName: "Ahmad Faris", targetMonthlySales: 85000, status: "active", updatedAt: new Date() } }),
      prisma.store.create({ data: { id: crypto.randomUUID(), name: "Harajuku Hub", location: "G-07, Mid Valley Megamall, Kuala Lumpur", phone: "03-2282 3300", managerName: "Nurul Izzati", targetMonthlySales: 75000, status: "active", updatedAt: new Date() } }),
      prisma.store.create({ data: { id: crypto.randomUUID(), name: "Shibuya Branch", location: "L2-45, Sunway Pyramid, Petaling Jaya", phone: "03-7494 2200", managerName: "Haziq Asyraf", targetMonthlySales: 70000, status: "active", updatedAt: new Date() } }),
      prisma.store.create({ data: { id: crypto.randomUUID(), name: "Omotesando Outlet", location: "F-18, The Gardens Mall, Mid Valley City", phone: "03-2283 1100", managerName: "Syafiqah Rahim", targetMonthlySales: 65000, status: "active", updatedAt: new Date() } }),
      prisma.store.create({ data: { id: crypto.randomUUID(), name: "Akihabara Point", location: "OB-22, One Utama Shopping Centre, Petaling Jaya", phone: "03-7726 0800", managerName: "Rizwan Hakim", targetMonthlySales: 60000, status: "active", updatedAt: new Date() } }),
    ]);

    const staffData = [
      { name: "Ahmad Faris", role: "Manager", si: 0, phone: "012-345 6789", daysAgo: 730 },
      { name: "Siti Nabilah", role: "Senior Staff", si: 0, phone: "011-234 5678", daysAgo: 400 },
      { name: "Hafiz Izzuddin", role: "Staff", si: 0, phone: "010-876 5432", daysAgo: 200 },
      { name: "Ainul Mardhiah", role: "Staff", si: 0, phone: "013-567 8901", daysAgo: 150 },
      { name: "Nurul Izzati", role: "Manager", si: 1, phone: "019-234 5678", daysAgo: 600 },
      { name: "Amirul Hakimi", role: "Senior Staff", si: 1, phone: "011-765 4321", daysAgo: 350 },
      { name: "Farhana Zulkifli", role: "Staff", si: 1, phone: "016-345 6789", daysAgo: 180 },
      { name: "Danial Ariff", role: "Staff", si: 1, phone: "012-456 7890", daysAgo: 90 },
      { name: "Haziq Asyraf", role: "Manager", si: 2, phone: "017-890 1234", daysAgo: 500 },
      { name: "Liyana Hussin", role: "Senior Staff", si: 2, phone: "014-567 8901", daysAgo: 300 },
      { name: "Syahril Anwar", role: "Staff", si: 2, phone: "018-678 9012", daysAgo: 240 },
      { name: "Nadia Roslan", role: "Staff", si: 2, phone: "011-890 1234", daysAgo: 120 },
      { name: "Syafiqah Rahim", role: "Manager", si: 3, phone: "013-901 2345", daysAgo: 450 },
      { name: "Ikram Haikal", role: "Senior Staff", si: 3, phone: "015-012 3456", daysAgo: 280 },
      { name: "Humaira Saad", role: "Staff", si: 3, phone: "012-123 4567", daysAgo: 160 },
      { name: "Zafri Adzlan", role: "Staff", si: 3, phone: "016-234 5678", daysAgo: 80 },
      { name: "Rizwan Hakim", role: "Manager", si: 4, phone: "019-345 6789", daysAgo: 380 },
      { name: "Aisyah Kamil", role: "Senior Staff", si: 4, phone: "017-456 7890", daysAgo: 260 },
      { name: "Farid Othman", role: "Staff", si: 4, phone: "013-567 8901", daysAgo: 190 },
      { name: "Nurul Ain", role: "Staff", si: 4, phone: "011-678 9012", daysAgo: 95 },
    ];

    const now = new Date();
    const createdStaff = await Promise.all(staffData.map((s) => {
      const hireDate = new Date(now); hireDate.setDate(hireDate.getDate() - s.daysAgo);
      return prisma.staff.create({ data: { id: crypto.randomUUID(), name: s.name, phone: s.phone, storeId: stores[s.si].id, role: s.role, hireDate, status: "active", updatedAt: new Date() } });
    }));

    const today = new Date(); today.setHours(0, 0, 0, 0);
    const dow = today.getDay();
    const thisMonday = new Date(today); thisMonday.setDate(today.getDate() - dow + (dow === 0 ? -6 : 1));
    const patterns = [
      ["Morning","Afternoon","Closing","Off","Morning","Afternoon","Off"],
      ["Afternoon","Closing","Morning","Morning","Off","Afternoon","Closing"],
      ["Closing","Morning","Off","Afternoon","Closing","Morning","Morning"],
      ["Off","Morning","Afternoon","Closing","Morning","Off","Afternoon"],
    ];
    for (let wo = -1; wo <= 1; wo++) {
      for (const staff of createdStaff) {
        const pi = createdStaff.indexOf(staff) % patterns.length;
        for (let d = 0; d < 7; d++) {
          const date = new Date(thisMonday); date.setDate(thisMonday.getDate() + wo * 7 + d);
          await prisma.schedule.create({ data: { id: crypto.randomUUID(), staffId: staff.id, storeId: staff.storeId, date, shiftType: patterns[pi][d], updatedAt: new Date() } });
        }
      }
    }

    const statuses = ["Present","Present","Present","Present","Late","Absent","Leave"];
    for (let db2 = 14; db2 >= 1; db2--) {
      const d = new Date(today); d.setDate(today.getDate() - db2);
      for (const staff of createdStaff) {
        await prisma.attendance.create({ data: { id: crypto.randomUUID(), staffId: staff.id, storeId: staff.storeId, date: d, status: statuses[Math.floor(Math.random() * statuses.length)], updatedAt: new Date() } });
      }
    }

    for (let mo = 0; mo <= 2; mo++) {
      const pd = new Date(today); pd.setMonth(pd.getMonth() - mo);
      for (const store of stores) {
        await prisma.storePerformance.create({ data: { id: crypto.randomUUID(), storeId: store.id, month: pd.getMonth() + 1, year: pd.getFullYear(), totalSales: Math.round(store.targetMonthlySales * (0.7 + Math.random() * 0.5)), targetSales: store.targetMonthlySales, updatedAt: new Date() } });
      }
    }

    for (const staff of createdStaff) {
      await prisma.staffPerformance.create({ data: { id: crypto.randomUUID(), staffId: staff.id, storeId: staff.storeId, month: today.getMonth() + 1, year: today.getFullYear(), rating: Math.floor(Math.random() * 3) + 3, updatedAt: new Date() } });
    }

    const products = [
      { name: "Sakura Bomber Jacket", category: "Bomber Jacket", price: 289 },
      { name: "Harajuku Track Top", category: "Track Top", price: 199 },
      { name: "Shibuya Varsity Jacket", category: "Varsity Jacket", price: 349 },
      { name: "Tokyo Oversized Tee", category: "Oversized Tee", price: 89 },
    ];
    const colors = ["Black","White","Navy","Red"];
    for (const store of stores) {
      for (const p of products) {
        for (const size of ["S","M","L","XL"]) {
          await prisma.stockItem.create({ data: { id: crypto.randomUUID(), storeId: store.id, productName: p.name, category: p.category, size, color: colors[Math.floor(Math.random()*4)], quantity: Math.floor(Math.random()*18)+1, minStockLevel: 5, sellingPrice: p.price, lastRestocked: new Date(), updatedAt: new Date() } });
        }
      }
    }

    const overdueDate = new Date(today); overdueDate.setDate(today.getDate() - 3);
    const dueSoon = new Date(today); dueSoon.setDate(today.getDate() + 2);
    const dueNextWeek = new Date(today); dueNextWeek.setDate(today.getDate() + 7);
    await Promise.all([
      prisma.task.create({ data: { id: crypto.randomUUID(), title: "Submit Q2 inventory audit report to HQ", priority: 1, status: "pending", dueDate: overdueDate, notes: "All 5 stores included.", updatedAt: new Date() } }),
      prisma.task.create({ data: { id: crypto.randomUUID(), title: "Fix broken display rack at Sakura Store", storeId: stores[0].id, priority: 1, status: "pending", dueDate: dueSoon, updatedAt: new Date() } }),
      prisma.task.create({ data: { id: crypto.randomUUID(), title: "Restock Bomber Jackets at Harajuku Hub", storeId: stores[1].id, priority: 2, status: "pending", dueDate: dueNextWeek, updatedAt: new Date() } }),
      prisma.task.create({ data: { id: crypto.randomUUID(), title: "Update price tags for summer collection", priority: 3, status: "pending", dueDate: dueNextWeek, updatedAt: new Date() } }),
      prisma.task.create({ data: { id: crypto.randomUUID(), title: "Review staff roster for June public holiday", storeId: stores[2].id, priority: 3, status: "pending", dueDate: dueNextWeek, updatedAt: new Date() } }),
    ]);

    const checklistItems = [
      { id: "1", text: "Create schedules for all 5 stores", type: "standard" },
      { id: "2", text: "Check stock levels for all stores", type: "standard" },
      { id: "3", text: "Review last week's sales figures", type: "standard" },
      { id: "4", text: "Submit weekly performance notes", type: "standard" },
      { id: "5", text: "Follow up on pending tasks", type: "standard" },
      { id: "6", text: "Visit stores", type: "visit" },
      { id: "7", text: "Team check-in call", type: "standard" },
    ];
    await prisma.weeklyChecklist.create({ data: { id: crypto.randomUUID(), weekStartDate: thisMonday, items: JSON.stringify(checklistItems), completedItems: JSON.stringify(["3","5"]), updatedAt: new Date() } });

    return NextResponse.json({ success: true, message: "✅ Done! Tables created and data seeded. Go to the home page now." });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
