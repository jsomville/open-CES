import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient();

export const getUserList = async () => {
  const users = await prisma.user.findMany();

  // Remove password hash
  const safeUsers = users.map(({ passwordHash, ...user }) => user);

  return safeUsers;
}

export const createUser = async (email, phone, hashedPassword, role, firstname , lastname) => {
  //Create User
  const user = await prisma.user.create({
    data: {
      email: email,
      firstname: firstname,
      lastname: lastname,
      phone: phone,
      passwordHash: hashedPassword,
      role: role,
    }
  })

  // Remove password hash
  const { passwordHash, ...safeUser } = user;

  return safeUser;
}

export const updateUser = async (id, data) => {
  const updatedUser = await prisma.user.update({
    data,
    where: { id: id }
  });

  // Remove password hash
  const { passwordHash, ...safeUser } = updatedUser;

  return safeUser;
}

export const removeUser = async (id) => {
  await prisma.user.delete({
    where: { id: id }
  });
}

export const getLoginUserByEmail = async (email) => {
  const user = await prisma.user.findUnique({ where: { email: email } });
  if (user) {
    return user;
  }
  return null;
};

export const getUserById = async (id) => {
  const user = await prisma.user.findUnique({ where: { id: id } });
  if (user) {
    // Remove password hash
    const { passwordHash, ...safeUser } = user;
    return safeUser;
  }
  return null;
};

export const getUserByEmail = async (email) => {
  const user = await prisma.user.findUnique({ where: { email: email } });
  if (user) {
    // Remove password hash
    const { passwordHash, ...safeUser } = user;
    return safeUser;
  }
  return null;
};

export const getUserByPhone = async (phone) => {
  const user = await prisma.user.findUnique({ where: { phone: phone } });
  if (user) {
    // Remove password hash
    const { passwordHash, ...safeUser } = user;
    return safeUser;
  }
  return null;
};

export const setActiveUserById = async (userId) => {
  await prisma.user.update({
    data: {
      isActive: true
    },
    where: { id: userId }
  });
}

export const setUserAdminById = async (id) => {
  await prisma.user.update({
    data: {
      role: "admin",
    },
    where: { id: id }
  });
}

export const updateLastLogin = async (userId) => {
  await prisma.user.update({
    data: {
      lastLoginAt: new Date()
    },
    where: { id: userId }
  });
}