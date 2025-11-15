"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const bcrypt = __importStar(require("bcrypt"));
const prisma = new client_1.PrismaClient();
async function main() {
    const hashedPassword = await bcrypt.hash('admin123', 10);
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
//# sourceMappingURL=seed.js.map