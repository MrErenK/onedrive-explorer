import { prisma } from "@/lib/prisma";

export const usePrisma = () => {
  return prisma;
};
