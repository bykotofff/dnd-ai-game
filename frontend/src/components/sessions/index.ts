// frontend/src/components/sessions/index.ts
// Центральный экспорт всех компонентов управления сессиями

export { SessionManagement } from './session-management'
export { SessionInvite, JoinSessionPage, useSessionInvitations } from './session-invite'
export type { GameSession, GameSettings, SessionPlayer } from './session-management'

// frontend/src/components/sessions/session-dashboard.tsx
'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { SessionManagement } from './session-management'
import { useSessionInvitations } from './session-invite'
import {
    Users,
    Crown,
    Calendar,
    TrendingUp,
    Clock,
    MapPin,
    Settings,
    BarChart3,
    Activity,
    Gamepad2,
    Share2,
    Plus,
    Globe
} from 'lucide-react'
import { cn, formatDistanceToNow } from '@/lib/utils'
import { motion } from 'framer-motion'
import { useAuthStore } from '@/stores/auth-store'
import { useGameStore } from '@/stores/game-store'

// Типы для дашборда
interface SessionStats {
    totalSessions: number
    activeSessions: number
    totalPlayersHosted: number
    averageSessionDuration: number
    totalGameTimeHours: number
    favoriteGameMode: string
}

interface RecentActivity {
    id: string
    type: 'session_created' | 'player_joined' | 'session_completed' | 'invite_sent'
    message: string
    timestamp: string
    sessionName?: string
    sessionId?: string
}

interface SessionDashboardProps {
    className?: string
}

export const SessionDashboard: React.FC<SessionDashboardProps> = ({
                                                                      className
                                                                  }) => {
    const [stats, setStats] = useState<SessionStats | null>(null)
    const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([])
    const [activeSessions, setActiveSessions] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    const { user } = useAuthStore()
    const { currentSession } = useGameStore()

    // Загрузка данных дашборда
    useEffect(() => {
        const loadDashboardData = async () => {
            try {
                setLoading(true)

                // Загружаем статистику пользователя
                const statsResponse = await fetch('/api/users/stats', {
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    }
                })

                if (statsResponse.ok) {
                    const statsData = await statsResponse.json()
                    setStats(statsData.data)
                }

                // Загружаем активные сессии
                const sessionsResponse = await fetch('/api/sessions/my', {
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    }
                })

                if (sessionsResponse.ok) {
                    const sessionsData = await sessionsResponse.json()
                    setActiveSessions(sessionsData.data.filter((s: any) => s.isActive))
                }

                // Загружаем недавнюю активность
                const activityResponse = await fetch('/api/users/activity', {
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    }
                })

                if (activityResponse.ok) {
                    const activityData = await activityResponse.json()
                    setRecentActivity(activityData.data)
                }

            } catch (error) {
                console.error('Error loading dashboard data:', error)
            } finally {
                setLoading(false)
            }
        }

        if (user) {
            loadDashboardData()
        }
    }, [user])

    // Компонент статистики
    const StatsCard = ({ icon: Icon, title, value, description, color = "text-primary" }: {
        icon: any
        title: string
        value: string | number
        description: string
        color?: string
    }) => (
        <Card>
            <CardContent className="p-6">
        <div className="flex items-center justify-between">
        <div>
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className={cn("text-2xl font-bold", color)}>{value}</p>
    <p className="text-xs text-muted-foreground">{description}</p>
        </div>
        <Icon className={cn("h-8 w-8", color)} />
    </div>
    </CardContent>
    </Card>
)

    if (loading) {
        return (
            <div className={cn("space-y-6", className)}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
                    <Card key={i} className="animate-pulse">
                <CardContent className="p-6">
                <div className="h-16 bg-muted rounded" />
                    </CardContent>
                    </Card>
    ))}
        </div>
        </div>
    )
    }

    return (
        <div className={cn("space-y-6", className)}>
    {/* Заголовок дашборда */}
    <div className="flex items-center justify-between">
    <div>
        <h1 className="text-3xl font-bold">Панель мастера игры</h1>
    <p className="text-muted-foreground">
        Добро пожаловать, {user?.username}! Управляйте своими сессиями D&D
    </p>
    </div>

    {currentSession && (
        <Button onClick={() => window.open(`/game/${currentSession.id}`, '_blank')}>
        <Gamepad2 className="h-4 w-4 mr-2" />
            Текущая игра
    </Button>
    )}
    </div>

    {/* Статистика */}
    {stats && (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
    >
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
            icon={Crown}
        title="Всего сессий"
        value={stats.totalSessions}
        description="Созданных вами"
        color="text-blue-600"
        />
        <StatsCard
            icon={Activity}
        title="Активные сессии"
        value={stats.activeSessions}
        description="Сейчас идут"
        color="text-green-600"
        />
        <StatsCard
            icon={Users}
        title="Игроков принято"
        value={stats.totalPlayersHosted}
        description="За все время"
        color="text-purple-600"
        />
        <StatsCard
            icon={Clock}
        title="Часов игры"
        value={Math.round(stats.totalGameTimeHours)}
        description="Общее время"
        color="text-orange-600"
            />
            </div>
            </motion.div>
    )}

    {/* Основной контент */}
    <Tabs defaultValue="sessions" className="w-full">
    <TabsList className="grid w-full grid-cols-4">
    <TabsTrigger value="sessions">Сессии</TabsTrigger>
        <TabsTrigger value="active">Активные</TabsTrigger>
        <TabsTrigger value="analytics">Аналитика</TabsTrigger>
        <TabsTrigger value="activity">Активность</TabsTrigger>
        </TabsList>

    {/* Управление сессиями */}
    <TabsContent value="sessions">
        <SessionManagement />
        </TabsContent>

    {/* Активные сессии */}
    <TabsContent value="active" className="space-y-4">
    <div className="flex items-center justify-between">
    <h2 className="text-xl font-semibold">Активные сессии</h2>
    <Badge variant="secondary">
        {activeSessions.length} активных
    </Badge>
    </div>

    {activeSessions.length === 0 ? (
        <Card>
            <CardContent className="pt-6 text-center space-y-4">
        <Gamepad2 className="h-12 w-12 mx-auto text-muted-foreground" />
        <div>
            <h3 className="font-semibold mb-2">Нет активных сессий</h3>
    <p className="text-muted-foreground mb-4">
        Создайте новую сессию, чтобы начать приключение
    </p>
    <Button>
    <Plus className="h-4 w-4 mr-2" />
        Создать сессию
    </Button>
    </div>
    </CardContent>
    </Card>
    ) : (
        <div className="grid gap-4">
            {activeSessions.map(session => (
                    <Card key={session.id}>
                    <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                    <div className="space-y-2">
                    <h3 className="font-semibold text-lg">{session.name}</h3>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                <Users className="h-4 w-4" />
                    {session.playerCount}/{session.maxPlayers}
    </div>
    <div className="flex items-center gap-1">
    <MapPin className="h-4 w-4" />
        {session.currentScene}
        </div>
        <div className="flex items-center gap-1">
    <Clock className="h-4 w-4" />
        {formatDistanceToNow(new Date(session.updatedAt))} назад
    </div>
    </div>
    </div>

    <div className="flex items-center gap-2">
    <Button
        variant="outline"
        size="sm"
        onClick={() => {
        // Открыть панель приглашений
    }}
    >
        <Share2 className="h-4 w-4" />
            </Button>
            <Button
        size="sm"
        onClick={() => window.open(`/game/${session.id}`, '_blank')}
    >
        Продолжить
        </Button>
        </div>
        </div>
        </CardContent>
        </Card>
    ))}
        </div>
    )}
    </TabsContent>

    {/* Аналитика */}
    <TabsContent value="analytics" className="space-y-4">
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
    {/* График активности */}
    <Card>
    <CardHeader>
        <CardTitle className="flex items-center gap-2">
    <BarChart3 className="h-5 w-5" />
        Активность по дням
    </CardTitle>
    </CardHeader>
    <CardContent>
    <div className="h-64 flex items-center justify-center text-muted-foreground">
        График активности сессий за последние 30 дней
    </div>
    </CardContent>
    </Card>

    {/* Популярные настройки */}
    <Card>
        <CardHeader>
            <CardTitle className="flex items-center gap-2">
    <TrendingUp className="h-5 w-5" />
        Популярные настройки
    </CardTitle>
    </CardHeader>
    <CardContent className="space-y-3">
    <div className="flex justify-between items-center">
    <span className="text-sm">Режим опыта</span>
    <Badge variant="outline">Стандартный</Badge>
        </div>
        <div className="flex justify-between items-center">
    <span className="text-sm">Сложность</span>
        <Badge variant="outline">Нормальная</Badge>
        </div>
        <div className="flex justify-between items-center">
    <span className="text-sm">Размер группы</span>
    <Badge variant="outline">4 игрока</Badge>
    </div>
    <div className="flex justify-between items-center">
    <span className="text-sm">Тип сессий</span>
    <Badge variant="outline">Приватные</Badge>
        </div>
        </CardContent>
        </Card>

    {/* Статистика игроков */}
    <Card>
        <CardHeader>
            <CardTitle className="flex items-center gap-2">
    <Users className="h-5 w-5" />
        Статистика игроков
    </CardTitle>
    </CardHeader>
    <CardContent className="space-y-3">
    <div className="flex justify-between items-center">
    <span className="text-sm">Среднее время в сессии</span>
    <span className="font-medium">3.2 часа</span>
    </div>
    <div className="flex justify-between items-center">
    <span className="text-sm">Возвращаемость игроков</span>
    <span className="font-medium">87%</span>
        </div>
        <div className="flex justify-between items-center">
    <span className="text-sm">Средний уровень персонажей</span>
    <span className="font-medium">Уровень 6</span>
    </div>
    <div className="flex justify-between items-center">
    <span className="text-sm">Самый популярный класс</span>
    <span className="font-medium">Волшебник</span>
        </div>
        </CardContent>
        </Card>

    {/* Достижения мастера */}
    <Card>
        <CardHeader>
            <CardTitle className="flex items-center gap-2">
    <Crown className="h-5 w-5" />
        Достижения мастера
    </CardTitle>
    </CardHeader>
    <CardContent className="space-y-3">
    <div className="flex items-center gap-3">
    <div className="w-8 h-8 rounded-full bg-yellow-100 flex items-center justify-center">
    <Crown className="h-4 w-4 text-yellow-600" />
    </div>
    <div>
    <div className="font-medium text-sm">Опытный мастер</div>
    <div className="text-xs text-muted-foreground">Провели 10+ сессий</div>
    </div>
    </div>
    <div className="flex items-center gap-3">
    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
    <Users className="h-4 w-4 text-blue-600" />
    </div>
    <div>
    <div className="font-medium text-sm">Сборщик команд</div>
    <div className="text-xs text-muted-foreground">Принято 50+ игроков</div>
    </div>
    </div>
    <div className="flex items-center gap-3">
    <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
    <Clock className="h-4 w-4 text-green-600" />
    </div>
    <div>
    <div className="font-medium text-sm">Марафонец</div>
        <div className="text-xs text-muted-foreground">100+ часов игры</div>
    </div>
    </div>
    </CardContent>
    </Card>
    </div>
    </TabsContent>

    {/* Недавняя активность */}
    <TabsContent value="activity" className="space-y-4">
    <div className="flex items-center justify-between">
    <h2 className="text-xl font-semibold">Недавняя активность</h2>
    <Button variant="outline" size="sm">
        Очистить историю
    </Button>
    </div>

    {recentActivity.length === 0 ? (
        <Card>
            <CardContent className="pt-6 text-center space-y-4">
        <Activity className="h-12 w-12 mx-auto text-muted-foreground" />
        <div>
            <h3 className="font-semibold mb-2">Нет недавней активности</h3>
    <p className="text-muted-foreground">
        Создайте сессию или пригласите игроков, чтобы увидеть активность здесь
    </p>
    </div>
    </CardContent>
    </Card>
    ) : (
        <Card>
            <CardContent className="p-6">
        <div className="space-y-4">
            {recentActivity.map(activity => (
                    <div key={activity.id} className="flex items-start gap-3 p-3 rounded-lg hover:bg-muted/50">
                <div className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center",
                    activity.type === 'session_created' && "bg-green-100",
                    activity.type === 'player_joined' && "bg-blue-100",
                    activity.type === 'session_completed' && "bg-purple-100",
                    activity.type === 'invite_sent' && "bg-orange-100"
    )}>
        {activity.type === 'session_created' && <Plus className="h-4 w-4 text-green-600" />}
        {activity.type === 'player_joined' && <Users className="h-4 w-4 text-blue-600" />}
        {activity.type === 'session_completed' && <Crown className="h-4 w-4 text-purple-600" />}
        {activity.type === 'invite_sent' && <Share2 className="h-4 w-4 text-orange-600" />}
        </div>
        <div className="flex-1">
    <p className="text-sm font-medium">{activity.message}</p>
        <div className="flex items-center gap-2 mt-1">
    <span className="text-xs text-muted-foreground">
        {formatDistanceToNow(new Date(activity.timestamp))} назад
    </span>
        {activity.sessionName && (
            <Badge variant="outline" className="text-xs">
            {activity.sessionName}
            </Badge>
        )}
        </div>
        </div>
        </div>
    ))}
        </div>
        </CardContent>
        </Card>
    )}
    </TabsContent>
    </Tabs>
    </div>
)
}

// Компонент быстрых действий для боковой панели
export const SessionQuickActions: React.FC<{ className?: string }> = ({ className }) => {
    const { currentSession } = useGameStore()

    return (
        <Card className={cn("", className)}>
    <CardHeader className="pb-3">
    <CardTitle className="text-base">Быстрые действия</CardTitle>
    </CardHeader>
    <CardContent className="space-y-2">
    <Button size="sm" className="w-full justify-start">
    <Plus className="h-4 w-4 mr-2" />
        Создать сессию
    </Button>
    <Button variant="outline" size="sm" className="w-full justify-start">
    <Globe className="h-4 w-4 mr-2" />
        Найти игру
    </Button>
    {currentSession && (
        <Button variant="outline" size="sm" className="w-full justify-start">
    <Gamepad2 className="h-4 w-4 mr-2" />
        Продолжить игру
    </Button>
    )}
    <Button variant="outline" size="sm" className="w-full justify-start">
    <Settings className="h-4 w-4 mr-2" />
        Настройки
        </Button>
        </CardContent>
        </Card>
)
}

// Главный компонент Session Tools
export const SessionTools: React.FC<{ view?: 'dashboard' | 'management' | 'create' }> = ({
                                                                                             view = 'dashboard'
                                                                                         }) => {
    const [currentView, setCurrentView] = useState(view)

    return (
        <div className="container mx-auto px-4 py-8">
            {currentView === 'dashboard' && <SessionDashboard />}
    {currentView === 'management' && (
        <SessionManagement
            onSessionSelect={(session) => {
        console.log('Session selected:', session)
    }}
        />
    )}
    </div>
)
}

// Хуки для управления сессиями
export function useSessionManagement() {
    const [sessions, setSessions] = useState<any[]>([])
    const [loading, setLoading] = useState(false)

    const createSession = async (sessionData: any) => {
        try {
            const response = await fetch('/api/sessions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify(sessionData)
            })

            if (!response.ok) {
                throw new Error('Failed to create session')
            }

            const result = await response.json()
            return result.data
        } catch (error) {
            console.error('Error creating session:', error)
            throw error
        }
    }

    const updateSession = async (sessionId: string, updates: any) => {
        try {
            const response = await fetch(`/api/sessions/${sessionId}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify(updates)
            })

            if (!response.ok) {
                throw new Error('Failed to update session')
            }

            const result = await response.json()
            return result.data
        } catch (error) {
            console.error('Error updating session:', error)
            throw error
        }
    }

    const deleteSession = async (sessionId: string) => {
        try {
            const response = await fetch(`/api/sessions/${sessionId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            })

            if (!response.ok) {
                throw new Error('Failed to delete session')
            }
        } catch (error) {
            console.error('Error deleting session:', error)
            throw error
        }
    }

    const joinSession = async (sessionId: string, characterId: string) => {
        try {
            const response = await fetch(`/api/sessions/${sessionId}/join`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({ characterId })
            })

            if (!response.ok) {
                throw new Error('Failed to join session')
            }

            const result = await response.json()
            return result.data
        } catch (error) {
            console.error('Error joining session:', error)
            throw error
        }
    }

    const leaveSession = async (sessionId: string) => {
        try {
            const response = await fetch(`/api/sessions/${sessionId}/leave`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            })

            if (!response.ok) {
                throw new Error('Failed to leave session')
            }
        } catch (error) {
            console.error('Error leaving session:', error)
            throw error
        }
    }

    return {
        sessions,
        loading,
        createSession,
        updateSession,
        deleteSession,
        joinSession,
        leaveSession
    }
}

// API утилиты для работы с сессиями
export const sessionAPI = {
    // Получение списка сессий
    async getSessions(type: 'my' | 'available' | 'all' = 'all') {
        const endpoint = type === 'my' ? '/api/sessions/my' :
            type === 'available' ? '/api/sessions/available' :
                '/api/sessions'

        const response = await fetch(endpoint, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        })

        if (!response.ok) {
            throw new Error('Failed to fetch sessions')
        }

        return response.json()
    },

    // Получение деталей сессии
    async getSessionDetails(sessionId: string) {
        const response = await fetch(`/api/sessions/${sessionId}`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        })

        if (!response.ok) {
            throw new Error('Failed to fetch session details')
        }

        return response.json()
    },

    // Создание приглашения
    async createInvite(sessionId: string, options: { expiresIn?: number, maxUses?: number } = {}) {
        const response = await fetch(`/api/sessions/${sessionId}/invites`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify(options)
        })

        if (!response.ok) {
            throw new Error('Failed to create invite')
        }

        return response.json()
    },

    // Проверка приглашения
    async validateInvite(inviteCode: string) {
        const response = await fetch(`/api/invites/${inviteCode}`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        })

        if (!response.ok) {
            throw new Error('Invalid or expired invite')
        }

        return response.json()
    },

    // Присоединение по приглашению
    async joinByInvite(inviteCode: string, characterId: string) {
        const response = await fetch(`/api/invites/${inviteCode}/join`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({ characterId })
        })

        if (!response.ok) {
            throw new Error('Failed to join by invite')
        }

        return response.json()
    }
}

export default SessionDashboard