// backend/src/shared/socket/socket.handler.ts
import { Server as SocketIOServer, Socket } from 'socket.io'
import { AuthService } from '@modules/auth/auth.service'
import { SessionService } from '@modules/sessions/session.service'
import { AIMasterService } from '@modules/game-master/ai-master.service'

interface AuthenticatedSocket extends Socket {
    userId?: string
    username?: string
    currentSessionId?: string
}

interface GameAction {
    type: 'player_action' | 'dice_roll' | 'chat_message' | 'status_update'
    playerId: string
    sessionId: string
    content: string
    metadata?: any
    timestamp: Date
}

interface DiceRoll {
    type: string // d20, d6, etc.
    result: number
    modifier: number
    total: number
    purpose: string // attack, skill_check, etc.
    characterId: string
}

export class SocketHandler {
    private io: SocketIOServer
    private authService: AuthService
    private sessionService: SessionService
    private aiMasterService: AIMasterService
    private connectedUsers: Map<string, string[]> = new Map() // userId -> socketIds
    private sessionRooms: Map<string, Set<string>> = new Map() // sessionId -> userIds

    constructor(io: SocketIOServer) {
        this.io = io
        this.authService = new AuthService()
        this.sessionService = new SessionService()
        this.aiMasterService = new AIMasterService()
    }

    public initialize(): void {
        this.io.use(this.authenticateSocket.bind(this))
        console.log('🔌 Socket.IO handler initialized')
    }

    /**
     * Публичный метод для обработки подключений
     */
    public handleSocketConnection(socket: AuthenticatedSocket): void {
        this.handleConnection(socket)
    }

    /**
     * Middleware для аутентификации сокетов
     */
    private async authenticateSocket(socket: AuthenticatedSocket, next: Function): Promise<void> {
        try {
            const token = socket.handshake.auth.token

            if (!token) {
                return next(new Error('Токен аутентификации не предоставлен'))
            }

            const decoded = await this.authService.verifyToken(token)

            socket.userId = decoded.userId
            socket.username = decoded.username

            next()
        } catch (error) {
            console.error('Socket authentication error:', error)
            next(new Error('Ошибка аутентификации'))
        }
    }

    /**
     * Обработка подключения клиента
     */
    private handleConnection(socket: AuthenticatedSocket): void {
        const userId = socket.userId!
        const username = socket.username!

        console.log(`🔌 User ${username} (${userId}) connected with socket ${socket.id}`)

        // Добавляем сокет к пользователю
        if (!this.connectedUsers.has(userId)) {
            this.connectedUsers.set(userId, [])
        }
        this.connectedUsers.get(userId)!.push(socket.id)

        // Отправляем подтверждение подключения
        socket.emit('connected', {
            userId,
            username,
            timestamp: new Date()
        })

        // Обработчики событий
        this.setupEventHandlers(socket)

        // Обработка отключения
        socket.on('disconnect', () => {
            this.handleDisconnection(socket)
        })
    }

    /**
     * Настройка обработчиков событий
     */
    private setupEventHandlers(socket: AuthenticatedSocket): void {
        const userId = socket.userId!

        // Присоединение к игровой сессии
        socket.on('join_session', async (data: { sessionId: string, characterId?: string }) => {
            try {
                await this.handleJoinSession(socket, data)
            } catch (error) {
                socket.emit('error', {
                    code: 'JOIN_SESSION_ERROR',
                    message: 'Ошибка при присоединении к сессии',
                    details: error
                })
            }
        })

        // Покидание игровой сессии
        socket.on('leave_session', async (data: { sessionId: string }) => {
            try {
                await this.handleLeaveSession(socket, data)
            } catch (error) {
                socket.emit('error', {
                    code: 'LEAVE_SESSION_ERROR',
                    message: 'Ошибка при покидании сессии',
                    details: error
                })
            }
        })

        // Игровое действие
        socket.on('game_action', async (action: GameAction) => {
            try {
                await this.handleGameAction(socket, action)
            } catch (error) {
                socket.emit('error', {
                    code: 'GAME_ACTION_ERROR',
                    message: 'Ошибка при обработке игрового действия',
                    details: error
                })
            }
        })

        // Бросок кубика
        socket.on('dice_roll', async (rollData: DiceRoll) => {
            try {
                await this.handleDiceRoll(socket, rollData)
            } catch (error) {
                socket.emit('error', {
                    code: 'DICE_ROLL_ERROR',
                    message: 'Ошибка при броске кубика',
                    details: error
                })
            }
        })

        // Сообщение в чате
        socket.on('chat_message', async (messageData: any) => {
            try {
                await this.handleChatMessage(socket, messageData)
            } catch (error) {
                socket.emit('error', {
                    code: 'CHAT_MESSAGE_ERROR',
                    message: 'Ошибка при отправке сообщения',
                    details: error
                })
            }
        })

        // Ping-pong для проверки соединения
        socket.on('ping', () => {
            socket.emit('pong', { timestamp: new Date() })
        })
    }

    /**
     * Обработка присоединения к сессии
     */
    private async handleJoinSession(socket: AuthenticatedSocket, data: { sessionId: string, characterId?: string }): Promise<void> {
        const { sessionId, characterId } = data
        const userId = socket.userId!

        // Проверяем существование сессии
        const session = await this.sessionService.getSession(sessionId)
        if (!session) {
            throw new Error('Сессия не найдена')
        }

        // Присоединяем к комнате
        socket.join(`session_${sessionId}`)
        socket.currentSessionId = sessionId

        // Добавляем в список активных пользователей сессии
        if (!this.sessionRooms.has(sessionId)) {
            this.sessionRooms.set(sessionId, new Set())
        }
        this.sessionRooms.get(sessionId)!.add(userId)

        // Уведомляем других игроков
        socket.to(`session_${sessionId}`).emit('player_joined', {
            userId,
            username: socket.username,
            characterId,
            timestamp: new Date()
        })

        // Отправляем текущее состояние сессии
        const sessionState = await this.sessionService.getSessionState(sessionId)
        socket.emit('session_joined', {
            sessionId,
            state: sessionState,
            timestamp: new Date()
        })

        console.log(`👥 User ${socket.username} joined session ${sessionId}`)
    }

    /**
     * Обработка покидания сессии
     */
    private async handleLeaveSession(socket: AuthenticatedSocket, data: { sessionId: string }): Promise<void> {
        const { sessionId } = data
        const userId = socket.userId!

        socket.leave(`session_${sessionId}`)
        socket.currentSessionId = undefined

        // Удаляем из списка активных пользователей
        if (this.sessionRooms.has(sessionId)) {
            this.sessionRooms.get(sessionId)!.delete(userId)
            if (this.sessionRooms.get(sessionId)!.size === 0) {
                this.sessionRooms.delete(sessionId)
            }
        }

        // Уведомляем других игроков
        socket.to(`session_${sessionId}`).emit('player_left', {
            userId,
            username: socket.username,
            timestamp: new Date()
        })

        console.log(`👋 User ${socket.username} left session ${sessionId}`)
    }

    /**
     * Обработка игрового действия
     */
    private async handleGameAction(socket: AuthenticatedSocket, action: GameAction): Promise<void> {
        const sessionId = socket.currentSessionId

        if (!sessionId) {
            throw new Error('Пользователь не находится в сессии')
        }

        // Обрабатываем действие через ИИ мастера
        const response = await this.aiMasterService.processPlayerAction(action)

        // Отправляем результат всем участникам сессии
        this.io.to(`session_${sessionId}`).emit('game_event', {
            type: 'player_action_result',
            action,
            response,
            timestamp: new Date()
        })
    }

    /**
     * Обработка броска кубика
     */
    private async handleDiceRoll(socket: AuthenticatedSocket, rollData: DiceRoll): Promise<void> {
        const sessionId = socket.currentSessionId

        if (!sessionId) {
            throw new Error('Пользователь не находится в сессии')
        }

        // Отправляем результат броска всем участникам
        this.io.to(`session_${sessionId}`).emit('dice_roll_result', {
            ...rollData,
            username: socket.username,
            timestamp: new Date()
        })
    }

    /**
     * Обработка сообщения в чате
     */
    private async handleChatMessage(socket: AuthenticatedSocket, messageData: any): Promise<void> {
        const sessionId = socket.currentSessionId

        if (!sessionId) {
            throw new Error('Пользователь не находится в сессии')
        }

        // Отправляем сообщение всем участникам сессии
        this.io.to(`session_${sessionId}`).emit('chat_message', {
            ...messageData,
            userId: socket.userId,
            username: socket.username,
            timestamp: new Date()
        })
    }

    /**
     * Обработка отключения
     */
    private handleDisconnection(socket: AuthenticatedSocket): void {
        const userId = socket.userId!
        const username = socket.username!

        console.log(`🔌 User ${username} (${userId}) disconnected`)

        // Удаляем сокет из списка пользователя
        if (this.connectedUsers.has(userId)) {
            const userSockets = this.connectedUsers.get(userId)!
            const socketIndex = userSockets.indexOf(socket.id)
            if (socketIndex > -1) {
                userSockets.splice(socketIndex, 1)
            }

            // Если у пользователя больше нет активных сокетов
            if (userSockets.length === 0) {
                this.connectedUsers.delete(userId)

                // Уведомляем о покидании сессии, если пользователь был в ней
                if (socket.currentSessionId) {
                    this.handleLeaveSession(socket, { sessionId: socket.currentSessionId })
                }
            }
        }
    }
}