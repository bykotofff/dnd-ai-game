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
        this.io.on('connection', this.handleConnection.bind(this))
        console.log('🔌 Socket.IO handler initialized')
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
        console.log(`🎮 User ${socket.username} connected (${socket.id})`)

        // Регистрируем пользователя
        this.registerUser(userId, socket.id)

        // Настраиваем обработчики событий
        this.setupEventHandlers(socket)

        // Уведомляем о подключении
        socket.emit('connected', {
            message: 'Подключение к игровому серверу установлено',
            userId: userId,
            socketId: socket.id
        })

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
        socket.on('join_session', async (data: { sessionId: string }) => {
            await this.handleJoinSession(socket, data.sessionId)
        })

        // Покидание игровой сессии
        socket.on('leave_session', async (data: { sessionId: string }) => {
            await this.handleLeaveSession(socket, data.sessionId)
        })

        // Игровое действие
        socket.on('game_action', async (action: GameAction) => {
            await this.handleGameAction(socket, action)
        })

        // Бросок кубиков
        socket.on('dice_roll', async (diceRoll: DiceRoll) => {
            await this.handleDiceRoll(socket, diceRoll)
        })

        // Сообщение в чат
        socket.on('chat_message', async (data: { sessionId: string, message: string, type?: 'ic' | 'ooc' }) => {
            await this.handleChatMessage(socket, data)
        })

        // Обновление статуса персонажа
        socket.on('character_update', async (data: { sessionId: string, characterId: string, updates: any }) => {
            await this.handleCharacterUpdate(socket, data)
        })

        // Запрос текущего состояния сессии
        socket.on('get_session_state', async (data: { sessionId: string }) => {
            await this.handleGetSessionState(socket, data.sessionId)
        })

        // Пинг для проверки соединения
        socket.on('ping', () => {
            socket.emit('pong', { timestamp: Date.now() })
        })
    }

    /**
     * Присоединение к игровой сессии
     */
    private async handleJoinSession(socket: AuthenticatedSocket, sessionId: string): Promise<void> {
        try {
            const userId = socket.userId!

            // Проверяем доступ к сессии
            const hasAccess = await this.sessionService.checkUserAccess(sessionId, userId)

            if (!hasAccess) {
                socket.emit('error', { message: 'Нет доступа к данной игровой сессии' })
                return
            }

            // Покидаем предыдущую сессию если есть
            if (socket.currentSessionId) {
                await this.handleLeaveSession(socket, socket.currentSessionId)
            }

            // Присоединяемся к комнате сессии
            await socket.join(`session_${sessionId}`)
            socket.currentSessionId = sessionId

            // Регистрируем в списке участников сессии
            if (!this.sessionRooms.has(sessionId)) {
                this.sessionRooms.set(sessionId, new Set())
            }
            this.sessionRooms.get(sessionId)!.add(userId)

            // Уведомляем всех участников о присоединении
            socket.to(`session_${sessionId}`).emit('player_joined', {
                userId: userId,
                username: socket.username,
                timestamp: new Date()
            })

            // Отправляем подтверждение
            socket.emit('session_joined', {
                sessionId: sessionId,
                message: 'Успешно присоединились к игровой сессии'
            })

            // Отправляем текущее состояние сессии
            await this.sendSessionState(socket, sessionId)

            console.log(`👥 User ${socket.username} joined session ${sessionId}`)
        } catch (error) {
            console.error('Join session error:', error)
            socket.emit('error', { message: 'Ошибка при присоединении к сессии' })
        }
    }

    /**
     * Покидание игровой сессии
     */
    private async handleLeaveSession(socket: AuthenticatedSocket, sessionId: string): Promise<void> {
        try {
            const userId = socket.userId!

            // Покидаем комнату
            await socket.leave(`session_${sessionId}`)

            // Удаляем из списка участников
            if (this.sessionRooms.has(sessionId)) {
                this.sessionRooms.get(sessionId)!.delete(userId)

                // Удаляем пустые сессии
                if (this.sessionRooms.get(sessionId)!.size === 0) {
                    this.sessionRooms.delete(sessionId)
                }
            }

            // Уведомляем участников о выходе
            socket.to(`session_${sessionId}`).emit('player_left', {
                userId: userId,
                username: socket.username,
                timestamp: new Date()
            })

            socket.currentSessionId = undefined

            console.log(`👋 User ${socket.username} left session ${sessionId}`)
        } catch (error) {
            console.error('Leave session error:', error)
        }
    }

    /**
     * Обработка игрового действия
     */
    private async handleGameAction(socket: AuthenticatedSocket, action: GameAction): Promise<void> {
        try {
            const userId = socket.userId!

            // Валидация действия
            if (!action.sessionId || !action.content) {
                socket.emit('error', { message: 'Некорректные данные действия' })
                return
            }

            // Проверяем доступ к сессии
            const hasAccess = await this.sessionService.checkUserAccess(action.sessionId, userId)
            if (!hasAccess) {
                socket.emit('error', { message: 'Нет доступа к данной сессии' })
                return
            }

            // Сохраняем действие в базу данных
            await this.sessionService.logAction({
                sessionId: action.sessionId,
                characterId: action.playerId,
                actionType: action.type,
                content: action.content,
                metadata: action.metadata
            })

            // Рассылаем действие всем участникам сессии
            this.io.to(`session_${action.sessionId}`).emit('game_action', {
                ...action,
                playerId: userId,
                playerName: socket.username,
                timestamp: new Date()
            })

            // Если это действие игрока, генерируем ответ ИИ мастера
            if (action.type === 'player_action') {
                try {
                    const aiResponse = await this.aiMasterService.processPlayerAction({
                        sessionId: action.sessionId,
                        requestType: 'player_action_response',
                        playerAction: action.content,
                        characterId: action.playerId,
                        additionalContext: action.metadata
                    })

                    // Отправляем ответ ИИ всем участникам
                    this.io.to(`session_${action.sessionId}`).emit('ai_response', {
                        responseId: aiResponse.id,
                        content: aiResponse.content,
                        suggestions: aiResponse.suggestions,
                        diceRollsRequired: aiResponse.diceRollsRequired,
                        sceneUpdates: aiResponse.sceneUpdates,
                        timestamp: aiResponse.timestamp
                    })

                } catch (aiError) {
                    console.error('AI Master error:', aiError)
                    // Отправляем fallback ответ
                    this.io.to(`session_${action.sessionId}`).emit('ai_response', {
                        responseId: `fallback_${Date.now()}`,
                        content: 'Мастер игры временно недоступен. Продолжайте игру!',
                        timestamp: new Date()
                    })
                }
            }

            console.log(`🎯 Game action from ${socket.username} in session ${action.sessionId}: ${action.content}`)
        } catch (error) {
            console.error('Game action error:', error)
            socket.emit('error', { message: 'Ошибка при обработке действия' })
        }
    }

    /**
     * Обработка броска кубиков
     */
    private async handleDiceRoll(socket: AuthenticatedSocket, diceRoll: DiceRoll): Promise<void> {
        try {
            const userId = socket.userId!

            // Здесь можно добавить валидацию броска
            const rollResult = {
                ...diceRoll,
                playerId: userId,
                playerName: socket.username,
                timestamp: new Date()
            }

            // Рассылаем результат броска
            if (socket.currentSessionId) {
                this.io.to(`session_${socket.currentSessionId}`).emit('dice_roll', rollResult)

                // Сохраняем в лог действий
                await this.sessionService.logAction({
                    sessionId: socket.currentSessionId,
                    characterId: diceRoll.characterId,
                    actionType: 'dice_roll',
                    content: `Бросок ${diceRoll.type}: ${diceRoll.result} + ${diceRoll.modifier} = ${diceRoll.total}`,
                    metadata: { diceRoll }
                })
            }

            console.log(`🎲 Dice roll from ${socket.username}: ${diceRoll.type} = ${diceRoll.total}`)
        } catch (error) {
            console.error('Dice roll error:', error)
            socket.emit('error', { message: 'Ошибка при обработке броска' })
        }
    }

    /**
     * Обработка сообщения в чат
     */
    private async handleChatMessage(socket: AuthenticatedSocket, data: { sessionId: string, message: string, type?: 'ic' | 'ooc' }): Promise<void> {
        try {
            const userId = socket.userId!

            const chatMessage = {
                sessionId: data.sessionId,
                playerId: userId,
                playerName: socket.username,
                message: data.message,
                type: data.type || 'ooc',
                timestamp: new Date()
            }

            // Рассылаем сообщение участникам
            this.io.to(`session_${data.sessionId}`).emit('chat_message', chatMessage)

            // Сохраняем в лог
            await this.sessionService.logAction({
                sessionId: data.sessionId,
                characterId: null,
                actionType: 'chat_message',
                content: data.message,
                metadata: { type: data.type }
            })
        } catch (error) {
            console.error('Chat message error:', error)
            socket.emit('error', { message: 'Ошибка при отправке сообщения' })
        }
    }

    /**
     * Обработка обновления персонажа
     */
    private async handleCharacterUpdate(socket: AuthenticatedSocket, data: { sessionId: string, characterId: string, updates: any }): Promise<void> {
        try {
            // Рассылаем обновление участникам сессии
            socket.to(`session_${data.sessionId}`).emit('character_update', {
                characterId: data.characterId,
                updates: data.updates,
                updatedBy: socket.username,
                timestamp: new Date()
            })
        } catch (error) {
            console.error('Character update error:', error)
        }
    }

    /**
     * Получение текущего состояния сессии
     */
    private async handleGetSessionState(socket: AuthenticatedSocket, sessionId: string): Promise<void> {
        try {
            await this.sendSessionState(socket, sessionId)
        } catch (error) {
            console.error('Get session state error:', error)
            socket.emit('error', { message: 'Ошибка при получении состояния сессии' })
        }
    }

    /**
     * Отправка состояния сессии
     */
    private async sendSessionState(socket: AuthenticatedSocket, sessionId: string): Promise<void> {
        try {
            const sessionState = await this.sessionService.getSessionState(sessionId)
            const connectedPlayers = Array.from(this.sessionRooms.get(sessionId) || [])

            socket.emit('session_state', {
                session: sessionState,
                connectedPlayers: connectedPlayers,
                timestamp: new Date()
            })
        } catch (error) {
            console.error('Send session state error:', error)
            socket.emit('error', { message: 'Ошибка при получении состояния сессии' })
        }
    }

    /**
     * Обработка отключения клиента
     */
    private handleDisconnection(socket: AuthenticatedSocket): void {
        const userId = socket.userId!

        console.log(`💔 User ${socket.username} disconnected (${socket.id})`)

        // Удаляем из списка подключенных пользователей
        this.unregisterUser(userId, socket.id)

        // Покидаем текущую сессию если есть
        if (socket.currentSessionId) {
            this.handleLeaveSession(socket, socket.currentSessionId)
        }
    }

    /**
     * Регистрация пользователя
     */
    private registerUser(userId: string, socketId: string): void {
        if (!this.connectedUsers.has(userId)) {
            this.connectedUsers.set(userId, [])
        }
        this.connectedUsers.get(userId)!.push(socketId)
    }

    /**
     * Отмена регистрации пользователя
     */
    private unregisterUser(userId: string, socketId: string): void {
        if (this.connectedUsers.has(userId)) {
            const sockets = this.connectedUsers.get(userId)!
            const index = sockets.indexOf(socketId)
            if (index > -1) {
                sockets.splice(index, 1)
            }

            if (sockets.length === 0) {
                this.connectedUsers.delete(userId)
            }
        }
    }

    /**
     * Публичные методы для использования другими модулями
     */

    /**
     * Отправка уведомления конкретному пользователю
     */
    public sendToUser(userId: string, event: string, data: any): void {
        const userSockets = this.connectedUsers.get(userId)
        if (userSockets) {
            userSockets.forEach(socketId => {
                this.io.to(socketId).emit(event, data)
            })
        }
    }

    /**
     * Отправка уведомления всем участникам сессии
     */
    public sendToSession(sessionId: string, event: string, data: any): void {
        this.io.to(`session_${sessionId}`).emit(event, data)
    }

    /**
     * Уведомление о начале хода игрока
     */
    public notifyPlayerTurn(sessionId: string, playerId: string, playerName: string): void {
        this.sendToSession(sessionId, 'player_turn', {
            playerId,
            playerName,
            message: `Ход игрока ${playerName}`,
            timestamp: new Date()
        })
    }

    /**
     * Уведомление об обновлении инициативы
     */
    public notifyInitiativeUpdate(sessionId: string, initiativeOrder: any[]): void {
        this.sendToSession(sessionId, 'initiative_update', {
            initiativeOrder,
            timestamp: new Date()
        })
    }

    /**
     * Уведомление о начале/конце боя
     */
    public notifyCombatStateChange(sessionId: string, inCombat: boolean, round?: number): void {
        this.sendToSession(sessionId, 'combat_state_change', {
            inCombat,
            round,
            timestamp: new Date()
        })
    }

    /**
     * Уведомление об изменении сцены
     */
    public notifySceneChange(sessionId: string, newScene: string, description: string): void {
        this.sendToSession(sessionId, 'scene_change', {
            scene: newScene,
            description,
            timestamp: new Date()
        })
    }

    /**
     * Уведомление об обновлении квеста
     */
    public notifyQuestUpdate(sessionId: string, questUpdate: any): void {
        this.sendToSession(sessionId, 'quest_update', {
            ...questUpdate,
            timestamp: new Date()
        })
    }

    /**
     * Массовое уведомление о событии в игре
     */
    public broadcastGameEvent(sessionId: string, eventType: string, eventData: any): void {
        this.sendToSession(sessionId, 'game_event', {
            type: eventType,
            data: eventData,
            timestamp: new Date()
        })
    }

    /**
     * Получение статистики подключений
     */
    public getConnectionStats(): {
        totalConnections: number
        activeSessions: number
        userSessions: { [sessionId: string]: number }
    } {
        const userSessions: { [sessionId: string]: number } = {}

        for (const [sessionId, users] of this.sessionRooms.entries()) {
            userSessions[sessionId] = users.size
        }

        return {
            totalConnections: this.connectedUsers.size,
            activeSessions: this.sessionRooms.size,
            userSessions
        }
    }

    /**
     * Проверка, подключен ли пользователь
     */
    public isUserConnected(userId: string): boolean {
        return this.connectedUsers.has(userId)
    }

    /**
     * Получение списка подключенных пользователей в сессии
     */
    public getSessionUsers(sessionId: string): string[] {
        return Array.from(this.sessionRooms.get(sessionId) || [])
    }

    /**
     * Принудительное отключение пользователя
     */
    public disconnectUser(userId: string, reason: string): void {
        const userSockets = this.connectedUsers.get(userId)
        if (userSockets) {
            userSockets.forEach(socketId => {
                const socket = this.io.sockets.sockets.get(socketId)
                if (socket) {
                    socket.emit('force_disconnect', { reason })
                    socket.disconnect(true)
                }
            })
        }
    }

    /**
     * Очистка неактивных соединений
     */
    public cleanupInactiveConnections(): void {
        // Удаляем сокеты, которые больше не подключены
        for (const [userId, socketIds] of this.connectedUsers.entries()) {
            const activeSockets = socketIds.filter(socketId => {
                return this.io.sockets.sockets.has(socketId)
            })

            if (activeSockets.length === 0) {
                this.connectedUsers.delete(userId)
            } else if (activeSockets.length !== socketIds.length) {
                this.connectedUsers.set(userId, activeSockets)
            }
        }

        // Очищаем пустые сессии
        for (const [sessionId, users] of this.sessionRooms.entries()) {
            if (users.size === 0) {
                this.sessionRooms.delete(sessionId)
            }
        }
    }
}