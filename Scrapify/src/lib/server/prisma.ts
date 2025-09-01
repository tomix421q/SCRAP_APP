import { PrismaClient } from '@prisma/client';

// Deklarácia globálneho typu pre Prisma, aby TypeScript vedel, že takáto premenná existuje.
declare global {
	// Declare global
	var prisma: PrismaClient | undefined;
}

// check if is created
const prismaClient = globalThis.prisma || new PrismaClient();

if (process.env.NODE_ENV !== 'production') {
	// save global this
	globalThis.prisma = prismaClient;
}

export default prismaClient;
