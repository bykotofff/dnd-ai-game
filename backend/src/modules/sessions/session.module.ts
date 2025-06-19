// backend/src/modules/sessions/session.module.ts
import { sessionRouter } from './session.router'
import { SessionService } from './session.service'
import { SessionController } from './session.controller'

/**
 * Session Module - централизованная точка доступа к функциональности игровых сессий
 */
export class SessionModule {
    public static router = sessionRouter
    public static service = new SessionService()
    public static controller = new SessionController()

    /**
     * Инициализация модуля
     */
    public static async initialize(): Promise<void> {
        try {
            // Здесь можно добавить инициализацию кэша, предзагрузку данных и т.д.
            console.log('🎲 Session module initialized successfully')
        } catch (error) {
            console.error('❌ Failed to initialize Session module:', error)
            throw error
        }
    }

    /**
     * Получение экземпляра сервиса
     */
    public static getService(): SessionService {
        return this.service
    }

    /**
     * Очистка неактивных сессий (можно запускать по расписанию)
     */
    public static async cleanupInactiveSessions(): Promise<void> {
        try {
            // TODO: Реализовать очистку неактивных сессий
            console.log('🧹 Cleaning up inactive sessions...')
        } catch (error) {
            console.error('❌ Failed to cleanup inactive sessions:', error)
        }
    }
}

// Экспорты для удобного импорта
export { SessionService } from './session.service'
export { SessionController } from './session.controller'
export { sessionRouter } from './session.router'
export * from './session.types'