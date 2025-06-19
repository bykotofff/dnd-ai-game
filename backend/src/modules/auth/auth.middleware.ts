// backend/src/modules/auth/auth.middleware.ts
import { Request, Response, NextFunction } from 'express'
import { AuthService } from './auth.service'
import { AuthError, JwtPayload } from './auth.types'

// Расширяем интерфейс Request
declare global {
    namespace Express {
        interface Request {
            user?: JwtPayload
        }
    }
}

export class AuthMiddleware {
    private authService: AuthService

    constructor() {
        this.authService = new AuthService()
    }

    /**
     * Middleware для проверки аутентификации
     */
    authenticate = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const authHeader = req.headers.authorization

            if (!authHeader) {
                res.status(401).json({
                    error: 'Токен авторизации не предоставлен'
                })
                return
            }

            // Проверяем формат токена (Bearer <token>)
            const token = authHeader.startsWith('Bearer ')
                ? authHeader.slice(7)
                : authHeader

            if (!token) {
                res.status(401).json({
                    error: 'Неверный формат токена'
                })
                return
            }

            // Верифицируем токен
            const decoded = await this.authService.verifyToken(token)

            // Добавляем информацию о пользователе в request
            req.user = decoded

            next()
        } catch (error) {
            if (error instanceof AuthError) {
                res.status(error.statusCode).json({
                    error: error.message
                })
                return
            }

            console.error('Authentication middleware error:', error)
            res.status(500).json({
                error: 'Ошибка аутентификации'
            })
        }
    }

    /**
     * Middleware для опциональной аутентификации
     * Не возвращает ошибку, если токен отсутствует
     */
    optionalAuthenticate = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const authHeader = req.headers.authorization

            if (!authHeader) {
                next()
                return
            }

            const token = authHeader.startsWith('Bearer ')
                ? authHeader.slice(7)
                : authHeader

            if (token) {
                try {
                    const decoded = await this.authService.verifyToken(token)
                    req.user = decoded
                } catch (error) {
                    // Игнорируем ошибки токена для опциональной аутентификации
                    console.log('Optional authentication failed:', error)
                }
            }

            next()
        } catch (error) {
            console.error('Optional authentication middleware error:', error)
            next()
        }
    }

    /**
     * Middleware для проверки владения ресурсом
     */
    checkResourceOwnership = (resourceUserIdField: string = 'userId') => {
        return (req: Request, res: Response, next: NextFunction): void => {
            try {
                const user = req.user
                if (!user) {
                    res.status(401).json({
                        error: 'Пользователь не аутентифицирован'
                    })
                    return
                }

                // Проверяем ID пользователя в параметрах запроса
                const resourceUserId = req.params[resourceUserIdField] || req.body[resourceUserIdField]

                if (resourceUserId && resourceUserId !== user.userId) {
                    res.status(403).json({
                        error: 'Недостаточно прав для доступа к ресурсу'
                    })
                    return
                }

                next()
            } catch (error) {
                console.error('Resource ownership check error:', error)
                res.status(500).json({
                    error: 'Ошибка проверки прав доступа'
                })
            }
        }
    }

    /**
     * Middleware для ограничения частоты запросов по пользователю
     */
    rateLimit = (maxRequests: number = 100, windowMs: number = 15 * 60 * 1000) => {
        const userRequests = new Map<string, { count: number; resetTime: number }>()

        return (req: Request, res: Response, next: NextFunction): void => {
            try {
                const user = req.user
                if (!user) {
                    next()
                    return
                }

                const now = Date.now()
                const userId = user.userId
                const userLimit = userRequests.get(userId)

                if (!userLimit || now > userLimit.resetTime) {
                    // Создаем новое окно для пользователя
                    userRequests.set(userId, {
                        count: 1,
                        resetTime: now + windowMs
                    })
                    next()
                    return
                }

                if (userLimit.count >= maxRequests) {
                    res.status(429).json({
                        error: 'Слишком много запросов. Попробуйте позже.',
                        retryAfter: Math.ceil((userLimit.resetTime - now) / 1000)
                    })
                    return
                }

                // Увеличиваем счетчик
                userLimit.count++
                next()
            } catch (error) {
                console.error('Rate limit middleware error:', error)
                next()
            }
        }
    }
}

// Создаем экземпляр middleware
export const authMiddleware = new AuthMiddleware()