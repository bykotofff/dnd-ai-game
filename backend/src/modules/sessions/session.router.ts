// backend/src/modules/sessions/session.router.ts
import { Router } from 'express'
import { SessionController } from './session.controller'
import { authMiddleware } from '@modules/auth/auth.middleware'

export class SessionRouter {
    public router: Router
    private sessionController: SessionController

    constructor() {
        this.router = Router()
        this.sessionController = new SessionController()
        this.initializeRoutes()
    }

    private initializeRoutes(): void {
        // Все маршруты требуют аутентификации
        this.router.use(authMiddleware.authenticate)

        /**
         * Информационные маршруты
         */

        // Получение шаблонов сессий
        this.router.get('/templates', this.sessionController.getSessionTemplates)

        // Получение активных сессий пользователя
        this.router.get('/my', this.sessionController.getUserActiveSessions)

        /**
         * Основные маршруты сессий
         */

        // Создание сессии
        this.router.post('/',
            authMiddleware.rateLimit(10, 60 * 60 * 1000), // 10 сессий в час
            this.sessionController.createSession
        )

        // Получение списка доступных сессий
        this.router.get('/', this.sessionController.getAvailableSessions)

        // Получение детальной информации о сессии
        this.router.get('/:id', this.sessionController.getSessionDetails)

        // Обновление сессии
        this.router.put('/:id', this.sessionController.updateSession)

        // Удаление сессии
        this.router.delete('/:id',
            authMiddleware.rateLimit(5, 60 * 60 * 1000), // 5 удалений в час
            this.sessionController.deleteSession
        )

        /**
         * Управление участниками
         */

        // Присоединение к сессии
        this.router.post('/:id/join', this.sessionController.joinSession)

        // Покидание сессии
        this.router.post('/:id/leave', this.sessionController.leaveSession)

        // Проверка прав мастера игры
        this.router.get('/:id/check-gm', this.sessionController.checkGameMasterRights)

        /**
         * Игровые механики
         */

        // Получение состояния сессии
        this.router.get('/:id/state', this.sessionController.getSessionState)

        // Изменение сцены
        this.router.post('/:id/scene', this.sessionController.changeScene)

        // Обновление активности
        this.router.post('/:id/activity', this.sessionController.updateActivity)

        /**
         * Лог действий
         */

        // Получение лога действий
        this.router.get('/:id/actions', this.sessionController.getActionLog)

        // Добавление действия
        this.router.post('/:id/actions',
            authMiddleware.rateLimit(100, 60 * 1000), // 100 действий в минуту
            this.sessionController.logAction
        )

        /**
         * Боевая система
         */

        // Установка инициативы
        this.router.post('/:id/initiative', this.sessionController.setInitiative)

        // Автоматический бросок инициативы
        this.router.post('/:id/initiative/roll', this.sessionController.rollInitiativeForAll)

        // Следующий ход в бою
        this.router.post('/:id/combat/next-turn', this.sessionController.nextTurn)

        // Завершение боя
        this.router.post('/:id/combat/end', this.sessionController.endCombat)

        /**
         * ИИ интеграция
         */

        // Получение контекста для ИИ мастера
        this.router.get('/:id/ai-context', this.sessionController.getAIContext)

        /**
         * Статистика и аналитика
         */

        // Получение статистики сессии
        this.router.get('/:id/stats', this.sessionController.getSessionStats)

        /**
         * Будущие возможности для расширения
         */

        // TODO: Управление NPC
        // this.router.get('/:id/npcs', this.sessionController.getNPCs)
        // this.router.post('/:id/npcs', this.sessionController.createNPC)
        // this.router.put('/:id/npcs/:npcId', this.sessionController.updateNPC)
        // this.router.delete('/:id/npcs/:npcId', this.sessionController.deleteNPC)

        // TODO: Управление локациями
        // this.router.get('/:id/locations', this.sessionController.getLocations)
        // this.router.post('/:id/locations', this.sessionController.createLocation)
        // this.router.put('/:id/locations/:locationId', this.sessionController.updateLocation)

        // TODO: Сохранения и загрузка состояний
        // this.router.post('/:id/save', this.sessionController.saveState)
        // this.router.post('/:id/load', this.sessionController.loadState)
        // this.router.get('/:id/saves', this.sessionController.getSaves)

        // TODO: Экспорт данных сессии
        // this.router.get('/:id/export', this.sessionController.exportSession)

        // TODO: Приглашения игроков
        // this.router.post('/:id/invite', this.sessionController.invitePlayer)
        // this.router.get('/invites', this.sessionController.getInvites)
        // this.router.post('/invites/:inviteId/accept', this.sessionController.acceptInvite)
        // this.router.post('/invites/:inviteId/decline', this.sessionController.declineInvite)

        // TODO: Права доступа
        // this.router.post('/:id/permissions', this.sessionController.updatePermissions)
        // this.router.post('/:id/transfer-gm', this.sessionController.transferGameMaster)

        // TODO: Интеграция с календарем
        // this.router.post('/:id/schedule', this.sessionController.scheduleSession)
        // this.router.get('/:id/schedule', this.sessionController.getSchedule)
    }
}

export const sessionRouter = new SessionRouter().router