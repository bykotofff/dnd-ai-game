// frontend/src/app/auth/layout.tsx
'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/stores/auth-store'
import { AppLoader } from '@/components/providers'

export default function AuthLayout({
                                       children,
                                   }: {
    children: React.ReactNode
}) {
    const router = useRouter()
    const { isAuthenticated, isLoading } = useAuthStore()

    useEffect(() => {
        // Если пользователь уже аутентифицирован, перенаправляем на dashboard
        if (isAuthenticated && !isLoading) {
            router.push('/dashboard')
        }
    }, [isAuthenticated, isLoading, router])

    // Показываем лоадер во время проверки аутентификации
    if (isLoading) {
        return <AppLoader />
    }

    // Если пользователь аутентифицирован, не показываем auth страницы
    if (isAuthenticated) {
        return <AppLoader />
    }

    return (
        <div className="auth-layout">
            {children}
        </div>
    )
}