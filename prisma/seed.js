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
      adminId: admin1.id,
    },
  });

  const branch2 = await prisma.branch.upsert({
    where: { id: 2 },
    update: {},
    create: {
      name: 'Uptown Fitness',
      address: '456 Oak Ave, Uptown',
      adminId: admin1.id,
    },
  });

  const branch3 = await prisma.branch.upsert({
    where: { id: 3 },
    update: {},
    create: {
      name: 'Suburb Wellness',
      address: '789 Pine Rd, Suburb',
      adminId: admin2.id,
    },
  });

  // Create STAFF users (created by Admins, assigned to branches)
  const staff1 = await prisma.user.upsert({
    where: { email: 'trainer1@example.com' },
    update: {},
    create: {
      name: 'John Trainer',
      email: 'trainer1@example.com',
      password: hashedStaffPasswords[0],
      role: 'STAFF',
      staffRole: 'GENERAL_TRAINER',
      status: 'ACTIVE',
      createdBy: admin1.id,
      branchId: branch1.id,
    },
  });

  const staff2 = await prisma.user.upsert({
    where: { email: 'trainer2@example.com' },
    update: {},
    create: {
      name: 'Jane PT',
      email: 'trainer2@example.com',
      password: hashedStaffPasswords[1],
      role: 'STAFF',
      staffRole: 'PERSONAL_TRAINER',
      status: 'ACTIVE',
      createdBy: admin1.id,
      branchId: branch1.id,
    },
  });

  const staff3 = await prisma.user.upsert({
    where: { email: 'housekeeper@example.com' },
    update: {},
    create: {
      name: 'Bob Housekeeper',
      email: 'housekeeper@example.com',
      password: hashedStaffPasswords[2],
      role: 'STAFF',
      staffRole: 'HOUSEKEEPING',
      status: 'ACTIVE',
      createdBy: admin1.id,
      branchId: branch2.id,
    },
  });

  const staff4 = await prisma.user.upsert({
    where: { email: 'receptionist@example.com' },
    update: {},
    create: {
      name: 'Alice Receptionist',
      email: 'receptionist@example.com',
      password: hashedStaffPasswords[3],
      role: 'STAFF',
      staffRole: 'RECEPTIONIST',
      status: 'ACTIVE',
      createdBy: admin2.id,
      branchId: branch3.id,
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

  console.log('Seeded data:', {
    superAdmin: superAdmin.email,
    admins: [admin1.email, admin2.email],
    branches: [branch1.name, branch2.name, branch3.name],
    staff: [staff1.email, staff2.email, staff3.email, staff4.email],
    members: [member1.email, member2.email, member3.email, member4.email, member5.email, member6.email],
    inactiveUser: inactiveUser.email,
    blockedUser: blockedUser.email,
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
