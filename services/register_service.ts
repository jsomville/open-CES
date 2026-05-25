import { prisma } from '../utils/prisma.ts';
import argon2 from 'argon2';

export const addUserRegistration = async (email: string, phone: string, password: string, firstname: string, lastname: string, region: string, code: string, symbol: string) => {
  
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

export const getUserRegistrationByEmail = async (email: string) => {
  const userRegistration = await prisma.userRegistration.findUnique({ where: { email: email } });
  return userRegistration;
}

export const getUserRegistrationByCode = async (code: string) => {
  const userRegistration = await prisma.userRegistration.findUnique({ where: { code: code } });
  return userRegistration;
}

export const deleteUserRegistrationById = async (id: number) => {
  await prisma.userRegistration.delete({ where: { id: id } });
}

export const deleteUserRegistrationByEmail = async (email: string) => {
  await prisma.userRegistration.delete({ where: { email: email } });
}

export const validateRegistration = async () => {

  
}

