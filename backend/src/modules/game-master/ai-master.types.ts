// backend/src/modules/game-master/ai-master.types.ts
import { z } from 'zod'
import { AIContext, ActionLog } from '@modules/sessions/session.types'

// Конфигурация ИИ модели
export interface AIModelConfig {
    modelName: string
    temperature: number
    maxTokens: number
    topP: number
    repeatPenalty: number
    contextWindow: number
}

// Типы запросов к ИИ
export type AIRequestType =
    | 'player_action_response'    // Ответ на действие игрока
    | 'scene_description'         // Описание сцены
    | 'npc_dialogue'             // Диалог NPC
    | 'combat_narration'         // Повествование в бою
    | 'quest_generation'         // Генерация квеста
    | 'story_progression'        // Развитие сюжета
    | 'world_building'           // Создание мира
    | 'random_encounter'         // Случайная встреча
    | 'consequence_analysis'     // Анализ последствий действий

// Контекст для запроса к ИИ
export interface AIRequestContext extends AIContext {
    requestType: AIRequestType
    playerAction?: string
    additionalContext?: Record<string, any>
    previousResponses?: AIResponse[]
    constraints?: AIConstraints
}

// Ограничения для ИИ
export interface AIConstraints {
    maxLength?: number
    tone?: 'serious' | 'humorous' | 'mysterious' | 'dramatic' | 'casual'
    includeChoices?: boolean
    requireDiceRoll?: boolean
    avoidTopics?: string[]
    focusOn?: string[]
    language?: 'russian' | 'english'
}

// Ответ ИИ мастера
export interface AIResponse {
    id: string
    requestType: AIRequestType
    content: string
    metadata: {
        processingTime: number
        modelUsed: string
        tokenCount: number
        confidence?: number
    }
    suggestions?: AIActionSuggestion[]
    diceRollsRequired?: DiceRollRequirement[]
    sceneUpdates?: SceneUpdate[]
    questUpdates?: QuestUpdate[]
    timestamp: Date
}

// Предложения действий от ИИ
export interface AIActionSuggestion {
    type: 'skill_check' | 'attack' | 'dialogue' | 'exploration' | 'rest'
    description: string
    difficulty?: number
    consequences?: string[]
}

// Требования к броскам костей
export interface DiceRollRequirement {
    type: string // 'd20', 'attack', 'damage', etc.
    purpose: string
    dc?: number // Difficulty Class
    advantage?: boolean
    disadvantage?: boolean
    modifier?: number
}

// Обновления сцены
export interface SceneUpdate {
    type: 'location_change' | 'time_change' | 'weather_change' | 'npc_arrival' | 'event'
    description: string
    newValue?: string
}

// Обновления квестов
export interface QuestUpdate {
    questId?: string
    type: 'progress' | 'completion' | 'failure' | 'new_objective'
    description: string
    newObjective?: string
}

// DTO для запроса к ИИ
export const AIRequestSchema = z.object({
    sessionId: z.string().min(1),
    requestType: z.enum([
        'player_action_response',
        'scene_description',
        'npc_dialogue',
        'combat_narration',
        'quest_generation',
        'story_progression',
        'world_building',
        'random_encounter',
        'consequence_analysis'
    ]),
    playerAction: z.string().optional(),
    characterId: z.string().optional(),
    additionalContext: z.record(z.any()).optional(),
    constraints: z.object({
        maxLength: z.number().optional(),
        tone: z.enum(['serious', 'humorous', 'mysterious', 'dramatic', 'casual']).optional(),
        includeChoices: z.boolean().optional(),
        requireDiceRoll: z.boolean().optional(),
        avoidTopics: z.array(z.string()).optional(),
        focusOn: z.array(z.string()).optional(),
        language: z.enum(['russian', 'english']).optional()
    }).optional()
})

export type AIRequestDto = z.infer<typeof AIRequestSchema>

// Система промптов
export interface PromptTemplate {
    id: string
    name: string
    description: string
    template: string
    variables: string[]
    requestType: AIRequestType
    language: 'russian' | 'english'
}

// Библиотека промптов
export interface PromptLibrary {
    [key: string]: PromptTemplate
}

// Настройки мастера игры
export interface GameMasterSettings {
    personality: 'strict' | 'lenient' | 'narrative' | 'tactical' | 'humorous'
    difficultyPreference: 'easy' | 'moderate' | 'challenging' | 'deadly'
    narrativeStyle: 'descriptive' | 'cinematic' | 'minimalist' | 'interactive'
    responseLength: 'brief' | 'moderate' | 'detailed' | 'extensive'
    allowPlayerCreativity: boolean
    enforceRules: boolean
    generateImages: boolean
    voiceNarration: boolean
}

// История взаимодействий с ИИ
export interface AIInteractionHistory {
    sessionId: string
    interactions: Array<{
        timestamp: Date
        request: AIRequestDto
        response: AIResponse
        playerFeedback?: 'positive' | 'negative' | 'neutral'
    }>
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