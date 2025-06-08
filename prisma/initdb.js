import { PrismaClient } from '@prisma/client'
import argon2 from 'argon2';

const prisma = new PrismaClient();

async function init() {

    const password = "OpenCES2025!";
    const email = "admin@opences.org"

    const userPwdHash = await argon2.hash(password);
    await prisma.user.create({
        data: {
            firstname: "default",
            lastname: "admin",
            email: email,
            phone: "+32488040204",
            region: "EU",
            passwordHash: userPwdHash,
            role: "admin",
            isActive: true,
        }
    });

}

// Make it callable directly from command line
if (import.meta.url === `file://${process.argv[1]}`) {
    console.log("init is running")
    init();
}