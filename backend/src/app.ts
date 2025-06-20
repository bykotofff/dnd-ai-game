// backend/src/app.ts
import express, { Application } from 'express'
import cors from 'cors'
import helmet from 'helmet'
import { createServer } from 'http'
import { Server as SocketIOServer } from 'socket.io'
import dotenv from 'dotenv'

// Импорты модулей
import { DatabaseService } from '@shared/database/database.service'
import { AuthModule } from '@modules/auth/auth.module'
import { CharacterModule } from '@modules/characters/character.module'
import { SessionModule } from '@modules/sessions/session.module'
import { AIMasterModule } from '@modules/game-master/ai-master.module'
import { DiceModule } from '@modules/dice/dice.module'
import { QuestModule } from '@modules/quests/quest.module'
import { ImageModule } from '@modules/images/image.module'

// Импорт Socket.IO обработчика
import { SocketHandler } from '@shared/socket/socket.handler'

// Загрузка переменных окружения
dotenv.config()

class App {
    public app: Application
    public server
    public io: SocketIOServer
    private databaseService: DatabaseService
    private socketHandler: SocketHandler

    constructor() {
        this.app = express()
        this.server = createServer(this.app)
        this.io = new SocketIOServer(this.server, {
            cors: {
                origin: process.env.FRONTEND_URL || "http://localhost:3000",
                methods: ["GET", "POST"]
            }
        })

        this.databaseService = new DatabaseService()
        this.socketHandler = new SocketHandler(this.io)

        this.initializeMiddlewares()
        this.initializeRoutes()
        this.initializeSocketIO()
        this.initializeErrorHandling()
    }

    private initializeMiddlewares(): void {
        // Безопасность
        this.app.use(helmet())

        // CORS
        this.app.use(cors({
            origin: process.env.FRONTEND_URL || "http://localhost:3000",
            credentials: true
        }))

        // Парсинг JSON
        this.app.use(express.json({ limit: '10mb' }))
        this.app.use(express.urlencoded({ extended: true, limit: '10mb' }))

        // Статические файлы
        this.app.use('/uploads', express.static('uploads'))

        // Логирование запросов
        this.app.use((req, res, next) => {
            console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`)
            next()
        })
    }

    private initializeRoutes(): void {
        // Проверка здоровья приложения
        this.app.get('/health', (req, res) => {
            res.status(200).json({
                status: 'ok',
                timestamp: new Date().toISOString(),
                uptime: process.uptime(),
                environment: process.env.NODE_ENV || 'development'
            })
        })

        // API роуты
        this.app.use('/api/auth', new AuthModule().router)
        this.app.use('/api/characters', new CharacterModule().router)
        this.app.use('/api/sessions', new SessionModule().router)
        this.app.use('/api/game-master', new AIMasterModule().router)
        this.app.use('/api/dice', new DiceModule().router)
        this.app.use('/api/quests', new QuestModule().router)
        this.app.use('/api/images', new ImageModule().router)

        // 404 обработчик
        this.app.use('*', (req, res) => {
            res.status(404).json({
                success: false,
                error: 'Маршрут не найден',
                path: req.originalUrl
            })
        })
    }

    private initializeSocketIO(): void {
        this.io.on('connection', (socket) => {
            console.log(`🔌 Клиент подключен: ${socket.id}`)

            // Передаем обработку в SocketHandler
            this.socketHandler.handleConnection(socket)
        })
    }

    private initializeErrorHandling(): void {
        // Обработчик необработанных ошибок
        this.app.use((error: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
            console.error('🔥 Необработанная ошибка:', error)

            res.status(500).json({
                success: false,
                error: process.env.NODE_ENV === 'production'
                    ? 'Внутренняя ошибка сервера'
                    : error.message,
                ...(process.env.NODE_ENV !== 'production' && { stack: error.stack })
            })
        })

        // Обработка необработанных промисов
        process.on('unhandledRejection', (reason, promise) => {
            console.error('🔥 Необработанное отклонение промиса:', reason)
        })

        process.on('uncaughtException', (error) => {
            console.error('🔥 Необработанное исключение:', error)
            process.exit(1)
        })
    }

    public async start(): Promise<void> {
        try {
            // Подключение к базе данных
            await this.databaseService.connect()

            const port = process.env.PORT || 3001

            this.server.listen(port, () => {
                console.log(`🚀 Сервер запущен на порту ${port}`)
                console.log(`📊 Режим: ${process.env.NODE_ENV || 'development'}`)
                console.log(`🔗 Health check: http://localhost:${port}/health`)
            })
        } catch (error) {
            console.error('❌ Ошибка запуска сервера:', error)
            process.exit(1)
        }
    }

    public async stop(): Promise<void> {
        try {
            await this.databaseService.disconnect()
            this.server.close()
            console.log('✅ Сервер остановлен')
        } catch (error) {
            console.error('❌ Ошибка остановки сервера:', error)
        }
    }
}

// Создание и запуск приложения
const app = new App()

// Graceful shutdown
process.on('SIGTERM', async () => {
    console.log('📝 Получен сигнал SIGTERM, останавливаем сервер...')
    await app.stop()
})

process.on('SIGINT', async () => {
    console.log('📝 Получен сигнал SIGINT, останавливаем сервер...')
    await app.stop()
})

// Запуск сервера
app.start()

export default app