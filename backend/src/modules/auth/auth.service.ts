// backend/src/modules/auth/auth.service.ts
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { db } from '@shared/database/database.service'
import {
    RegisterDto,
    LoginDto,
    ChangePasswordDto,
    AuthResponse,
    JwtPayload,
    AuthError,
    ValidationError
} from './auth.types'

export class AuthService {
    private readonly JWT_SECRET = process.env.JWT_SECRET!
    private readonly JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d'
    private readonly SALT_ROUNDS = 12

    /**
     * Регистрация нового пользователя
     */
    async register(data: RegisterDto): Promise<AuthResponse> {
        try {
            // Проверяем существование пользователя с таким email
            const existingUserByEmail = await db.user.findUnique({
                where: { email: data.email }
            })

            if (existingUserByEmail) {
                throw new ValidationError('Пользователь с таким email уже существует')
            }

            // Проверяем существование пользователя с таким username
            const existingUserByUsername = await db.user.findUnique({
                where: { username: data.username }
            })

            if (existingUserByUsername) {
                throw new ValidationError('Пользователь с таким именем уже существует')
            }

            // Хешируем пароль
            const hashedPassword = await bcrypt.hash(data.password, this.SALT_ROUNDS)

            // Создаем пользователя
            const user = await db.user.create({
                data: {
                    email: data.email,
                    username: data.username,
                    password: hashedPassword
                },
                select: {
                    id: true,
                    email: true,
                    username: true,
                    createdAt: true
                }
            })

            // Генерируем JWT токен
            const token = this.generateToken({
                userId: user.id,
                email: user.email,
                username: user.username
            })

            return {
                user,
                token
            }
        } catch (error) {
            if (error instanceof ValidationError) {
                throw error
            }
            console.error('Registration error:', error)
            throw new AuthError('Ошибка при регистрации')
        }
    }

    /**
     * Авторизация пользователя
     */
    async login(data: LoginDto): Promise<AuthResponse> {
        try {
            // Находим пользователя по email
            const user = await db.user.findUnique({
                where: { email: data.email }
            })

            if (!user) {
                throw new AuthError('Неверный email или пароль')
            }

            // Проверяем пароль
            const isPasswordValid = await bcrypt.compare(data.password, user.password)

            if (!isPasswordValid) {
                throw new AuthError('Неверный email или пароль')
            }

            // Генерируем JWT токен
            const token = this.generateToken({
                userId: user.id,
                email: user.email,
                username: user.username
            })

            return {
                user: {
                    id: user.id,
                    email: user.email,
                    username: user.username,
                    createdAt: user.createdAt
                },
                token
            }
        } catch (error) {
            if (error instanceof AuthError) {
                throw error
            }
            console.error('Login error:', error)
            throw new AuthError('Ошибка при авторизации')
        }
    }

    /**
     * Изменение пароля
     */
    async changePassword(userId: string, data: ChangePasswordDto): Promise<void> {
        try {
            // Находим пользователя
            const user = await db.user.findUnique({
                where: { id: userId }
            })

            if (!user) {
                throw new AuthError('Пользователь не найден')
            }

            // Проверяем текущий пароль
            const isCurrentPasswordValid = await bcrypt.compare(data.currentPassword, user.password)

            if (!isCurrentPasswordValid) {
                throw new AuthError('Неверный текущий пароль')
            }

            // Хешируем новый пароль
            const hashedNewPassword = await bcrypt.hash(data.newPassword, this.SALT_ROUNDS)

            // Обновляем пароль
            await db.user.update({
                where: { id: userId },
                data: { password: hashedNewPassword }
            })
        } catch (error) {
            if (error instanceof AuthError) {
                throw error
            }
            console.error('Change password error:', error)
            throw new AuthError('Ошибка при изменении пароля')
        }
    }

    /**
     * Получение информации о пользователе по токену
     */
    async getUserProfile(userId: string) {
        try {
            const user = await db.user.findUnique({
                where: { id: userId },
                select: {
                    id: true,
                    email: true,
                    username: true,
                    createdAt: true,
                    _count: {
                        select: {
                            characters: true,
                            gameSessions: true
                        }
                    }
                }
            })

            if (!user) {
                throw new AuthError('Пользователь не найден')
            }

            return user
        } catch (error) {
            if (error instanceof AuthError) {
                throw error
            }
            console.error('Get user profile error:', error)
            throw new AuthError('Ошибка при получении профиля')
        }
    }

    /**
     * Проверка валидности токена
     */
    async verifyToken(token: string): Promise<JwtPayload> {
        try {
            const decoded = jwt.verify(token, this.JWT_SECRET) as JwtPayload

            // Проверяем существование пользователя
            const user = await db.user.findUnique({
                where: { id: decoded.userId }
            })

            if (!user) {
                throw new AuthError('Пользователь не найден')
            }

            return decoded
        } catch (error) {
            if (error instanceof jwt.JsonWebTokenError) {
                throw new AuthError('Недействительный токен')
            }
            if (error instanceof jwt.TokenExpiredError) {
                throw new AuthError('Токен истек')
            }
            throw error
        }
    }

    /**
     * Обновление токена
     */
    async refreshToken(userId: string): Promise<string> {
        try {
            const user = await db.user.findUnique({
                where: { id: userId },
                select: {
                    id: true,
                    email: true,
                    username: true
                }
            })

            if (!user) {
                throw new AuthError('Пользователь не найден')
            }

            return this.generateToken({
                userId: user.id,
                email: user.email,
                username: user.username
            })
        } catch (error) {
            console.error('Refresh token error:', error)
            throw new AuthError('Ошибка при обновлении токена')
        }
    }

    /**
     * Генерация JWT токена
     */
    private generateToken(payload: Omit<JwtPayload, 'iat' | 'exp'>): string {
        return jwt.sign(
            payload,
            this.JWT_SECRET,
            { expiresIn: this.JWT_EXPIRES_IN }
        )
    }

    /**
     * Удаление аккаунта пользователя
     */
    async deleteAccount(userId: string, password: string): Promise<void> {
        try {
            const user = await db.user.findUnique({
                where: { id: userId }
            })

            if (!user) {
                throw new AuthError('Пользователь не найден')
            }

            // Проверяем пароль перед удалением
            const isPasswordValid = await bcrypt.compare(password, user.password)

            if (!isPasswordValid) {
                throw new AuthError('Неверный пароль')
            }

            // Удаляем пользователя (каскадно удалятся связанные данные)
            await db.user.delete({
                where: { id: userId }
            })
        } catch (error) {
            if (error instanceof AuthError) {
                throw error
            }
            console.error('Delete account error:', error)
            throw new AuthError('Ошибка при удалении аккаунта')
        }
    }
}