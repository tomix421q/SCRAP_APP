import 'dotenv/config';
import { PrismaClient } from '../../../prisma/generated/client/client';
import { PrismaMssql } from '@prisma/adapter-mssql';

declare global {
	var prisma: PrismaClient | undefined;
}

const createPrismaClientWithAdapter = () => {
	const sqlConfig = {
		user: process.env.DB_USER,
		password: process.env.DB_PASSWORD,
		database: process.env.DB_NAME,
		server: process.env.DB_HOST!, // Dôležité: Uistite sa, že HOST je vždy definovaný
		port: Number(process.env.DB_PORT) || 1433,
		pool: {
			max: 10,
			min: 0,
			idleTimeoutMillis: 30000
		},
		options: {
			encrypt: true, // true pre Azure, false pre lokálne (ak nemáš certifikát)
			trustServerCertificate: true // true pre lokálne (ak nemáš certifikát)
		}
	};
	console.log(sqlConfig);

	const adapter = new PrismaMssql(sqlConfig);
	return new PrismaClient({ adapter });
};

const prisma = globalThis.prisma ?? createPrismaClientWithAdapter();

if (process.env.NODE_ENV !== 'production') {
	globalThis.prisma = prisma;
}

export default prisma;
