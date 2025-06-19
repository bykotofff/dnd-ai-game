// frontend/src/lib/socket-client.ts
import { io, Socket } from 'socket.io-client'
import { useGameStore } from '@/stores/game-store'
import { useAuthStore } from '@/stores/auth-store'
import {
    SocketGameAction,
    SocketDiceRoll,
    SocketChatMessage,
    ActionLog,
    AIResponse,
    SessionPlayer,
    CombatState,
    InitiativeEntry
} from '@/types'
import toast from 'react-hot-toast'

interface ServerToClientEvents {
    // Подключение
    connected: (data: { message: string; userId: string; socketId: string }) => void
    error: (data: { message: string }) => void

    // Сессии
    session_joined: (data: { sessionId: string; message: string }) => void
    session_state: (data: any) => void
    player_joined: (data: { userId: string; username: string; timestamp: Date }) => void
    player_left: (data: { userId: string; username: string; timestamp: Date }) => void

    // Игровые события
    game_action: (action: SocketGameAction & { playerName: string; timestamp: Date }) => void
    ai_response: (response: AIResponse) => void
    dice_roll: (rollResult: SocketDiceRoll & { playerId: string; playerName: string; timestamp: Date }) => void
    chat_message: (message: SocketChatMessage & { playerId: string; playerName: string; timestamp: Date }) => void
    character_update: (update: { characterId: string; updates: any; updatedBy: string; timestamp: Date }) => void

    // Игровые механики
    player_turn: (data: { playerId: string; playerName: string; message: string; timestamp: Date }) => void
    initiative_update: (data: { initiativeOrder: InitiativeEntry[]; timestamp: Date }) => void
    combat_state_change: (data: { inCombat: boolean; round?: number; timestamp: Date }) => void
    scene_change: (data: { scene: string; description: string; imageUrl?: string; timestamp: Date }) => void
    quest_update: (data: { questId: string; questName: string; status: string; description?: string; timestamp: Date }) => void
    game_event: (data: { type: string; data: Record<string, any>; timestamp: Date }) => void

    // Системные
    pong: (data: { timestamp: number }) => void
    force_disconnect: (data: { reason: string }) => void
}

interface ClientToServerEvents {
    join_session: (data: { sessionId: string }) => void
    leave_session: (data: { sessionId: string }) => void
    get_session_state: (data: { sessionId: string }) => void
    game_action: (action: SocketGameAction) => void
    dice_roll: (diceRoll: SocketDiceRoll) => void
    chat_message: (data: SocketChatMessage) => void
    character_update: (data: { sessionId: string; characterId: string; updates: any }) => void
    ping: () => void
}

class SocketClient {
    private socket: Socket<ServerToClientEvents, ClientToServerEvents> | null = null
    private reconnectAttempts = 0
    private maxReconnectAttempts = 5
    private reconnectDelay = 1000

    connect(token: string): void {
        if (this.socket?.connected) {
            return
        }

        const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3001'

        this.socket = io(socketUrl, {
            auth: {
                token
            },
            autoConnect: true,
            reconnection: true,
            reconnectionAttempts: this.maxReconnectAttempts,
            reconnectionDelay: this.reconnectDelay,
            timeout: 10000
        })

        this.setupEventHandlers()
    }

    disconnect(): void {
        if (this.socket) {
            this.socket.disconnect()
            this.socket = null
        }
        useGameStore.getState().setConnectionStatus('disconnected')
    }

    private setupEventHandlers(): void {
        if (!this.socket) return

        const gameStore = useGameStore.getState()

        // События подключения
        this.socket.on('connect', () => {
            console.log('🔌 Connected to game server')
            gameStore.setConnectionStatus('connected')
            this.reconnectAttempts = 0
            toast.success('Подключен к серверу игры')
        })

        this.socket.on('disconnect', (reason) => {
            console.log('💔 Disconnected from game server:', reason)
            gameStore.setConnectionStatus('disconnected')

            if (reason === 'io server disconnect') {
                toast.error('Соединение разорвано сервером')
            }
        })

        this.socket.on('connect_error', (error) => {
            console.error('❌ Connection error:', error)
            gameStore.setConnectionStatus('error')

            this.reconnectAttempts++
            if (this.reconnectAttempts >= this.maxReconnectAttempts) {
                toast.error('Не удалось подключиться к серверу')
            }
        })

        // Системные события
        this.socket.on('connected', (data) => {
            console.log('✅ Server confirmed connection:', data.message)
        })

        this.socket.on('error', (data) => {
            console.error('🚨 Server error:', data.message)
            toast.error(data.message)
        })

        // События сессии
        this.socket.on('session_joined', (data) => {
            toast.success(`Присоединились к сессии`)
        })

        this.socket.on('session_state', (data) => {
            // Обновляем состояние сессии
            if (data.session) {
                gameStore.setCurrentSession(data.session)
            }
            if (data.connectedPlayers) {
                // Обновляем список подключенных игроков
            }
        })

        this.socket.on('player_joined', (data) => {
            toast(`${data.username} присоединился к игре`, {
                icon: '👋',
                duration: 3000
            })
        })

        this.socket.on('player_left', (data) => {
            toast(`${data.username} покинул игру`, {
                icon: '👋',
                duration: 3000
            })
        })

        // Игровые события
        this.socket.on('game_action', (action) => {
            const actionLog: ActionLog = {
                id: `action_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                sessionId: action.sessionId,
                characterId: action.playerId,
                actionType: action.type,
                content: `${action.playerName}: ${action.content}`,
                metadata: action.metadata,
                timestamp: new Date(action.timestamp).toISOString()
            }

            gameStore.addActionLog(actionLog)
        })

        this.socket.on('ai_response', (response) => {
            const actionLog: ActionLog = {
                id: response.id,
                sessionId: gameStore.currentSession?.id || '',
                actionType: 'ai_response',
                content: response.content,
                metadata: {
                    responseType: response.requestType,
                    suggestions: response.suggestions,
                    diceRollsRequired: response.diceRollsRequired,
                    sceneUpdates: response.sceneUpdates
                },
                timestamp: response.timestamp
            }

            gameStore.addActionLog(actionLog)
            gameStore.setLastAIResponse(response)
            gameStore.setPendingAIRequest(false)

            // Показываем уведомление об ответе ИИ
            toast('🎭 Мастер ответил', {
                duration: 2000
            })
        })

        this.socket.on('dice_roll', (rollResult) => {
            const diceRoll = {
                id: `roll_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                type: rollResult.type as any,
                result: rollResult.result,
                modifier: rollResult.modifier,
                total: rollResult.total,
                advantage: rollResult.advantage,
                disadvantage: rollResult.disadvantage,
                timestamp: new Date(rollResult.timestamp)
            }

            gameStore.addDiceRoll(diceRoll)

            const actionLog: ActionLog = {
                id: `dice_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                sessionId: gameStore.currentSession?.id || '',
                characterId: rollResult.characterId,
                actionType: 'dice_roll',
                content: `${rollResult.playerName} бросил ${rollResult.type}: ${rollResult.result} + ${rollResult.modifier} = ${rollResult.total}`,
                diceRolls: [rollResult],
                timestamp: new Date(rollResult.timestamp).toISOString()
            }

            gameStore.addActionLog(actionLog)
        })

        this.socket.on('chat_message', (message) => {
            const actionLog: ActionLog = {
                id: `chat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                sessionId: message.sessionId,
                actionType: 'chat_message',
                content: `${message.playerName}: ${message.message}`,
                metadata: {
                    type: message.type,
                    playerId: message.playerId
                },
                timestamp: new Date(message.timestamp).toISOString()
            }

            gameStore.addActionLog(actionLog)
        })

        this.socket.on('character_update', (update) => {
            const character = gameStore.getCharacterById(update.characterId)
            if (character) {
                const updatedCharacter = { ...character, ...update.updates }
                gameStore.updateCharacter(updatedCharacter)
            }

            toast(`${update.updatedBy} обновил персонажа`, {
                icon: '📝',
                duration: 2000
            })
        })

        // Боевые события
        this.socket.on('combat_state_change', (data) => {
            const combatState: CombatState = {
                inCombat: data.inCombat,
                round: data.round || 0,
                turn: 0,
                initiativeOrder: []
            }

            gameStore.setCombatState(combatState)

            const message = data.inCombat ? 'Бой начался!' : 'Бой завершен!'
            toast(message, {
                icon: data.inCombat ? '⚔️' : '🕊️',
                duration: 3000
            })
        })

        this.socket.on('initiative_update', (data) => {
            const combatState = gameStore.combatState
            if (combatState) {
                gameStore.setCombatState({
                    ...combatState,
                    initiativeOrder: data.initiativeOrder
                })
            }
        })

        this.socket.on('player_turn', (data) => {
            toast(`Ход игрока: ${data.playerName}`, {
                icon: '🎲',
                duration: 4000
            })
        })

        // События мира
        this.socket.on('scene_change', (data) => {
            const actionLog: ActionLog = {
                id: `scene_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                sessionId: gameStore.currentSession?.id || '',
                actionType: 'scene_change',
                content: data.description,
                metadata: {
                    scene: data.scene,
                    imageUrl: data.imageUrl
                },
                timestamp: new Date(data.timestamp).toISOString()
            }

            gameStore.addActionLog(actionLog)

            toast('Сцена изменилась', {
                icon: '🎬',
                duration: 3000
            })
        })

        this.socket.on('quest_update', (data) => {
            const actionLog: ActionLog = {
                id: `quest_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                sessionId: gameStore.currentSession?.id || '',
                actionType: 'quest_update',
                content: `Квест "${data.questName}": ${data.status}`,
                metadata: data,
                timestamp: new Date(data.timestamp).toISOString()
            }

            gameStore.addActionLog(actionLog)
        })

        this.socket.on('game_event', (data) => {
            toast(`Игровое событие: ${data.type}`, {
                icon: '✨',
                duration: 3000
            })
        })

        // Ping-pong для проверки соединения
        this.socket.on('pong', (data) => {
            const latency = Date.now() - data.timestamp
            console.log(`🏓 Ping: ${latency}ms`)
        })

        this.socket.on('force_disconnect', (data) => {
            toast.error(`Принудительное отключение: ${data.reason}`)
            this.disconnect()
        })
    }

    // Методы для отправки событий
    joinSession(sessionId: string): void {
        if (this.socket?.connected) {
            this.socket.emit('join_session', { sessionId })
            useGameStore.getState().setConnectionStatus('connecting')
        }
    }

    leaveSession(sessionId: string): void {
        if (this.socket?.connected) {
            this.socket.emit('leave_session', { sessionId })
        }
    }

    sendGameAction(action: SocketGameAction): void {
        if (this.socket?.connected) {
            this.socket.emit('game_action', action)
            useGameStore.getState().setPendingAIRequest(true)
        }
    }

    sendDiceRoll(diceRoll: SocketDiceRoll): void {
        if (this.socket?.connected) {
            this.socket.emit('dice_roll', diceRoll)
        }
    }

    sendChatMessage(message: SocketChatMessage): void {
        if (this.socket?.connected) {
            this.socket.emit('chat_message', message)
        }
    }

    updateCharacter(sessionId: string, characterId: string, updates: any): void {
        if (this.socket?.connected) {
            this.socket.emit('character_update', { sessionId, characterId, updates })
        }
    }

    getSessionState(sessionId: string): void {
        if (this.socket?.connected) {
            this.socket.emit('get_session_state', { sessionId })
        }
    }

    ping(): void {
        if (this.socket?.connected) {
            this.socket.emit('ping')
        }
    }

    // Утилиты
    isConnected(): boolean {
        return this.socket?.connected || false
    }

    getSocketId(): string | undefined {
        return this.socket?.id
    }
}

// Создаем единственный экземпляр
export const socketClient = new SocketClient()

// Хук для использования в компонентах
export const useSocket = () => {
    const isAuthenticated = useAuthStore(state => state.isAuthenticated)
    const token = useAuthStore(state => state.token)
    const connectionStatus = useGameStore(state => state.connectionStatus)

    const connect = () => {
        if (isAuthenticated && token && !socketClient.isConnected()) {
            socketClient.connect(token)
        }
    }

    const disconnect = () => {
        socketClient.disconnect()
    }

    return {
        connect,
        disconnect,
        isConnected: socketClient.isConnected(),
        connectionStatus,
        socket: socketClient
    }
}