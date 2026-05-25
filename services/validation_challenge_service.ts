import { prisma } from '../utils/prisma.ts';

export const generateCode = async () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export const createValidationChallenge = async (channel: string, email: string, code: string, expiresAt: Date) => {
  const challenge = await prisma.validationChallenge.create({
    data: {
      channel,
      email,
      code,
      expiresAt,
    }
  });

  return challenge;
}

export const getValidationChallengeByEmailAndChannel = async (email: string, channel: string) => {
  const challenge = await prisma.validationChallenge.findFirst({
    where: {
      email,
      channel,
      consumedAt: null,
      expiresAt: {
        gt: new Date(),
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  return challenge;
}

export const consumeValidationChallenge = async (id: number) => {
  await prisma.validationChallenge.update({
    where: { id },
    data: { consumedAt: new Date() },
  });
}

export const incrementValidationChallengeAttemptCount = async (id: number) => {
  await prisma.validationChallenge.update({
    where: { id },
    data: { attemptCount: { increment: 1 } },
  });
}

export const deleteValidationChallengesByEmailAndChannel = async (email: string, channel: string) => {
  await prisma.validationChallenge.deleteMany({
    where: {
      email,
      channel,
    },
  });
}

export const deleteExpiredValidationChallenges = async () => {
  await prisma.validationChallenge.deleteMany({
    where: {
      expiresAt: {
        lt: new Date(),
      },
    },
  });
}

export const validateCode = async (email: string, channel: string, code: string) => {
  const challenge = await getValidationChallengeByEmailAndChannel(email, channel);
  if (!challenge) {
    return false;
  }

  // Verify code
  const isValid = (challenge.code === code );
  if (isValid) {
    await consumeValidationChallenge(challenge.id);
    return true;
  } else {
    await incrementValidationChallengeAttemptCount(challenge.id);
    return false;
  }
}