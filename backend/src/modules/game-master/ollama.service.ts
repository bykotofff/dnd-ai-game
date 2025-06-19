// backend/src/modules/game-master/ollama.service.ts
import axios, { AxiosInstance } from 'axios'
import {
    OllamaConfig,
    AIModelConfig,
    AIMasterError,
    AIProcessingResult,
    AIResponse,
    AIRequestType
} from './ai-master.types'

export class OllamaService {
    private client: AxiosInstance
    private config: OllamaConfig
    private modelConfigs: Map<AIRequestType, AIModelConfig>

    constructor() {
        this.config = {
            baseUrl: process.env.OLLAMA_URL || 'http://localhost:11434',
            defaultModel: process.env.OLLAMA_MODEL || 'qwen2.5:14b',
            timeout: 60000, // 60 секунд
            maxRetries: 3,
            models: {
                story: process.env.OLLAMA_STORY_MODEL || 'qwen2.5:14b',
                dialogue: process.env.OLLAMA_DIALOGUE_MODEL || 'qwen2.5:14b',
                combat: process.env.OLLAMA_COMBAT_MODEL || 'qwen2.5:7b',
                quest: process.env.OLLAMA_QUEST_MODEL || 'qwen2.5:14b'
            }
        }

        this.client = axios.create({
            baseURL: this.config.baseUrl,
            timeout: this.config.timeout,
            headers: {
                'Content-Type': 'application/json'
            }
        })

        this.initializeModelConfigs()
    }

    /**
     * Инициализация конфигураций моделей для разных типов запросов
     */
    private initializeModelConfigs(): void {
        this.modelConfigs = new Map([
            ['player_action_response', {
                modelName: this.config.models.story,
                temperature: 0.8,
                maxTokens: 300,
                topP: 0.9,
                repeatPenalty: 1.1,
                contextWindow: 4096
            }],
            ['scene_description', {
                modelName: this.config.models.story,
                temperature: 0.9,
                maxTokens: 400,
                topP: 0.95,
                repeatPenalty: 1.05,
                contextWindow: 4096
            }],
            ['npc_dialogue', {
                modelName: this.config.models.dialogue,
                temperature: 0.7,
                maxTokens: 200,
                topP: 0.85,
                repeatPenalty: 1.15,
                contextWindow: 2048
            }],
            ['combat_narration', {
                modelName: this.config.models.combat,
                temperature: 0.6,
                maxTokens: 150,
                topP: 0.8,
                repeatPenalty: 1.2,
                contextWindow: 1024
            }],
            ['quest_generation', {
                modelName: this.config.models.quest,
                temperature: 0.8,
                maxTokens: 500,
                topP: 0.9,
                repeatPenalty: 1.0,
                contextWindow: 4096
            }],
            ['story_progression', {
                modelName: this.config.models.story,
                temperature: 0.75,
                maxTokens: 350,
                topP: 0.88,
                repeatPenalty: 1.1,
                contextWindow: 4096
            }],
            ['world_building', {
                modelName: this.config.models.story,
                temperature: 0.85,
                maxTokens: 400,
                topP: 0.92,
                repeatPenalty: 1.05,
                contextWindow: 4096
            }],
            ['random_encounter', {
                modelName: this.config.models.story,
                temperature: 0.9,
                maxTokens: 300,
                topP: 0.95,
                repeatPenalty: 1.1,
                contextWindow: 2048
            }],
            ['consequence_analysis', {
                modelName: this.config.models.story,
                temperature: 0.5,
                maxTokens: 250,
                topP: 0.7,
                repeatPenalty: 1.2,
                contextWindow: 2048
            }]
        ])
    }

    /**
     * Генерация ответа с помощью Ollama
     */
    async generateResponse(
        prompt: string,
        requestType: AIRequestType,
        customConfig?: Partial<AIModelConfig>
    ): Promise<AIProcessingResult> {
        const startTime = Date.now()

        try {
            const modelConfig = this.getModelConfig(requestType, customConfig)

            const requestData = {
                model: modelConfig.modelName,
                prompt: prompt,
                options: {
                    temperature: modelConfig.temperature,
                    top_p: modelConfig.topP,
                    repeat_penalty: modelConfig.repeatPenalty,
                    num_predict: modelConfig.maxTokens
                },
                stream: false
            }

            console.log(`🤖 Отправка запроса к Ollama: ${requestType}`)

            const response = await this.makeRequestWithRetries(requestData)
            const processingTime = Date.now() - startTime

            const aiResponse: AIResponse = {
                id: `ai_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                requestType,
                content: response.response.trim(),
                metadata: {
                    processingTime,
                    modelUsed: modelConfig.modelName,
                    tokenCount: this.estimateTokenCount(response.response),
                    confidence: this.calculateConfidence(response)
                },
                timestamp: new Date()
            }

            console.log(`✅ Ollama ответил за ${processingTime}ms`)

            return {
                success: true,
                response: aiResponse
            }

        } catch (error) {
            console.error('Ollama request failed:', error)

            return {
                success: false,
                error: error instanceof Error ? error.message : 'Неизвестная ошибка',
                retryAfter: this.calculateRetryDelay(error)
            }
        }
    }

    /**
     * Стриминг ответа (для длинных текстов)
     */
    async generateStreamingResponse(
        prompt: string,
        requestType: AIRequestType,
        onChunk: (chunk: string) => void,
        customConfig?: Partial<AIModelConfig>
    ): Promise<AIProcessingResult> {
        const startTime = Date.now()

        try {
            const modelConfig = this.getModelConfig(requestType, customConfig)

            const requestData = {
                model: modelConfig.modelName,
                prompt: prompt,
                options: {
                    temperature: modelConfig.temperature,
                    top_p: modelConfig.topP,
                    repeat_penalty: modelConfig.repeatPenalty,
                    num_predict: modelConfig.maxTokens
                },
                stream: true
            }

            const response = await this.client.post('/api/generate', requestData, {
                responseType: 'stream'
            })

            let fullResponse = ''

            return new Promise((resolve, reject) => {
                response.data.on('data', (chunk: Buffer) => {
                    const lines = chunk.toString().split('\n').filter(line => line.trim())

                    for (const line of lines) {
                        try {
                            const data = JSON.parse(line)
                            if (data.response) {
                                fullResponse += data.response
                                onChunk(data.response)
                            }

                            if (data.done) {
                                const processingTime = Date.now() - startTime

                                const aiResponse: AIResponse = {
                                    id: `ai_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                                    requestType,
                                    content: fullResponse.trim(),
                                    metadata: {
                                        processingTime,
                                        modelUsed: modelConfig.modelName,
                                        tokenCount: this.estimateTokenCount(fullResponse)
                                    },
                                    timestamp: new Date()
                                }

                                resolve({
                                    success: true,
                                    response: aiResponse
                                })
                            }
                        } catch (parseError) {
                            // Игнорируем ошибки парсинга отдельных чанков
                        }
                    }
                })

                response.data.on('error', (error: Error) => {
                    reject({
                        success: false,
                        error: error.message
                    })
                })
            })

        } catch (error) {
            console.error('Ollama streaming request failed:', error)

            return {
                success: false,
                error: error instanceof Error ? error.message : 'Ошибка стриминга'
            }
        }
    }

    /**
     * Проверка доступности Ollama
     */
    async checkHealth(): Promise<boolean> {
        try {
            const response = await this.client.get('/api/tags', { timeout: 5000 })
            return response.status === 200
        } catch (error) {
            console.error('Ollama health check failed:', error)
            return false
        }
    }

    /**
     * Получение списка доступных моделей
     */
    async getAvailableModels(): Promise<string[]> {
        try {
            const response = await this.client.get('/api/tags')
            return response.data.models?.map((model: any) => model.name) || []
        } catch (error) {
            console.error('Failed to get models:', error)
            return []
        }
    }

    /**
     * Загрузка модели (если не загружена)
     */
    async loadModel(modelName: string): Promise<boolean> {
        try {
            console.log(`📥 Загрузка модели: ${modelName}`)

            const response = await this.client.post('/api/generate', {
                model: modelName,
                prompt: 'test',
                options: { num_predict: 1 }
            })

            return response.status === 200
        } catch (error) {
            console.error(`Failed to load model ${modelName}:`, error)
            return false
        }
    }

    /**
     * Получение информации о модели
     */
    async getModelInfo(modelName: string): Promise<any> {
        try {
            const response = await this.client.post('/api/show', { name: modelName })
            return response.data
        } catch (error) {
            console.error(`Failed to get model info for ${modelName}:`, error)
            return null
        }
    }

    // === Приватные методы ===

    /**
     * Получение конфигурации модели для типа запроса
     */
    private getModelConfig(
        requestType: AIRequestType,
        customConfig?: Partial<AIModelConfig>
    ): AIModelConfig {
        const baseConfig = this.modelConfigs.get(requestType) || {
            modelName: this.config.defaultModel,
            temperature: 0.7,
            maxTokens: 200,
            topP: 0.9,
            repeatPenalty: 1.1,
            contextWindow: 2048
        }

        return { ...baseConfig, ...customConfig }
    }

    /**
     * Выполнение запроса с повторными попытками
     */
    private async makeRequestWithRetries(requestData: any, attempt: number = 1): Promise<any> {
        try {
            const response = await this.client.post('/api/generate', requestData)
            return response.data
        } catch (error) {
            if (attempt < this.config.maxRetries) {
                const delay = Math.pow(2, attempt) * 1000 // Экспоненциальная задержка
                console.log(`Повторная попытка ${attempt + 1} через ${delay}ms`)

                await new Promise(resolve => setTimeout(resolve, delay))
                return this.makeRequestWithRetries(requestData, attempt + 1)
            }

            throw error
        }
    }

    /**
     * Оценка количества токенов (приблизительно)
     */
    private estimateTokenCount(text: string): number {
        // Грубая оценка: ~4 символа на токен для русского текста
        return Math.ceil(text.length / 4)
    }

    /**
     * Расчет уверенности в ответе
     */
    private calculateConfidence(response: any): number {
        // Простая эвристика на основе длины ответа и наличия специальных символов
        const text = response.response || ''

        if (text.length < 10) return 0.3
        if (text.includes('?') && text.length < 50) return 0.5
        if (text.length > 100 && text.includes('.')) return 0.9

        return 0.7
    }

    /**
     * Расчет задержки перед повторной попыткой
     */
    private calculateRetryDelay(error: any): number {
        if (error?.response?.status === 429) return 30000 // Rate limit
        if (error?.code === 'ECONNREFUSED') return 10000 // Connection refused
        return 5000 // Default delay
    }

    /**
     * Очистка контекста модели
     */
    async clearModelContext(modelName?: string): Promise<boolean> {
        try {
            // Ollama не имеет прямого API для очистки контекста
            // Отправляем пустой запрос для сброса состояния
            await this.client.post('/api/generate', {
                model: modelName || this.config.defaultModel,
                prompt: '',
                options: { num_predict: 0 }
            })

            return true
        } catch (error) {
            console.error('Failed to clear model context:', error)
            return false
        }
    }

    /**
     * Получение статистики использования
     */
    getUsageStats(): {
        totalRequests: number
        averageResponseTime: number
        errorRate: number
    } {
        // TODO: Реализовать сбор статистики
        return {
            totalRequests: 0,
            averageResponseTime: 0,
            errorRate: 0
        }
    }

    /**
     * Обновление конфигурации
     */
    updateConfig(newConfig: Partial<OllamaConfig>): void {
        this.config = { ...this.config, ...newConfig }

        // Пересоздаем клиент с новыми настройками
        this.client = axios.create({
            baseURL: this.config.baseUrl,
            timeout: this.config.timeout,
            headers: {
                'Content-Type': 'application/json'
            }
        })
    }

    /**
     * Получение текущей конфигурации
     */
    getConfig(): OllamaConfig {
        return { ...this.config }
    }
}