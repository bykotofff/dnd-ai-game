// backend/src/modules/auth/auth.controller.ts
import { Request, Response } from 'express'
import { AuthService } from './auth.service'
import {
    RegisterSchema,
    LoginSchema,
    ChangePasswordSchema,
    AuthError,
    ValidationError
} from './auth.types'

export class AuthController {
    private authService: AuthService

    constructor() {
        this.authService = new AuthService()
    }

    /**
     * Регистрация нового пользователя
     * POST /api/auth/register
     */
    register = async (req: Request, res: Response): Promise<void> => {
        try {
            // Валидация входных данных
            const validatedData = RegisterSchema.parse(req.body)

            const result = await this.authService.register(validatedData)

            res.status(201).json({
                success: true,
                message: 'Пользователь успешно зарегистрирован',
                data: result
            })
        } catch (error) {
            this.handleError(error, res)
        }
    }

    /**
     * Авторизация пользователя
     * POST /api/auth/login
     */
    login = async (req: Request, res: Response): Promise<void> => {
        try {
            // Валидация входных данных
            const validatedData = LoginSchema.parse(req.body)

            const result = await this.authService.login(validatedData)

            res.status(200).json({
                success: true,
                message: 'Авторизация успешна',
                data: result
            })
        } catch (error) {
            this.handleError(error, res)
        }
    }

    /**
     * Получение профиля текущего пользователя
     * GET /api/auth/profile
     */
    getProfile = async (req: Request, res: Response): Promise<void> => {
        try {
            const userId = req.user!.userId

            const profile = await this.authService.getUserProfile(userId)

            res.status(200).json({
                success: true,
                data: profile
            })
        } catch (error) {
            this.handleError(error, res)
        }
    }

    /**
     * Изменение пароля
     * POST /api/auth/change-password
     */
    changePassword = async (req: Request, res: Response): Promise<void> => {
        try {
            const userId = req.user!.userId
            const validatedData = ChangePasswordSchema.parse(req.body)

            await this.authService.changePassword(userId, validatedData)

            res.status(200).json({
                success: true,
                message: 'Пароль успешно изменен'
            })
        } catch (error) {
            this.handleError(error, res)
        }
    }

    /**
     * Обновление токена
     * POST /api/auth/refresh
     */
    refreshToken = async (req: Request, res: Response): Promise<void> => {
        try {
            const userId = req.user!.userId

            const newToken = await this.authService.refreshToken(userId)

            res.status(200).json({
                success: true,
                message: 'Токен успешно обновлен',
                data: { token: newToken }
            })
        } catch (error) {
            this.handleError(error, res)
        }
    }

    /**
     * Проверка валидности токена
     * GET /api/auth/verify
     */
    verifyToken = async (req: Request, res: Response): Promise<void> => {
        try {
            // Если middleware прошел успешно, токен валиден
            res.status(200).json({
                success: true,
                message: 'Токен валиден',
                data: {
                    user: req.user
                }
            })
        } catch (error) {
            this.handleError(error, res)
        }
    }

    /**
     * Выход из системы
     * POST /api/auth/logout
     */
    logout = async (req: Request, res: Response): Promise<void> => {
        try {
            // В нашей реализации токены stateless, поэтому просто возвращаем успех
            // В продакшене можно добавить blacklist токенов в Redis
            res.status(200).json({
                success: true,
                message: 'Выход выполнен успешно'
            })
        } catch (error) {
            this.handleError(error, res)
        }
    }

    /**
     * Удаление аккаунта
     * DELETE /api/auth/account
     */
    deleteAccount = async (req: Request, res: Response): Promise<void> => {
        try {
            const userId = req.user!.userId
            const { password } = req.body

            if (!password) {
                res.status(400).json({
                    success: false,
                    error: 'Пароль обязателен для удаления аккаунта'
                })
                return
            }

            await this.authService.deleteAccount(userId, password)

            res.status(200).json({
                success: true,
                message: 'Аккаунт успешно удален'
            })
        } catch (error) {
            this.handleError(error, res)
        }
    }

    /**
     * Проверка доступности email
     * GET /api/auth/check-email/:email
     */
    checkEmailAvailability = async (req: Request, res: Response): Promise<void> => {
        try {
            const { email } = req.params

            if (!email) {
                res.status(400).json({
                    success: false,
                    error: 'Email обязателен'
                })
                return
            }

            const user = await this.authService.getUserProfile(email)
            const isAvailable = !user

            res.status(200).json({
                success: true,
                data: {
                    email,
                    available: isAvailable
                }
            })
        } catch (error) {
            // Если пользователь не найден, email доступен
            res.status(200).json({
                success: true,
                data: {
                    email: req.params.email,
                    available: true
                }
            })
        }
    }

    /**
     * Проверка доступности username
     * GET /api/auth/check-username/:username
     */
    checkUsernameAvailability = async (req: Request, res: Response): Promise<void> => {
        try {
            const { username } = req.params

            if (!username) {
                res.status(400).json({
                    success: false,
                    error: 'Username обязателен'
                })
                return
            }

            // Простая проверка через базу данных
            const existingUser = await this.authService.getUserProfile(username)
            const isAvailable = !existingUser

            res.status(200).json({
                success: true,
                data: {
                    username,
                    available: isAvailable
                }
            })
        } catch (error) {
            // Если пользователь не найден, username доступен
            res.status(200).json({
                success: true,
                data: {
                    username: req.params.username,
                    available: true
                }
            })
        }
    }

    /**
     * Обработка ошибок
     */
    private handleError = (error: any, res: Response): void => {
        console.error('Auth controller error:', error)

        if (error.name === 'ZodError') {
            res.status(400).json({
                success: false,
                error: 'Ошибка валидации данных',
                details: error.errors.map((err: any) => ({
                    field: err.path.join('.'),
                    message: err.message
                }))
            })
            return
        }

        if (error instanceof ValidationError) {
            res.status(error.statusCode).json({
                success: false,
                error: error.message
            })
            return
        }

        if (error instanceof AuthError) {
            res.status(error.statusCode).json({
                success: false,
                error: error.message
            })
            return
        }

        // Общая ошибка сервера
        res.status(500).json({
            success: false,
            error: 'Внутренняя ошибка сервера'
        })
    }
}