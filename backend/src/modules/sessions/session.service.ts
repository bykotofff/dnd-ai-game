// backend/src/modules/sessions/session.service.ts
import { db } from '@shared/database/database.service'
import {
    CreateSessionDto,
    UpdateSessionDto,
    JoinSessionDto,
    LogActionDto,
    InitiativeDto,
    SceneChangeDto,
    SessionDetails,
    GameSession,
    SessionPlayer,
    ActionLog,
    WorldState,
    GameSettings,
    InitiativeEntry,
    CombatStatus,
    InitiativeRollResult,
    SessionError,
    AIContext
} from './session.types'

export class SessionService {

    /**
     * Создание новой игровой сессии
     */
    async createSession(userId: string, data: CreateSessionDto): Promise<SessionDetails> {
        try {
            // Создаем начальное состояние мира
            const initialWorldState: WorldState = {
                currentLocation: 'Таверна "Шумная гарпия"',
                timeOfDay: 'evening',
                weather: 'Ясная погода',
                inCombat: false,
                activeQuests: [],
                completedQuests: [],
                globalFlags: {},
                npcsInLocation: ['tavern_keeper', 'mysterious_stranger']
            }

            // Настройки по умолчанию
            const defaultSettings: GameSettings = {
                allowPvP: false,
                useOptionalRules: [],
                experienceMode: 'standard',
                restVariant: 'standard',
                hitPointVariant: 'average',
                criticalHitVariant: 'standard',
                difficultyLevel: 'normal',
                autoLevelUp: false,
                playerRollsInitiative: true,
                ...data.gameSettings
            }

            // Создаем сессию в базе данных
            const session = await db.gameSession.create({
                data: {
                    name: data.name,
                    description: data.description || '',
                    maxPlayers: data.maxPlayers,
                    isActive: true,
                    currentScene: 'Партия собирается в уютной таверне, планируя свое следующее приключение.',
                    worldState: initialWorldState,
                    gameSettings: defaultSettings
                }
            })

            // Автоматически делаем создателя мастером игры
            await db.gameSessionPlayer.create({
                data: {
                    sessionId: session.id,
                    characterId: '', // Мастер игры не имеет персонажа
                    isGameMaster: true
                }
            })

            return this.getSessionDetails(session.id, userId)
        } catch (error) {
            console.error('Create session error:', error)
            throw new SessionError('Ошибка при создании игровой сессии')
        }
    }

    /**
     * Получение детальной информации о сессии
     */
    async getSessionDetails(sessionId: string, userId: string): Promise<SessionDetails> {
        try {
            const session = await db.gameSession.findUnique({
                where: { id: sessionId },
                include: {
                    players: {
                        include: {
                            character: {
                                select: {
                                    id: true,
                                    name: true,
                                    class: true,
                                    level: true,
                                    currentHP: true,
                                    maxHP: true
                                }
                            }
                        }
                    },
                    actionLogs: {
                        orderBy: { timestamp: 'desc' },
                        take: 50 // Последние 50 действий
                    }
                }
            })

            if (!session) {
                throw new SessionError('Игровая сессия не найдена', 404)
            }

            // Проверяем права доступа
            const userPlayer = session.players.find(p => p.userId === userId)
            const canJoin = !userPlayer && session.players.length < session.maxPlayers && session.isActive
            const isPlayer = !!userPlayer && !userPlayer.isGameMaster
            const isGameMaster = !!userPlayer && userPlayer.isGameMaster

            const sessionDetails: SessionDetails = {
                id: session.id,
                name: session.name,
                description: session.description,
                maxPlayers: session.maxPlayers,
                isActive: session.isActive,
                currentScene: session.currentScene,
                worldState: session.worldState as WorldState,
                gameSettings: session.gameSettings as GameSettings,
                mapImage: session.mapImage,
                sceneImage: session.sceneImage,
                createdAt: session.createdAt,
                updatedAt: session.updatedAt,
                players: session.players as SessionPlayer[],
                actionLogs: session.actionLogs as ActionLog[],
                myCharacter: userPlayer as SessionPlayer,
                canJoin,
                isPlayer,
                isGameMaster
            }

            return sessionDetails
        } catch (error) {
            if (error instanceof SessionError) {
                throw error
            }
            console.error('End combat error:', error)
            throw new SessionError('Ошибка при завершении боя')
        }
    }

    /**
     * Изменение сцены
     */
    async changeScene(data: SceneChangeDto, userId: string): Promise<void> {
        try {
            const isMaster = await this.checkGameMasterRights(data.sessionId, userId)
            if (!isMaster) {
                throw new SessionError('Только мастер игры может изменять сцену', 403)
            }

            const session = await db.gameSession.findUnique({
                where: { id: data.sessionId }
            })

            if (!session) {
                throw new SessionError('Сессия не найдена', 404)
            }

            // Обновляем сцену и локацию
            const worldState = session.worldState as WorldState
            if (data.location) {
                worldState.currentLocation = data.location
            }

            await db.gameSession.update({
                where: { id: data.sessionId },
                data: {
                    currentScene: data.newScene,
                    worldState
                }
            })

            // Логируем изменение сцены
            await this.logAction({
                sessionId: data.sessionId,
                actionType: 'scene_change',
                content: data.description,
                metadata: {
                    newScene: data.newScene,
                    location: data.location,
                    imagePrompt: data.imagePrompt
                }
            })

            // TODO: Здесь можно добавить генерацию изображения сцены
            if (data.imagePrompt) {
                // const imageUrl = await this.generateSceneImage(data.imagePrompt)
                // await db.gameSession.update({
                //   where: { id: data.sessionId },
                //   data: { sceneImage: imageUrl }
                // })
            }
        } catch (error) {
            if (error instanceof SessionError) {
                throw error
            }
            console.error('Change scene error:', error)
            throw new SessionError('Ошибка при изменении сцены')
        }
    }

    /**
     * Получение текущего состояния сессии для Socket.IO
     */
    async getSessionState(sessionId: string): Promise<any> {
        try {
            const session = await db.gameSession.findUnique({
                where: { id: sessionId },
                include: {
                    players: {
                        include: {
                            character: {
                                select: {
                                    id: true,
                                    name: true,
                                    class: true,
                                    level: true,
                                    currentHP: true,
                                    maxHP: true
                                }
                            }
                        }
                    }
                }
            })

            if (!session) {
                throw new SessionError('Сессия не найдена', 404)
            }

            const worldState = session.worldState as WorldState

            return {
                id: session.id,
                name: session.name,
                currentScene: session.currentScene,
                inCombat: worldState.inCombat,
                round: worldState.combatRound,
                activePlayerId: worldState.initiativeOrder?.[worldState.currentTurn || 0]?.playerId,
                players: session.players.map(player => ({
                    id: player.userId,
                    name: player.character?.name || 'Мастер игры',
                    characterId: player.characterId,
                    characterName: player.character?.name,
                    online: false // Будет обновлено в Socket handler
                })),
                worldState
            }
        } catch (error) {
            console.error('Get session state error:', error)
            throw new SessionError('Ошибка при получении состояния сессии')
        }
    }

    /**
     * Получение контекста для ИИ мастера
     */
    async getAIContext(sessionId: string): Promise<AIContext> {
        try {
            const session = await db.gameSession.findUnique({
                where: { id: sessionId },
                include: {
                    players: {
                        include: {
                            character: {
                                select: {
                                    id: true,
                                    name: true,
                                    class: true,
                                    level: true,
                                    race: true,
                                    backstory: true,
                                    currentHP: true,
                                    maxHP: true
                                }
                            }
                        }
                    },
                    actionLogs: {
                        orderBy: { timestamp: 'desc' },
                        take: 20 // Последние 20 действий для контекста
                    }
                }
            })

            if (!session) {
                throw new SessionError('Сессия не найдена', 404)
            }

            const worldState = session.worldState as WorldState

            return {
                sessionId: session.id,
                currentScene: session.currentScene,
                worldState,
                recentActions: session.actionLogs as ActionLog[],
                activeCharacters: session.players.filter(p => !p.isGameMaster) as SessionPlayer[],
                location: {
                    name: worldState.currentLocation,
                    description: `Текущая локация: ${worldState.currentLocation}. Время: ${worldState.timeOfDay}. Погода: ${worldState.weather}.`,
                    npcs: worldState.npcsInLocation
                }
            }
        } catch (error) {
            console.error('Get AI context error:', error)
            throw new SessionError('Ошибка при получении контекста для ИИ')
        }
    }

    /**
     * Удаление сессии
     */
    async deleteSession(sessionId: string, userId: string): Promise<void> {
        try {
            const isMaster = await this.checkGameMasterRights(sessionId, userId)
            if (!isMaster) {
                throw new SessionError('Только мастер игры может удалить сессию', 403)
            }

            await db.gameSession.delete({
                where: { id: sessionId }
            })
        } catch (error) {
            if (error instanceof SessionError) {
                throw error
            }
            console.error('Delete session error:', error)
            throw new SessionError('Ошибка при удалении сессии')
        }
    }

    /**
     * Генерация случайных бросков инициативы
     */
    async rollInitiativeForAll(sessionId: string, userId: string): Promise<InitiativeRollResult[]> {
        try {
            const isMaster = await this.checkGameMasterRights(sessionId, userId)
            if (!isMaster) {
                throw new SessionError('Только мастер игры может бросать инициативу', 403)
            }

            const session = await db.gameSession.findUnique({
                where: { id: sessionId },
                include: {
                    players: {
                        include: {
                            character: {
                                select: {
                                    id: true,
                                    name: true,
                                    dexterity: true
                                }
                            }
                        }
                    }
                }
            })

            if (!session) {
                throw new SessionError('Сессия не найдена', 404)
            }

            const results: InitiativeRollResult[] = []

            for (const player of session.players) {
                if (!player.isGameMaster && player.character) {
                    const dexModifier = Math.floor((player.character.dexterity - 10) / 2)
                    const roll = Math.floor(Math.random() * 20) + 1
                    const total = roll + dexModifier

                    results.push({
                        characterId: player.character.id,
                        characterName: player.character.name,
                        roll,
                        modifier: dexModifier,
                        total
                    })
                }
            }

            // Логируем броски инициативы
            const rollsText = results.map(r => `${r.characterName}: ${r.roll} + ${r.modifier} = ${r.total}`).join(', ')
            await this.logAction({
                sessionId: sessionId,
                actionType: 'dice_roll',
                content: `Броски инициативы: ${rollsText}`,
                metadata: { initiativeRolls: results }
            })

            return results.sort((a, b) => b.total - a.total)
        } catch (error) {
            if (error instanceof SessionError) {
                throw error
            }
            console.error('Roll initiative error:', error)
            throw new SessionError('Ошибка при броске инициативы')
        }
    }

    // === Вспомогательные методы ===

    /**
     * Проверка прав мастера игры
     */
    async checkGameMasterRights(sessionId: string, userId: string): Promise<boolean> {
        try {
            const player = await db.gameSessionPlayer.findFirst({
                where: {
                    sessionId: sessionId,
                    userId: userId,
                    isGameMaster: true
                }
            })

            return !!player
        } catch (error) {
            console.error('Check game master rights error:', error)
            return false
        }
    }

    /**
     * Проверка доступа пользователя к сессии
     */
    async checkUserAccess(sessionId: string, userId: string): Promise<boolean> {
        try {
            const player = await db.gameSessionPlayer.findFirst({
                where: {
                    sessionId: sessionId,
                    userId: userId
                }
            })

            return !!player
        } catch (error) {
            console.error('Check user access error:', error)
            return false
        }
    }

    /**
     * Получение активных сессий пользователя
     */
    async getUserActiveSessions(userId: string): Promise<GameSession[]> {
        try {
            const userSessions = await db.gameSessionPlayer.findMany({
                where: { userId: userId },
                include: {
                    session: {
                        include: {
                            _count: {
                                select: { players: true }
                            }
                        }
                    }
                }
            })

            return userSessions
                .filter(us => us.session.isActive)
                .map(us => ({
                    id: us.session.id,
                    name: us.session.name,
                    description: us.session.description,
                    maxPlayers: us.session.maxPlayers,
                    isActive: us.session.isActive,
                    currentScene: us.session.currentScene,
                    worldState: us.session.worldState as WorldState,
                    gameSettings: us.session.gameSettings as GameSettings,
                    mapImage: us.session.mapImage,
                    sceneImage: us.session.sceneImage,
                    createdAt: us.session.createdAt,
                    updatedAt: us.session.updatedAt
                }))
        } catch (error) {
            console.error('Get user active sessions error:', error)
            throw new SessionError('Ошибка при получении активных сессий')
        }
    }

    /**
     * Обновление времени последней активности
     */
    async updateLastActivity(sessionId: string): Promise<void> {
        try {
            await db.gameSession.update({
                where: { id: sessionId },
                data: { updatedAt: new Date() }
            })
        } catch (error) {
            console.error('Update last activity error:', error)
            // Не выбрасываем ошибку, так как это не критично
        }
    }

    /**
     * Получение статистики сессии
     */
    async getSessionStats(sessionId: string, userId: string): Promise<{
        totalActions: number
        playersCount: number
        sessionDuration: number
        averageActionsPerPlayer: number
        lastActivity: Date
    }> {
        try {
            const hasAccess = await this.checkUserAccess(sessionId, userId)
            if (!hasAccess) {
                throw new SessionError('Нет доступа к этой сессии', 403)
            }

            const session = await db.gameSession.findUnique({
                where: { id: sessionId },
                include: {
                    _count: {
                        select: {
                            players: true,
                            actionLogs: true
                        }
                    }
                }
            })

            if (!session) {
                throw new SessionError('Сессия не найдена', 404)
            }

            const sessionDuration = Date.now() - session.createdAt.getTime()
            const playersCount = session._count.players
            const totalActions = session._count.actionLogs
            const averageActionsPerPlayer = playersCount > 0 ? totalActions / playersCount : 0

            return {
                totalActions,
                playersCount,
                sessionDuration,
                averageActionsPerPlayer,
                lastActivity: session.updatedAt
            }
        } catch (error) {
            if (error instanceof SessionError) {
                throw error
            }
            console.error('Get session stats error:', error)
            throw new SessionError('Ошибка при получении статистики сессии')
        }
    }
}
throw error
}
console.error('Get session details error:', error)
throw new SessionError('Ошибка при получении информации о сессии')
}
}

/**
 * Получение списка доступных сессий
 */
async getAvailableSessions(userId: string): Promise<GameSession[]> {
    try {
        const sessions = await db.gameSession.findMany({
            where: {
                isActive: true,
                players: {
                    some: {
                        OR: [
                            { userId: userId }, // Пользователь уже участник
                            {
                                sessionId: {
                                    in: await db.gameSession.findMany({
                                        where: {
                                            isActive: true,
                                            players: { some: { userId: { not: userId } } }
                                        },
                                        select: { id: true }
                                    }).then(sessions => sessions.map(s => s.id))
                                }
                            }
                        ]
                    }
                }
            },
            include: {
                _count: {
                    select: { players: true }
                }
            },
            orderBy: { createdAt: 'desc' }
        })

        return sessions.map(session => ({
            id: session.id,
            name: session.name,
            description: session.description,
            maxPlayers: session.maxPlayers,
            isActive: session.isActive,
            currentScene: session.currentScene,
            worldState: session.worldState as WorldState,
            gameSettings: session.gameSettings as GameSettings,
            mapImage: session.mapImage,
            sceneImage: session.sceneImage,
            createdAt: session.createdAt,
            updatedAt: session.updatedAt
        }))
    } catch (error) {
        console.error('Get available sessions error:', error)
        throw new SessionError('Ошибка при получении списка сессий')
    }
}

/**
 * Присоединение к игровой сессии
 */
async joinSession(sessionId: string, userId: string, data: JoinSessionDto): Promise<SessionDetails> {
    try {
        // Проверяем существование сессии
        const session = await db.gameSession.findUnique({
            where: { id: sessionId },
            include: {
                players: true
            }
        })

        if (!session) {
    throw new SessionError('Игровая сессия не найдена', 404)
}

if (!session.isActive) {
    throw new SessionError('Игровая сессия неактивна')
}

// Проверяем, не является ли пользователь уже участником
const existingPlayer = session.players.find(p => p.userId === userId)
if (existingPlayer) {
    throw new SessionError('Вы уже участвуете в этой сессии')
}

// Проверяем лимит игроков
if (session.players.length >= session.maxPlayers) {
    throw new SessionError('Игровая сессия заполнена')
}

// Проверяем существование персонажа и права доступа
const character = await db.character.findFirst({
    where: {
        id: data.characterId,
        userId: userId
    }
})

if (!character) {
    throw new SessionError('Персонаж не найден или не принадлежит вам', 404)
}

// Добавляем игрока в сессию
await db.gameSessionPlayer.create({
    data: {
        sessionId: sessionId,
        characterId: data.characterId,
        isGameMaster: false
    }
})

// Логируем присоединение
await this.logAction({
    sessionId: sessionId,
    actionType: 'system_message',
    content: `${character.name} присоединился к приключению!`
})

return this.getSessionDetails(sessionId, userId)
} catch (error) {
    if (error instanceof SessionError) {
        throw error
    }
    console.error('Join session error:', error)
    throw new SessionError('Ошибка при присоединении к сессии')
}
}

/**
 * Покидание игровой сессии
 */
async leaveSession(sessionId: string, userId: string): Promise<void> {
    try {
        const player = await db.gameSessionPlayer.findFirst({
            where: {
                sessionId: sessionId,
                userId: userId
            },
            include: {
                character: true
            }
        })

        if (!player) {
    throw new SessionError('Вы не участвуете в этой сессии', 404)
}

if (player.isGameMaster) {
    throw new SessionError('Мастер игры не может покинуть сессию. Сначала передайте права другому игроку.')
}

// Удаляем игрока из сессии
await db.gameSessionPlayer.delete({
    where: { id: player.id }
})

// Логируем выход
await this.logAction({
    sessionId: sessionId,
    actionType: 'system_message',
    content: `${player.character?.name || 'Игрок'} покинул приключение.`
})

} catch (error) {
    if (error instanceof SessionError) {
        throw error
    }
    console.error('Leave session error:', error)
    throw new SessionError('Ошибка при выходе из сессии')
}
}

/**
 * Обновление сессии
 */
async updateSession(sessionId: string, userId: string, data: UpdateSessionDto): Promise<SessionDetails> {
    try {
        // Проверяем права мастера игры
        const isMaster = await this.checkGameMasterRights(sessionId, userId)
        if (!isMaster) {
    throw new SessionError('Только мастер игры может изменять настройки сессии', 403)
}

const updatedSession = await db.gameSession.update({
    where: { id: sessionId },
    data: {
        ...data,
        updatedAt: new Date()
    }
})

return this.getSessionDetails(sessionId, userId)
} catch (error) {
    if (error instanceof SessionError) {
        throw error
    }
    console.error('Update session error:', error)
    throw new SessionError('Ошибка при обновлении сессии')
}
}

/**
 * Логирование действия
 */
async logAction(data: LogActionDto): Promise<ActionLog> {
    try {
        const actionLog = await db.actionLog.create({
            data: {
                sessionId: data.sessionId,
                characterId: data.characterId,
                actionType: data.actionType,
                content: data.content,
                metadata: data.metadata || {},
                diceRolls: data.diceRolls || []
            }
        })

        return actionLog as ActionLog
    } catch (error) {
        console.error('Log action error:', error)
        throw new SessionError('Ошибка при записи действия')
    }
}

/**
 * Получение лога действий
 */
async getActionLog(sessionId: string, userId: string, limit: number = 50, offset: number = 0): Promise<ActionLog[]> {
    try {
        // Проверяем доступ к сессии
        const hasAccess = await this.checkUserAccess(sessionId, userId)
        if (!hasAccess) {
    throw new SessionError('Нет доступа к этой сессии', 403)
}

const logs = await db.actionLog.findMany({
    where: { sessionId },
    orderBy: { timestamp: 'desc' },
    take: limit,
    skip: offset,
    include: {
        character: {
            select: {
                id: true,
                name: true
            }
        }
    }
})

return logs as ActionLog[]
} catch (error) {
    if (error instanceof SessionError) {
        throw error
    }
    console.error('Get action log error:', error)
    throw new SessionError('Ошибка при получении лога действий')
}
}

/**
 * Управление инициативой
 */
async setInitiative(data: InitiativeDto, userId: string): Promise<CombatStatus> {
    try {
        // Проверяем права мастера игры
        const isMaster = await this.checkGameMasterRights(data.sessionId, userId)
        if (!isMaster) {
    throw new SessionError('Только мастер игры может управлять инициативой', 403)
}

// Сортируем по инициативе (убывание)
const sortedEntries = data.entries.sort((a, b) => b.initiative - a.initiative)

// Обновляем состояние мира
const session = await db.gameSession.findUnique({
    where: { id: data.sessionId }
})

if (!session) {
    throw new SessionError('Сессия не найдена', 404)
}

const worldState = session.worldState as WorldState
worldState.inCombat = true
worldState.combatRound = 1
worldState.currentTurn = 0
worldState.initiativeOrder = sortedEntries.map(entry => ({
    ...entry,
    hasActed: false
}))

await db.gameSession.update({
    where: { id: data.sessionId },
    data: { worldState }
})

// Логируем начало боя
await this.logAction({
    sessionId: data.sessionId,
    actionType: 'system_message',
    content: `Начался бой! Порядок инициативы: ${sortedEntries.map(e => `${e.characterName} (${e.initiative})`).join(', ')}`
})

return {
    inCombat: true,
    round: 1,
    turn: 0,
    currentCharacter: worldState.initiativeOrder[0],
    initiativeOrder: worldState.initiativeOrder
}
} catch (error) {
    if (error instanceof SessionError) {
        throw error
    }
    console.error('Set initiative error:', error)
    throw new SessionError('Ошибка при установке инициативы')
}
}

/**
 * Следующий ход в бою
 */
async nextTurn(sessionId: string, userId: string): Promise<CombatStatus> {
    try {
        const isMaster = await this.checkGameMasterRights(sessionId, userId)
        if (!isMaster) {
    throw new SessionError('Только мастер игры может управлять ходами', 403)
}

const session = await db.gameSession.findUnique({
    where: { id: sessionId }
})

if (!session) {
    throw new SessionError('Сессия не найдена', 404)
}

const worldState = session.worldState as WorldState

if (!worldState.inCombat || !worldState.initiativeOrder) {
    throw new SessionError('Бой не начат')
}

const currentTurn = worldState.currentTurn || 0
const initiativeOrder = worldState.initiativeOrder

// Отмечаем текущего персонажа как совершившего действие
if (initiativeOrder[currentTurn]) {
    initiativeOrder[currentTurn].hasActed = true
}

// Переходим к следующему ходу
let nextTurn = currentTurn + 1
let nextRound = worldState.combatRound || 1

// Если дошли до конца списка, начинаем новый раунд
if (nextTurn >= initiativeOrder.length) {
    nextTurn = 0
    nextRound += 1

    // Сбрасываем флаги действий для нового раунда
    initiativeOrder.forEach(entry => {
        entry.hasActed = false
    })
}

// Обновляем состояние
worldState.currentTurn = nextTurn
worldState.combatRound = nextRound
worldState.initiativeOrder = initiativeOrder

await db.gameSession.update({
    where: { id: sessionId },
    data: { worldState }
})

const currentCharacter = initiativeOrder[nextTurn]

// Логируем смену хода
await this.logAction({
    sessionId: sessionId,
    actionType: 'system_message',
    content: `Раунд ${nextRound}, ход ${nextTurn + 1}: ${currentCharacter.characterName}`
})

return {
    inCombat: true,
    round: nextRound,
    turn: nextTurn,
    currentCharacter,
    initiativeOrder
}
} catch (error) {
    if (error instanceof SessionError) {
        throw error
    }
    console.error('Next turn error:', error)
    throw new SessionError('Ошибка при переходе к следующему ходу')
}
}

/**
 * Завершение боя
 */
async endCombat(sessionId: string, userId: string): Promise<void> {
    try {
        const isMaster = await this.checkGameMasterRights(sessionId, userId)
        if (!isMaster) {
    throw new SessionError('Только мастер игры может завершить бой', 403)
}

const session = await db.gameSession.findUnique({
    where: { id: sessionId }
})

if (!session) {
    throw new SessionError('Сессия не найдена', 404)
}

const worldState = session.worldState as WorldState

worldState.inCombat = false
worldState.combatRound = undefined
worldState.currentTurn = undefined
worldState.initiativeOrder = undefined

await db.gameSession.update({
    where: { id: sessionId },
    data: { worldState }
})

await this.logAction({
    sessionId: sessionId,
    actionType: 'system_message',
    content: 'Бой завершен.'
})
} catch (error) {
    if (error instanceof SessionError) {