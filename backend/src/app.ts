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
                uptime: process.uptime()
            })
        })

        // API роуты
        this.app.use('/api/auth', AuthModule.router)
        this.app.use('/api/characters', CharacterModule.router)
        this.app.use('/api/sessions', SessionModule.router)
        this.app.use('/api/game-master', AIMasterModule.router)
        this.app.use('/api/dice', DiceModule.router)
        this.app.use('/api/quests', QuestModule.router)
        this.app.use('/api/images', ImageModule.router)

        // 404 обработчик
        this.app.use('*', (req, res) => {
            res.status(404).json({
                error: 'Route not found',
                path: req.originalUrl
            })
        })
    }

    private initializeSocketIO(): void {
        this.socketHandler.initialize()
    }

    private initializeErrorHandling(): void {
        // Глобальный обработчик ошибок
        this.app.use((error: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
            console.error('Global error handler:', error)

            res.status(500).json({
                error: 'Internal server error',
                message: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
            })
        })

        // Обработка неперехваченных исключений
        process.on('unhandledRejection', (reason, promise) => {
            console.error('Unhandled Rejection at:', promise, 'reason:', reason)
        })

        process.on('uncaughtException', (error) => {
            console.error('Uncaught Exception:', error)
            process.exit(1)
        })
    }

    public async start(): Promise<void> {
        try {
            // Подключение к базе данных
            await this.databaseService.connect()
            console.log('✅ Database connected successfully')

            // Инициализация ИИ модуля
            await AIMasterModule.initialize()

            // Запуск сервера
            const PORT = process.env.PORT || 3001
            this.server.listen(PORT, () => {
                console.log(`🚀 Server is running on port ${PORT}`)
                console.log(`📊 Health check available at http://localhost:${PORT}/health`)
                console.log(`🎮 Game API available at http://localhost:${PORT}/api`)
                console.log(`🤖 AI Master available at http://localhost:${PORT}/api/game-master`)
            })
        } catch (error) {
            console.error('❌ Failed to start server:', error)
            process.exit(1)
        }
    }
}

// Запуск приложения
const app = new App()
app.start()