// frontend/src/app/auth/register/page.tsx
import { Metadata } from 'next'
import { RegisterFormWithInfo } from '@/components/auth/register-form'
import { AuthLayout } from '@/components/auth/auth-layout'

export const metadata: Metadata = {
    title: 'Регистрация',
    description: 'Создайте аккаунт для игры в D&D с ИИ мастером'
}

export default function RegisterPage() {
    return (
        <AuthLayout
            title="Начните свое приключение!"
            subtitle="Присоединяйтесь к тысячам игроков в мире D&D с ИИ мастером"
            backgroundImage="/images/auth-bg-register.jpg"
        >
            <RegisterFormWithInfo />
        </AuthLayout>
    )
}