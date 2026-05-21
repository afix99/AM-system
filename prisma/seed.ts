import { PrismaClient } from '@prisma/client'
import { PrismaLibSql } from '@prisma/adapter-libsql'

const adapter = new PrismaLibSql({
  url: process.env.TURSO_DATABASE_URL ?? process.env.DATABASE_URL ?? 'file:./dev.db',
  authToken: process.env.TURSO_AUTH_TOKEN,
})
const prisma = new PrismaClient({ adapter })

async function main() {
  console.log('Seeding database...')

  // Clean existing data
  await prisma.weeklyChecklist.deleteMany()
  await prisma.task.deleteMany()
  await prisma.stockItem.deleteMany()
  await prisma.staffPerformance.deleteMany()
  await prisma.storePerformance.deleteMany()
  await prisma.attendance.deleteMany()
  await prisma.staff.deleteMany()
  await prisma.store.deleteMany()

  // Create stores
  const stores = await Promise.all([
    prisma.store.create({
      data: {
        name: 'Sakura Store',
        location: 'Lot 12, Pavilion KL, Bukit Bintang, Kuala Lumpur',
        phone: '03-2141 8800',
        managerName: 'Ahmad Faris',
        targetMonthlySales: 85000,
        status: 'active',
      },
    }),
    prisma.store.create({
      data: {
        name: 'Harajuku Hub',
        location: 'G-07, Mid Valley Megamall, Kuala Lumpur',
        phone: '03-2282 3300',
        managerName: 'Nurul Izzati',
        targetMonthlySales: 75000,
        status: 'active',
      },
    }),
    prisma.store.create({
      data: {
        name: 'Shibuya Branch',
        location: 'L2-45, Sunway Pyramid, Petaling Jaya',
        phone: '03-7494 2200',
        managerName: 'Haziq Asyraf',
        targetMonthlySales: 70000,
        status: 'active',
      },
    }),
    prisma.store.create({
      data: {
        name: 'Omotesando Outlet',
        location: 'F-18, The Gardens Mall, Mid Valley City',
        phone: '03-2283 1100',
        managerName: 'Syafiqah Rahim',
        targetMonthlySales: 65000,
        status: 'active',
      },
    }),
    prisma.store.create({
      data: {
        name: 'Akihabara Point',
        location: 'OB-22, One Utama Shopping Centre, Petaling Jaya',
        phone: '03-7726 0800',
        managerName: 'Rizwan Hakim',
        targetMonthlySales: 60000,
        status: 'active',
      },
    }),
  ])

  console.log(`Created ${stores.length} stores`)

  // Staff names (Malaysian)
  const staffData = [
    // Sakura Store
    { name: 'Ahmad Faris', role: 'Manager', storeIdx: 0, phone: '012-345 6789', daysAgo: 730 },
    { name: 'Siti Nabilah', role: 'Senior Staff', storeIdx: 0, phone: '011-234 5678', daysAgo: 400 },
    { name: 'Hafiz Izzuddin', role: 'Staff', storeIdx: 0, phone: '010-876 5432', daysAgo: 200 },
    { name: 'Ainul Mardhiah', role: 'Staff', storeIdx: 0, phone: '013-567 8901', daysAgo: 150 },

    // Harajuku Hub
    { name: 'Nurul Izzati', role: 'Manager', storeIdx: 1, phone: '019-234 5678', daysAgo: 600 },
    { name: 'Amirul Hakimi', role: 'Senior Staff', storeIdx: 1, phone: '011-765 4321', daysAgo: 350 },
    { name: 'Farhana Zulkifli', role: 'Staff', storeIdx: 1, phone: '016-345 6789', daysAgo: 180 },
    { name: 'Danial Ariff', role: 'Staff', storeIdx: 1, phone: '012-456 7890', daysAgo: 90 },

    // Shibuya Branch
    { name: 'Haziq Asyraf', role: 'Manager', storeIdx: 2, phone: '017-890 1234', daysAgo: 500 },
    { name: 'Liyana Hussin', role: 'Senior Staff', storeIdx: 2, phone: '014-567 8901', daysAgo: 300 },
    { name: 'Syahril Anwar', role: 'Staff', storeIdx: 2, phone: '018-678 9012', daysAgo: 240 },
    { name: 'Nadia Roslan', role: 'Staff', storeIdx: 2, phone: '011-890 1234', daysAgo: 120 },

    // Omotesando Outlet
    { name: 'Syafiqah Rahim', role: 'Manager', storeIdx: 3, phone: '013-901 2345', daysAgo: 450 },
    { name: 'Ikram Haikal', role: 'Senior Staff', storeIdx: 3, phone: '015-012 3456', daysAgo: 280 },
    { name: 'Humaira Saad', role: 'Staff', storeIdx: 3, phone: '012-123 4567', daysAgo: 160 },
    { name: 'Zafri Adzlan', role: 'Staff', storeIdx: 3, phone: '016-234 5678', daysAgo: 80 },

    // Akihabara Point
    { name: 'Rizwan Hakim', role: 'Manager', storeIdx: 4, phone: '019-345 6789', daysAgo: 380 },
    { name: 'Aisyah Kamil', role: 'Senior Staff', storeIdx: 4, phone: '017-456 7890', daysAgo: 260 },
    { name: 'Farid Othman', role: 'Staff', storeIdx: 4, phone: '013-567 8901', daysAgo: 190 },
    { name: 'Nurul Ain', role: 'Staff', storeIdx: 4, phone: '011-678 9012', daysAgo: 95 },
  ]

  const now = new Date()
  const createdStaff = await Promise.all(
    staffData.map((s) => {
      const hireDate = new Date(now)
      hireDate.setDate(hireDate.getDate() - s.daysAgo)
      return prisma.staff.create({
        data: {
          name: s.name,
          phone: s.phone,
          storeId: stores[s.storeIdx].id,
          role: s.role,
          hireDate,
          status: 'active',
        },
      })
    })
  )

  console.log(`Created ${createdStaff.length} staff`)

  const today = new Date()

  // Create attendance for past 2 weeks
  const attendanceStatuses = ['Present', 'Present', 'Present', 'Present', 'Late', 'Absent', 'Leave']
  for (let daysBack = 14; daysBack >= 1; daysBack--) {
    const attDate = new Date(today)
    attDate.setDate(today.getDate() - daysBack)
    attDate.setHours(0, 0, 0, 0)

    for (const staff of createdStaff) {
      const statusIdx = Math.floor(Math.random() * attendanceStatuses.length)
      await prisma.attendance.create({
        data: {
          staffId: staff.id,
          storeId: staff.storeId,
          date: attDate,
          status: attendanceStatuses[statusIdx],
        },
      })
    }
  }

  console.log('Created attendance records')

  // Create store performance for last 3 months
  for (let monthOffset = 0; monthOffset <= 2; monthOffset++) {
    const perfDate = new Date(today)
    perfDate.setMonth(perfDate.getMonth() - monthOffset)
    const month = perfDate.getMonth() + 1
    const year = perfDate.getFullYear()

    for (const store of stores) {
      const achievementFactor = 0.7 + Math.random() * 0.5
      await prisma.storePerformance.create({
        data: {
          storeId: store.id,
          month,
          year,
          totalSales: Math.round(store.targetMonthlySales * achievementFactor),
          targetSales: store.targetMonthlySales,
          areaManagerNotes: monthOffset === 0 ? 'Good performance this month. Keep it up!' : null,
        },
      })
    }
  }

  console.log('Created store performance data')

  // Create staff performance
  for (const staff of createdStaff) {
    const month = today.getMonth() + 1
    const year = today.getFullYear()
    await prisma.staffPerformance.create({
      data: {
        staffId: staff.id,
        storeId: staff.storeId,
        month,
        year,
        rating: Math.floor(Math.random() * 3) + 3,
        notes: 'Performing well.',
      },
    })
  }

  console.log('Created staff performance data')

  // Create stock items
  const products = [
    { name: 'Sakura Bomber Jacket', category: 'Bomber Jacket', price: 289 },
    { name: 'Harajuku Track Top', category: 'Track Top', price: 199 },
    { name: 'Shibuya Varsity Jacket', category: 'Varsity Jacket', price: 349 },
    { name: 'Tokyo Oversized Tee', category: 'Oversized Tee', price: 89 },
    { name: 'Neon Kanji Bomber', category: 'Bomber Jacket', price: 319 },
    { name: 'Street Ninja Track Top', category: 'Track Top', price: 219 },
    { name: 'Kyoto Varsity Classic', category: 'Varsity Jacket', price: 389 },
    { name: 'Oni Oversized Tee', category: 'Oversized Tee', price: 99 },
    { name: 'Akihabara Windbreaker', category: 'Windbreaker', price: 259 },
    { name: 'Omotesando Zip-Up', category: 'Track Top', price: 179 },
  ]
  const sizes = ['S', 'M', 'L', 'XL']
  const colors = ['Black', 'White', 'Navy', 'Red']

  for (const store of stores) {
    for (const product of products.slice(0, 4)) {
      for (const size of sizes.slice(0, 3)) {
        const qty = Math.floor(Math.random() * 20) + 1
        const minLevel = 5
        await prisma.stockItem.create({
          data: {
            storeId: store.id,
            productName: product.name,
            category: product.category,
            size,
            color: colors[Math.floor(Math.random() * colors.length)],
            quantity: qty,
            minStockLevel: minLevel,
            sellingPrice: product.price,
            lastRestocked: new Date(today.getTime() - Math.random() * 30 * 24 * 60 * 60 * 1000),
          },
        })
      }
    }
  }

  console.log('Created stock items')

  // Create tasks (including 1 overdue)
  const overdueDate = new Date(today)
  overdueDate.setDate(overdueDate.getDate() - 3)

  const dueSoon = new Date(today)
  dueSoon.setDate(dueSoon.getDate() + 2)

  const dueNextWeek = new Date(today)
  dueNextWeek.setDate(dueNextWeek.getDate() + 7)

  await prisma.task.createMany({
    data: [
      {
        title: 'Submit Q2 inventory audit report to HQ',
        storeId: null,
        priority: 1,
        status: 'pending',
        dueDate: overdueDate,
        notes: 'All 5 stores included. Template shared via email.',
      },
      {
        title: 'Fix broken display rack at Sakura Store',
        storeId: stores[0].id,
        priority: 1,
        status: 'pending',
        dueDate: dueSoon,
        notes: 'Customer reported sharp edge on rack near entrance.',
      },
      {
        title: 'Restock Bomber Jackets at Harajuku Hub',
        storeId: stores[1].id,
        priority: 2,
        status: 'pending',
        dueDate: dueNextWeek,
        notes: 'Popular SKUs: Sakura Bomber S, M. Call supplier.',
      },
      {
        title: 'Update price tags for summer collection',
        storeId: null,
        priority: 3,
        status: 'pending',
        dueDate: dueNextWeek,
        notes: '10% discount on all track tops from June 1.',
      },
      {
        title: 'Review staff roster for June public holiday',
        storeId: stores[2].id,
        priority: 3,
        status: 'pending',
        dueDate: dueNextWeek,
        notes: 'Ensure minimum 2 staff per shift on 31 May.',
      },
    ],
  })

  console.log('Created tasks')

  // Create weekly checklist
  const dayOfWeek = today.getDay()
  const diff = today.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1)
  const weekStart = new Date(today)
  weekStart.setDate(diff)
  weekStart.setHours(0, 0, 0, 0)
  const checklistItems = [
    { id: '1', text: 'Create schedules for all 5 stores', type: 'standard' },
    { id: '2', text: 'Check stock levels for all stores', type: 'standard' },
    { id: '3', text: "Review last week's sales figures", type: 'standard' },
    { id: '4', text: 'Submit weekly performance notes', type: 'standard' },
    { id: '5', text: 'Follow up on pending tasks', type: 'standard' },
    { id: '6', text: 'Visit stores', type: 'visit', notes: '' },
    { id: '7', text: 'Team check-in call', type: 'standard' },
  ]

  await prisma.weeklyChecklist.create({
    data: {
      weekStartDate: weekStart,
      items: JSON.stringify(checklistItems),
      completedItems: JSON.stringify(['3', '5']),
    },
  })

  console.log('Created weekly checklist')
  console.log('Seed completed successfully!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
