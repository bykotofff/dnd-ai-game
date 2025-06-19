// frontend/src/app/auth/login/page.tsx
import { Metadata } from 'next'
import { LoginFormDemo } from '@/components/auth/login-form'
import { AuthLayout } from '@/components/auth/auth-layout'

export const metadata: Metadata = {
    title: 'Вход в систему',
    description: 'Войдите в свой аккаунт D&D AI Game'
}

export default function LoginPage() {
    return (
        <AuthLayout
            title="Добро пожаловать обратно!"
            subtitle="Продолжите свое приключение в мире D&D"
            backgroundImage="/images/auth-bg-login.jpg"
        >
            <LoginFormDemo />
        </AuthLayout>
    )
}