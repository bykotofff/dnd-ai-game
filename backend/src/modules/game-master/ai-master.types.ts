// backend/src/modules/game-master/ai-master.types.ts
import { z } from 'zod'

// Типы запросов к ИИ мастеру
export type AIRequestType =
    | 'story_narration'    // Повествование
    | 'npc_dialogue'       // Диалоги NPC
    | 'combat_description' // Описание боя
    | 'environment'        // Описание окружения
    | 'quest_generation'   // Генерация квестов
    | 'item_generation'    // Генерация предметов
    | 'random_encounter'   // Случайные встречи
    | 'world_building'     // Создание мира

// DTO для запроса к ИИ
export const AIRequestSchema = z.object({
    type: z.enum(['story_narration', 'npc_dialogue', 'combat_description', 'environment', 'quest_generation', 'item_generation', 'random_encounter', 'world_building']),
    sessionId: z.string().min(1, 'ID сессии обязателен'),
    userId: z.string().min(1, 'ID пользователя обязателен'),
    characterId: z.string().optional(),
    prompt: z.string().min(1, 'Промпт обязателен'),
    context: z.object({
        characters: z.array(z.any()).optional(),
        worldState: z.record(z.any()).optional(),
        previousActions: z.array(z.string()).optional(),
        currentScene: z.string().optional(),
        gameSettings: z.record(z.any()).optional()
    }).optional(),
    options: z.object({
        temperature: z.number().min(0).max(2).optional(),
        maxTokens: z.number().min(10).max(4000).optional(),
        model: z.string().optional(),
        language: z.enum(['ru', 'en']).optional()
    }).optional()
})

export type AIRequestDto = z.infer<typeof AIRequestSchema>

// Ответ от ИИ
export interface AIResponse {
    id: string
    sessionId: string
    type: AIRequestType
    content: string
    metadata: {
        model: string
        tokens: number
        responseTime: number
        temperature: number
        timestamp: Date
    }
    suggestions?: string[]
    relatedActions?: string[]
    mood: 'positive' | 'negative' | 'neutral'
}

// Статистика ИИ
export interface AIStats {
    totalRequests: number
    averageResponseTime: number
    totalTokensUsed: number
    responsesByType: Record<AIRequestType, number>
    playerSatisfactionRating: number
    successfulQuestGenerations: number
    uniqueNPCsCreated: number
}

// Кэш ответов ИИ
export interface AIResponseCache {
    key: string
    response: AIResponse
    expiresAt: Date
    hitCount: number
}

// Конфигурация для разных типов запросов
export interface AIRequestConfig {
    [K in AIRequestType]: {
        promptTemplate: string
        maxTokens: number
        temperature: number
        requiresContext: boolean
        cacheable: boolean
        priority: 'low' | 'medium' | 'high'
    }
}

// Ошибки ИИ модуля
export class AIMasterError extends Error {
    constructor(
        message: string,
        public statusCode: number = 500,
        public code?: string
    ) {
        super(message)
        this.name = 'AIMasterError'
    }
}

// Конфигурация Ollama
export interface OllamaConfig {
    baseUrl: string
    defaultModel: string
    timeout: number
    maxRetries: number
    models: {
        story: string      // Для повествования
        dialogue: string   // Для диалогов NPC
        combat: string     // Для боевых сцен
        quest: string      // Для генерации квестов
    }
}

// Результат обработки ИИ
export interface AIProcessingResult {
    success: boolean
    response?: AIResponse
    error?: string
    retryAfter?: number
    fallbackUsed?: boolean
}

// Очередь запросов к ИИ
export interface AIRequestQueue {
    id: string
    sessionId: string
    request: AIRequestDto
    priority: number
    createdAt: Date
    attempts: number
    status: 'pending' | 'processing' | 'completed' | 'failed'
}

// Настройки ИИ мастера для сессии
export interface GameMasterSettings {
    sessionId: string
    creativityLevel: number // 0-100
    difficultyPreference: 'easy' | 'medium' | 'hard'
    narrativeStyle: 'descriptive' | 'action' | 'roleplay' | 'tactical'
    allowAdultContent: boolean
    autoGenerateNPCs: boolean
    autoGenerateItems: boolean
    responseLength: 'short' | 'medium' | 'long'
    language: 'ru' | 'en'
}

// Промпт шаблон
export interface PromptTemplate {
    id: string
    name: string
    description: string
    template: string
    variables: string[]
    requestType: AIRequestType
    language: 'ru' | 'en'
    tags: string[]
    isActive: boolean
    createdAt: Date
    updatedAt: Date
}

// Контекст игровой сессии для ИИ
export interface SessionContext {
    sessionId: string
    worldState: Record<string, any>
    activeCharacters: Array<{
        id: string
        name: string
        class: string
        level: number
        currentHP: number
        maxHP: number
    }>
    currentScene: string
    recentActions: Array<{
        characterId: string
        action: string
        result: string
        timestamp: Date
    }>
    gameSettings: GameMasterSettings
}

// Метрики производительности ИИ
export interface AIPerformanceMetrics {
    averageResponseTime: number
    tokenUsagePerMinute: number
    errorRate: number
    cacheHitRate: number
    userSatisfactionScore: number
    requestsPerHour: number
}

// События ИИ мастера
export type AIMasterEvent =
    | 'ai_response_generated'
    | 'ai_request_queued'
    | 'ai_processing_started'
    | 'ai_error_occurred'
    | 'ai_cache_hit'
    | 'ai_model_loaded'

// Payload для событий
export interface AIMasterEventPayload {
    sessionId: string
    requestId: string
    type: AIRequestType
    timestamp: Date
    metadata?: Record<string, any>
}