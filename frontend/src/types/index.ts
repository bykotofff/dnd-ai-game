// frontend/src/types/index.ts

// === API Response Types ===
export interface ApiResponse<T = any> {
    success: boolean
    data?: T
    error?: string
    message?: string
    details?: Array<{
        field: string
        message: string
    }>
}

// === Authentication Types ===
export interface User {
    id: string
    email: string
    username: string
    createdAt: string
}

export interface AuthResponse {
    user: User
    token: string
}

export interface LoginCredentials {
    email: string
    password: string
}

export interface RegisterCredentials {
    email: string
    username: string
    password: string
}

// === Character Types ===
export interface AbilityScores {
    strength: number
    dexterity: number
    constitution: number
    intelligence: number
    wisdom: number
    charisma: number
}

export interface Character {
    id: string
    userId: string
    name: string
    race: string
    class: string
    level: number
    experience: number
    abilityScores: AbilityScores
    currentHP: number
    maxHP: number
    temporaryHP: number
    armorClass: number
    initiative: number
    speed: number
    skills: Record<string, { proficient: boolean; expertise: boolean }>
    equipment: Equipment[]
    features: Feature[]
    personalityTraits: PersonalityTraits
    backstory: string
    motivation: string
    alignment: string
    profileImage?: string
    createdAt: string
    updatedAt: string
}

export interface Equipment {
    id: string
    name: string
    type: 'weapon' | 'armor' | 'shield' | 'tool' | 'consumable' | 'treasure' | 'other'
    quantity: number
    weight: number
    value: number
    description: string
    properties?: string[]
    equipped?: boolean
    damage?: {
        dice: string
        type: string
    }
    armorClass?: number
}

export interface Feature {
    id: string
    name: string
    description: string
    source: 'race' | 'class' | 'background' | 'feat'
    level?: number
    uses?: {
        max: number
        used: number
        resetOn: 'short rest' | 'long rest' | 'dawn' | 'manual'
    }
}

export interface PersonalityTraits {
    traits: string[]
    ideals: string[]
    bonds: string[]
    flaws: string[]
}

// === Game Session Types ===
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
    createdAt: string
    updatedAt: string
}

export interface WorldState {
    currentLocation: string
    timeOfDay: 'morning' | 'afternoon' | 'evening' | 'night'
    weather: string
    inCombat: boolean
    combatRound?: number
    currentTurn?: number
    initiativeOrder?: InitiativeEntry[]
    activeQuests: string[]
    completedQuests: string[]
    globalFlags: Record<string, any>
    npcsInLocation: string[]
}

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

export interface SessionPlayer {
    id: string
    sessionId: string
    characterId: string
    userId: string
    isGameMaster: boolean
    joinedAt: string
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

export interface InitiativeEntry {
    characterId: string
    characterName: string
    playerId: string
    initiative: number
    hasActed: boolean
    isNPC: boolean
}

// === Action Log Types ===
export interface ActionLog {
    id: string
    sessionId: string
    characterId?: string
    actionType: 'player_action' | 'ai_response' | 'dice_roll' | 'chat_message' | 'system_message' | 'combat_action' | 'skill_check' | 'saving_throw' | 'scene_change' | 'quest_update'
    content: string
    metadata?: Record<string, any>
    diceRolls?: DiceRollRecord[]
    timestamp: string
}

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

// === AI Master Types ===
export interface AIResponse {
    id: string
    requestType: string
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
    timestamp: string
}

export interface AIActionSuggestion {
    type: 'skill_check' | 'attack' | 'dialogue' | 'exploration' | 'rest'
    description: string
    difficulty?: number
    consequences?: string[]
}

export interface DiceRollRequirement {
    type: string
    purpose: string
    dc?: number
    advantage?: boolean
    disadvantage?: boolean
    modifier?: number
}

export interface SceneUpdate {
    type: 'location_change' | 'time_change' | 'weather_change' | 'npc_arrival' | 'event'
    description: string
    newValue?: string
}

export interface QuestUpdate {
    questId?: string
    type: 'progress' | 'completion' | 'failure' | 'new_objective'
    description: string
    newObjective?: string
}

// === Socket.IO Types ===
export interface SocketGameAction {
    type: 'player_action' | 'dice_roll' | 'chat_message' | 'status_update'
    playerId: string
    sessionId: string
    content: string
    metadata?: any
    timestamp: Date
}

export interface SocketDiceRoll {
    type: string
    result: number
    modifier: number
    total: number
    purpose: string
    characterId: string
    advantage?: boolean
    disadvantage?: boolean
}

export interface SocketChatMessage {
    sessionId: string
    message: string
    type?: 'ic' | 'ooc' | 'whisper' | 'system'
    targetPlayerId?: string
}

// === Dice Types ===
export interface DiceRoll {
    id: string
    type: 'd4' | 'd6' | 'd8' | 'd10' | 'd12' | 'd20' | 'd100'
    result: number
    modifier: number
    total: number
    advantage?: boolean
    disadvantage?: boolean
    critical?: boolean
    timestamp: Date
}

export interface DiceRollResult {
    rolls: number[]
    modifier: number
    total: number
    advantage?: boolean
    disadvantage?: boolean
    critical?: boolean
}

// === UI State Types ===
export interface UIState {
    theme: 'light' | 'dark'
    sidebarOpen: boolean
    characterSheetTab: string
    gameViewMode: 'chat' | 'map' | 'combat'
    notifications: Notification[]
}

export interface Notification {
    id: string
    type: 'info' | 'success' | 'warning' | 'error'
    title: string
    message: string
    duration?: number
    timestamp: Date
}

// === Form Types ===
export interface CreateCharacterForm {
    name: string
    race: string
    class: string
    abilityScores: AbilityScores
    backstory: string
    motivation: string
    alignment: string
    selectedSkills?: string[]
    personalityTraits?: PersonalityTraits
}

export interface CreateSessionForm {
    name: string
    description?: string
    maxPlayers: number
    gameSettings?: Partial<GameSettings>
}

export interface JoinSessionForm {
    characterId: string
}

// === Quest Types ===
export interface Quest {
    id: string
    sessionId: string
    title: string
    description: string
    type: 'MAIN' | 'SIDE' | 'PERSONAL'
    status: 'ACTIVE' | 'COMPLETED' | 'FAILED' | 'PAUSED'
    priority: number
    objectives: QuestObjective[]
    rewards: QuestReward[]
    relatedNPCs?: string[]
    location?: string
    createdAt: string
    updatedAt: string
}

export interface QuestObjective {
    id: string
    description: string
    completed: boolean
    optional: boolean
}

export interface QuestReward {
    type: 'experience' | 'gold' | 'item' | 'favor'
    amount?: number
    description: string
}

// === NPC Types ===
export interface NPC {
    id: string
    sessionId: string
    name: string
    description: string
    personality: string
    stats?: Record<string, number>
    alignment?: string
    occupation?: string
    dialogueTree?: DialogueNode[]
    questGiver: boolean
    image?: string
    location?: string
}

export interface DialogueNode {
    id: string
    text: string
    responses: DialogueResponse[]
    conditions?: Record<string, any>
    effects?: Record<string, any>
}

export interface DialogueResponse {
    id: string
    text: string
    nextNodeId?: string
    requirements?: Record<string, any>
    effects?: Record<string, any>
}

// === Combat Types ===
export interface CombatState {
    inCombat: boolean
    round: number
    turn: number
    currentCharacter?: InitiativeEntry
    initiativeOrder: InitiativeEntry[]
}

export interface CombatAction {
    type: 'attack' | 'spell' | 'move' | 'dodge' | 'help' | 'hide' | 'ready' | 'search'
    characterId: string
    targetId?: string
    description: string
    rollRequired?: boolean
    damage?: {
        dice: string
        type: string
        modifier: number
    }
}

// === Utility Types ===
export interface LoadingState {
    isLoading: boolean
    error?: string
}

export interface PaginatedResponse<T> {
    data: T[]
    total: number
    page: number
    limit: number
    hasNext: boolean
    hasPrev: boolean
}

export interface SelectOption {
    value: string
    label: string
    disabled?: boolean
}

// === Константы ===
export const DICE_TYPES = ['d4', 'd6', 'd8', 'd10', 'd12', 'd20', 'd100'] as const
export type DiceType = typeof DICE_TYPES[number]

export const ABILITY_NAMES = ['strength', 'dexterity', 'constitution', 'intelligence', 'wisdom', 'charisma'] as const
export type AbilityName = typeof ABILITY_NAMES[number]

export const CHARACTER_CLASSES = [
    'BARBARIAN', 'BARD', 'CLERIC', 'DRUID', 'FIGHTER',
    'MONK', 'PALADIN', 'RANGER', 'ROGUE', 'SORCERER',
    'WARLOCK', 'WIZARD'
] as const
export type CharacterClass = typeof CHARACTER_CLASSES[number]

export const CHARACTER_RACES = [
    'HUMAN', 'ELF', 'DWARF', 'HALFLING', 'DRAGONBORN',
    'GNOME', 'HALF_ELF', 'HALF_ORC', 'TIEFLING'
] as const
export type CharacterRace = typeof CHARACTER_RACES[number]

export const ALIGNMENTS = [
    'Законно-добрый', 'Нейтрально-добрый', 'Хаотично-добрый',
    'Законно-нейтральный', 'Истинно нейтральный', 'Хаотично-нейтральный',
    'Законно-злой', 'Нейтрально-злой', 'Хаотично-злой'
] as const
export type Alignment = typeof ALIGNMENTS[number]

// === Хуки типы ===
export interface UseApiOptions {
    enabled?: boolean
    refetchOnWindowFocus?: boolean
    staleTime?: number
    cacheTime?: number
}

export interface UseSocketOptions {
    autoConnect?: boolean
    reconnection?: boolean
    timeout?: number
}

// === Store типы ===
export interface AuthStore {
    user: User | null
    token: string | null
    isAuthenticated: boolean
    isLoading: boolean
    login: (credentials: LoginCredentials) => Promise<void>
    register: (credentials: RegisterCredentials) => Promise<void>
    logout: () => void
    checkAuth: () => Promise<void>
}

export interface GameStore {
    currentSession: GameSession | null
    characters: Character[]
    selectedCharacter: Character | null
    isConnected: boolean
    actionLog: ActionLog[]
    setCurrentSession: (session: GameSession | null) => void
    setSelectedCharacter: (character: Character | null) => void
    addActionLog: (action: ActionLog) => void
    updateCharacter: (character: Character) => void
}

export interface UIStore {
    theme: 'light' | 'dark'
    sidebarOpen: boolean
    notifications: Notification[]
    toggleTheme: () => void
    toggleSidebar: () => void
    addNotification: (notification: Omit<Notification, 'id' | 'timestamp'>) => void
    removeNotification: (id: string) => void
}