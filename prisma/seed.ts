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
  await prisma.trainingRecord.deleteMany()
  await prisma.libraryEntry.deleteMany()
  await prisma.checklistRun.deleteMany()
  await prisma.checklistTemplate.deleteMany()
  await prisma.visit.deleteMany()
  await prisma.scheduleImage.deleteMany()
  await prisma.attendance.deleteMany()
  await prisma.staff.deleteMany()
  await prisma.store.deleteMany()

  // Create stores
  const stores = await Promise.all([
    prisma.store.create({
      data: { name: 'Sakura Store', location: 'Lot 12, Pavilion KL, Bukit Bintang, Kuala Lumpur', phone: '03-2141 8800', managerName: 'Ahmad Faris', status: 'active' },
    }),
    prisma.store.create({
      data: { name: 'Harajuku Hub', location: 'G-07, Mid Valley Megamall, Kuala Lumpur', phone: '03-2282 3300', managerName: 'Nurul Izzati', status: 'active' },
    }),
    prisma.store.create({
      data: { name: 'Shibuya Branch', location: 'L2-45, Sunway Pyramid, Petaling Jaya', phone: '03-7494 2200', managerName: 'Haziq Asyraf', status: 'active' },
    }),
    prisma.store.create({
      data: { name: 'Omotesando Outlet', location: 'F-18, The Gardens Mall, Mid Valley City', phone: '03-2283 1100', managerName: 'Syafiqah Rahim', status: 'active' },
    }),
    prisma.store.create({
      data: { name: 'Akihabara Point', location: 'OB-22, One Utama Shopping Centre, Petaling Jaya', phone: '03-7726 0800', managerName: 'Rizwan Hakim', status: 'active' },
    }),
  ])

  console.log(`Created ${stores.length} stores`)

  const staffData = [
    { name: 'Ahmad Faris', role: 'Manager', storeIdx: 0, phone: '012-345 6789', daysAgo: 730 },
    { name: 'Siti Nabilah', role: 'Senior Staff', storeIdx: 0, phone: '011-234 5678', daysAgo: 400 },
    { name: 'Hafiz Izzuddin', role: 'Staff', storeIdx: 0, phone: '010-876 5432', daysAgo: 200 },
    { name: 'Ainul Mardhiah', role: 'Staff', storeIdx: 0, phone: '013-567 8901', daysAgo: 150 },
    { name: 'Nurul Izzati', role: 'Manager', storeIdx: 1, phone: '019-234 5678', daysAgo: 600 },
    { name: 'Amirul Hakimi', role: 'Senior Staff', storeIdx: 1, phone: '011-765 4321', daysAgo: 350 },
    { name: 'Farhana Zulkifli', role: 'Staff', storeIdx: 1, phone: '016-345 6789', daysAgo: 180 },
    { name: 'Danial Ariff', role: 'Staff', storeIdx: 1, phone: '012-456 7890', daysAgo: 90 },
    { name: 'Haziq Asyraf', role: 'Manager', storeIdx: 2, phone: '017-890 1234', daysAgo: 500 },
    { name: 'Liyana Hussin', role: 'Senior Staff', storeIdx: 2, phone: '014-567 8901', daysAgo: 300 },
    { name: 'Syahril Anwar', role: 'Staff', storeIdx: 2, phone: '018-678 9012', daysAgo: 240 },
    { name: 'Nadia Roslan', role: 'Staff', storeIdx: 2, phone: '011-890 1234', daysAgo: 120 },
    { name: 'Syafiqah Rahim', role: 'Manager', storeIdx: 3, phone: '013-901 2345', daysAgo: 450 },
    { name: 'Ikram Haikal', role: 'Senior Staff', storeIdx: 3, phone: '015-012 3456', daysAgo: 280 },
    { name: 'Humaira Saad', role: 'Staff', storeIdx: 3, phone: '012-123 4567', daysAgo: 160 },
    { name: 'Zafri Adzlan', role: 'Staff', storeIdx: 3, phone: '016-234 5678', daysAgo: 80 },
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
        data: { name: s.name, phone: s.phone, storeId: stores[s.storeIdx].id, role: s.role, hireDate, status: 'active' },
      })
    })
  )

  console.log(`Created ${createdStaff.length} staff`)

  const today = new Date()
  const attendanceStatuses = ['Present', 'Present', 'Present', 'Present', 'Late', 'Absent', 'Leave']
  for (let daysBack = 14; daysBack >= 1; daysBack--) {
    const attDate = new Date(today)
    attDate.setDate(today.getDate() - daysBack)
    attDate.setHours(0, 0, 0, 0)

    for (const staff of createdStaff) {
      const statusIdx = Math.floor(Math.random() * attendanceStatuses.length)
      await prisma.attendance.create({
        data: { staffId: staff.id, storeId: staff.storeId, date: attDate, status: attendanceStatuses[statusIdx] },
      })
    }
  }

  console.log('Created attendance records')

  const overdueDate = new Date(today); overdueDate.setDate(overdueDate.getDate() - 3)
  const dueSoon = new Date(today); dueSoon.setDate(dueSoon.getDate() + 2)
  const dueNextWeek = new Date(today); dueNextWeek.setDate(dueNextWeek.getDate() + 7)

  await prisma.task.createMany({
    data: [
      { title: 'Visit Aman Central this week', storeId: stores[0].id, priority: 1, status: 'pending', dueDate: dueSoon },
      { title: 'Fix broken display rack at Sakura Store', storeId: stores[0].id, priority: 1, status: 'pending', dueDate: overdueDate, notes: 'Customer reported sharp edge on rack near entrance.' },
      { title: 'Update opening checklist with new ATM step', storeId: stores[1].id, priority: 2, status: 'pending', dueDate: dueNextWeek },
      { title: 'Train new staff on POS', storeId: stores[2].id, priority: 3, status: 'pending', dueDate: dueNextWeek },
      { title: 'Photograph shift schedule for the week', priority: 3, status: 'pending', dueDate: dueNextWeek },
    ],
  })

  console.log('Created tasks')

  const dayOfWeek = today.getDay()
  const diff = today.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1)
  const weekStart = new Date(today)
  weekStart.setDate(diff)
  weekStart.setHours(0, 0, 0, 0)
  const checklistItems = [
    { id: '1', text: 'Visit stores', type: 'visit', notes: '' },
    { id: '2', text: 'Review pending tasks', type: 'standard' },
    { id: '3', text: 'Check shift schedules', type: 'standard' },
    { id: '4', text: 'Team check-in call', type: 'standard' },
  ]

  await prisma.weeklyChecklist.create({
    data: { weekStartDate: weekStart, items: JSON.stringify(checklistItems), completedItems: JSON.stringify([]) },
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
