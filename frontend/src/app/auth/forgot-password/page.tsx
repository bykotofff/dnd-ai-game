'use client'

// frontend/src/app/auth/forgot-password/page.tsx
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import Link from 'next/link'
import { AuthLayout } from '@/components/auth/auth-layout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Mail, ArrowLeft, CheckCircle } from 'lucide-react'
import toast from 'react-hot-toast'

const forgotPasswordSchema = z.object({
    email: z
        .string()
        .min(1, 'Email обязателен')
        .email('Неверный формат email')
})

type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>

function ForgotPasswordForm() {
    const [isSubmitted, setIsSubmitted] = useState(false)
    const [email, setEmail] = useState('')

    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting }
    } = useForm<ForgotPasswordFormData>({
        resolver: zodResolver(forgotPasswordSchema)
    })

    const onSubmit = async (data: ForgotPasswordFormData) => {
        try {
            // TODO: Реализовать отправку email для сброса пароля
            // await apiClient.post('/auth/forgot-password', data)

            // Имитируем отправку
            await new Promise(resolve => setTimeout(resolve, 2000))

            setEmail(data.email)
            setIsSubmitted(true)
            toast.success('Инструкции отправлены на email')
        } catch (error: any) {
            toast.error(error.message || 'Ошибка при отправке запроса')
        }
    }

    if (isSubmitted) {
        return (
            <Card className="w-full max-w-md mx-auto">
                <CardHeader className="text-center">
                    <div className="mx-auto mb-4 w-12 h-12 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center">
                        <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
                    </div>
                    <CardTitle className="text-2xl font-bold">
                        Проверьте почту
                    </CardTitle>
                    <CardDescription>
                        Мы отправили инструкции по восстановлению пароля на адрес:
                        <br />
                        <strong>{email}</strong>
                    </CardDescription>
                </CardHeader>

                <CardContent className="space-y-4">
                    <div className="text-sm text-muted-foreground space-y-2">
                        <p>
                            Если письмо не пришло в течение нескольких минут:
                        </p>
                        <ul className="list-disc list-inside space-y-1 ml-4">
                            <li>Проверьте папку "Спам"</li>
                            <li>Убедитесь, что email указан правильно</li>
                            <li>Попробуйте отправить запрос еще раз</li>
                        </ul>
                    </div>
                </CardContent>

                <CardFooter className="flex flex-col space-y-4">
                    <Button
                        variant="outline"
                        className="w-full"
                        onClick={() => setIsSubmitted(false)}
                    >
                        Отправить еще раз
                    </Button>

                    <Link href="/auth/login" className="w-full">
                        <Button variant="ghost" className="w-full">
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            Вернуться к входу
                        </Button>
                    </Link>
                </CardFooter>
            </Card>
        )
    }

    return (
        <Card className="w-full max-w-md mx-auto">
            <CardHeader className="space-y-1">
                <CardTitle className="text-2xl font-bold text-center">
                    Забыли пароль?
                </CardTitle>
                <CardDescription className="text-center">
                    Введите email и мы отправим инструкции по восстановлению
                </CardDescription>
            </CardHeader>

            <form onSubmit={handleSubmit(onSubmit)}>
                <CardContent className="space-y-4">
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
                </CardContent>

                <CardFooter className="flex flex-col space-y-4">
                    <Button
                        type="submit"
                        className="w-full"
                        loading={isSubmitting}
                        disabled={isSubmitting}
                    >
                        Отправить инструкции
                    </Button>

                    <Link href="/auth/login" className="w-full">
                        <Button variant="ghost" className="w-full">
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            Вернуться к входу
                        </Button>
                    </Link>
                </CardFooter>
            </form>
        </Card>
    )
}

export default function ForgotPasswordPage() {
    return (
        <AuthLayout
            title="Восстановление пароля"
            subtitle="Не волнуйтесь, мы поможем вам восстановить доступ"
            backgroundImage="/images/auth-bg-forgot.jpg"
        >
            <ForgotPasswordForm />
        </AuthLayout>
    )
}