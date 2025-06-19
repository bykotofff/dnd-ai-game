// backend/src/modules/game-master/ai-master.router.ts
import { Router } from 'express'
import { AIMasterController } from './ai-master.controller'
import { authMiddleware } from '@modules/auth/auth.middleware'

export class AIMasterRouter {
    public router: Router
    private aiMasterController: AIMasterController

    constructor() {
        this.router = Router()
        this.aiMasterController = new AIMasterController()
        this.initializeRoutes()
    }

    private initializeRoutes(): void {
        // Все маршруты требуют аутентификации
        this.router.use(authMiddleware.authenticate)

        /**
         * Основные игровые функции ИИ
         */

        // Обработка действия игрока
        this.router.post('/process',
            authMiddleware.rateLimit(30, 60 * 1000), // 30 запросов в минуту
            this.aiMasterController.processPlayerAction
        )

        // Генерация описания сцены
        this.router.post('/scene',
            authMiddleware.rateLimit(10, 60 * 1000), // 10 сцен в минуту
            this.aiMasterController.generateScene
        )

        // Генерация диалога NPC
        this.router.post('/npc-dialogue',
            authMiddleware.rateLimit(20, 60 * 1000), // 20 диалогов в минуту
            this.aiMasterController.generateNPCDialogue
        )

        // Генерация боевого повествования
        this.router.post('/combat-narration',
            authMiddleware.rateLimit(15, 60 * 1000), // 15 описаний боя в минуту
            this.aiMasterController.generateCombatNarration
        )

        /**
         * Генерация контента
         */

        // Генерация квестов
        this.router.post('/quest',
            authMiddleware.rateLimit(5, 60 * 1000), // 5 квестов в минуту
            this.aiMasterController.generateQuest
        )

        // Генерация случайных встреч
        this.router.post('/random-encounter',
            authMiddleware.rateLimit(10, 60 * 1000), // 10 встреч в минуту
            this.aiMasterController.generateRandomEncounter
        )

        // Развитие сюжета
        this.router.post('/story-progression',
            authMiddleware.rateLimit(5, 60 * 1000), // 5 развитий сюжета в минуту
            this.aiMasterController.progressStory
        )

        // Создание элементов мира
        this.router.post('/world-building',
            authMiddleware.rateLimit(8, 60 * 1000), // 8 элементов мира в минуту
            this.aiMasterController.buildWorldElement
        )

        // Анализ последствий
        this.router.post('/analyze-consequences',
            authMiddleware.rateLimit(5, 60 * 1000), // 5 анализов в минуту
            this.aiMasterController.analyzeConsequences
        )

        /**
         * Аналитика и рекомендации
         */

        // Получение рекомендаций для игры
        this.router.get('/recommendations/:sessionId',
            this.aiMasterController.getGameplayRecommendations
        )

        // Статистика использования ИИ
        this.router.get('/stats',
            this.aiMasterController.getUsageStats
        )

        /**
         * Системные функции
         */

        // Проверка здоровья системы
        this.router.get('/health',
            this.aiMasterController.checkHealth
        )

        // Тестирование ИИ
        this.router.post('/test',
            authMiddleware.rateLimit(3, 60 * 1000), // 3 теста в минуту
            this.aiMasterController.testAI
        )

        // Предзагрузка моделей (только для администраторов)
        this.router.post('/preload-models',
            authMiddleware.rateLimit(1, 5 * 60 * 1000), // 1 раз в 5 минут
            this.aiMasterController.preloadModels
        )

        /**
         * Управление кэшем
         */

        // Информация о кэше
        this.router.get('/cache',
            this.aiMasterController.getCacheInfo
        )

        // Очистка кэша
        this.router.post('/cache/clear',
            authMiddleware.rateLimit(3, 60 * 1000), // 3 очистки в минуту
            this.aiMasterController.clearCache
        )

        /**
         * Настройки и конфигурация
         */

        // Настройки мастера игры для сессии
        this.router.post('/settings/:sessionId',
            this.aiMasterController.setGameMasterSettings
        )

        // Конфигурация Ollama
        this.router.get('/ollama/config',
            this.aiMasterController.getOllamaConfig
        )

        /**
         * Управление промптами
         */

        // Получение списка промптов
        this.router.get('/prompts',
            this.aiMasterController.getPrompts
        )

        // Обновление промпта
        this.router.put('/prompts/:promptId',
            authMiddleware.rateLimit(10, 60 * 1000), // 10 обновлений в минуту
            this.aiMasterController.updatePrompt
        )

        /**
         * Экспорт и импорт данных
         */

        // Экспорт истории взаимодействий
        this.router.get('/export/:sessionId',
            this.aiMasterController.exportInteractionHistory
        )

        /**
         * Будущие возможности для расширения
         */

        // TODO: Обучение на пользовательских данных
        // this.router.post('/train', this.aiMasterController.trainOnUserData)

        // TODO: Создание персонализированных промптов
        // this.router.post('/prompts/personalize', this.aiMasterController.personalizePrompts)

        // TODO: A/B тестирование разных моделей
        // this.router.post('/ab-test', this.aiMasterController.runABTest)

        // TODO: Автоматическая оптимизация параметров
        // this.router.post('/optimize', this.aiMasterController.optimizeParameters)

        // TODO: Интеграция с внешними API (OpenAI, Claude)
        // this.router.post('/external/openai', this.aiMasterController.useOpenAI)
        // this.router.post('/external/claude', this.aiMasterController.useClaude)

        // TODO: Голосовая генерация
        // this.router.post('/voice/generate', this.aiMasterController.generateVoice)
        // this.router.get('/voice/models', this.aiMasterController.getVoiceModels)

        // TODO: Мультимодальные возможности
        // this.router.post('/multimodal/analyze-image', this.aiMasterController.analyzeImage)
        // this.router.post('/multimodal/generate-map', this.aiMasterController.generateMap)

        // TODO: Коллаборативное повествование
        // this.router.post('/collaborative/suggest', this.aiMasterController.suggestCollaboration)
        // this.router.post('/collaborative/merge', this.aiMasterController.mergeStories)

        // TODO: Адаптивная сложность
        // this.router.post('/adaptive/difficulty', this.aiMasterController.adaptDifficulty)
        // this.router.get('/adaptive/analysis', this.aiMasterController.getAdaptiveAnalysis)
    }
}

export const aiMasterRouter = new AIMasterRouter().router