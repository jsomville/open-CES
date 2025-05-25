import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient();

import { getUserByEmail } from '../controller/userController.js';


export const deleteUserAndAccount = async (email) =>{
  const user = await getUserByEmail(email);
  if (user) {
    //Delete User's Account
    await prisma.account.deleteMany({
      where : { 
        userId : user.id
      }
    });

    //Delete User
    await prisma.user.delete({
      where : { id : user.id}
    });
  }
}