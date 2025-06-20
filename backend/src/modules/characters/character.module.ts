// backend/src/modules/characters/character.module.ts
import { characterRouter } from './character.router'
import { CharacterService } from './character.service'
import { CharacterController } from ".//backend/src/modules/characters/character.controller"

/**
 * Character Module - централизованная точка доступа к функциональности персонажей
 */
export class CharacterModule {
    public static router = characterRouter
    public static service = new CharacterService()
    public static controller = new CharacterController()

    /**
     * Инициализация модуля
     */
    public static async initialize(): Promise<void> {
        try {
            // Здесь можно добавить инициализацию кэша, предзагрузку данных и т.д.
            console.log('⚔️ Character module initialized successfully')
        } catch (error) {
            console.error('❌ Failed to initialize Character module:', error)
            throw error
        }
    }

    /**
     * Получение экземпляра сервиса
     */
    public static getService(): CharacterService {
        return this.service
    }
}

// Экспорты для удобного импорта
export { CharacterService } from './character.service'
export { CharacterController } from './character.controller'
export { characterRouter } from './character.router'
export * from './character.types'