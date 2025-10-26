import { PrismaClient } from '@prisma/client'
import argon2 from 'argon2';

const prisma = new PrismaClient()

export const addUserRegistration = async (email, phone, password, firstname, lastname, region, code, symbol) => {
  
    const hashedPassword = await argon2.hash(password);

    const userRegistration = await prisma.userRegistration.create({
    data: {
      email: email,
      firstname: firstname,
      lastname: lastname,
      phone: phone,
      region: region,
      passwordHash: hashedPassword,
      code: code,
      symbol: symbol,
    }
  })

  return userRegistration;
}

export const getUserRegistrationByEmail = async (email) => {
  const userRegistration = await prisma.userRegistration.findUnique({ where: { email: email } });
  return userRegistration;
}

export const getUserRegistrationByCode = async (code) => {
  const userRegistration = await prisma.userRegistration.findUnique({ where: { code: code } });
  return userRegistration;
}

export const deleteUserRegistrationById = async (id) => {
  await prisma.userRegistration.delete({ where: { id: id } });
}

export const deleteUserRegistrationByEmail = async (email) => {
  await prisma.userRegistration.delete({ where: { email: email } });
}