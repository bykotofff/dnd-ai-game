// backend/src/modules/auth/auth.types.ts
import { z } from 'zod'

// Схемы валидации
export const RegisterSchema = z.object({
    email: z.string().email('Некорректный email'),
    username: z.string()
        .min(3, 'Имя пользователя должно содержать минимум 3 символа')
        .max(20, 'Имя пользователя не должно превышать 20 символов')
        .regex(/^[a-zA-Z0-9_]+$/, 'Имя пользователя может содержать только буквы, цифры и подчеркивания'),
    password: z.string()
        .min(6, 'Пароль должен содержать минимум 6 символов')
        .max(100, 'Пароль не должен превышать 100 символов')
})

export const LoginSchema = z.object({
    email: z.string().email('Некорректный email'),
    password: z.string().min(1, 'Пароль обязателен')
})

export const ChangePasswordSchema = z.object({
    currentPassword: z.string().min(1, 'Текущий пароль обязателен'),
    newPassword: z.string()
        .min(6, 'Новый пароль должен содержать минимум 6 символов')
        .max(100, 'Новый пароль не должен превышать 100 символов')
})

// Типы данных
export type RegisterDto = z.infer<typeof RegisterSchema>
export type LoginDto = z.infer<typeof LoginSchema>
export type ChangePasswordDto = z.infer<typeof ChangePasswordSchema>

// Интерфейсы ответов
export interface AuthResponse {
    user: {
        id: string
        email: string
        username: string
        createdAt: Date
    }
    token: string
}

export interface JwtPayload {
    userId: string
    email: string
    username: string
    iat?: number
    exp?: number
}

// Интерфейс для расширения Request
export interface AuthenticatedRequest extends Request {
    user?: JwtPayload
}

// Ошибки аутентификации
export class AuthError extends Error {
    constructor(
        message: string,
        public statusCode: number = 401
    ) {
        super(message)
        this.name = 'AuthError'
    }
}

export class ValidationError extends Error {
    constructor(
        message: string,
        public statusCode: number = 400
    ) {
        super(message)
        this.name = 'ValidationError'
    }
}