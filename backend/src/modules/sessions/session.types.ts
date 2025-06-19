// backend/src/modules/sessions/session.types.ts
import { z } from 'zod'

// Основные типы для игровых сессий
export interface GameSession {
    id: string
    name: string
    description?: string
    maxPlayers: number
    isActive: boolean
    currentScene: string
    worldState: WorldState
    gameSettings: GameSettings
    mapImage?: string
    sceneImage?: string
    createdAt: Date
    updatedAt: Date
}

// Состояние игрового мира
export interface WorldState {
    currentLocation: string
    timeOfDay: 'morning' | 'afternoon' | 'evening' | 'night'
    weather: string
    inCombat: boolean
    combatRound?: number
    currentTurn?: number
    initiativeOrder?: InitiativeEntry[]
    activeQuests: string[] // IDs активных квестов
    completedQuests: string[]
    globalFlags: Record<string, any> // Флаги для отслеживания событий
    npcsInLocation: string[] // IDs NPC в текущей локации
}

// Настройки игры
export interface GameSettings {
    allowPvP: boolean
    useOptionalRules: string[]
    experienceMode: 'standard' | 'milestone' | 'slow' | 'fast'
    restVariant: 'standard' | 'gritty' | 'heroic'
    hitPointVariant: 'fixed' | 'average' | 'rolled'
    criticalHitVariant: 'standard' | 'brutal'
    difficultyLevel: 'easy' | 'normal' | 'hard' | 'deadly'
    autoLevelUp: boolean
    playerRollsInitiative: boolean
}

// Участник сессии
export interface SessionPlayer {
    id: string
    sessionId: string
    characterId: string
    userId: string
    isGameMaster: boolean
    joinedAt: Date
    character?: {
        id: string
        name: string
        class: string
        level: number
        currentHP: number
        maxHP: number
    }
    user?: {
        username: string
    }
}

// Запись инициативы
export interface InitiativeEntry {
    characterId: string
    characterName: string
    playerId: string
    initiative: number
    hasActed: boolean
    isNPC: boolean
}

// Лог действий
export interface ActionLog {
    id: string
    sessionId: string
    characterId?: string
    actionType: ActionType
    content: string
    metadata?: Record<string, any>
    diceRolls?: DiceRollRecord[]
    timestamp: Date
}

export type ActionType =
    | 'player_action'
    | 'ai_response'
    | 'dice_roll'
    | 'chat_message'
    | 'system_message'
    | 'combat_action'
    | 'skill_check'
    | 'saving_throw'
    | 'scene_change'
    | 'quest_update'

// Запись броска кубиков
export interface DiceRollRecord {
    type: string
    result: number
    modifier: number
    total: number
    purpose: string
    advantage?: boolean
    disadvantage?: boolean
    critical?: boolean
}

// DTO для создания сессии
export const CreateSessionSchema = z.object({
    name: z.string()
        .min(1, 'Название сессии обязательно')
        .max(100, 'Название не должно превышать 100 символов'),
    description: z.string().max(500, 'Описание не должно превышать 500 символов').optional(),
    maxPlayers: z.number().min(1).max(8).default(6),
    gameSettings: z.object({
        allowPvP: z.boolean().default(false),
        useOptionalRules: z.array(z.string()).default([]),
        experienceMode: z.enum(['standard', 'milestone', 'slow', 'fast']).default('standard'),
        restVariant: z.enum(['standard', 'gritty', 'heroic']).default('standard'),
        hitPointVariant: z.enum(['fixed', 'average', 'rolled']).default('average'),
        criticalHitVariant: z.enum(['standard', 'brutal']).default('standard'),
        difficultyLevel: z.enum(['easy', 'normal', 'hard', 'deadly']).default('normal'),
        autoLevelUp: z.boolean().default(false),
        playerRollsInitiative: z.boolean().default(true)
    }).optional()
})

export type CreateSessionDto = z.infer<typeof CreateSessionSchema>

// DTO для обновления сессии
export const UpdateSessionSchema = z.object({
    name: z.string().min(1).max(100).optional(),
    description: z.string().max(500).optional(),
    maxPlayers: z.number().min(1).max(8).optional(),
    isActive: z.boolean().optional(),
    currentScene: z.string().optional(),
    gameSettings: z.object({
        allowPvP: z.boolean(),
        useOptionalRules: z.array(z.string()),
        experienceMode: z.enum(['standard', 'milestone', 'slow', 'fast']),
        restVariant: z.enum(['standard', 'gritty', 'heroic']),
        hitPointVariant: z.enum(['fixed', 'average', 'rolled']),
        criticalHitVariant: z.enum(['standard', 'brutal']),
        difficultyLevel: z.enum(['easy', 'normal', 'hard', 'deadly']),
        autoLevelUp: z.boolean(),
        playerRollsInitiative: z.boolean()
    }).partial().optional(),
    worldState: z.object({
        currentLocation: z.string(),
        timeOfDay: z.enum(['morning', 'afternoon', 'evening', 'night']),
        weather: z.string(),
        inCombat: z.boolean(),
        combatRound: z.number().optional(),
        currentTurn: z.number().optional(),
        activeQuests: z.array(z.string()),
        completedQuests: z.array(z.string()),
        globalFlags: z.record(z.any()),
        npcsInLocation: z.array(z.string())
    }).partial().optional()
})

export type UpdateSessionDto = z.infer<typeof UpdateSessionSchema>

// DTO для присоединения к сессии
export const JoinSessionSchema = z.object({
    characterId: z.string().min(1, 'ID персонажа обязателен')
})

export type JoinSessionDto = z.infer<typeof JoinSessionSchema>

// DTO для логирования действий
export const LogActionSchema = z.object({
    sessionId: z.string().min(1),
    characterId: z.string().optional(),
    actionType: z.enum(['player_action', 'ai_response', 'dice_roll', 'chat_message', 'system_message', 'combat_action', 'skill_check', 'saving_throw', 'scene_change', 'quest_update']),
    content: z.string().min(1),
    metadata: z.record(z.any()).optional(),
    diceRolls: z.array(z.object({
        type: z.string(),
        result: z.number(),
        modifier: z.number(),
        total: z.number(),
        purpose: z.string(),
        advantage: z.boolean().optional(),
        disadvantage: z.boolean().optional(),
        critical: z.boolean().optional()
    })).optional()
})

export type LogActionDto = z.infer<typeof LogActionSchema>

// DTO для управления инициативой
export const InitiativeSchema = z.object({
    sessionId: z.string().min(1),
    entries: z.array(z.object({
        characterId: z.string(),
        characterName: z.string(),
        playerId: z.string(),
        initiative: z.number().min(1).max(50),
        isNPC: z.boolean().default(false)
    }))
})

export type InitiativeDto = z.infer<typeof InitiativeSchema>

// DTO для изменения сцены
export const SceneChangeSchema = z.object({
    sessionId: z.string().min(1),
    newScene: z.string().min(1),
    description: z.string().min(1),
    location: z.string().optional(),
    imagePrompt: z.string().optional() // Для генерации изображения
})

export type SceneChangeDto = z.infer<typeof SceneChangeSchema>

// Полная информация о сессии для клиента
export interface SessionDetails extends GameSession {
    players: SessionPlayer[]
    actionLogs: ActionLog[]
    myCharacter?: SessionPlayer
    canJoin: boolean
    isPlayer: boolean
    isGameMaster: boolean
}

// Ошибки модуля сессий
export class SessionError extends Error {
    constructor(
        message: string,
        public statusCode: number = 400
    ) {
        super(message)
        this.name = 'SessionError'
    }
}

// Результат броска инициативы
export interface InitiativeRollResult {
    characterId: string
    characterName: string
    roll: number
    modifier: number
    total: number
}

// Статус боя
export interface CombatStatus {
    inCombat: boolean
    round: number
    turn: number
    currentCharacter?: InitiativeEntry
    initiativeOrder: InitiativeEntry[]
}

// Результат хода в бою
export interface TurnResult {
    characterId: string
    actions: string[]
    diceRolls: DiceRollRecord[]
    damage?: {
        target: string
        amount: number
        type: string
    }[]
    effects?: {
        target: string
        effect: string
        duration: number
    }[]
}

// Типы для интеграции с ИИ
export interface AIContext {
    sessionId: string
    currentScene: string
    worldState: WorldState
    recentActions: ActionLog[]
    activeCharacters: SessionPlayer[]
    location: {
        name: string
        description: string
        npcs: string[]
    }
}