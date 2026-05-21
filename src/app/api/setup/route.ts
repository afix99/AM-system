import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

// One-time setup route: visit /api/setup to create tables + seed data
// Delete or disable this route after first use

export async function GET() {
  try {
    // Test connection first
    await prisma.$queryRaw`SELECT 1`;

    // Check if already seeded
    const storeCount = await prisma.store.count();
    if (storeCount > 0) {
      return NextResponse.json({ message: `Already set up. ${storeCount} stores found.` });
    }

    // Seed stores
    const stores = await Promise.all([
      prisma.store.create({ data: { name: "Sakura Store", location: "Lot 12, Pavilion KL, Bukit Bintang, Kuala Lumpur", phone: "03-2141 8800", managerName: "Ahmad Faris", targetMonthlySales: 85000, status: "active" } }),
      prisma.store.create({ data: { name: "Harajuku Hub", location: "G-07, Mid Valley Megamall, Kuala Lumpur", phone: "03-2282 3300", managerName: "Nurul Izzati", targetMonthlySales: 75000, status: "active" } }),
      prisma.store.create({ data: { name: "Shibuya Branch", location: "L2-45, Sunway Pyramid, Petaling Jaya", phone: "03-7494 2200", managerName: "Haziq Asyraf", targetMonthlySales: 70000, status: "active" } }),
      prisma.store.create({ data: { name: "Omotesando Outlet", location: "F-18, The Gardens Mall, Mid Valley City", phone: "03-2283 1100", managerName: "Syafiqah Rahim", targetMonthlySales: 65000, status: "active" } }),
      prisma.store.create({ data: { name: "Akihabara Point", location: "OB-22, One Utama Shopping Centre, Petaling Jaya", phone: "03-7726 0800", managerName: "Rizwan Hakim", targetMonthlySales: 60000, status: "active" } }),
    ]);

    const staffData = [
      { name: "Ahmad Faris", role: "Manager", storeIdx: 0, phone: "012-345 6789", daysAgo: 730 },
      { name: "Siti Nabilah", role: "Senior Staff", storeIdx: 0, phone: "011-234 5678", daysAgo: 400 },
      { name: "Hafiz Izzuddin", role: "Staff", storeIdx: 0, phone: "010-876 5432", daysAgo: 200 },
      { name: "Ainul Mardhiah", role: "Staff", storeIdx: 0, phone: "013-567 8901", daysAgo: 150 },
      { name: "Nurul Izzati", role: "Manager", storeIdx: 1, phone: "019-234 5678", daysAgo: 600 },
      { name: "Amirul Hakimi", role: "Senior Staff", storeIdx: 1, phone: "011-765 4321", daysAgo: 350 },
      { name: "Farhana Zulkifli", role: "Staff", storeIdx: 1, phone: "016-345 6789", daysAgo: 180 },
      { name: "Danial Ariff", role: "Staff", storeIdx: 1, phone: "012-456 7890", daysAgo: 90 },
      { name: "Haziq Asyraf", role: "Manager", storeIdx: 2, phone: "017-890 1234", daysAgo: 500 },
      { name: "Liyana Hussin", role: "Senior Staff", storeIdx: 2, phone: "014-567 8901", daysAgo: 300 },
      { name: "Syahril Anwar", role: "Staff", storeIdx: 2, phone: "018-678 9012", daysAgo: 240 },
      { name: "Nadia Roslan", role: "Staff", storeIdx: 2, phone: "011-890 1234", daysAgo: 120 },
      { name: "Syafiqah Rahim", role: "Manager", storeIdx: 3, phone: "013-901 2345", daysAgo: 450 },
      { name: "Ikram Haikal", role: "Senior Staff", storeIdx: 3, phone: "015-012 3456", daysAgo: 280 },
      { name: "Humaira Saad", role: "Staff", storeIdx: 3, phone: "012-123 4567", daysAgo: 160 },
      { name: "Zafri Adzlan", role: "Staff", storeIdx: 3, phone: "016-234 5678", daysAgo: 80 },
      { name: "Rizwan Hakim", role: "Manager", storeIdx: 4, phone: "019-345 6789", daysAgo: 380 },
      { name: "Aisyah Kamil", role: "Senior Staff", storeIdx: 4, phone: "017-456 7890", daysAgo: 260 },
      { name: "Farid Othman", role: "Staff", storeIdx: 4, phone: "013-567 8901", daysAgo: 190 },
      { name: "Nurul Ain", role: "Staff", storeIdx: 4, phone: "011-678 9012", daysAgo: 95 },
    ];

    const now = new Date();
    const createdStaff = await Promise.all(
      staffData.map((s) => {
        const hireDate = new Date(now);
        hireDate.setDate(hireDate.getDate() - s.daysAgo);
        return prisma.staff.create({ data: { name: s.name, phone: s.phone, storeId: stores[s.storeIdx].id, role: s.role, hireDate, status: "active" } });
      })
    );

    // Schedules
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const dayOfWeek = today.getDay();
    const diff = today.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
    const thisMonday = new Date(today); thisMonday.setDate(diff);
    const shiftPatterns = [
      ["Morning","Afternoon","Closing","Off","Morning","Afternoon","Off"],
      ["Afternoon","Closing","Morning","Morning","Off","Afternoon","Closing"],
      ["Closing","Morning","Off","Afternoon","Closing","Morning","Morning"],
      ["Off","Morning","Afternoon","Closing","Morning","Off","Afternoon"],
    ];
    for (let weekOffset = -1; weekOffset <= 1; weekOffset++) {
      for (const staff of createdStaff) {
        const patternIdx = createdStaff.indexOf(staff) % shiftPatterns.length;
        for (let day = 0; day < 7; day++) {
          const schedDate = new Date(thisMonday);
          schedDate.setDate(thisMonday.getDate() + weekOffset * 7 + day);
          await prisma.schedule.create({ data: { staffId: staff.id, storeId: staff.storeId, date: schedDate, shiftType: shiftPatterns[patternIdx][day] } });
        }
      }
    }

    // Attendance
    const statuses = ["Present","Present","Present","Present","Late","Absent","Leave"];
    for (let daysBack = 14; daysBack >= 1; daysBack--) {
      const attDate = new Date(today); attDate.setDate(today.getDate() - daysBack);
      for (const staff of createdStaff) {
        await prisma.attendance.create({ data: { staffId: staff.id, storeId: staff.storeId, date: attDate, status: statuses[Math.floor(Math.random() * statuses.length)] } });
      }
    }

    // Performance (3 months)
    for (let mo = 0; mo <= 2; mo++) {
      const pd = new Date(today); pd.setMonth(pd.getMonth() - mo);
      const month = pd.getMonth() + 1; const year = pd.getFullYear();
      for (const store of stores) {
        const factor = 0.7 + Math.random() * 0.5;
        await prisma.storePerformance.create({ data: { storeId: store.id, month, year, totalSales: Math.round(store.targetMonthlySales * factor), targetSales: store.targetMonthlySales, areaManagerNotes: mo === 0 ? "Good performance this month." : null } });
      }
    }

    // Staff performance
    for (const staff of createdStaff) {
      await prisma.staffPerformance.create({ data: { staffId: staff.id, storeId: staff.storeId, month: today.getMonth() + 1, year: today.getFullYear(), rating: Math.floor(Math.random() * 3) + 3 } });
    }

    // Stock
    const products = [
      { name: "Sakura Bomber Jacket", category: "Bomber Jacket", price: 289 },
      { name: "Harajuku Track Top", category: "Track Top", price: 199 },
      { name: "Shibuya Varsity Jacket", category: "Varsity Jacket", price: 349 },
      { name: "Tokyo Oversized Tee", category: "Oversized Tee", price: 89 },
    ];
    for (const store of stores) {
      for (const product of products) {
        for (const size of ["S","M","L","XL"]) {
          await prisma.stockItem.create({ data: { storeId: store.id, productName: product.name, category: product.category, size, color: ["Black","White","Navy","Red"][Math.floor(Math.random()*4)], quantity: Math.floor(Math.random()*18)+1, minStockLevel: 5, sellingPrice: product.price, lastRestocked: new Date() } });
        }
      }
    }

    // Tasks
    const overdueDate = new Date(today); overdueDate.setDate(today.getDate() - 3);
    const dueSoon = new Date(today); dueSoon.setDate(today.getDate() + 2);
    const dueNextWeek = new Date(today); dueNextWeek.setDate(today.getDate() + 7);
    await prisma.task.createMany({ data: [
      { title: "Submit Q2 inventory audit report to HQ", priority: 1, status: "pending", dueDate: overdueDate, notes: "All 5 stores included." },
      { title: "Fix broken display rack at Sakura Store", storeId: stores[0].id, priority: 1, status: "pending", dueDate: dueSoon },
      { title: "Restock Bomber Jackets at Harajuku Hub", storeId: stores[1].id, priority: 2, status: "pending", dueDate: dueNextWeek },
      { title: "Update price tags for summer collection", priority: 3, status: "pending", dueDate: dueNextWeek },
      { title: "Review staff roster for June public holiday", storeId: stores[2].id, priority: 3, status: "pending", dueDate: dueNextWeek },
    ]});

    // Weekly checklist
    const checklistItems = [
      { id: "1", text: "Create schedules for all 5 stores", type: "standard" },
      { id: "2", text: "Check stock levels for all stores", type: "standard" },
      { id: "3", text: "Review last week's sales figures", type: "standard" },
      { id: "4", text: "Submit weekly performance notes", type: "standard" },
      { id: "5", text: "Follow up on pending tasks", type: "standard" },
      { id: "6", text: "Visit stores", type: "visit" },
      { id: "7", text: "Team check-in call", type: "standard" },
    ];
    await prisma.weeklyChecklist.create({ data: { weekStartDate: thisMonday, items: JSON.stringify(checklistItems), completedItems: JSON.stringify(["3","5"]) } });

    return NextResponse.json({ success: true, message: "Database seeded successfully! You can now use the app." });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
