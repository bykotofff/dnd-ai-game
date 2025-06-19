'use client'

// frontend/src/components/auth/login-form.tsx
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
import { Mail, Lock, AlertCircle, Eye, EyeOff } from 'lucide-react'
import toast from 'react-hot-toast'

const loginSchema = z.object({
    email: z
        .string()
        .min(1, 'Email обязателен')
        .email('Неверный формат email'),
    password: z
        .string()
        .min(1, 'Пароль обязателен')
        .min(6, 'Пароль должен содержать минимум 6 символов')
})

type LoginFormData = z.infer<typeof loginSchema>

interface LoginFormProps {
    onSuccess?: () => void
    redirectTo?: string
}

export function LoginForm({ onSuccess, redirectTo = '/dashboard' }: LoginFormProps) {
    const [showPassword, setShowPassword] = useState(false)
    const router = useRouter()
    const { login, isLoading, error, clearError } = useAuthStore()

    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
        setError,
        clearErrors
    } = useForm<LoginFormData>({
        resolver: zodResolver(loginSchema)
    })

    const onSubmit = async (data: LoginFormData) => {
        try {
            clearError()
            clearErrors()

            await login(data)

            toast.success('Успешный вход в систему!')

            if (onSuccess) {
                onSuccess()
            } else {
                router.push(redirectTo)
            }
        } catch (error: any) {
            console.error('Login error:', error)

            // Обрабатываем специфичные ошибки
            if (error.message?.includes('email')) {
                setError('email', { message: 'Пользователь с таким email не найден' })
            } else if (error.message?.includes('пароль') || error.message?.includes('password')) {
                setError('password', { message: 'Неверный пароль' })
            } else {
                toast.error(error.message || 'Ошибка при входе в систему')
            }
        }
    }

    return (
        <Card className="w-full max-w-md mx-auto">
            <CardHeader className="space-y-1">
                <CardTitle className="text-2xl font-bold text-center">
                    Вход в систему
                </CardTitle>
                <CardDescription className="text-center">
                    Введите свои данные для входа в D&D игру
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
                            {...register('email')}
                            type="email"
                            label="Email"
                            placeholder="your@email.com"
                            leftIcon={<Mail className="h-4 w-4" />}
                            error={errors.email?.message}
                            autoComplete="email"
                            autoFocus
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
                            autoComplete="current-password"
                        />
                    </div>

                    <div className="flex items-center justify-between">
                        <Link
                            href="/auth/forgot-password"
                            className="text-sm text-primary hover:underline"
                        >
                            Забыли пароль?
                        </Link>
                    </div>
                </CardContent>

                <CardFooter className="flex flex-col space-y-4">
                    <Button
                        type="submit"
                        className="w-full"
                        loading={isLoading || isSubmitting}
                        disabled={isLoading || isSubmitting}
                    >
                        Войти
                    </Button>

                    <div className="text-center text-sm text-muted-foreground">
                        Нет аккаунта?{' '}
                        <Link
                            href="/auth/register"
                            className="text-primary hover:underline font-medium"
                        >
                            Зарегистрироваться
                        </Link>
                    </div>
                </CardFooter>
            </form>
        </Card>
    )
}

// Демо-версия с предзаполненными данными для разработки
export function LoginFormDemo() {
    return (
        <div className="space-y-4">
            <LoginForm />

            {process.env.NODE_ENV === 'development' && (
                <Card className="max-w-md mx-auto">
                    <CardHeader>
                        <CardTitle className="text-sm">Демо-данные</CardTitle>
                    </CardHeader>
                    <CardContent className="text-xs space-y-2">
                        <div>
                            <strong>Email:</strong> demo@example.com
                        </div>
                        <div>
                            <strong>Пароль:</strong> password123
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    )
}