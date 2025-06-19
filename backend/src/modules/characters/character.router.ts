// backend/src/modules/characters/character.router.ts
import { Router } from 'express'
import { CharacterController } from './character.controller'
import { authMiddleware } from '@modules/auth/auth.middleware'

export class CharacterRouter {
    public router: Router
    private characterController: CharacterController

    constructor() {
        this.router = Router()
        this.characterController = new CharacterController()
        this.initializeRoutes()
    }

    private initializeRoutes(): void {
        // Все маршруты требуют аутентификации
        this.router.use(authMiddleware.authenticate)

        /**
         * Информационные маршруты (не требуют персонажа)
         */

        // Получение доступных рас
        this.router.get('/races', this.characterController.getRaces)

        // Получение доступных классов
        this.router.get('/classes', this.characterController.getClasses)

        // Генерация случайных характеристик
        this.router.get('/generate-stats', this.characterController.generateRandomStats)

        // Генерация предыстории
        this.router.post('/generate-backstory', this.characterController.generateBackstory)

        // Генерация мотивации
        this.router.post('/generate-motivation', this.characterController.generateMotivation)

        /**
         * Основные маршруты персонажей
         */

        // Создание персонажа
        this.router.post('/',
            authMiddleware.rateLimit(5, 60 * 60 * 1000), // 5 персонажей в час
            this.characterController.createCharacter
        )

        // Получение всех персонажей пользователя
        this.router.get('/', this.characterController.getUserCharacters)

        // Получение конкретного персонажа
        this.router.get('/:id', this.characterController.getCharacter)

        // Обновление персонажа
        this.router.put('/:id', this.characterController.updateCharacter)

        // Удаление персонажа
        this.router.delete('/:id',
            authMiddleware.rateLimit(3, 60 * 60 * 1000), // 3 удаления в час
            this.characterController.deleteCharacter
        )

        /**
         * Игровые механики
         */

        // Добавление опыта
        this.router.post('/:id/experience', this.characterController.addExperience)

        // Управление здоровьем
        this.router.post('/:id/health', this.characterController.updateHealth)

        // Получение статистики персонажа
        this.router.get('/:id/stats', this.characterController.getCharacterStats)

        /**
         * Управление экипировкой
         */

        // Добавление экипировки
        this.router.post('/:id/equipment', this.characterController.addEquipment)

        // Удаление экипировки
        this.router.delete('/:id/equipment/:equipmentId', this.characterController.removeEquipment)

        // Надевание/снятие экипировки
        this.router.post('/:id/equipment/:equipmentId/toggle', this.characterController.toggleEquipment)

        /**
         * Будущие маршруты для расширения функциональности
         */

        // TODO: Управление заклинаниями
        // this.router.get('/:id/spells', this.characterController.getSpells)
        // this.router.post('/:id/spells', this.characterController.addSpell)
        // this.router.delete('/:id/spells/:spellId', this.characterController.removeSpell)
        // this.router.post('/:id/spells/:spellId/cast', this.characterController.castSpell)

        // TODO: Управление способностями
        // this.router.get('/:id/features', this.characterController.getFeatures)
        // this.router.post('/:id/features/:featureId/use', this.characterController.useFeature)

        // TODO: Долгий и короткий отдых
        // this.router.post('/:id/rest/short', this.characterController.shortRest)
        // this.router.post('/:id/rest/long', this.characterController.longRest)

        // TODO: Управление состояниями
        // this.router.get('/:id/conditions', this.characterController.getConditions)
        // this.router.post('/:id/conditions', this.characterController.addCondition)
        // this.router.delete('/:id/conditions/:conditionId', this.characterController.removeCondition)

        // TODO: Экспорт/импорт персонажа
        // this.router.get('/:id/export', this.characterController.exportCharacter)
        // this.router.post('/import', this.characterController.importCharacter)
    }
}

export const characterRouter = new CharacterRouter().router