import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  // Hash passwords
  const hashedSuperAdminPassword = await bcrypt.hash('superadmin123', 10);
  const hashedAdmin1Password = await bcrypt.hash('admin123', 10);
  const hashedAdmin2Password = await bcrypt.hash('admin456', 10);
  const hashedStaffPasswords = await Promise.all([
    bcrypt.hash('staff123', 10),
    bcrypt.hash('staff456', 10),
    bcrypt.hash('staff789', 10),
    bcrypt.hash('staff101', 10),
  ]);
  const hashedMemberPasswords = await Promise.all([
    bcrypt.hash('member123', 10),
    bcrypt.hash('member456', 10),
    bcrypt.hash('member789', 10),
    bcrypt.hash('member101', 10),
    bcrypt.hash('member202', 10),
    bcrypt.hash('member303', 10),
  ]);
  const hashedInactivePassword = await bcrypt.hash('inactive123', 10);
  const hashedBlockedPassword = await bcrypt.hash('blocked123', 10);

  // Create SUPERADMIN user
  const superAdmin = await prisma.user.upsert({
    where: { email: 'superadmin@example.com' },
    update: {},
    create: {
      name: 'Super Admin',
      email: 'superadmin@example.com',
      password: hashedSuperAdminPassword,
      role: 'SUPERADMIN',
      staffRole: 'NONE',
      status: 'ACTIVE',
    },
  });

  // Create ADMIN users (created by SuperAdmin)
  const admin1 = await prisma.user.upsert({
    where: { email: 'admin1@example.com' },
    update: {},
    create: {
      name: 'Admin One',
      email: 'admin1@example.com',
      password: hashedAdmin1Password,
      role: 'ADMIN',
      staffRole: 'NONE',
      status: 'ACTIVE',
      createdBy: superAdmin.id,
    },
  });

  const admin2 = await prisma.user.upsert({
    where: { email: 'admin2@example.com' },
    update: {},
    create: {
      name: 'Admin Two',
      email: 'admin2@example.com',
      password: hashedAdmin2Password,
      role: 'ADMIN',
      staffRole: 'NONE',
      status: 'ACTIVE',
      createdBy: superAdmin.id,
    },
  });

  // Create Branches (created by Admins)
  const branch1 = await prisma.branch.upsert({
    where: { id: 1 },
    update: {},
    create: {
      name: 'Downtown Gym',
      address: '123 Main St, Downtown',
      phone: '+91 98765 43210',
      status: 'ACTIVE',
      adminId: admin1.id,
    },
  });

  const branch2 = await prisma.branch.upsert({
    where: { id: 2 },
    update: {},
    create: {
      name: 'Uptown Fitness',
      address: '456 Oak Ave, Uptown',
      phone: '+91 91234 56789',
      status: 'ACTIVE',
      adminId: admin1.id,
    },
  });

  const branch3 = await prisma.branch.upsert({
    where: { id: 3 },
    update: {},
    create: {
      name: 'Suburb Wellness',
      address: '789 Pine Rd, Suburb',
      phone: '+91 99876 54321',
      status: 'INACTIVE',
      adminId: admin2.id,
    },
  });

  // Create STAFF records (separate from User)
  const staff1 = await prisma.staff.upsert({
    where: { staffCode: 'STAFF001' },
    update: {},
    create: {
      staffCode: 'STAFF001',
      firstName: 'John',
      lastName: 'Trainer',
      gender: 'Male',
      dob: new Date('1990-01-01'),
      email: 'trainer1@example.com',
      phone: '+91 98765 43211',
      status: 'ACTIVE',
      role: 'GENERAL_TRAINER',
      branchId: branch1.id,
      joinDate: new Date('2023-01-01'),
      salaryType: 'FIXED',
      fixedSalary: 30000,
      loginEnabled: true,
      username: 'trainer1',
      password: hashedStaffPasswords[0],
      adminId: admin1.id,
    },
  });

  const staff2 = await prisma.staff.upsert({
    where: { staffCode: 'STAFF002' },
    update: {},
    create: {
      staffCode: 'STAFF002',
      firstName: 'Jane',
      lastName: 'PT',
      gender: 'Female',
      dob: new Date('1985-05-15'),
      email: 'trainer2@example.com',
      phone: '+91 98765 43212',
      status: 'ACTIVE',
      role: 'PERSONAL_TRAINER',
      branchId: branch1.id,
      joinDate: new Date('2023-02-01'),
      salaryType: 'FIXED',
      fixedSalary: 40000,
      loginEnabled: true,
      username: 'trainer2',
      password: hashedStaffPasswords[1],
      adminId: admin1.id,
    },
  });

  const staff3 = await prisma.staff.upsert({
    where: { staffCode: 'STAFF003' },
    update: {},
    create: {
      staffCode: 'STAFF003',
      firstName: 'Bob',
      lastName: 'Housekeeper',
      gender: 'Male',
      dob: new Date('1992-08-20'),
      email: 'housekeeper@example.com',
      phone: '+91 98765 43213',
      status: 'ACTIVE',
      role: 'HOUSEKEEPING',
      branchId: branch2.id,
      joinDate: new Date('2023-03-01'),
      salaryType: 'FIXED',
      fixedSalary: 20000,
      loginEnabled: false,
      adminId: admin1.id,
    },
  });

  const staff4 = await prisma.staff.upsert({
    where: { staffCode: 'STAFF004' },
    update: {},
    create: {
      staffCode: 'STAFF004',
      firstName: 'Alice',
      lastName: 'Receptionist',
      gender: 'Female',
      dob: new Date('1995-12-10'),
      email: 'receptionist@example.com',
      phone: '+91 98765 43214',
      status: 'ACTIVE',
      role: 'RECEPTIONIST',
      branchId: branch3.id,
      joinDate: new Date('2023-04-01'),
      salaryType: 'FIXED',
      fixedSalary: 25000,
      loginEnabled: true,
      username: 'receptionist',
      password: hashedStaffPasswords[3],
      adminId: admin2.id,
    },
  });

  // Create MEMBER users (created by Admins, assigned to branches)
  const member1 = await prisma.user.upsert({
    where: { email: 'member1@example.com' },
    update: {},
    create: {
      name: 'Mike Member',
      email: 'member1@example.com',
      password: hashedMemberPasswords[0],
      role: 'MEMBER',
      staffRole: 'NONE',
      status: 'ACTIVE',
      createdBy: admin1.id,
      branchId: branch1.id,
    },
  });

  const member2 = await prisma.user.upsert({
    where: { email: 'member2@example.com' },
    update: {},
    create: {
      name: 'Sara Member',
      email: 'member2@example.com',
      password: hashedMemberPasswords[1],
      role: 'MEMBER',
      staffRole: 'NONE',
      status: 'ACTIVE',
      createdBy: admin1.id,
      branchId: branch1.id,
    },
  });

  const member3 = await prisma.user.upsert({
    where: { email: 'member3@example.com' },
    update: {},
    create: {
      name: 'Tom Member',
      email: 'member3@example.com',
      password: hashedMemberPasswords[2],
      role: 'MEMBER',
      staffRole: 'NONE',
      status: 'ACTIVE',
      createdBy: admin1.id,
      branchId: branch2.id,
    },
  });

  const member4 = await prisma.user.upsert({
    where: { email: 'member4@example.com' },
    update: {},
    create: {
      name: 'Lisa Member',
      email: 'member4@example.com',
      password: hashedMemberPasswords[3],
      role: 'MEMBER',
      staffRole: 'NONE',
      status: 'ACTIVE',
      createdBy: admin2.id,
      branchId: branch3.id,
    },
  });

  const member5 = await prisma.user.upsert({
    where: { email: 'member5@example.com' },
    update: {},
    create: {
      name: 'Dave Member',
      email: 'member5@example.com',
      password: hashedMemberPasswords[4],
      role: 'MEMBER',
      staffRole: 'NONE',
      status: 'ACTIVE',
      createdBy: admin2.id,
      branchId: branch3.id,
    },
  });

  const member6 = await prisma.user.upsert({
    where: { email: 'member6@example.com' },
    update: {},
    create: {
      name: 'Emma Member',
      email: 'member6@example.com',
      password: hashedMemberPasswords[5],
      role: 'MEMBER',
      staffRole: 'NONE',
      status: 'ACTIVE',
      createdBy: admin2.id,
      branchId: branch3.id,
    },
  });

  // Create INACTIVE user
  const inactiveUser = await prisma.user.upsert({
    where: { email: 'inactive@example.com' },
    update: {},
    create: {
      name: 'Inactive User',
      email: 'inactive@example.com',
      password: hashedInactivePassword,
      role: 'MEMBER',
      staffRole: 'NONE',
      status: 'INACTIVE',
      createdBy: admin1.id,
      branchId: branch1.id,
    },
  });

  // Create BLOCKED user
  const blockedUser = await prisma.user.upsert({
    where: { email: 'blocked@example.com' },
    update: {},
    create: {
      name: 'Blocked User',
      email: 'blocked@example.com',
      password: hashedBlockedPassword,
      role: 'MEMBER',
      staffRole: 'NONE',
      status: 'BLOCKED',
      createdBy: admin1.id,
      branchId: branch2.id,
    },
  });

  // Create Membership Plans
  const goldPlan = await prisma.membershipPlan.upsert({
    where: { id: 1 },
    update: {},
    create: {
      planName: 'Gold',
      basePrice: 999,
      billingCycle: 'Yearly',
      status: 'Active',
      descriptions: ['Premium gym membership plan', 'Complete access to all facilities', 'Personal training sessions included'],
      creatorId: superAdmin.id
    },
  });

  const basicPlan = await prisma.membershipPlan.upsert({
    where: { id: 2 },
    update: {},
    create: {
      planName: 'Basic',
      basePrice: 499,
      billingCycle: 'Monthly',
      status: 'Active',
      descriptions: ['Essential gym membership', 'Access to basic facilities', 'Group classes included'],
      creatorId: superAdmin.id
    },
  });

  // Assign membership plans to members
  await prisma.user.update({
    where: { id: member1.id },
    data: {
      planId: goldPlan.id,
      planStartAt: new Date(),
      planExpireAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
      membershipStatus: 'ACTIVE',
    },
  });

  await prisma.user.update({
    where: { id: member2.id },
    data: {
      planId: basicPlan.id,
      planStartAt: new Date(),
      planExpireAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 1 month
      membershipStatus: 'ACTIVE',
    },
  });

  await prisma.user.update({
    where: { id: member3.id },
    data: {
      planId: goldPlan.id,
      planStartAt: new Date(),
      planExpireAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      membershipStatus: 'ACTIVE',
    },
  });

  // Create Trainers
  const trainer1 = await prisma.trainer.upsert({
    where: { id: 1 },
    update: {},
    create: {
      name: 'Alex Johnson',
      branchId: branch1.id,
    },
  });

  const trainer2 = await prisma.trainer.upsert({
    where: { id: 2 },
    update: {},
    create: {
      name: 'Maria Garcia',
      branchId: branch2.id,
    },
  });

  // Create Classes
  const class1 = await prisma.class.upsert({
    where: { id: 1 },
    update: {},
    create: {
      className: 'Yoga Class',
      trainerName: trainer1.name,
      date: new Date(),
      time: '10:00 AM',
      scheduleDay: 'Monday',
      status: 'ACTIVE',
      adminId: admin1.id,
      branchId: branch1.id,
    },
  });

  const class2 = await prisma.class.upsert({
    where: { id: 2 },
    update: {},
    create: {
      className: 'HIIT Workout',
      trainerName: trainer2.name,
      date: new Date(Date.now() + 24 * 60 * 60 * 1000), // tomorrow
      time: '6:00 PM',
      scheduleDay: 'Tuesday',
      status: 'ACTIVE',
      adminId: admin1.id,
      branchId: branch2.id,
    },
  });

  // Create GymPlans
  const gymPlan1 = await prisma.gymPlan.upsert({
    where: { id: 1 },
    update: {},
    create: {
      adminId: admin1.id,
      branchId: branch1.id,
      name: 'Group Fitness Plan',
      type: 'GROUP',
      sessions: 10,
      validity: 30,
      price: 2000,
      active: true,
    },
  });

  const gymPlan2 = await prisma.gymPlan.upsert({
    where: { id: 2 },
    update: {},
    create: {
      adminId: admin1.id,
      branchId: branch1.id,
      name: 'Personal Training',
      type: 'PERSONAL',
      sessions: 20,
      validity: 60,
      price: 5000,
      active: true,
    },
  });

  // Create BookingRequests
  const booking1 = await prisma.bookingRequest.upsert({
    where: { id: 1 },
    update: {},
    create: {
      memberId: member1.id,
      planId: gymPlan1.id,
      status: 'APPROVED',
      sessionsUsed: 5,
    },
  });

  const booking2 = await prisma.bookingRequest.upsert({
    where: { id: 2 },
    update: {},
    create: {
      memberId: member2.id,
      planId: gymPlan2.id,
      status: 'PENDING',
      sessionsUsed: 0,
    },
  });

  // Create CheckIns
  const checkIn1 = await prisma.checkIn.upsert({
    where: { id: 1 },
    update: {},
    create: {
      userId: member1.id,
      branchId: branch1.id,
      checkInTime: new Date(),
      sessionType: 'GYM',
      duration: 120,
    },
  });

  const checkIn2 = await prisma.checkIn.upsert({
    where: { id: 2 },
    update: {},
    create: {
      userId: member2.id,
      branchId: branch1.id,
      checkInTime: new Date(Date.now() - 60 * 60 * 1000), // 1 hour ago
      checkOutTime: new Date(),
      sessionType: 'CLASS',
      duration: 60,
    },
  });

  // Create Payments
  const payment1 = await prisma.payment.upsert({
    where: { id: 1 },
    update: {},
    create: {
      userId: member1.id,
      branchId: branch1.id,
      amount: 999,
      paymentType: 'MEMBERSHIP',
      status: 'COMPLETED',
      gateway: 'RAZORPAY',
      paidAt: new Date(),
    },
  });

  const payment2 = await prisma.payment.upsert({
    where: { id: 2 },
    update: {},
    create: {
      userId: member2.id,
      branchId: branch1.id,
      amount: 5000,
      paymentType: 'PT',
      status: 'COMPLETED',
      gateway: 'STRIPE',
      paidAt: new Date(),
    },
  });

  // Create Alerts
  const alert1 = await prisma.alert.upsert({
    where: { id: 1 },
    update: {},
    create: {
      type: 'WARNING',
      priority: 'HIGH',
      title: 'Membership Expiring',
      description: 'Your membership is expiring soon.',
      userId: member1.id,
      branchId: branch1.id,
      isRead: false,
    },
  });

  const alert2 = await prisma.alert.upsert({
    where: { id: 2 },
    update: {},
    create: {
      type: 'SUCCESS',
      priority: 'MEDIUM',
      title: 'Payment Received',
      description: 'Payment for membership has been received.',
      userId: member2.id,
      branchId: branch1.id,
      isRead: true,
    },
  });

  // Create DailyRevenue
  const revenue1 = await prisma.dailyRevenue.upsert({
    where: { date_branchId: { date: new Date(), branchId: branch1.id } },
    update: {},
    create: {
      date: new Date(),
      revenue: 15000,
      target: 20000,
      branchId: branch1.id,
      membershipRevenue: 10000,
      ptRevenue: 5000,
    },
  });

  // Create KPISnapshot
  const kpi1 = await prisma.kPISnapshot.upsert({
    where: { date_period_branchId: { date: new Date(), period: 'DAILY', branchId: branch1.id } },
    update: {},
    create: {
      date: new Date(),
      period: 'DAILY',
      totalRevenue: 15000,
      newMembers: 5,
      activeMembers: 50,
      totalCheckIns: 30,
      ptRevenue: 5000,
      overdueAmount: 1000,
      revenueGrowth: 10.5,
      newMembersGrowth: 20,
      activeMembersGrowth: 5,
      checkInsGrowth: 15,
      ptRevenueGrowth: 25,
      overdueGrowth: -5,
      branchId: branch1.id,
    },
  });

  // Create AccountSettings for admins
  const accountSettings1 = await prisma.accountSettings.upsert({
    where: { userId: admin1.id },
    update: {},
    create: {
      adminName: 'Admin One',
      email: 'admin1@example.com',
      phone: '+91 98765 43210',
      timezone: 'Asia/Kolkata',
      language: 'en',
      dateFormat: 'DD/MM/YYYY',
      userId: admin1.id,
    },
  });

  // Create GstSettings
  const gstSettings1 = await prisma.gstSettings.upsert({
    where: { userId: admin1.id },
    update: {},
    create: {
      gstNumber: '22AAAAA0000A1Z5',
      gstPercentage: 18,
      isGstEnabled: true,
      businessName: 'Downtown Gym Pvt Ltd',
      businessAddress: '123 Main St, Downtown',
      userId: admin1.id,
    },
  });

  // Create PaymentSettings
  const paymentSettings1 = await prisma.paymentSettings.upsert({
    where: { userId: admin1.id },
    update: {},
    create: {
      razorpayKeyId: 'rzp_test_key',
      razorpaySecret: 'rzp_test_secret',
      defaultGateway: 'RAZORPAY',
      isTestMode: true,
      currency: 'INR',
      userId: admin1.id,
    },
  });

  // Create AdminActivity
  const activity1 = await prisma.adminActivity.upsert({
    where: { id: 1 },
    update: {},
    create: {
      adminId: admin1.id,
      action: 'CREATED_BRANCH',
      description: 'Created new branch Downtown Gym',
      ipAddress: '192.168.1.1',
      userAgent: 'Mozilla/5.0',
    },
  });

  // Create SystemSettings
  const systemSetting1 = await prisma.systemSettings.upsert({
    where: { key: 'maintenance_mode' },
    update: {},
    create: {
      key: 'maintenance_mode',
      value: 'false',
      description: 'Enable maintenance mode',
      category: 'system',
    },
  });

  const systemSetting2 = await prisma.systemSettings.upsert({
    where: { key: 'default_timezone' },
    update: {},
    create: {
      key: 'default_timezone',
      value: 'Asia/Kolkata',
      description: 'Default timezone for the system',
      category: 'general',
    },
  });

  // Create Plan Requests
  const request1 = await prisma.planRequest.upsert({
    where: { id: 1 },
    update: {},
    create: {
      visitorName: 'kiaaa teach',
      email: 'pankit1205@gmail.com',
      phone: '+91-9876543210',
      gymName: 'FitZone Academy',
      address: '123 Fitness Street, Mumbai',
      status: 'PENDING',
      planId: goldPlan.id
    },
  });

  const request2 = await prisma.planRequest.upsert({
    where: { id: 2 },
    update: {},
    create: {
      visitorName: 'Kiaan',
      email: 'Kiaan@gmail.com',
      phone: '+91-9876543211',
      gymName: 'Power Gym',
      address: '456 Strength Ave, Delhi',
      status: 'PENDING',
      planId: goldPlan.id
    },
  });

  const request3 = await prisma.planRequest.upsert({
    where: { id: 3 },
    update: {},
    create: {
      visitorName: 'ram',
      email: 'ram@gmail.com',
      phone: '+91-9876543212',
      gymName: 'Ram Fitness Center',
      address: '789 Health Road, Bangalore',
      status: 'PENDING',
      planId: basicPlan.id
    },
  });

  const request4 = await prisma.planRequest.upsert({
    where: { id: 4 },
    update: {},
    create: {
      visitorName: 'ABC Technologies Pvt Ltd',
      email: 'contact@abctech.com',
      phone: '+91-9876543213',
      gymName: 'ABC Fitness Hub',
      address: '101 Tech Park, Hyderabad',
      status: 'PENDING',
      planId: basicPlan.id
    },
  });

  console.log('Seeded data:', {
    superAdmin: superAdmin.email,
    admins: [admin1.email, admin2.email],
    branches: [branch1.name, branch2.name, branch3.name],
    staff: [staff1.email, staff2.email, staff3.email, staff4.email],
    members: [member1.email, member2.email, member3.email, member4.email, member5.email, member6.email],
    inactiveUser: inactiveUser.email,
    blockedUser: blockedUser.email,
    plans: [goldPlan.planName, basicPlan.planName],
    trainers: [trainer1.name, trainer2.name],
    classes: [class1.className, class2.className],
    gymPlans: [gymPlan1.name, gymPlan2.name],
    bookingRequests: [booking1.status, booking2.status],
    checkIns: [checkIn1.sessionType, checkIn2.sessionType],
    payments: [payment1.paymentType, payment2.paymentType],
    alerts: [alert1.title, alert2.title],
    dailyRevenue: revenue1.revenue,
    kpiSnapshot: kpi1.totalRevenue,
    accountSettings: accountSettings1.adminName,
    gstSettings: gstSettings1.gstNumber,
    paymentSettings: paymentSettings1.defaultGateway,
    adminActivity: activity1.action,
    systemSettings: [systemSetting1.key, systemSetting2.key],
    planRequests: [request1.visitorName, request2.visitorName, request3.visitorName, request4.visitorName],
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
