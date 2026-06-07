import { prisma } from '../utils/prisma.ts';

export const getUserList = async () => {
  const users = await prisma.user.findMany();

  // Remove password hash
  const safeUsers = users.map(({ passwordHash, ...user }) => user);

  return safeUsers;
}

export const createUser = async (email:string, phone:string, passwordHash:string, role:string, firstname:string , lastname:string) => {
  //Create User
  const user = await prisma.user.create({
    data: {
      email: email,
      firstname: firstname,
      lastname: lastname,
      phone: phone,
      passwordHash: passwordHash,
      role: role,
    }
  })

  // Remove password hash
  const { passwordHash: _, ...safeUser } = user;

  return safeUser;
}

export const updateUser = async (id: number, data: any) => {
  const updatedUser = await prisma.user.update({
    data,
    where: { id: id }
  });

  // Remove password hash
  const { passwordHash, ...safeUser } = updatedUser;

  return safeUser;
}

export const deleteUser = async (id: number) => {
  await prisma.user.delete({
    where: { id: id }
  });
}

export const getLoginUserByEmail = async (email: string) => {
  const user = await prisma.user.findUnique({ where: { email: email } });
  if (user) {
    return user;
  }
  return null;
};

export const getUserById = async (id: number) => {
  const user = await prisma.user.findUnique({ where: { id: id } });
  if (user) {
    // Remove password hash
    const { passwordHash, ...safeUser } = user;
    return safeUser;
  }
  return null;
};

export const getUserByEmail = async (email: string) => {
  const user = await prisma.user.findUnique({ where: { email: email } });
  if (user) {
    // Remove password hash
    const { passwordHash, ...safeUser } = user;
    return safeUser;
  }
  return null;
};

export const getUserByPhone = async (phone: string) => {
  const user = await prisma.user.findUnique({ where: { phone: phone } });
  if (user) {
    // Remove password hash
    const { passwordHash, ...safeUser } = user;
    return safeUser;
  }
  return null;
};

export const setActiveUserById = async (id: number) => {
  await prisma.user.update({
    data: {
      isActive: true
    },
    where: { id: id }
  });
}

export const setUserAdminById = async (id: number) => {
  await prisma.user.update({
    data: {
      role: "admin",
    },
    where: { id: id }
  });
}

export const updateLastLogin = async (id: number) => {
  await prisma.user.update({
    data: {
      lastLoginAt: new Date()
    },
    where: { id: id }
  });
}

export const setEmailVerifiedAtByEmail = async (email: string) => {
  await prisma.user.update({
    data: {
      emailVerifiedAt: new Date()
    },
    where: { email: email }
  });
}

export const setPhoneVerifiedAtByEmail = async (email: string) => {
  await prisma.user.update({
    data: {
      phoneVerifiedAt: new Date()
    },
    where: { email: email }
  });
}
export const setUserStatusByEmail = async (email: string, status: string) => {
  await prisma.user.update({
    data: {
      status: status
    },
    where: { email: email }
  });
}