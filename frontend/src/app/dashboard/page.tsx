'use client'

// frontend/src/app/dashboard/page.tsx
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/stores/auth-store'
import { useGameStore } from '@/stores/game-store'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
    Users,
    Swords,
    Crown,
    Dice6,
    Plus,
    Play,
    Clock,
    Zap,
    TrendingUp,
    ScrollText
} from 'lucide-react'
import { StatsCards } from '@/components/dashboard/stats-cards'
import { RecentSessions } from '@/components/dashboard/recent-sessions'
import { CharacterList } from '@/components/dashboard/character-list'

export default function DashboardPage() {
    const router = useRouter()
    const { user } = useAuthStore()
    const {
        characters,
        currentSession,
        loadCharacters,
        loadSessions,
        sessions
    } = useGameStore()

    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        const loadDashboardData = async () => {
            try {
                // Загружаем персонажей и сессии пользователя
                await Promise.all([
                    loadCharacters(),
                    loadSessions()
                ])
            } catch (error) {
                console.error('Ошибка загрузки данных dashboard:', error)
            } finally {
                setIsLoading(false)
            }
        }

        loadDashboardData()
    }, [loadCharacters, loadSessions])

    // Статистика для карточек
    const stats = {
        totalCharacters: characters.length,
        activeSessions: sessions?.filter(s => s.isActive).length || 0,
        totalSessions: sessions?.length || 0,
        highestLevel: characters.length > 0 ? Math.max(...characters.map(c => c.level)) : 0
    }

    // Активные персонажи (с высоким уровнем или недавно играли)
    const activeCharacters = characters
        .sort((a, b) => b.level - a.level)
        .slice(0, 3)

    // Последние сессии
    const recentSessions = sessions
        ?.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
        .slice(0, 3) || []

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center space-y-4">
                    <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto" />
                    <p className="text-muted-foreground">Загрузка приборной панели...</p>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 dark:from-slate-950 dark:via-blue-950 dark:to-purple-950">
            <div className="container mx-auto px-4 py-8 max-w-7xl">
                {/* Заголовок */}
                <div className="mb-8">
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                                Добро пожаловать, {user?.username}!
                            </h1>
                            <p className="text-muted-foreground text-lg mt-2">
                                Готовы к новому приключению в мире D&D?
                            </p>
                        </div>

                        {/* Быстрые действия */}
                        <div className="flex space-x-3">
                            <Button
                                onClick={() => router.push('/characters/create')}
                                className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                            >
                                <Plus className="h-4 w-4 mr-2" />
                                Создать персонажа
                            </Button>
                            <Button
                                variant="outline"
                                onClick={() => router.push('/sessions/create')}
                            >
                                <Play className="h-4 w-4 mr-2" />
                                Новая игра
                            </Button>
                        </div>
                    </div>

                    {/* Активная сессия баннер */}
                    {currentSession && (
                        <Card className="bg-gradient-to-r from-amber-500/10 to-orange-500/10 border-amber-200 dark:border-amber-800">
                            <CardContent className="flex items-center justify-between p-4">
                                <div className="flex items-center space-x-3">
                                    <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
                                    <div>
                                        <p className="font-semibold">Активная игра: {currentSession.name}</p>
                                        <p className="text-sm text-muted-foreground">
                                            {currentSession.description || 'Приключение продолжается...'}
                                        </p>
                                    </div>
                                </div>
                                <Button
                                    onClick={() => router.push(`/game/${currentSession.id}`)}
                                    className="bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700"
                                >
                                    <Play className="h-4 w-4 mr-2" />
                                    Продолжить игру
                                </Button>
                            </CardContent>
                        </Card>
                    )}
                </div>

                {/* Статистические карточки */}
                <StatsCards stats={stats} />

                {/* Основной контент */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-8">
                    {/* Левая колонка - Персонажи */}
                    <div className="lg:col-span-2 space-y-6">
                        <CharacterList
                            characters={activeCharacters}
                            onCreateCharacter={() => router.push('/characters/create')}
                            onViewCharacter={(id) => router.push(`/characters/${id}`)}
                        />

                        {/* Последние сессии */}
                        <RecentSessions
                            sessions={recentSessions}
                            onJoinSession={(id) => router.push(`/game/${id}`)}
                            onCreateSession={() => router.push('/sessions/create')}
                        />
                    </div>

                    {/* Правая колонка - Боковая панель */}
                    <div className="space-y-6">
                        {/* Быстрый старт */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center space-x-2">
                                    <Zap className="h-5 w-5 text-amber-500" />
                                    <span>Быстрый старт</span>
                                </CardTitle>
                                <CardDescription>
                                    Начните играть прямо сейчас
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <Button
                                    variant="outline"
                                    className="w-full justify-start"
                                    onClick={() => router.push('/characters/create')}
                                >
                                    <Crown className="h-4 w-4 mr-2" />
                                    Создать персонажа
                                </Button>
                                <Button
                                    variant="outline"
                                    className="w-full justify-start"
                                    onClick={() => router.push('/sessions/browse')}
                                >
                                    <Users className="h-4 w-4 mr-2" />
                                    Найти игру
                                </Button>
                                <Button
                                    variant="outline"
                                    className="w-full justify-start"
                                    onClick={() => router.push('/dice')}
                                >
                                    <Dice6 className="h-4 w-4 mr-2" />
                                    Бросить кости
                                </Button>
                            </CardContent>
                        </Card>

                        {/* Игровые советы */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center space-x-2">
                                    <ScrollText className="h-5 w-5 text-blue-500" />
                                    <span>Совет дня</span>
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm text-muted-foreground leading-relaxed">
                                    💡 <strong>Ролевая игра:</strong> Не забывайте описывать действия вашего персонажа!
                                    ИИ мастер лучше реагирует на детальные описания того, что ваш персонаж делает и говорит.
                                </p>
                            </CardContent>
                        </Card>

                        {/* Достижения (заглушка) */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center space-x-2">
                                    <TrendingUp className="h-5 w-5 text-green-500" />
                                    <span>Прогресс</span>
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <div className="space-y-2">
                                    <div className="flex justify-between text-sm">
                                        <span>Создано персонажей</span>
                                        <span className="font-semibold">{characters.length}/10</span>
                                    </div>
                                    <div className="w-full bg-secondary rounded-full h-2">
                                        <div
                                            className="bg-gradient-to-r from-purple-600 to-blue-600 h-2 rounded-full transition-all duration-300"
                                            style={{ width: `${Math.min((characters.length / 10) * 100, 100)}%` }}
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <div className="flex justify-between text-sm">
                                        <span>Сыграно сессий</span>
                                        <span className="font-semibold">{stats.totalSessions}/20</span>
                                    </div>
                                    <div className="w-full bg-secondary rounded-full h-2">
                                        <div
                                            className="bg-gradient-to-r from-amber-500 to-orange-500 h-2 rounded-full transition-all duration-300"
                                            style={{ width: `${Math.min((stats.totalSessions / 20) * 100, 100)}%` }}
                                        />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    )
}