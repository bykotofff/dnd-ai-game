// backend/src/modules/auth/auth.module.ts
import { authRouter } from './auth.router'
import { AuthService } from './auth.service'
import { AuthController } from './auth.controller'
import { authMiddleware } from './auth.middleware'

/**
 * Auth Module - централизованная точка доступа к функциональности аутентификации
 */
export class AuthModule {
    public static router = authRouter
    public static service = new AuthService()
    public static controller = new AuthController()
    public static middleware = authMiddleware

    /**
     * Инициализация модуля
     */
    public static async initialize(): Promise<void> {
        try {
            console.log('🔐 Auth module initialized successfully')
        } catch (error) {
            console.error('❌ Failed to initialize Auth module:', error)
            throw error
        }
    }

    /**
     * Получение экземпляра сервиса
     */
    public static getService(): AuthService {
        return this.service
    }

    /**
     * Получение middleware для использования в других модулях
     */
    public static getMiddleware() {
        return this.middleware
    }
}

// Экспорты для удобного импорта
export { AuthService } from './auth.service'
export { AuthController } from './auth.controller'
export { authMiddleware } from './auth.middleware'
export { authRouter } from './auth.router'
export * from './auth.types'