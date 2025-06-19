'use client'

// frontend/src/components/auth/auth-layout.tsx
import { ReactNode } from 'react'
import Link from 'next/link'
import { useTheme } from 'next-themes'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Moon, Sun, Dice1, Dice2, Dice3, Dice4, Dice5, Dice6 } from 'lucide-react'

interface AuthLayoutProps {
    children: ReactNode
    title: string
    subtitle?: string
    backgroundImage?: string
}

export function AuthLayout({ children, title, subtitle, backgroundImage }: AuthLayoutProps) {
    const { theme, setTheme } = useTheme()

    return (
        <div className="min-h-screen flex">
            {/* Левая панель с формой */}
            <div className="flex-1 flex flex-col justify-center px-4 sm:px-6 lg:px-8 bg-background">
                <div className="mx-auto w-full max-w-md">
                    {/* Логотип и навигация */}
                    <div className="text-center mb-8">
                        <Link href="/" className="inline-flex items-center space-x-2 text-2xl font-bold text-primary">
                            <div className="flex space-x-1">
                                <Dice1 className="h-6 w-6 text-red-500" />
                                <Dice6 className="h-6 w-6 text-blue-500" />
                            </div>
                            <span className="font-fantasy">D&D AI</span>
                        </Link>
                    </div>

                    {/* Заголовок */}
                    <div className="text-center mb-8">
                        <h1 className="text-3xl font-bold text-foreground mb-2">
                            {title}
                        </h1>
                        {subtitle && (
                            <p className="text-muted-foreground">
                                {subtitle}
                            </p>
                        )}
                    </div>

                    {/* Форма */}
                    <div className="mb-8">
                        {children}
                    </div>

                    {/* Дополнительные ссылки */}
                    <div className="text-center space-y-4">
                        <div className="flex items-center justify-center space-x-4 text-sm text-muted-foreground">
                            <Link href="/help" className="hover:text-foreground transition-colors">
                                Помощь
                            </Link>
                            <span>•</span>
                            <Link href="/privacy" className="hover:text-foreground transition-colors">
                                Конфиденциальность
                            </Link>
                            <span>•</span>
                            <Link href="/terms" className="hover:text-foreground transition-colors">
                                Условия
                            </Link>
                        </div>

                        {/* Переключатель темы */}
                        <div className="flex justify-center">
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                                className="text-muted-foreground hover:text-foreground"
                            >
                                {theme === 'dark' ? (
                                    <Sun className="h-4 w-4" />
                                ) : (
                                    <Moon className="h-4 w-4" />
                                )}
                                <span className="ml-2">
                  {theme === 'dark' ? 'Светлая тема' : 'Темная тема'}
                </span>
                            </Button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Правая панель с фоном */}
            <div className="hidden lg:block relative flex-1">
                <div
                    className={cn(
                        "absolute inset-0 bg-cover bg-center",
                        !backgroundImage && "bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900"
                    )}
                    style={backgroundImage ? { backgroundImage: `url(${backgroundImage})` } : undefined}
                >
                    {/* Оверлей */}
                    <div className="absolute inset-0 bg-black/50" />

                    {/* Контент поверх фона */}
                    <div className="relative h-full flex flex-col justify-center items-center text-white p-8">
                        <div className="text-center max-w-md">
                            <h2 className="text-4xl font-bold mb-4 font-fantasy">
                                Эпические приключения ждут
                            </h2>
                            <p className="text-lg mb-8 text-white/90">
                                Создавайте персонажей, исследуйте миры и переживайте незабываемые приключения с ИИ мастером
                            </p>

                            {/* Декоративные элементы */}
                            <div className="flex justify-center space-x-4 mb-8">
                                <div className="w-12 h-12 rounded-lg bg-white/10 backdrop-blur-sm flex items-center justify-center">
                                    <Dice1 className="h-6 w-6" />
                                </div>
                                <div className="w-12 h-12 rounded-lg bg-white/10 backdrop-blur-sm flex items-center justify-center">
                                    <Dice2 className="h-6 w-6" />
                                </div>
                                <div className="w-12 h-12 rounded-lg bg-white/10 backdrop-blur-sm flex items-center justify-center">
                                    <Dice3 className="h-6 w-6" />
                                </div>
                                <div className="w-12 h-12 rounded-lg bg-white/10 backdrop-blur-sm flex items-center justify-center">
                                    <Dice4 className="h-6 w-6" />
                                </div>
                                <div className="w-12 h-12 rounded-lg bg-white/10 backdrop-blur-sm flex items-center justify-center">
                                    <Dice5 className="h-6 w-6" />
                                </div>
                                <div className="w-12 h-12 rounded-lg bg-white/10 backdrop-blur-sm flex items-center justify-center">
                                    <Dice6 className="h-6 w-6" />
                                </div>
                            </div>

                            <div className="text-sm text-white/70">
                                "Лучший способ играть в D&D в одиночку или с друзьями"
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

// Компонент для отображения характеристик игры
export function GameFeatures() {
    const features = [
        {
            icon: <Dice1 className="h-8 w-8" />,
            title: "ИИ Мастер игры",
            description: "Умный ИИ создает увлекательные истории и ведет игру"
        },
        {
            icon: <Dice2 className="h-8 w-8" />,
            title: "Настоящий D&D 5e",
            description: "Полные правила пятой редакции Dungeons & Dragons"
        },
        {
            icon: <Dice3 className="h-8 w-8" />,
            title: "Многопользовательский режим",
            description: "Играйте с друзьями в режиме реального времени"
        },
        {
            icon: <Dice4 className="h-8 w-8" />,
            title: "Визуальные сцены",
            description: "ИИ генерирует изображения локаций и персонажей"
        },
        {
            icon: <Dice5 className="h-8 w-8" />,
            title: "Бесконечные приключения",
            description: "Каждая игра уникальна благодаря ИИ генерации"
        },
        {
            icon: <Dice6 className="h-8 w-8" />,
            title: "Простота использования",
            description: "Интуитивный интерфейс для новичков и ветеранов"
        }
    ]

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-12">
            {features.map((feature, index) => (
                <div
                    key={index}
                    className="p-6 rounded-lg bg-white/10 backdrop-blur-sm border border-white/20 text-center"
                >
                    <div className="flex justify-center text-white mb-4">
                        {feature.icon}
                    </div>
                    <h3 className="text-white font-semibold mb-2">
                        {feature.title}
                    </h3>
                    <p className="text-white/80 text-sm">
                        {feature.description}
                    </p>
                </div>
            ))}
        </div>
    )
}

// Мобильная версия auth layout
export function MobileAuthLayout({ children, title, subtitle }: Omit<AuthLayoutProps, 'backgroundImage'>) {
    return (
        <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex flex-col">
            {/* Заголовок */}
            <div className="text-center pt-8 pb-4 px-4">
                <Link href="/" className="inline-flex items-center space-x-2 text-2xl font-bold text-white">
                    <div className="flex space-x-1">
                        <Dice1 className="h-6 w-6 text-red-400" />
                        <Dice6 className="h-6 w-6 text-blue-400" />
                    </div>
                    <span className="font-fantasy">D&D AI</span>
                </Link>

                <h1 className="text-2xl font-bold text-white mt-4 mb-2">
                    {title}
                </h1>
                {subtitle && (
                    <p className="text-white/80 text-sm">
                        {subtitle}
                    </p>
                )}
            </div>

            {/* Основной контент */}
            <div className="flex-1 flex items-center justify-center px-4 pb-8">
                <div className="w-full max-w-md">
                    {children}
                </div>
            </div>
        </div>
    )
}