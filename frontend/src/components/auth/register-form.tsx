'use client'

// frontend/src/components/auth/register-form.tsx
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/stores/auth-store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Mail, Lock, User, AlertCircle, CheckCircle, Shield } from 'lucide-react'
import { cn } from '@/lib/utils'
import toast from 'react-hot-toast'

const registerSchema = z.object({
    username: z
        .string()
        .min(1, 'Имя пользователя обязательно')
        .min(3, 'Имя пользователя должно содержать минимум 3 символа')
        .max(20, 'Имя пользователя не должно превышать 20 символов')
        .regex(/^[a-zA-Z0-9_]+$/, 'Имя пользователя может содержать только буквы, цифры и подчеркивания'),
    email: z
        .string()
        .min(1, 'Email обязателен')
        .email('Неверный формат email'),
    password: z
        .string()
        .min(1, 'Пароль обязателен')
        .min(6, 'Пароль должен содержать минимум 6 символов')
        .max(100, 'Пароль не должен превышать 100 символов'),
    confirmPassword: z
        .string()
        .min(1, 'Подтверждение пароля обязательно')
}).refine((data) => data.password === data.confirmPassword, {
    message: 'Пароли не совпадают',
    path: ['confirmPassword']
})

type RegisterFormData = z.infer<typeof registerSchema>

interface RegisterFormProps {
    onSuccess?: () => void
    redirectTo?: string
}

export function RegisterForm({ onSuccess, redirectTo = '/dashboard' }: RegisterFormProps) {
    const [showPassword, setShowPassword] = useState(false)
    const [showConfirmPassword, setShowConfirmPassword] = useState(false)
    const router = useRouter()
    const { register: registerUser, isLoading, error, clearError } = useAuthStore()

    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
        watch,
        setError,
        clearErrors
    } = useForm<RegisterFormData>({
        resolver: zodResolver(registerSchema),
        mode: 'onChange'
    })

    const password = watch('password')

    // Валидация пароля в реальном времени
    const getPasswordStrength = (password: string) => {
        if (!password) return { score: 0, text: '', color: '' }

        let score = 0
        if (password.length >= 6) score++
        if (password.length >= 8) score++
        if (/[A-Z]/.test(password)) score++
        if (/[a-z]/.test(password)) score++
        if (/[0-9]/.test(password)) score++
        if (/[^A-Za-z0-9]/.test(password)) score++

        if (score <= 2) return { score, text: 'Слабый', color: 'text-red-500' }
        if (score <= 4) return { score, text: 'Средний', color: 'text-yellow-500' }
        return { score, text: 'Сильный', color: 'text-green-500' }
    }

    const passwordStrength = getPasswordStrength(password || '')

    const onSubmit = async (data: RegisterFormData) => {
        try {
            clearError()
            clearErrors()

            const { confirmPassword, ...registerData } = data
            await registerUser(registerData)

            toast.success('Регистрация успешна! Добро пожаловать!')

            if (onSuccess) {
                onSuccess()
            } else {
                router.push(redirectTo)
            }
        } catch (error: any) {
            console.error('Registration error:', error)

            // Обрабатываем специфичные ошибки
            if (error.message?.includes('email')) {
                setError('email', { message: 'Пользователь с таким email уже существует' })
            } else if (error.message?.includes('username')) {
                setError('username', { message: 'Пользователь с таким именем уже существует' })
            } else {
                toast.error(error.message || 'Ошибка при регистрации')
            }
        }
    }

    return (
        <Card className="w-full max-w-md mx-auto">
            <CardHeader className="space-y-1">
                <CardTitle className="text-2xl font-bold text-center">
                    Регистрация
                </CardTitle>
                <CardDescription className="text-center">
                    Создайте аккаунт для игры в D&D с ИИ мастером
                </CardDescription>
            </CardHeader>

            <form onSubmit={handleSubmit(onSubmit)}>
                <CardContent className="space-y-4">
                    {error && (
                        <div className="flex items-center space-x-2 p-3 rounded-md bg-destructive/10 border border-destructive/20">
                            <AlertCircle className="h-4 w-4 text-destructive" />
                            <p className="text-sm text-destructive">{error}</p>
                        </div>
                    )}

                    <div className="space-y-2">
                        <Input
                            {...register('username')}
                            type="text"
                            label="Имя пользователя"
                            placeholder="your_username"
                            leftIcon={<User className="h-4 w-4" />}
                            error={errors.username?.message}
                            helperText="Только буквы, цифры и подчеркивания"
                            autoComplete="username"
                            autoFocus
                        />
                    </div>

                    <div className="space-y-2">
                        <Input
                            {...register('email')}
                            type="email"
                            label="Email"
                            placeholder="your@email.com"
                            leftIcon={<Mail className="h-4 w-4" />}
                            error={errors.email?.message}
                            autoComplete="email"
                        />
                    </div>

                    <div className="space-y-2">
                        <Input
                            {...register('password')}
                            type="password"
                            label="Пароль"
                            placeholder="••••••••"
                            leftIcon={<Lock className="h-4 w-4" />}
                            error={errors.password?.message}
                            autoComplete="new-password"
                        />

                        {password && (
                            <div className="space-y-2">
                                <div className="flex items-center justify-between text-xs">
                                    <span className="text-muted-foreground">Сложность пароля:</span>
                                    <span className={passwordStrength.color}>{passwordStrength.text}</span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-1.5">
                                    <div
                                        className={cn(
                                            'h-1.5 rounded-full transition-all duration-300',
                                            passwordStrength.score <= 2 ? 'bg-red-500' :
                                                passwordStrength.score <= 4 ? 'bg-yellow-500' : 'bg-green-500'
                                        )}
                                        style={{ width: `${(passwordStrength.score / 6) * 100}%` }}
                                    />
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="space-y-2">
                        <Input
                            {...register('confirmPassword')}
                            type="password"
                            label="Подтверждение пароля"
                            placeholder="••••••••"
                            leftIcon={<Shield className="h-4 w-4" />}
                            error={errors.confirmPassword?.message}
                            autoComplete="new-password"
                        />
                    </div>

                    {/* Индикаторы требований к паролю */}
                    {password && (
                        <div className="space-y-1 text-xs">
                            <div className="flex items-center space-x-2">
                                {password.length >= 6 ? (
                                    <CheckCircle className="h-3 w-3 text-green-500" />
                                ) : (
                                    <div className="h-3 w-3 rounded-full border border-gray-300" />
                                )}
                                <span className={password.length >= 6 ? 'text-green-600' : 'text-gray-500'}>
                  Минимум 6 символов
                </span>
                            </div>
                            <div className="flex items-center space-x-2">
                                {/[A-Z]/.test(password) ? (
                                    <CheckCircle className="h-3 w-3 text-green-500" />
                                ) : (
                                    <div className="h-3 w-3 rounded-full border border-gray-300" />
                                )}
                                <span className={/[A-Z]/.test(password) ? 'text-green-600' : 'text-gray-500'}>
                  Заглавная буква
                </span>
                            </div>
                            <div className="flex items-center space-x-2">
                                {/[0-9]/.test(password) ? (
                                    <CheckCircle className="h-3 w-3 text-green-500" />
                                ) : (
                                    <div className="h-3 w-3 rounded-full border border-gray-300" />
                                )}
                                <span className={/[0-9]/.test(password) ? 'text-green-600' : 'text-gray-500'}>
                  Цифра
                </span>
                            </div>
                        </div>
                    )}
                </CardContent>

                <CardFooter className="flex flex-col space-y-4">
                    <Button
                        type="submit"
                        className="w-full"
                        loading={isLoading || isSubmitting}
                        disabled={isLoading || isSubmitting}
                    >
                        Зарегистрироваться
                    </Button>

                    <div className="text-center text-sm text-muted-foreground">
                        Уже есть аккаунт?{' '}
                        <Link
                            href="/auth/login"
                            className="text-primary hover:underline font-medium"
                        >
                            Войти
                        </Link>
                    </div>
                </CardFooter>
            </form>
        </Card>
    )
}

// Компонент с дополнительной информацией о безопасности
export function RegisterFormWithInfo() {
    return (
        <div className="space-y-6">
            <RegisterForm />

            <Card className="max-w-md mx-auto">
                <CardHeader>
                    <CardTitle className="text-sm flex items-center space-x-2">
                        <Shield className="h-4 w-4" />
                        <span>Безопасность данных</span>
                    </CardTitle>
                </CardHeader>
                <CardContent className="text-xs space-y-2 text-muted-foreground">
                    <p>
                        • Ваши данные защищены современным шифрованием
                    </p>
                    <p>
                        • Мы не передаем данные третьим лицам
                    </p>
                    <p>
                        • Пароли хранятся в зашифрованном виде
                    </p>
                </CardContent>
            </Card>
        </div>
    )
}