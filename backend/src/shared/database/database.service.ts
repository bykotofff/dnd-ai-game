// backend/src/shared/database/database.service.ts
import { PrismaClient } from '@prisma/client'

export class DatabaseService {
    private static instance: DatabaseService
    public prisma: PrismaClient

    constructor() {
        this.prisma = new PrismaClient({
            log: process.env.NODE_ENV === 'development' ? ['query', 'info', 'warn', 'error'] : ['error']
        })
    }

    public static getInstance(): DatabaseService {
        if (!DatabaseService.instance) {
            DatabaseService.instance = new DatabaseService()
        }
        return DatabaseService.instance
    }

    public async connect(): Promise<void> {
        try {
            await this.prisma.$connect()
            console.log('Database connection established')
        } catch (error) {
            console.error('Database connection failed:', error)
            throw error
        }
    }

    public async disconnect(): Promise<void> {
        try {
            await this.prisma.$disconnect()
            console.log('Database connection closed')
        } catch (error) {
            console.error('Error closing database connection:', error)
            throw error
        }
    }

    public async healthCheck(): Promise<{ status: string; latency: number }> {
        const start = Date.now()
        try {
            await this.prisma.$queryRaw`SELECT 1`
            const latency = Date.now() - start
            return { status: 'healthy', latency }
        } catch (error) {
            console.error('Database health check failed:', error)
            return { status: 'unhealthy', latency: 0 }
        }
    }
}

// Экспорт единственного экземпляра
export const db = DatabaseService.getInstance().prisma