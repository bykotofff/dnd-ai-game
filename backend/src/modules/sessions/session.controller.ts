// backend/src/modules/sessions/session.controller.ts
import { Request, Response } from 'express'
import { SessionService } from './session.service'
import {
    CreateSessionSchema,
    UpdateSessionSchema,
    JoinSessionSchema,
    LogActionSchema,
    InitiativeSchema,
    SceneChangeSchema,
    SessionError
} from './session.types'

export class SessionController {
    private sessionService: SessionService

    constructor() {
        this.sessionService = new SessionService()
    }

    /**
     * Создание новой игровой сессии
     * POST /api/sessions
     */
    createSession = async (req: Request, res: Response): Promise<void> => {
        try {
            const userId = req.user!.userId
            const validatedData = CreateSessionSchema.parse(req.body)

            const session = await this.sessionService.createSession(userId, validatedData)

            res.status(201).json({
                success: true,
                message: 'Игровая сессия успешно создана',
                data: session
            })
        } catch (error) {
            this.handleError(error, res)
        }
    }

    /**
     * Получение списка доступных сессий
     * GET /api/sessions
     */
    getAvailableSessions = async (req: Request, res: Response): Promise<void> => {
        try {
            const userId = req.user!.userId

            const sessions = await this.sessionService.getAvailableSessions(userId)

            res.status(200).json({
                success: true,
                data: sessions
            })
        } catch (error) {
            this.handleError(error, res)
        }
    }

    /**
     * Получение активных сессий пользователя
     * GET /api/sessions/my
     */
    getUserActiveSessions = async (req: Request, res: Response): Promise<void> => {
        try {
            const userId = req.user!.userId

            const sessions = await this.sessionService.getUserActiveSessions(userId)

            res.status(200).json({
                success: true,
                data: sessions
            })
        } catch (error) {
            this.handleError(error, res)
        }
    }

    /**
     * Получение детальной информации о сессии
     * GET /api/sessions/:id
     */
    getSessionDetails = async (req: Request, res: Response): Promise<void> => {
        try {
            const userId = req.user!.userId
            const { id } = req.params

            const session = await this.sessionService.getSessionDetails(id, userId)

            res.status(200).json({
                success: true,
                data: session
            })
        } catch (error) {
            this.handleError(error, res)
        }
    }

    /**
     * Обновление сессии
     * PUT /api/sessions/:id
     */
    updateSession = async (req: Request, res: Response): Promise<void> => {
        try {
            const userId = req.user!.userId
            const { id } = req.params
            const validatedData = UpdateSessionSchema.parse(req.body)

            const session = await this.sessionService.updateSession(id, userId, validatedData)

            res.status(200).json({
                success: true,
                message: 'Сессия успешно обновлена',
                data: session
            })
        } catch (error) {
            this.handleError(error, res)
        }
    }

    /**
     * Присоединение к сессии
     * POST /api/sessions/:id/join
     */
    joinSession = async (req: Request, res: Response): Promise<void> => {
        try {
            const userId = req.user!.userId
            const { id } = req.params
            const validatedData = JoinSessionSchema.parse(req.body)

            const session = await this.sessionService.joinSession(id, userId, validatedData)

            res.status(200).json({
                success: true,
                message: 'Успешно присоединились к игровой сессии',
                data: session
            })
        } catch (error) {
            this.handleError(error, res)
        }
    }

    /**
     * Покидание сессии
     * POST /api/sessions/:id/leave
     */
    leaveSession = async (req: Request, res: Response): Promise<void> => {
        try {
            const userId = req.user!.userId
            const { id } = req.params

            await this.sessionService.leaveSession(id, userId)

            res.status(200).json({
                success: true,
                message: 'Вы покинули игровую сессию'
            })
        } catch (error) {
            this.handleError(error, res)
        }
    }

    /**
     * Удаление сессии
     * DELETE /api/sessions/:id
     */
    deleteSession = async (req: Request, res: Response): Promise<void> => {
        try {
            const userId = req.user!.userId
            const { id } = req.params

            await this.sessionService.deleteSession(id, userId)

            res.status(200).json({
                success: true,
                message: 'Игровая сессия удалена'
            })
        } catch (error) {
            this.handleError(error, res)
        }
    }

    /**
     * Получение лога действий
     * GET /api/sessions/:id/actions
     */
    getActionLog = async (req: Request, res: Response): Promise<void> => {
        try {
            const userId = req.user!.userId
            const { id } = req.params
            const limit = parseInt(req.query.limit as string) || 50
            const offset = parseInt(req.query.offset as string) || 0

            const actions = await this.sessionService.getActionLog(id, userId, limit, offset)

            res.status(200).json({
                success: true,
                data: actions
            })
        } catch (error) {
            this.handleError(error, res)
        }
    }

    /**
     * Добавление действия в лог
     * POST /api/sessions/:id/actions
     */
    logAction = async (req: Request, res: Response): Promise<void> => {
        try {
            const { id } = req.params
            const validatedData = LogActionSchema.parse({
                ...req.body,
                sessionId: id
            })

            const action = await this.sessionService.logAction(validatedData)

            res.status(201).json({
                success: true,
                message: 'Действие зарегистрировано',
                data: action
            })
        } catch (error) {
            this.handleError(error, res)
        }
    }

    /**
     * Установка инициативы
     * POST /api/sessions/:id/initiative
     */
    setInitiative = async (req: Request, res: Response): Promise<void> => {
        try {
            const userId = req.user!.userId
            const { id } = req.params
            const validatedData = InitiativeSchema.parse({
                ...req.body,
                sessionId: id
            })

            const combatStatus = await this.sessionService.setInitiative(validatedData, userId)

            res.status(200).json({
                success: true,
                message: 'Инициатива установлена, бой начат',
                data: combatStatus
            })
        } catch (error) {
            this.handleError(error, res)
        }
    }

    /**
     * Автоматический бросок инициативы для всех
     * POST /api/sessions/:id/initiative/roll
     */
    rollInitiativeForAll = async (req: Request, res: Response): Promise<void> => {
        try {
            const userId = req.user!.userId
            const { id } = req.params

            const results = await this.sessionService.rollInitiativeForAll(id, userId)

            res.status(200).json({
                success: true,
                message: 'Инициатива брошена для всех персонажей',
                data: results
            })
        } catch (error) {
            this.handleError(error, res)
        }
    }

    /**
     * Следующий ход в бою
     * POST /api/sessions/:id/combat/next-turn
     */
    nextTurn = async (req: Request, res: Response): Promise<void> => {
        try {
            const userId = req.user!.userId
            const { id } = req.params

            const combatStatus = await this.sessionService.nextTurn(id, userId)

            res.status(200).json({
                success: true,
                message: 'Переход к следующему ходу',
                data: combatStatus
            })
        } catch (error) {
            this.handleError(error, res)
        }
    }

    /**
     * Завершение боя
     * POST /api/sessions/:id/combat/end
     */
    endCombat = async (req: Request, res: Response): Promise<void> => {
        try {
            const userId = req.user!.userId
            const { id } = req.params

            await this.sessionService.endCombat(id, userId)

            res.status(200).json({
                success: true,
                message: 'Бой завершен'
            })
        } catch (error) {
            this.handleError(error, res)
        }
    }

    /**
     * Изменение сцены
     * POST /api/sessions/:id/scene
     */
    changeScene = async (req: Request, res: Response): Promise<void> => {
        try {
            const userId = req.user!.userId
            const { id } = req.params
            const validatedData = SceneChangeSchema.parse({
                ...req.body,
                sessionId: id
            })

            await this.sessionService.changeScene(validatedData, userId)

            res.status(200).json({
                success: true,
                message: 'Сцена изменена'
            })
        } catch (error) {
            this.handleError(error, res)
        }
    }

    /**
     * Получение состояния сессии
     * GET /api/sessions/:id/state
     */
    getSessionState = async (req: Request, res: Response): Promise<void> => {
        try {
            const { id } = req.params

            const state = await this.sessionService.getSessionState(id)

            res.status(200).json({
                success: true,
                data: state
            })
        } catch (error) {
            this.handleError(error, res)
        }
    }

    /**
     * Получение контекста для ИИ
     * GET /api/sessions/:id/ai-context
     */
    getAIContext = async (req: Request, res: Response): Promise<void> => {
        try {
            const userId = req.user!.userId
            const { id } = req.params

            // Проверяем права мастера игры
            const isMaster = await this.sessionService.checkGameMasterRights(id, userId)
            if (!isMaster) {
                res.status(403).json({
                    success: false,
                    error: 'Только мастер игры может получить контекст для ИИ'
                })
                return
            }

            const context = await this.sessionService.getAIContext(id)

            res.status(200).json({
                success: true,
                data: context
            })
        } catch (error) {
            this.handleError(error, res)
        }
    }

    /**
     * Получение статистики сессии
     * GET /api/sessions/:id/stats
     */
    getSessionStats = async (req: Request, res: Response): Promise<void> => {
        try {
            const userId = req.user!.userId
            const { id } = req.params

            const stats = await this.sessionService.getSessionStats(id, userId)

            res.status(200).json({
                success: true,
                data: stats
            })
        } catch (error) {
            this.handleError(error, res)
        }
    }

    /**
     * Проверка прав мастера игры
     * GET /api/sessions/:id/check-gm
     */
    checkGameMasterRights = async (req: Request, res: Response): Promise<void> => {
        try {
            const userId = req.user!.userId
            const { id } = req.params

            const isGameMaster = await this.sessionService.checkGameMasterRights(id, userId)

            res.status(200).json({
                success: true,
                data: { isGameMaster }
            })
        } catch (error) {
            this.handleError(error, res)
        }
    }

    /**
     * Обновление последней активности (вызывается автоматически)
     * POST /api/sessions/:id/activity
     */
    updateActivity = async (req: Request, res: Response): Promise<void> => {
        try {
            const { id } = req.params

            await this.sessionService.updateLastActivity(id)

            res.status(200).json({
                success: true,
                message: 'Активность обновлена'
            })
        } catch (error) {
            this.handleError(error, res)
        }
    }

    /**
     * Получение шаблонов для создания сессии
     * GET /api/sessions/templates
     */
    getSessionTemplates = async (req: Request, res: Response): Promise<void> => {
        try {
            const templates = [
                {
                    id: 'starter_adventure',
                    name: 'Приключение для начинающих',
                    description: 'Идеально для новых игроков и мастеров',
                    maxPlayers: 4,
                    gameSettings: {
                        experienceMode: 'milestone',
                        difficultyLevel: 'easy',
                        autoLevelUp: true,
                        hitPointVariant: 'average'
                    }
                },
                {
                    id: 'classic_campaign',
                    name: 'Классическая кампания',
                    description: 'Стандартные правила D&D 5e',
                    maxPlayers: 6,
                    gameSettings: {
                        experienceMode: 'standard',
                        difficultyLevel: 'normal',
                        autoLevelUp: false,
                        hitPointVariant: 'rolled'
                    }
                },
                {
                    id: 'hardcore_mode',
                    name: 'Хардкорный режим',
                    description: 'Для опытных игроков, жесткие правила',
                    maxPlayers: 4,
                    gameSettings: {
                        experienceMode: 'slow',
                        difficultyLevel: 'deadly',
                        restVariant: 'gritty',
                        criticalHitVariant: 'brutal'
                    }
                }
            ]

            res.status(200).json({
                success: true,
                data: templates
            })
        } catch (error) {
            this.handleError(error, res)
        }
    }

    /**
     * Обработка ошибок
     */
    private handleError = (error: any, res: Response): void => {
        console.error('Session controller error:', error)

        if (error.name === 'ZodError') {
            res.status(400).json({
                success: false,
                error: 'Ошибка валидации данных',
                details: error.errors.map((err: any) => ({
                    field: err.path.join('.'),
                    message: err.message
                }))
            })
            return
        }

        if (error instanceof SessionError) {
            res.status(error.statusCode).json({
                success: false,
                error: error.message
            })
            return
        }

        // Общая ошибка сервера
        res.status(500).json({
            success: false,
            error: 'Внутренняя ошибка сервера'
        })
    }
}