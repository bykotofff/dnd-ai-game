// backend/src/modules/auth/auth.router.ts
import { Router } from 'express'
import { AuthController } from './auth.controller'
import { authMiddleware } from './auth.middleware'

export class AuthRouter {
    public router: Router
    private authController: AuthController

    constructor() {
        this.router = Router()
        this.authController = new AuthController()
        this.initializeRoutes()
    }

    private initializeRoutes(): void {
        /**
         * Публичные маршруты (не требуют аутентификации)
         */

        // Регистрация
        this.router.post('/register', this.authController.register)

        // Авторизация
        this.router.post('/login', this.authController.login)

        // Проверка доступности email
        this.router.get('/check-email/:email', this.authController.checkEmailAvailability)

        // Проверка доступности username
        this.router.get('/check-username/:username', this.authController.checkUsernameAvailability)

        /**
         * Защищенные маршруты (требуют аутентификации)
         */

        // Получение профиля
        this.router.get('/profile',
            authMiddleware.authenticate,
            this.authController.getProfile
        )

        // Проверка валидности токена
        this.router.get('/verify',
            authMiddleware.authenticate,
            this.authController.verifyToken
        )

        // Обновление токена
        this.router.post('/refresh',
            authMiddleware.authenticate,
            this.authController.refreshToken
        )

        // Изменение пароля
        this.router.post('/change-password',
            authMiddleware.authenticate,
            authMiddleware.rateLimit(5, 15 * 60 * 1000), // 5 попыток за 15 минут
            this.authController.changePassword
        )

        // Выход из системы
        this.router.post('/logout',
            authMiddleware.authenticate,
            this.authController.logout
        )

        // Удаление аккаунта
        this.router.delete('/account',
            authMiddleware.authenticate,
            authMiddleware.rateLimit(3, 60 * 60 * 1000), // 3 попытки за час
            this.authController.deleteAccount
        )
    }
}

export const authRouter = new AuthRouter().router