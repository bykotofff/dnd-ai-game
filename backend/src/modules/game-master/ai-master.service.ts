// backend/src/modules/game-master/ai-master.service.ts
import {
    AIRequestDto,
    AIResponse,
    AIRequestContext,
    AIMasterError,
    AIProcessingResult,
    GameMasterSettings,
    AIInteractionHistory,
    AIStats,
    AIResponseCache
} from './ai-master.types'
import { SessionService } from '@modules/sessions/session.service'
import { CharacterService } from '@modules/characters/character.service'
import { OllamaService } from './ollama.service'
import { PromptLibraryService } from './prompt-library'
import { db } from '@shared/database/database.service'

export class AIMasterService {
    private ollamaService: OllamaService
    private promptLibrary: PromptLibraryService
    private sessionService: SessionService
    private characterService: CharacterService
    private responseCache: Map<string, AIResponseCache> = new Map()
    private processingQueue: Map<string, Promise<AIProcessingResult>> = new Map()

    constructor() {
        this.ollamaService = new OllamaService()
        this.promptLibrary = PromptLibraryService.getInstance()
        this.sessionService = new SessionService()
        this.characterService = new CharacterService()

        // Очистка кэша каждые 30 минут
        setInterval(() => this.cleanupCache(), 30 * 60 * 1000)
    }

    /**
     * Обработка запроса игрока - основной метод
     */
    async processPlayerAction(request: AIRequestDto): Promise<AIResponse> {
        try {
            console.log(`🎯 Обработка запроса: ${request.requestType}`)

            // Проверяем кэш для одинаковых запросов
            const cacheKey = this.generateCacheKey(request)
            const cached = this.getCachedResponse(cacheKey)
            if (cached) {
                console.log('📦 Используем кэшированный ответ')
                return cached
            }

            // Проверяем, не обрабатывается ли уже такой запрос
            if (this.processingQueue.has(cacheKey)) {
                console.log('⏳ Ожидаем завершения аналогичного запроса')
                const result = await this.processingQueue.get(cacheKey)!
                if (result.success && result.response) {
                    return result.response
                }
            }

            // Создаем промис для обработки
            const processingPromise = this.processRequest(request)
            this.processingQueue.set(cacheKey, processingPromise)

            try {
                const result = await processingPromise

                if (!result.success || !result.response) {
                    throw new AIMasterError(result.error || 'Ошибка обработки запроса ИИ')
                }

                // Кэшируем успешный ответ
                this.cacheResponse(cacheKey, result.response)

                // Сохраняем взаимодействие в историю
                await this.saveInteraction(request, result.response)

                // Логируем действие в сессии
                await this.sessionService.logAction({
                    sessionId: request.sessionId,
                    characterId: request.characterId,
                    actionType: 'ai_response',
                    content: result.response.content,
                    metadata: {
                        requestType: request.requestType,
                        processingTime: result.response.metadata.processingTime,
                        aiResponseId: result.response.id
                    }
                })

                return result.response

            } finally {
                // Удаляем из очереди обработки
                this.processingQueue.delete(cacheKey)
            }

        } catch (error) {
            console.error('AI Master processing error:', error)

            if (error instanceof AIMasterError) {
                throw error
            }

            throw new AIMasterError('Ошибка при обработке запроса к ИИ мастеру')
        }
    }

    /**
     * Внутренняя обработка запроса
     */
    private async processRequest(request: AIRequestDto): Promise<AIProcessingResult> {
        try {
            // Получаем контекст игровой сессии
            const context = await this.buildRequestContext(request)

            // Генерируем промпт
            const prompt = await this.generatePrompt(context)

            // Отправляем запрос к Ollama
            const result = await this.ollamaService.generateResponse(
                prompt,
                request.requestType,
                this.getModelConfigForRequest(request)
            )

            if (result.success && result.response) {
                // Обогащаем ответ дополнительной информацией
                result.response = await this.enrichResponse(result.response, context)
            }

            return result

        } catch (error) {
            console.error('Request processing error:', error)
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Неизвестная ошибка'
            }
        }
    }

    /**
     * Построение контекста для запроса
     */
    private async buildRequestContext(request: AIRequestDto): Promise<AIRequestContext> {
        try {
            // Получаем базовый контекст сессии
            const aiContext = await this.sessionService.getAIContext(request.sessionId)

            // Получаем информацию о персонаже если указан
            let characterInfo = null
            if (request.characterId) {
                // Находим userId по characterId (нужно для проверки прав)
                const character = await db.character.findUnique({
                    where: { id: request.characterId },
                    include: { user: true }
                })

                if (character) {
                    characterInfo = await this.characterService.getCharacter(
                        request.characterId,
                        character.userId
                    )
                }
            }

            // Получаем предыдущие ответы ИИ для контекста
            const previousResponses = await this.getRecentAIResponses(
                request.sessionId,
                5 // Последние 5 ответов
            )

            const context: AIRequestContext = {
                ...aiContext,
                requestType: request.requestType,
                playerAction: request.playerAction,
                additionalContext: {
                    ...request.additionalContext,
                    character: characterInfo
                },
                previousResponses,
                constraints: request.constraints
            }

            return context

        } catch (error) {
            console.error('Error building request context:', error)
            throw new AIMasterError('Ошибка при построении контекста запроса')
        }
    }

    /**
     * Генерация промпта на основе контекста
     */
    private async generatePrompt(context: AIRequestContext): Promise<string> {
        try {
            const language = context.constraints?.language || 'russian'
            const template = this.promptLibrary.getPromptByType(context.requestType, language)

            if (!template) {
                throw new AIMasterError(`Шаблон не найден для типа: ${context.requestType}`)
            }

            // Подготавливаем переменные для шаблона
            const variables = this.prepareTemplateVariables(context)

            // Рендерим промпт
            const prompt = this.promptLibrary.renderPrompt(template.id, variables)

            console.log(`📝 Сгенерирован промпт для ${context.requestType}`)

            return prompt

        } catch (error) {
            console.error('Error generating prompt:', error)
            throw new AIMasterError('Ошибка при генерации промпта')
        }
    }

    /**
     * Подготовка переменных для шаблона
     */
    private prepareTemplateVariables(context: AIRequestContext): Record<string, any> {
        const character = context.additionalContext?.character
        const worldState = context.worldState

        // Форматируем последние действия
        const recentActions = context.recentActions
            .slice(0, 5)
            .map(action => `${action.actionType}: ${action.content}`)
            .join('\n')

        const variables = {
            // Основная информация
            currentLocation: worldState.currentLocation,
            timeOfDay: worldState.timeOfDay,
            weather: worldState.weather,
            currentScene: context.currentScene,
            playerAction: context.playerAction || '',

            // Информация о персонаже
            characterName: character?.name || 'Персонаж',
            characterClass: character?.class || '',
            characterLevel: character?.level || 1,
            currentHP: character?.currentHP || 0,
            maxHP: character?.maxHP || 0,

            // Контекст
            recentActions,
            npcsPresent: worldState.npcsInLocation.join(', '),
            questContext: worldState.activeQuests.join(', '),

            // Дополнительные параметры
            ...context.additionalContext
        }

        return variables
    }

    /**
     * Обогащение ответа дополнительной информацией
     */
    private async enrichResponse(
        response: AIResponse,
        context: AIRequestContext
    ): Promise<AIResponse> {
        try {
            // Анализируем ответ на предмет специальных инструкций
            const content = response.content

            // Ищем требования к броскам костей
            const dicePatterns = [
                /бросок\s+(.*?)\s+против\s+(\d+)/gi,
                /проверка\s+(.*?)\s+DC\s*(\d+)/gi,
                /бросьте?\s+(d\d+)/gi
            ]

            response.diceRollsRequired = []

            for (const pattern of dicePatterns) {
                const matches = content.matchAll(pattern)
                for (const match of matches) {
                    response.diceRollsRequired.push({
                        type: match[1] || 'd20',
                        purpose: `Проверка: ${match[0]}`,
                        dc: parseInt(match[2]) || undefined
                    })
                }
            }

            // Ищем предложения действий
            if (content.includes('можете') || content.includes('могли бы')) {
                response.suggestions = this.extractActionSuggestions(content)
            }

            // Определяем обновления сцены
            response.sceneUpdates = this.detectSceneUpdates(content, context)

            return response

        } catch (error) {
            console.error('Error enriching response:', error)
            return response // Возвращаем неизмененный ответ при ошибке
        }
    }

    /**
     * Извлечение предложений действий из текста
     */
    private extractActionSuggestions(content: string): any[] {
        const suggestions: any[] = []

        // Простые эвристики для извлечения предложений
        if (content.includes('проверка')) {
            suggestions.push({
                type: 'skill_check',
                description: 'Выполнить проверку навыка'
            })
        }

        if (content.includes('атак') || content.includes('удар')) {
            suggestions.push({
                type: 'attack',
                description: 'Атаковать противника'
            })
        }

        if (content.includes('говор') || content.includes('сказать')) {
            suggestions.push({
                type: 'dialogue',
                description: 'Начать диалог'
            })
        }

        return suggestions
    }

    /**
     * Определение обновлений сцены
     */
    private detectSceneUpdates(content: string, context: AIRequestContext): any[] {
        const updates: any[] = []

        // Поиск изменений локации
        const locationPattern = /(переход|движ|идти|направл).*?(в|к|на)\s+([А-Я][а-я\s]+)/gi
        const locationMatch = content.match(locationPattern)
        if (locationMatch) {
            updates.push({
                type: 'location_change',
                description: 'Возможное изменение локации',
                newValue: locationMatch[0]
            })
        }

        // Поиск изменений времени
        if (content.includes('наступ') && (content.includes('вечер') || content.includes('утро') || content.includes('ночь'))) {
            updates.push({
                type: 'time_change',
                description: 'Изменение времени суток'
            })
        }

        return updates
    }

    /**
     * Получение недавних ответов ИИ
     */
    private async getRecentAIResponses(sessionId: string, limit: number): Promise<AIResponse[]> {
        try {
            const actions = await this.sessionService.getActionLog(sessionId, 'system', limit * 2, 0)

            return actions
                .filter(action => action.actionType === 'ai_response')
                .slice(0, limit)
                .map(action => ({
                    id: action.metadata?.aiResponseId || action.id,
                    requestType: action.metadata?.requestType || 'player_action_response',
                    content: action.content,
                    metadata: {
                        processingTime: action.metadata?.processingTime || 0,
                        modelUsed: 'unknown',
                        tokenCount: Math.ceil(action.content.length / 4)
                    },
                    timestamp: action.timestamp
                })) as AIResponse[]

        } catch (error) {
            console.error('Error getting recent AI responses:', error)
            return []
        }
    }

    /**
     * Получение конфигурации модели для запроса
     */
    private getModelConfigForRequest(request: AIRequestDto) {
        // Настройки можно изменять в зависимости от типа запроса
        const baseConfig = {
            temperature: 0.8,
            maxTokens: 300
        }

        // Применяем ограничения из запроса
        if (request.constraints?.maxLength) {
            baseConfig.maxTokens = Math.min(request.constraints.maxLength, 500)
        }

        // Настройки для разных тонов
        if (request.constraints?.tone) {
            switch (request.constraints.tone) {
                case 'serious':
                    baseConfig.temperature = 0.6
                    break
                case 'humorous':
                    baseConfig.temperature = 0.9
                    break
                case 'mysterious':
                    baseConfig.temperature = 0.7
                    break
                case 'dramatic':
                    baseConfig.temperature = 0.8
                    break
                case 'casual':
                    baseConfig.temperature = 0.8
                    break
            }
        }

        return baseConfig
    }

    // === Кэширование ===

    /**
     * Генерация ключа кэша
     */
    private generateCacheKey(request: AIRequestDto): string {
        const keyParts = [
            request.requestType,
            request.sessionId,
            request.playerAction || '',
            JSON.stringify(request.constraints || {})
        ]

        return Buffer.from(keyParts.join('|')).toString('base64')
    }

    /**
     * Получение кэшированного ответа
     */
    private getCachedResponse(key: string): AIResponse | null {
        const cached = this.responseCache.get(key)

        if (cached && cached.expiresAt > new Date()) {
            cached.hitCount++
            return cached.response
        }

        if (cached) {
            this.responseCache.delete(key)
        }

        return null
    }

    /**
     * Кэширование ответа
     */
    private cacheResponse(key: string, response: AIResponse): void {
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000) // 10 минут

        this.responseCache.set(key, {
            key,
            response,
            expiresAt,
            hitCount: 0
        })
    }

    /**
     * Очистка устаревшего кэша
     */
    private cleanupCache(): void {
        const now = new Date()
        let cleaned = 0

        for (const [key, cached] of this.responseCache.entries()) {
            if (cached.expiresAt <= now) {
                this.responseCache.delete(key)
                cleaned++
            }
        }

        if (cleaned > 0) {
            console.log(`🧹 Очищено ${cleaned} записей из кэша ИИ`)
        }
    }

    // === Сохранение истории ===

    /**
     * Сохранение взаимодействия в историю
     */
    private async saveInteraction(request: AIRequestDto, response: AIResponse): Promise<void> {
        try {
            // TODO: Реализовать сохранение в отдельную таблицу для аналитики
            console.log(`💾 Сохранено взаимодействие: ${request.requestType}`)
        } catch (error) {
            console.error('Error saving interaction:', error)
            // Не выбрасываем ошибку, так как это не критично
        }
    }

    // === Публичные методы для управления ===

    /**
     * Проверка здоровья ИИ сервиса
     */
    async checkHealth(): Promise<{
        ollama: boolean
        models: string[]
        cacheSize: number
        queueSize: number
    }> {
        try {
            const ollamaHealth = await this.ollamaService.checkHealth()
            const availableModels = await this.ollamaService.getAvailableModels()

            return {
                ollama: ollamaHealth,
                models: availableModels,
                cacheSize: this.responseCache.size,
                queueSize: this.processingQueue.size
            }
        } catch (error) {
            console.error('Health check error:', error)
            return {
                ollama: false,
                models: [],
                cacheSize: this.responseCache.size,
                queueSize: this.processingQueue.size
            }
        }
    }

    /**
     * Генерация описания сцены
     */
    async generateSceneDescription(
        sessionId: string,
        locationName: string,
        additionalContext?: Record<string, any>
    ): Promise<AIResponse> {
        const request: AIRequestDto = {
            sessionId,
            requestType: 'scene_description',
            additionalContext: {
                locationName,
                ...additionalContext
            }
        }

        return this.processPlayerAction(request)
    }

    /**
     * Генерация диалога NPC
     */
    async generateNPCDialogue(
        sessionId: string,
        npcName: string,
        playerMessage: string,
        npcPersonality?: string
    ): Promise<AIResponse> {
        const request: AIRequestDto = {
            sessionId,
            requestType: 'npc_dialogue',
            playerAction: playerMessage,
            additionalContext: {
                npcName,
                npcPersonality: npcPersonality || 'дружелюбный'
            }
        }

        return this.processPlayerAction(request)
    }

    /**
     * Генерация боевого повествования
     */
    async generateCombatNarration(
        sessionId: string,
        combatAction: string,
        result: {
            hit: boolean
            damage?: number
            critical?: boolean
        }
    ): Promise<AIResponse> {
        const request: AIRequestDto = {
            sessionId,
            requestType: 'combat_narration',
            playerAction: combatAction,
            additionalContext: {
                combatResult: result
            }
        }

        return this.processPlayerAction(request)
    }

    /**
     * Генерация нового квеста
     */
    async generateQuest(
        sessionId: string,
        questType: 'main' | 'side' | 'personal' = 'side',
        difficulty: 'easy' | 'medium' | 'hard' = 'medium'
    ): Promise<AIResponse> {
        const request: AIRequestDto = {
            sessionId,
            requestType: 'quest_generation',
            additionalContext: {
                questType,
                difficulty
            }
        }

        return this.processPlayerAction(request)
    }

    /**
     * Анализ последствий действий игроков
     */
    async analyzeConsequences(
        sessionId: string,
        playerActions: string[],
        timeframe: 'immediate' | 'short_term' | 'long_term' = 'immediate'
    ): Promise<AIResponse> {
        const request: AIRequestDto = {
            sessionId,
            requestType: 'consequence_analysis',
            additionalContext: {
                playerActions,
                timeframe
            }
        }

        return this.processPlayerAction(request)
    }

    /**
     * Генерация случайной встречи
     */
    async generateRandomEncounter(
        sessionId: string,
        environment: string,
        partyLevel: number
    ): Promise<AIResponse> {
        const request: AIRequestDto = {
            sessionId,
            requestType: 'random_encounter',
            additionalContext: {
                environment,
                partyLevel
            }
        }

        return this.processPlayerAction(request)
    }

    /**
     * Развитие сюжета
     */
    async progressStory(
        sessionId: string,
        majorEvents: string[],
        desiredDirection?: string
    ): Promise<AIResponse> {
        const request: AIRequestDto = {
            sessionId,
            requestType: 'story_progression',
            additionalContext: {
                majorEvents,
                desiredDirection
            }
        }

        return this.processPlayerAction(request)
    }

    /**
     * Создание элементов мира
     */
    async buildWorldElement(
        sessionId: string,
        elementType: 'location' | 'organization' | 'culture' | 'history',
        theme: string
    ): Promise<AIResponse> {
        const request: AIRequestDto = {
            sessionId,
            requestType: 'world_building',
            additionalContext: {
                elementType,
                theme
            }
        }

        return this.processPlayerAction(request)
    }

    /**
     * Получение статистики использования ИИ
     */
    async getUsageStats(sessionId?: string): Promise<AIStats> {
        try {
            // TODO: Реализовать сбор статистики из базы данных
            const ollamaStats = this.ollamaService.getUsageStats()

            return {
                totalRequests: ollamaStats.totalRequests,
                averageResponseTime: ollamaStats.averageResponseTime,
                totalTokensUsed: 0, // Подсчитать из логов
                responsesByType: {
                    'player_action_response': 0,
                    'scene_description': 0,
                    'npc_dialogue': 0,
                    'combat_narration': 0,
                    'quest_generation': 0,
                    'story_progression': 0,
                    'world_building': 0,
                    'random_encounter': 0,
                    'consequence_analysis': 0
                },
                playerSatisfactionRating: 0.8, // Средняя оценка
                successfulQuestGenerations: 0,
                uniqueNPCsCreated: 0
            }
        } catch (error) {
            console.error('Error getting usage stats:', error)
            throw new AIMasterError('Ошибка при получении статистики')
        }
    }

    /**
     * Очистка кэша
     */
    clearCache(): void {
        this.responseCache.clear()
        console.log('🧹 Кэш ИИ очищен')
    }

    /**
     * Получение размера кэша
     */
    getCacheInfo(): {
        size: number
        entries: Array<{
            key: string
            expiresAt: Date
            hitCount: number
        }>
    } {
        const entries = Array.from(this.responseCache.values()).map(cached => ({
            key: cached.key,
            expiresAt: cached.expiresAt,
            hitCount: cached.hitCount
        }))

        return {
            size: this.responseCache.size,
            entries
        }
    }

    /**
     * Предзагрузка моделей
     */
    async preloadModels(): Promise<boolean> {
        try {
            console.log('🚀 Предзагрузка моделей ИИ...')

            const config = this.ollamaService.getConfig()
            const modelsToLoad = Object.values(config.models)

            for (const model of modelsToLoad) {
                console.log(`📥 Загрузка модели: ${model}`)
                await this.ollamaService.loadModel(model)
            }

            console.log('✅ Все модели загружены')
            return true
        } catch (error) {
            console.error('❌ Ошибка предзагрузки моделей:', error)
            return false
        }
    }

    /**
     * Установка настроек мастера игры
     */
    async setGameMasterSettings(
        sessionId: string,
        settings: GameMasterSettings
    ): Promise<void> {
        try {
            // TODO: Сохранить настройки в базу данных для сессии
            console.log(`⚙️ Настройки ИИ мастера обновлены для сессии ${sessionId}`)
        } catch (error) {
            console.error('Error setting GM settings:', error)
            throw new AIMasterError('Ошибка при сохранении настроек мастера игры')
        }
    }

    /**
     * Экспорт истории взаимодействий
     */
    async exportInteractionHistory(sessionId: string): Promise<AIInteractionHistory> {
        try {
            // TODO: Реализовать экспорт из базы данных
            return {
                sessionId,
                interactions: []
            }
        } catch (error) {
            console.error('Error exporting interaction history:', error)
            throw new AIMasterError('Ошибка при экспорте истории взаимодействий')
        }
    }

    /**
     * Получение рекомендаций для улучшения игры
     */
    async getGameplayRecommendations(sessionId: string): Promise<{
        recommendations: string[]
        insights: string[]
    }> {
        try {
            // Анализируем последние действия и генерируем рекомендации
            const context = await this.sessionService.getAIContext(sessionId)

            const request: AIRequestDto = {
                sessionId,
                requestType: 'consequence_analysis',
                additionalContext: {
                    analysisType: 'gameplay_recommendations'
                },
                constraints: {
                    tone: 'helpful',
                    maxLength: 400
                }
            }

            const response = await this.processPlayerAction(request)

            return {
                recommendations: [response.content],
                insights: ['Анализ основан на последних действиях игроков']
            }
        } catch (error) {
            console.error('Error getting gameplay recommendations:', error)
            return {
                recommendations: ['Продолжайте исследовать мир и взаимодействовать с NPC'],
                insights: ['Недостаточно данных для анализа']
            }
        }
    }

    /**
     * Тестирование ИИ с примером запроса
     */
    async testAI(sessionId: string): Promise<{
        success: boolean
        response?: string
        error?: string
        latency: number
    }> {
        const startTime = Date.now()

        try {
            const testRequest: AIRequestDto = {
                sessionId,
                requestType: 'scene_description',
                additionalContext: {
                    locationName: 'Тестовая локация',
                    testing: true
                }
            }

            const response = await this.processPlayerAction(testRequest)
            const latency = Date.now() - startTime

            return {
                success: true,
                response: response.content,
                latency
            }
        } catch (error) {
            const latency = Date.now() - startTime

            return {
                success: false,
                error: error instanceof Error ? error.message : 'Неизвестная ошибка',
                latency
            }
        }
    }
}