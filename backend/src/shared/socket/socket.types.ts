// backend/src/shared/socket/socket.types.ts

// События от клиента к серверу
export interface ClientToServerEvents {
    // Сессии
    join_session: (data: { sessionId: string }) => void
    leave_session: (data: { sessionId: string }) => void
    get_session_state: (data: { sessionId: string }) => void

    // Игровые действия
    game_action: (action: GameAction) => void
    dice_roll: (diceRoll: DiceRoll) => void
    chat_message: (data: ChatMessageData) => void
    character_update: (data: CharacterUpdateData) => void

    // Системные
    ping: () => void
}

// События от сервера к клиенту
export interface ServerToClientEvents {
    // Подключение
    connected: (data: { message: string; userId: string; socketId: string }) => void
    error: (data: { message: string }) => void

    // Сессии
    session_joined: (data: { sessionId: string; message: string }) => void
    session_state: (data: SessionStateData) => void
    player_joined: (data: PlayerJoinedData) => void
    player_left: (data: PlayerLeftData) => void

    // Игровые события
    game_action: (action: GameActionBroadcast) => void
    dice_roll: (rollResult: DiceRollResult) => void
    chat_message: (message: ChatMessage) => void
    character_update: (update: CharacterUpdateBroadcast) => void

    // Игровые механики
    player_turn: (data: PlayerTurnData) => void
    initiative_update: (data: InitiativeUpdateData) => void
    combat_state_change: (data: CombatStateData) => void
    scene_change: (data: SceneChangeData) => void
    quest_update: (data: QuestUpdateData) => void
    game_event: (data: GameEventData) => void

    // Системные
    pong: (data: { timestamp: number }) => void
    force_disconnect: (data: { reason: string }) => void
}

// Типы данных для событий

export interface GameAction {
    type: 'player_action' | 'dice_roll' | 'chat_message' | 'status_update'
    playerId: string
    sessionId: string
    content: string
    metadata?: Record<string, any>
    timestamp: Date
}

export interface GameActionBroadcast extends GameAction {
    playerName: string
}

export interface DiceRoll {
    type: string // d20, d6, d4, d8, d10, d12, d100
    result: number
    modifier: number
    total: number
    purpose: string // attack, skill_check, saving_throw, damage, etc.
    characterId: string
    advantage?: boolean
    disadvantage?: boolean
}

export interface DiceRollResult extends DiceRoll {
    playerId: string
    playerName: string
    timestamp: Date
}

export interface ChatMessageData {
    sessionId: string
    message: string
    type?: 'ic' | 'ooc' | 'whisper' | 'system'
    targetPlayerId?: string // для приватных сообщений
}

export interface ChatMessage extends ChatMessageData {
    playerId: string
    playerName: string
    timestamp: Date
}

export interface CharacterUpdateData {
    sessionId: string
    characterId: string
    updates: {
        currentHP?: number
        temporaryHP?: number
        conditions?: string[]
        position?: { x: number; y: number }
        equipment?: any[]
        [key: string]: any
    }
}

export interface CharacterUpdateBroadcast {
    characterId: string
    updates: CharacterUpdateData['updates']
    updatedBy: string
    timestamp: Date
}

export interface SessionStateData {
    session: {
        id: string
        name: string
        currentScene: string
        inCombat: boolean
        round?: number
        activePlayerId?: string
        players: Array<{
            id: string
            name: string
            characterId: string
            characterName: string
            online: boolean
        }>
    }
    connectedPlayers: string[]
    timestamp: Date
}

export interface PlayerJoinedData {
    userId: string
    username: string
    timestamp: Date
}

export interface PlayerLeftData {
    userId: string
    username: string
    timestamp: Date
}

export interface PlayerTurnData {
    playerId: string
    playerName: string
    message: string
    timestamp: Date
}

export interface InitiativeUpdateData {
    initiativeOrder: Array<{
        characterId: string
        characterName: string
        playerId: string
        initiative: number
        hasActed: boolean
    }>
    timestamp: Date
}

export interface CombatStateData {
    inCombat: boolean
    round?: number
    currentTurn?: number
    timestamp: Date
}

export interface SceneChangeData {
    scene: string
    description: string
    imageUrl?: string
    timestamp: Date
}

export interface QuestUpdateData {
    questId: string
    questName: string
    status: 'active' | 'completed' | 'failed'
    description?: string
    objectives?: Array<{
        id: string
        description: string
        completed: boolean
    }>
    timestamp: Date
}

export interface GameEventData {
    type: 'level_up' | 'item_found' | 'npc_interaction' | 'environmental' | 'system'
    data: Record<string, any>
    message?: string
    timestamp: Date
}

// Типы для состояний соединений
export interface ConnectionInfo {
    userId: string
    username: string
    socketId: string
    currentSessionId?: string
    connectedAt: Date
    lastActivity: Date
}

export interface SessionRoom {
    sessionId: string
    users: Set<string>
    createdAt: Date
    lastActivity: Date
}

// Типы ошибок
export interface SocketError {
    code: string
    message: string
    details?: Record<string, any>
}

// Константы для событий
export const SOCKET_EVENTS = {
    // Клиент -> Сервер
    JOIN_SESSION: 'join_session',
    LEAVE_SESSION: 'leave_session',
    GAME_ACTION: 'game_action',
    DICE_ROLL: 'dice_roll',
    CHAT_MESSAGE: 'chat_message',
    CHARACTER_UPDATE: 'character_update',
    GET_SESSION_STATE: 'get_session_state',
    PING: 'ping',

    // Сервер -> Клиент
    CONNECTED: 'connected',
    ERROR: 'error',
    SESSION_JOINED: 'session_joined',
    SESSION_STATE: 'session_state',
    PLAYER_JOINED: 'player_joined',
    PLAYER_LEFT: 'player_left',
    PLAYER_TURN: 'player_turn',
    INITIATIVE_UPDATE: 'initiative_update',
    COMBAT_STATE_CHANGE: 'combat_state_change',
    SCENE_CHANGE: 'scene_change',
    QUEST_UPDATE: 'quest_update',
    GAME_EVENT: 'game_event',
    PONG: 'pong',
    FORCE_DISCONNECT: 'force_disconnect'
} as const

// Типы для валидации данных
export const DICE_TYPES = ['d4', 'd6', 'd8', 'd10', 'd12', 'd20', 'd100'] as const
export type DiceType = typeof DICE_TYPES[number]

export const CHAT_MESSAGE_TYPES = ['ic', 'ooc', 'whisper', 'system'] as const
export type ChatMessageType = typeof CHAT_MESSAGE_TYPES[number]

export const GAME_ACTION_TYPES = ['player_action', 'dice_roll', 'chat_message', 'status_update'] as const
export type GameActionType = typeof GAME_ACTION_TYPES[number]