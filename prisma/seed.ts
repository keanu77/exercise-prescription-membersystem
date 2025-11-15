import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  // 加密密碼
  const hashedPassword = await bcrypt.hash('admin123', 10);

  // 建立預設管理員帳號
  const admin = await prisma.admin.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      username: 'admin',
      password: hashedPassword,
    },
  });

  console.log('✅ 預設管理員帳號已建立:');
  console.log('   帳號: admin');
  console.log('   密碼: admin123');
  console.log('');

  // 建立幾筆測試會員資料
  const member1 = await prisma.member.upsert({
    where: { phone: '0912345678' },
    update: {},
    create: {
      memberId: 'M00001',
      name: '王小明',
      phone: '0912345678',
      email: 'wang@example.com',
      birthday: new Date('1990-01-15'),
      note: '測試會員資料1',
      isActive: true,
    },
  });

  const member2 = await prisma.member.upsert({
    where: { phone: '0987654321' },
    update: {},
    create: {
      memberId: 'M00002',
      name: '李小華',
      phone: '0987654321',
      email: 'lee@example.com',
      birthday: new Date('1985-05-20'),
      note: '測試會員資料2',
      isActive: true,
    },
  });

  const member3 = await prisma.member.upsert({
    where: { phone: '0923456789' },
    update: {},
    create: {
      memberId: 'M00003',
      name: '張三',
      phone: '0923456789',
      birthday: new Date('1995-12-10'),
      isActive: true,
    },
  });

  console.log('✅ 測試會員資料已建立:');
  console.log(`   ${member1.memberId} - ${member1.name}`);
  console.log(`   ${member2.memberId} - ${member2.name}`);
  console.log(`   ${member3.memberId} - ${member3.name}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
