// backend/src/modules/game-master/ai-master.controller.ts
import { Request, Response } from 'express'
import { AIMasterService } from './ai-master.service'
import {
    AIRequestSchema,
    AIMasterError
} from './ai-master.types'

export class AIMasterController {
    private aiMasterService: AIMasterService

    constructor() {
        this.aiMasterService = new AIMasterService()
    }

    /**
     * Обработка действия игрока ИИ мастером
     * POST /api/game-master/process
     */
    processPlayerAction = async (req: Request, res: Response): Promise<void> => {
        try {
            const validatedData = AIRequestSchema.parse(req.body)

            const response = await this.aiMasterService.processPlayerAction(validatedData)

            res.status(200).json({
                success: true,
                data: response
            })
        } catch (error) {
            this.handleError(error, res)
        }
    }

    /**
     * Генерация описания сцены
     * POST /api/game-master/scene
     */
    generateScene = async (req: Request, res: Response): Promise<void> => {
        try {
            const { sessionId, locationName, ...additionalContext } = req.body

            if (!sessionId || !locationName) {
                res.status(400).json({
                    success: false,
                    error: 'sessionId и locationName обязательны'
                })
                return
            }

            const response = await this.aiMasterService.generateSceneDescription(
                sessionId,
                locationName,
                additionalContext
            )

            res.status(200).json({
                success: true,
                data: response
            })
        } catch (error) {
            this.handleError(error, res)
        }
    }

    /**
     * Генерация диалога NPC
     * POST /api/game-master/npc-dialogue
     */
    generateNPCDialogue = async (req: Request, res: Response): Promise<void> => {
        try {
            const { sessionId, npcName, playerMessage, npcPersonality } = req.body

            if (!sessionId || !npcName || !playerMessage) {
                res.status(400).json({
                    success: false,
                    error: 'sessionId, npcName и playerMessage обязательны'
                })
                return
            }

            const response = await this.aiMasterService.generateNPCDialogue(
                sessionId,
                npcName,
                playerMessage,
                npcPersonality
            )

            res.status(200).json({
                success: true,
                data: response
            })
        } catch (error) {
            this.handleError(error, res)
        }
    }

    /**
     * Генерация боевого повествования
     * POST /api/game-master/combat-narration
     */
    generateCombatNarration = async (req: Request, res: Response): Promise<void> => {
        try {
            const { sessionId, combatAction, result } = req.body

            if (!sessionId || !combatAction || !result) {
                res.status(400).json({
                    success: false,
                    error: 'sessionId, combatAction и result обязательны'
                })
                return
            }

            const response = await this.aiMasterService.generateCombatNarration(
                sessionId,
                combatAction,
                result
            )

            res.status(200).json({
                success: true,
                data: response
            })
        } catch (error) {
            this.handleError(error, res)
        }
    }

    /**
     * Генерация квеста
     * POST /api/game-master/quest
     */
    generateQuest = async (req: Request, res: Response): Promise<void> => {
        try {
            const { sessionId, questType = 'side', difficulty = 'medium' } = req.body

            if (!sessionId) {
                res.status(400).json({
                    success: false,
                    error: 'sessionId обязателен'
                })
                return
            }

            const response = await this.aiMasterService.generateQuest(
                sessionId,
                questType,
                difficulty
            )

            res.status(200).json({
                success: true,
                data: response
            })
        } catch (error) {
            this.handleError(error, res)
        }
    }

    /**
     * Генерация случайной встречи
     * POST /api/game-master/random-encounter
     */
    generateRandomEncounter = async (req: Request, res: Response): Promise<void> => {
        try {
            const { sessionId, environment, partyLevel } = req.body

            if (!sessionId || !environment || !partyLevel) {
                res.status(400).json({
                    success: false,
                    error: 'sessionId, environment и partyLevel обязательны'
                })
                return
            }

            const response = await this.aiMasterService.generateRandomEncounter(
                sessionId,
                environment,
                partyLevel
            )

            res.status(200).json({
                success: true,
                data: response
            })
        } catch (error) {
            this.handleError(error, res)
        }
    }

    /**
     * Развитие сюжета
     * POST /api/game-master/story-progression
     */
    progressStory = async (req: Request, res: Response): Promise<void> => {
        try {
            const { sessionId, majorEvents, desiredDirection } = req.body

            if (!sessionId || !majorEvents) {
                res.status(400).json({
                    success: false,
                    error: 'sessionId и majorEvents обязательны'
                })
                return
            }

            const response = await this.aiMasterService.progressStory(
                sessionId,
                majorEvents,
                desiredDirection
            )

            res.status(200).json({
                success: true,
                data: response
            })
        } catch (error) {
            this.handleError(error, res)
        }
    }

    /**
     * Создание элементов мира
     * POST /api/game-master/world-building
     */
    buildWorldElement = async (req: Request, res: Response): Promise<void> => {
        try {
            const { sessionId, elementType, theme } = req.body

            if (!sessionId || !elementType || !theme) {
                res.status(400).json({
                    success: false,
                    error: 'sessionId, elementType и theme обязательны'
                })
                return
            }

            const response = await this.aiMasterService.buildWorldElement(
                sessionId,
                elementType,
                theme
            )

            res.status(200).json({
                success: true,
                data: response
            })
        } catch (error) {
            this.handleError(error, res)
        }
    }

    /**
     * Анализ последствий действий
     * POST /api/game-master/analyze-consequences
     */
    analyzeConsequences = async (req: Request, res: Response): Promise<void> => {
        try {
            const { sessionId, playerActions, timeframe = 'immediate' } = req.body

            if (!sessionId || !playerActions) {
                res.status(400).json({
                    success: false,
                    error: 'sessionId и playerActions обязательны'
                })
                return
            }

            const response = await this.aiMasterService.analyzeConsequences(
                sessionId,
                playerActions,
                timeframe
            )

            res.status(200).json({
                success: true,
                data: response
            })
        } catch (error) {
            this.handleError(error, res)
        }
    }

    /**
     * Получение рекомендаций для игры
     * GET /api/game-master/recommendations/:sessionId
     */
    getGameplayRecommendations = async (req: Request, res: Response): Promise<void> => {
        try {
            const { sessionId } = req.params

            const recommendations = await this.aiMasterService.getGameplayRecommendations(sessionId)

            res.status(200).json({
                success: true,
                data: recommendations
            })
        } catch (error) {
            this.handleError(error, res)
        }
    }

    /**
     * Проверка здоровья ИИ системы
     * GET /api/game-master/health
     */
    checkHealth = async (req: Request, res: Response): Promise<void> => {
        try {
            const health = await this.aiMasterService.checkHealth()

            res.status(200).json({
                success: true,
                data: health
            })
        } catch (error) {
            this.handleError(error, res)
        }
    }

    /**
     * Получение статистики использования ИИ
     * GET /api/game-master/stats
     */
    getUsageStats = async (req: Request, res: Response): Promise<void> => {
        try {
            const { sessionId } = req.query

            const stats = await this.aiMasterService.getUsageStats(sessionId as string)

            res.status(200).json({
                success: true,
                data: stats
            })
        } catch (error) {
            this.handleError(error, res)
        }
    }

    /**
     * Получение информации о кэше
     * GET /api/game-master/cache
     */
    getCacheInfo = async (req: Request, res: Response): Promise<void> => {
        try {
            const cacheInfo = this.aiMasterService.getCacheInfo()

            res.status(200).json({
                success: true,
                data: cacheInfo
            })
        } catch (error) {
            this.handleError(error, res)
        }
    }

    /**
     * Очистка кэша
     * POST /api/game-master/cache/clear
     */
    clearCache = async (req: Request, res: Response): Promise<void> => {
        try {
            this.aiMasterService.clearCache()

            res.status(200).json({
                success: true,
                message: 'Кэш очищен'
            })
        } catch (error) {
            this.handleError(error, res)
        }
    }

    /**
     * Тестирование ИИ
     * POST /api/game-master/test
     */
    testAI = async (req: Request, res: Response): Promise<void> => {
        try {
            const { sessionId } = req.body

            if (!sessionId) {
                res.status(400).json({
                    success: false,
                    error: 'sessionId обязателен'
                })
                return
            }

            const testResult = await this.aiMasterService.testAI(sessionId)

            res.status(200).json({
                success: true,
                data: testResult
            })
        } catch (error) {
            this.handleError(error, res)
        }
    }

    /**
     * Предзагрузка моделей
     * POST /api/game-master/preload-models
     */
    preloadModels = async (req: Request, res: Response): Promise<void> => {
        try {
            const success = await this.aiMasterService.preloadModels()

            res.status(200).json({
                success,
                message: success ? 'Модели загружены' : 'Ошибка загрузки моделей'
            })
        } catch (error) {
            this.handleError(error, res)
        }
    }

    /**
     * Установка настроек мастера игры
     * POST /api/game-master/settings/:sessionId
     */
    setGameMasterSettings = async (req: Request, res: Response): Promise<void> => {
        try {
            const { sessionId } = req.params
            const settings = req.body

            await this.aiMasterService.setGameMasterSettings(sessionId, settings)

            res.status(200).json({
                success: true,
                message: 'Настройки мастера игры обновлены'
            })
        } catch (error) {
            this.handleError(error, res)
        }
    }

    /**
     * Экспорт истории взаимодействий
     * GET /api/game-master/export/:sessionId
     */
    exportInteractionHistory = async (req: Request, res: Response): Promise<void> => {
        try {
            const { sessionId } = req.params

            const history = await this.aiMasterService.exportInteractionHistory(sessionId)

            res.status(200).json({
                success: true,
                data: history
            })
        } catch (error) {
            this.handleError(error, res)
        }
    }

    /**
     * Получение доступных промптов
     * GET /api/game-master/prompts
     */
    getPrompts = async (req: Request, res: Response): Promise<void> => {
        try {
            const { PromptLibraryService } = await import('./prompt-library')
            const promptLibrary = PromptLibraryService.getInstance()

            const prompts = promptLibrary.getAllPrompts()

            res.status(200).json({
                success: true,
                data: Object.values(prompts).map(prompt => ({
                    id: prompt.id,
                    name: prompt.name,
                    description: prompt.description,
                    requestType: prompt.requestType,
                    language: prompt.language
                }))
            })
        } catch (error) {
            this.handleError(error, res)
        }
    }

    /**
     * Обновление промпта
     * PUT /api/game-master/prompts/:promptId
     */
    updatePrompt = async (req: Request, res: Response): Promise<void> => {
        try {
            const { promptId } = req.params
            const updates = req.body

            const { PromptLibraryService } = await import('./prompt-library')
            const promptLibrary = PromptLibraryService.getInstance()

            const success = promptLibrary.updatePrompt(promptId, updates)

            if (success) {
                res.status(200).json({
                    success: true,
                    message: 'Промпт обновлен'
                })
            } else {
                res.status(404).json({
                    success: false,
                    error: 'Промпт не найден'
                })
            }
        } catch (error) {
            this.handleError(error, res)
        }
    }

    /**
     * Получение конфигурации Ollama
     * GET /api/game-master/ollama/config
     */
    getOllamaConfig = async (req: Request, res: Response): Promise<void> => {
        try {
            // Создаем временный экземпляр для получения конфигурации
            const { OllamaService } = await import('./ollama.service')
            const ollamaService = new OllamaService()

            const config = ollamaService.getConfig()

            res.status(200).json({
                success: true,
                data: {
                    baseUrl: config.baseUrl,
                    defaultModel: config.defaultModel,
                    timeout: config.timeout,
                    models: config.models
                }
            })
        } catch (error) {
            this.handleError(error, res)
        }
    }

    /**
     * Обработка ошибок
     */
    private handleError = (error: any, res: Response): void => {
        console.error('AI Master controller error:', error)

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

        if (error instanceof AIMasterError) {
            res.status(error.statusCode).json({
                success: false,
                error: error.message,
                code: error.code
            })
            return
        }

        // Общая ошибка сервера
        res.status(500).json({
            success: false,
            error: 'Внутренняя ошибка сервера ИИ'
        })
    }
}