// frontend/src/components/sessions/session-management.tsx
'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Switch } from '@/components/ui/switch'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog'
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip'
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
    Plus,
    Users,
    Settings,
    Share2,
    Copy,
    Globe,
    Lock,
    Eye,
    EyeOff,
    Crown,
    UserPlus,
    MapPin,
    Clock,
    Dice6,
    Sword,
    Shield,
    Zap,
    Calendar,
    Link2,
    QrCode,
    Mail,
    MessageSquare,
    Edit,
    Trash2,
    Play,
    Pause,
    RotateCcw
} from 'lucide-react'
import { cn, formatDistanceToNow } from '@/lib/utils'
import { motion, AnimatePresence } from 'framer-motion'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import toast from 'react-hot-toast'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/stores/auth-store'
import { useGameStore } from '@/stores/game-store'

// Схемы валидации
const CreateSessionSchema = z.object({
    name: z.string()
        .min(3, 'Название должно содержать минимум 3 символа')
        .max(100, 'Название не должно превышать 100 символов'),
    description: z.string()
        .max(500, 'Описание не должно превышать 500 символов')
        .optional(),
    maxPlayers: z.number()
        .min(2, 'Минимум 2 игрока')
        .max(8, 'Максимум 8 игроков')
        .default(4),
    isPublic: z.boolean().default(false),
    gameSettings: z.object({
        allowPvP: z.boolean().default(false),
        experienceMode: z.enum(['standard', 'milestone', 'slow', 'fast']).default('standard'),
        restVariant: z.enum(['standard', 'gritty', 'heroic']).default('standard'),
        hitPointVariant: z.enum(['fixed', 'average', 'rolled']).default('average'),
        criticalHitVariant: z.enum(['standard', 'brutal']).default('standard'),
        difficultyLevel: z.enum(['easy', 'normal', 'hard', 'deadly']).default('normal'),
        autoLevelUp: z.boolean().default(false),
        playerRollsInitiative: z.boolean().default(true),
        useOptionalRules: z.array(z.string()).default([])
    }).optional()
})

type CreateSessionForm = z.infer<typeof CreateSessionSchema>

// Типы для системы сессий
export interface GameSession {
    id: string
    name: string
    description?: string
    maxPlayers: number
    isActive: boolean
    isPublic: boolean
    currentScene: string
    gameSettings: GameSettings
    inviteCode?: string
    createdAt: string
    updatedAt: string
    createdBy: string
    players: SessionPlayer[]
    playerCount: number
}

export interface GameSettings {
    allowPvP: boolean
    experienceMode: 'standard' | 'milestone' | 'slow' | 'fast'
    restVariant: 'standard' | 'gritty' | 'heroic'
    hitPointVariant: 'fixed' | 'average' | 'rolled'
    criticalHitVariant: 'standard' | 'brutal'
    difficultyLevel: 'easy' | 'normal' | 'hard' | 'deadly'
    autoLevelUp: boolean
    playerRollsInitiative: boolean
    useOptionalRules: string[]
}

export interface SessionPlayer {
    id: string
    userId: string
    characterId: string
    isGameMaster: boolean
    joinedAt: string
    lastActivity: string
    user: {
        username: string
        email: string
    }
    character: {
        name: string
        class: string
        level: number
        hp: number
        maxHp: number
    }
}

export interface SessionInvite {
    id: string
    sessionId: string
    code: string
    createdBy: string
    expiresAt: string
    maxUses?: number
    usedCount: number
    isActive: boolean
}

interface SessionManagementProps {
    onSessionSelect?: (session: GameSession) => void
    className?: string
}

export const SessionManagement: React.FC<SessionManagementProps> = ({
                                                                        onSessionSelect,
                                                                        className
                                                                    }) => {
    const [sessions, setSessions] = useState<GameSession[]>([])
    const [selectedSession, setSelectedSession] = useState<GameSession | null>(null)
    const [loading, setLoading] = useState(true)
    const [activeTab, setActiveTab] = useState<'my' | 'available' | 'create'>('my')
    const [showCreateDialog, setShowCreateDialog] = useState(false)
    const [showInviteDialog, setShowInviteDialog] = useState(false)
    const [showSettingsDialog, setShowSettingsDialog] = useState(false)
    const [inviteLink, setInviteLink] = useState('')
    const [qrCodeData, setQrCodeData] = useState('')

    const router = useRouter()
    const { user } = useAuthStore()
    const { setCurrentSession } = useGameStore()

    // Форма создания сессии
    const form = useForm<CreateSessionForm>({
        resolver: zodResolver(CreateSessionSchema),
        defaultValues: {
            name: '',
            description: '',
            maxPlayers: 4,
            isPublic: false,
            gameSettings: {
                allowPvP: false,
                experienceMode: 'standard',
                restVariant: 'standard',
                hitPointVariant: 'average',
                criticalHitVariant: 'standard',
                difficultyLevel: 'normal',
                autoLevelUp: false,
                playerRollsInitiative: true,
                useOptionalRules: []
            }
        }
    })

    // Загрузка сессий
    const loadSessions = useCallback(async (type: 'my' | 'available') => {
        setLoading(true)
        try {
            const endpoint = type === 'my'
                ? '/api/sessions/my'
                : '/api/sessions/available'

            const response = await fetch(endpoint, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            })

            if (!response.ok) {
                throw new Error('Ошибка загрузки сессий')
            }

            const data = await response.json()
            setSessions(data.data)
        } catch (error) {
            console.error('Ошибка загрузки сессий:', error)
            toast.error('Не удалось загрузить сессии')
        } finally {
            setLoading(false)
        }
    }, [])

    // Создание новой сессии
    const createSession = async (data: CreateSessionForm) => {
        try {
            const response = await fetch('/api/sessions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify(data)
            })

            if (!response.ok) {
                throw new Error('Ошибка создания сессии')
            }

            const result = await response.json()
            toast.success('Сессия успешно создана!')

            setShowCreateDialog(false)
            form.reset()

            // Переключаемся на созданную сессию
            setSelectedSession(result.data)
            setCurrentSession(result.data)
            onSessionSelect?.(result.data)

            // Обновляем список
            if (activeTab === 'my') {
                loadSessions('my')
            }

        } catch (error) {
            console.error('Ошибка создания сессии:', error)
            toast.error('Не удалось создать сессию')
        }
    }

    // Присоединение к сессии
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
                throw new Error('Ошибка присоединения к сессии')
            }

            const result = await response.json()
            toast.success('Вы присоединились к сессии!')

            setCurrentSession(result.data)
            onSessionSelect?.(result.data)
            router.push(`/game/${sessionId}`)

        } catch (error) {
            console.error('Ошибка присоединения:', error)
            toast.error('Не удалось присоединиться к сессии')
        }
    }

    // Создание ссылки-приглашения
    const generateInviteLink = async (sessionId: string) => {
        try {
            const response = await fetch(`/api/sessions/${sessionId}/invite`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            })

            if (!response.ok) {
                throw new Error('Ошибка создания приглашения')
            }

            const result = await response.json()
            const link = `${window.location.origin}/join/${result.data.code}`
            setInviteLink(link)
            setQrCodeData(link)

            toast.success('Ссылка-приглашение создана!')

        } catch (error) {
            console.error('Ошибка создания приглашения:', error)
            toast.error('Не удалось создать приглашение')
        }
    }

    // Копирование ссылки в буфер обмена
    const copyInviteLink = () => {
        navigator.clipboard.writeText(inviteLink).then(() => {
            toast.success('Ссылка скопирована в буфер обмена!')
        }).catch(() => {
            toast.error('Не удалось скопировать ссылку')
        })
    }

    // Удаление сессии
    const deleteSession = async (sessionId: string) => {
        try {
            const response = await fetch(`/api/sessions/${sessionId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            })

            if (!response.ok) {
                throw new Error('Ошибка удаления сессии')
            }

            toast.success('Сессия удалена')
            loadSessions(activeTab === 'my' ? 'my' : 'available')

        } catch (error) {
            console.error('Ошибка удаления сессии:', error)
            toast.error('Не удалось удалить сессию')
        }
    }

    // Обновление активности сессии
    const toggleSessionActivity = async (sessionId: string, isActive: boolean) => {
        try {
            const response = await fetch(`/api/sessions/${sessionId}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({ isActive })
            })

            if (!response.ok) {
                throw new Error('Ошибка обновления сессии')
            }

            toast.success(isActive ? 'Сессия активирована' : 'Сессия приостановлена')
            loadSessions(activeTab === 'my' ? 'my' : 'available')

        } catch (error) {
            console.error('Ошибка обновления сессии:', error)
            toast.error('Не удалось обновить сессию')
        }
    }

    useEffect(() => {
        loadSessions(activeTab === 'my' ? 'my' : 'available')
    }, [activeTab, loadSessions])

    // Компонент карточки сессии
    const SessionCard = ({ session, isOwner = false }: { session: GameSession, isOwner?: boolean }) => (
        <Card className={cn(
            "transition-all hover:shadow-lg cursor-pointer",
            selectedSession?.id === session.id && "ring-2 ring-primary"
        )}>
            <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                    <div className="flex-1">
                        <CardTitle className="flex items-center gap-2 text-lg">
                            {session.isPublic ? <Globe className="h-4 w-4" /> : <Lock className="h-4 w-4" />}
                            {session.name}
                            {!session.isActive && <Badge variant="secondary">Приостановлена</Badge>}
                        </CardTitle>
                        {session.description && (
                            <p className="text-sm text-muted-foreground mt-1">
                                {session.description}
                            </p>
                        )}
                    </div>

                    {isOwner && (
                        <div className="flex items-center gap-1">
                            <Crown className="h-4 w-4 text-yellow-500" />
                            <span className="text-xs text-yellow-600">ГМ</span>
                        </div>
                    )}
                </div>

                <div className="flex items-center gap-4 text-sm">
                    <div className="flex items-center gap-1">
                        <Users className="h-4 w-4" />
                        <span>{session.playerCount}/{session.maxPlayers}</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <MapPin className="h-4 w-4" />
                        <span>{session.currentScene}</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        <span>{formatDistanceToNow(new Date(session.updatedAt))} назад</span>
                    </div>
                </div>
            </CardHeader>

            <CardContent className="pt-0">
                {/* Настройки игры */}
                <div className="flex flex-wrap gap-1 mb-3">
                    <Badge variant="outline" className="text-xs">
                        Опыт: {session.gameSettings.experienceMode}
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                        Отдых: {session.gameSettings.restVariant}
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                        Сложность: {session.gameSettings.difficultyLevel}
                    </Badge>
                    {session.gameSettings.allowPvP && (
                        <Badge variant="destructive" className="text-xs">PvP</Badge>
                    )}
                </div>

                {/* Игроки */}
                {session.players.length > 0 && (
                    <div className="space-y-2 mb-3">
                        <h4 className="text-sm font-medium">Игроки:</h4>
                        <div className="space-y-1">
                            {session.players.slice(0, 3).map(player => (
                                <div key={player.id} className="flex items-center gap-2 text-xs">
                                    {player.isGameMaster && <Crown className="h-3 w-3 text-yellow-500" />}
                                    <span className="font-medium">{player.user.username}</span>
                                    <span className="text-muted-foreground">
                                        {player.character.name} ({player.character.class} {player.character.level})
                                    </span>
                                </div>
                            ))}
                            {session.players.length > 3 && (
                                <div className="text-xs text-muted-foreground">
                                    +{session.players.length - 3} игроков
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Действия */}
                <div className="flex items-center gap-2">
                    {isOwner ? (
                        <>
                            <Button
                                size="sm"
                                onClick={() => {
                                    setCurrentSession(session)
                                    router.push(`/game/${session.id}`)
                                }}
                                className="flex-1"
                            >
                                <Play className="h-4 w-4 mr-1" />
                                Продолжить игру
                            </Button>

                            <TooltipProvider>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => {
                                                setSelectedSession(session)
                                                setShowInviteDialog(true)
                                                generateInviteLink(session.id)
                                            }}
                                        >
                                            <Share2 className="h-4 w-4" />
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>Пригласить игроков</TooltipContent>
                                </Tooltip>
                            </TooltipProvider>

                            <TooltipProvider>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => {
                                                setSelectedSession(session)
                                                setShowSettingsDialog(true)
                                            }}
                                        >
                                            <Settings className="h-4 w-4" />
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>Настройки</TooltipContent>
                                </Tooltip>
                            </TooltipProvider>

                            <TooltipProvider>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => toggleSessionActivity(session.id, !session.isActive)}
                                        >
                                            {session.isActive ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        {session.isActive ? 'Приостановить' : 'Активировать'}
                                    </TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                        </>
                    ) : (
                        <Button
                            size="sm"
                            onClick={() => {
                                // Здесь должен быть выбор персонажа
                                // Для демо используем заглушку
                                joinSession(session.id, 'character_id')
                            }}
                            disabled={session.playerCount >= session.maxPlayers || !session.isActive}
                            className="flex-1"
                        >
                            <UserPlus className="h-4 w-4 mr-1" />
                            Присоединиться
                        </Button>
                    )}
                </div>
            </CardContent>
        </Card>
    )

    return (
        <TooltipProvider>
            <div className={cn("w-full space-y-6", className)}>
                {/* Заголовок */}
                <div className="flex items-center justify-between">
                    <h1 className="text-3xl font-bold">Игровые сессии</h1>
                    <Button onClick={() => setShowCreateDialog(true)}>
                        <Plus className="h-4 w-4 mr-2" />
                        Создать сессию
                    </Button>
                </div>

                {/* Навигация */}
                <Tabs value={activeTab} onValueChange={(value: any) => setActiveTab(value)}>
                    <TabsList className="grid w-full grid-cols-3">
                        <TabsTrigger value="my" className="flex items-center gap-2">
                            <Crown className="h-4 w-4" />
                            Мои сессии
                        </TabsTrigger>
                        <TabsTrigger value="available" className="flex items-center gap-2">
                            <Globe className="h-4 w-4" />
                            Доступные
                        </TabsTrigger>
                        <TabsTrigger value="create" className="flex items-center gap-2">
                            <Plus className="h-4 w-4" />
                            Создать
                        </TabsTrigger>
                    </TabsList>

                    {/* Мои сессии */}
                    <TabsContent value="my" className="space-y-4">
                        {loading ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {Array.from({ length: 6 }).map((_, i) => (
                                    <Card key={i} className="animate-pulse">
                                        <CardHeader>
                                            <div className="h-6 bg-muted rounded w-3/4" />
                                            <div className="h-4 bg-muted rounded w-1/2" />
                                        </CardHeader>
                                        <CardContent>
                                            <div className="space-y-2">
                                                <div className="h-4 bg-muted rounded" />
                                                <div className="h-4 bg-muted rounded w-2/3" />
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        ) : sessions.length === 0 ? (
                            <div className="text-center py-12">
                                <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                                <h3 className="text-lg font-semibold mb-2">Нет созданных сессий</h3>
                                <p className="text-muted-foreground mb-4">
                                    Создайте свою первую игровую сессию, чтобы начать приключение!
                                </p>
                                <Button onClick={() => setShowCreateDialog(true)}>
                                    <Plus className="h-4 w-4 mr-2" />
                                    Создать первую сессию
                                </Button>
                            </div>
                        ) : (
                            <motion.div
                                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ staggerChildren: 0.1 }}
                            >
                                <AnimatePresence>
                                    {sessions.map(session => (
                                        <motion.div
                                            key={session.id}
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: -20 }}
                                            transition={{ duration: 0.3 }}
                                        >
                                            <SessionCard
                                                session={session}
                                                isOwner={session.createdBy === user?.id}
                                            />
                                        </motion.div>
                                    ))}
                                </AnimatePresence>
                            </motion.div>
                        )}
                    </TabsContent>

                    {/* Доступные сессии */}
                    <TabsContent value="available" className="space-y-4">
                        {loading ? (
                            <div className="text-center py-12">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto" />
                                <p className="mt-2">Загрузка сессий...</p>
                            </div>
                        ) : sessions.length === 0 ? (
                            <div className="text-center py-12">
                                <Globe className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                                <h3 className="text-lg font-semibold mb-2">Нет доступных сессий</h3>
                                <p className="text-muted-foreground">
                                    На данный момент нет открытых игровых сессий для присоединения.
                                </p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {sessions.map(session => (
                                    <SessionCard key={session.id} session={session} />
                                ))}
                            </div>
                        )}
                    </TabsContent>

                    {/* Создание сессии */}
                    <TabsContent value="create">
                        <Card className="max-w-2xl mx-auto">
                            <CardHeader>
                                <CardTitle>Создать новую игровую сессию</CardTitle>
                                <p className="text-sm text-muted-foreground">
                                    Настройте параметры своей игровой сессии D&D 5e
                                </p>
                            </CardHeader>
                            <CardContent>
                                <form onSubmit={form.handleSubmit(createSession)} className="space-y-6">
                                    {/* Основная информация */}
                                    <div className="space-y-4">
                                        <h3 className="font-semibold">Основная информация</h3>

                                        <div>
                                            <Label htmlFor="name">Название сессии *</Label>
                                            <Input
                                                id="name"
                                                {...form.register('name')}
                                                placeholder="Введите название вашей кампании"
                                            />
                                            {form.formState.errors.name && (
                                                <p className="text-sm text-red-600 mt-1">
                                                    {form.formState.errors.name.message}
                                                </p>
                                            )}
                                        </div>

                                        <div>
                                            <Label htmlFor="description">Описание</Label>
                                            <Textarea
                                                id="description"
                                                {...form.register('description')}
                                                placeholder="Краткое описание приключения..."
                                                rows={3}
                                            />
                                            {form.formState.errors.description && (
                                                <p className="text-sm text-red-600 mt-1">
                                                    {form.formState.errors.description.message}
                                                </p>
                                            )}
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <Label htmlFor="maxPlayers">Максимум игроков</Label>
                                                <Select
                                                    value={form.watch('maxPlayers')?.toString()}
                                                    onValueChange={(value) => form.setValue('maxPlayers', parseInt(value))}
                                                >
                                                    <SelectTrigger>
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {[2, 3, 4, 5, 6, 7, 8].map(num => (
                                                            <SelectItem key={num} value={num.toString()}>
                                                                {num} игроков
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>

                                            <div className="flex items-center space-x-2 pt-6">
                                                <Switch
                                                    id="isPublic"
                                                    checked={form.watch('isPublic')}
                                                    onCheckedChange={(checked) => form.setValue('isPublic', checked)}
                                                />
                                                <Label htmlFor="isPublic">Публичная сессия</Label>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Настройки игры */}
                                    <div className="space-y-4">
                                        <h3 className="font-semibold">Настройки игры</h3>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <Label>Режим опыта</Label>
                                                <Select
                                                    value={form.watch('gameSettings.experienceMode')}
                                                    onValueChange={(value: any) =>
                                                        form.setValue('gameSettings.experienceMode', value)
                                                    }
                                                >
                                                    <SelectTrigger>
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="standard">Стандартный</SelectItem>
                                                        <SelectItem value="milestone">По вехам</SelectItem>
                                                        <SelectItem value="slow">Медленный</SelectItem>
                                                        <SelectItem value="fast">Быстрый</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>

                                            <div>
                                                <Label>Вариант отдыха</Label>
                                                <Select
                                                    value={form.watch('gameSettings.restVariant')}
                                                    onValueChange={(value: any) =>
                                                        form.setValue('gameSettings.restVariant', value)
                                                    }
                                                >
                                                    <SelectTrigger>
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="standard">Стандартный</SelectItem>
                                                        <SelectItem value="gritty">Суровый</SelectItem>
                                                        <SelectItem value="heroic">Героический</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>

                                            <div>
                                                <Label>Хит-поинты</Label>
                                                <Select
                                                    value={form.watch('gameSettings.hitPointVariant')}
                                                    onValueChange={(value: any) =>
                                                        form.setValue('gameSettings.hitPointVariant', value)
                                                    }
                                                >
                                                    <SelectTrigger>
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="fixed">Фиксированные</SelectItem>
                                                        <SelectItem value="average">Средние</SelectItem>
                                                        <SelectItem value="rolled">Броски костей</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>

                                            <div>
                                                <Label>Сложность</Label>
                                                <Select
                                                    value={form.watch('gameSettings.difficultyLevel')}
                                                    onValueChange={(value: any) =>
                                                        form.setValue('gameSettings.difficultyLevel', value)
                                                    }
                                                >
                                                    <SelectTrigger>
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="easy">Легкая</SelectItem>
                                                        <SelectItem value="normal">Нормальная</SelectItem>
                                                        <SelectItem value="hard">Тяжелая</SelectItem>
                                                        <SelectItem value="deadly">Смертельная</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        </div>

                                        {/* Дополнительные опции */}
                                        <div className="space-y-3">
                                            <div className="flex items-center space-x-2">
                                                <Checkbox
                                                    id="allowPvP"
                                                    checked={form.watch('gameSettings.allowPvP')}
                                                    onCheckedChange={(checked) =>
                                                        form.setValue('gameSettings.allowPvP', checked as boolean)
                                                    }
                                                />
                                                <Label htmlFor="allowPvP">Разрешить PvP (бой между игроками)</Label>
                                            </div>

                                            <div className="flex items-center space-x-2">
                                                <Checkbox
                                                    id="autoLevelUp"
                                                    checked={form.watch('gameSettings.autoLevelUp')}
                                                    onCheckedChange={(checked) =>
                                                        form.setValue('gameSettings.autoLevelUp', checked as boolean)
                                                    }
                                                />
                                                <Label htmlFor="autoLevelUp">Автоматическое повышение уровня</Label>
                                            </div>

                                            <div className="flex items-center space-x-2">
                                                <Checkbox
                                                    id="playerRollsInitiative"
                                                    checked={form.watch('gameSettings.playerRollsInitiative')}
                                                    onCheckedChange={(checked) =>
                                                        form.setValue('gameSettings.playerRollsInitiative', checked as boolean)
                                                    }
                                                />
                                                <Label htmlFor="playerRollsInitiative">Игроки бросают инициативу</Label>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex gap-4">
                                        <Button
                                            type="button"
                                            variant="outline"
                                            onClick={() => setActiveTab('my')}
                                            className="flex-1"
                                        >
                                            Отмена
                                        </Button>
                                        <Button
                                            type="submit"
                                            disabled={form.formState.isSubmitting}
                                            className="flex-1"
                                        >
                                            {form.formState.isSubmitting ? (
                                                <>
                                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                                                    Создание...
                                                </>
                                            ) : (
                                                <>
                                                    <Plus className="h-4 w-4 mr-2" />
                                                    Создать сессию
                                                </>
                                            )}
                                        </Button>
                                    </div>
                                </form>
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>

                {/* Диалог приглашения игроков */}
                <Dialog open={showInviteDialog} onOpenChange={setShowInviteDialog}>
                    <DialogContent className="max-w-md">
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2">
                                <Share2 className="h-5 w-5" />
                                Пригласить игроков
                            </DialogTitle>
                            <DialogDescription>
                                Поделитесь ссылкой для присоединения к сессии &quot;{selectedSession?.name}&quot;
                            </DialogDescription>
                        </DialogHeader>

                        <div className="space-y-4">
                            {/* Ссылка приглашения */}
                            {inviteLink && (
                                <div className="space-y-2">
                                    <Label>Ссылка-приглашение</Label>
                                    <div className="flex gap-2">
                                        <Input
                                            value={inviteLink}
                                            readOnly
                                            className="font-mono text-xs"
                                        />
                                        <Button
                                            variant="outline"
                                            size="icon"
                                            onClick={copyInviteLink}
                                        >
                                            <Copy className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            )}

                            {/* QR код */}
                            {qrCodeData && (
                                <div className="text-center p-4 border rounded-lg">
                                    <div className="w-32 h-32 mx-auto bg-muted rounded flex items-center justify-center mb-2">
                                        <QrCode className="h-16 w-16 text-muted-foreground" />
                                    </div>
                                    <p className="text-xs text-muted-foreground">
                                        QR-код для быстрого присоединения
                                    </p>
                                </div>
                            )}

                            {/* Быстрые действия */}
                            <div className="grid grid-cols-2 gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                        // Открыть почтовый клиент
                                        window.location.href = `mailto:?subject=Приглашение в D&D сессию: ${selectedSession?.name}&body=Присоединяйтесь к нашей игровой сессии D&D:%0A%0A${inviteLink}`
                                    }}
                                >
                                    <Mail className="h-4 w-4 mr-1" />
                                    Email
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                        // Поделиться через Web Share API
                                        if (navigator.share) {
                                            navigator.share({
                                                title: `D&D сессия: ${selectedSession?.name}`,
                                                text: 'Присоединяйтесь к нашей игровой сессии D&D!',
                                                url: inviteLink
                                            })
                                        }
                                    }}
                                >
                                    <MessageSquare className="h-4 w-4 mr-1" />
                                    Поделиться
                                </Button>
                            </div>

                            {/* Информация о ссылке */}
                            <div className="text-xs text-muted-foreground space-y-1">
                                <p>• Ссылка действительна в течение 7 дней</p>
                                <p>• Максимум 10 использований</p>
                                <p>• Игроки смогут выбрать персонажа при присоединении</p>
                            </div>
                        </div>

                        <DialogFooter>
                            <Button
                                variant="outline"
                                onClick={() => setShowInviteDialog(false)}
                            >
                                Закрыть
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                {/* Диалог настроек сессии */}
                <Dialog open={showSettingsDialog} onOpenChange={setShowSettingsDialog}>
                    <DialogContent className="max-w-2xl">
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2">
                                <Settings className="h-5 w-5" />
                                Настройки сессии
                            </DialogTitle>
                            <DialogDescription>
                                Управление сессией &quot;{selectedSession?.name}&quot;
                            </DialogDescription>
                        </DialogHeader>

                        <Tabs defaultValue="general" className="w-full">
                            <TabsList className="grid w-full grid-cols-3">
                                <TabsTrigger value="general">Общие</TabsTrigger>
                                <TabsTrigger value="players">Игроки</TabsTrigger>
                                <TabsTrigger value="advanced">Расширенные</TabsTrigger>
                            </TabsList>

                            <TabsContent value="general" className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <Label>Название сессии</Label>
                                        <Input
                                            value={selectedSession?.name || ''}
                                            onChange={() => {}}
                                        />
                                    </div>
                                    <div>
                                        <Label>Максимум игроков</Label>
                                        <Select value={selectedSession?.maxPlayers.toString()}>
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {[2, 3, 4, 5, 6, 7, 8].map(num => (
                                                    <SelectItem key={num} value={num.toString()}>
                                                        {num} игроков
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>

                                <div>
                                    <Label>Описание</Label>
                                    <Textarea
                                        value={selectedSession?.description || ''}
                                        onChange={() => {}}
                                        rows={3}
                                    />
                                </div>

                                <div className="flex items-center space-x-2">
                                    <Switch
                                        checked={selectedSession?.isPublic}
                                        onCheckedChange={() => {}}
                                    />
                                    <Label>Публичная сессия</Label>
                                </div>
                            </TabsContent>

                            <TabsContent value="players" className="space-y-4">
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <h4 className="font-medium">Участники сессии</h4>
                                        <Badge variant="secondary">
                                            {selectedSession?.players.length || 0} / {selectedSession?.maxPlayers || 0}
                                        </Badge>
                                    </div>

                                    {selectedSession?.players.map(player => (
                                        <div key={player.id} className="flex items-center justify-between p-3 border rounded-lg">
                                            <div className="flex items-center gap-3">
                                                {player.isGameMaster && <Crown className="h-4 w-4 text-yellow-500" />}
                                                <div>
                                                    <div className="font-medium">{player.user.username}</div>
                                                    <div className="text-sm text-muted-foreground">
                                                        {player.character.name} • {player.character.class} {player.character.level}
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-2">
                                                <Badge variant="outline" className="text-xs">
                                                    HP: {player.character.hp}/{player.character.maxHp}
                                                </Badge>
                                                {!player.isGameMaster && (
                                                    <AlertDialog>
                                                        <AlertDialogTrigger asChild>
                                                            <Button variant="ghost" size="sm">
                                                                <Trash2 className="h-4 w-4" />
                                                            </Button>
                                                        </AlertDialogTrigger>
                                                        <AlertDialogContent>
                                                            <AlertDialogHeader>
                                                                <AlertDialogTitle>Исключить игрока</AlertDialogTitle>
                                                                <AlertDialogDescription>
                                                                    Вы уверены, что хотите исключить {player.user.username} из сессии?
                                                                </AlertDialogDescription>
                                                            </AlertDialogHeader>
                                                            <AlertDialogFooter>
                                                                <AlertDialogCancel>Отмена</AlertDialogCancel>
                                                                <AlertDialogAction>Исключить</AlertDialogAction>
                                                            </AlertDialogFooter>
                                                        </AlertDialogContent>
                                                    </AlertDialog>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </TabsContent>

                            <TabsContent value="advanced" className="space-y-4">
                                <div className="space-y-4">
                                    <h4 className="font-medium text-red-600">Опасная зона</h4>

                                    <div className="space-y-3 p-4 border border-red-200 rounded-lg">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <div className="font-medium">Сбросить сессию</div>
                                                <div className="text-sm text-muted-foreground">
                                                    Удалить всех игроков и сбросить состояние игры
                                                </div>
                                            </div>
                                            <Button variant="outline" size="sm">
                                                <RotateCcw className="h-4 w-4 mr-1" />
                                                Сбросить
                                            </Button>
                                        </div>

                                        <div className="flex items-center justify-between">
                                            <div>
                                                <div className="font-medium">Удалить сессию</div>
                                                <div className="text-sm text-muted-foreground">
                                                    Навсегда удалить сессию и все связанные данные
                                                </div>
                                            </div>
                                            <AlertDialog>
                                                <AlertDialogTrigger asChild>
                                                    <Button variant="destructive" size="sm">
                                                        <Trash2 className="h-4 w-4 mr-1" />
                                                        Удалить
                                                    </Button>
                                                </AlertDialogTrigger>
                                                <AlertDialogContent>
                                                    <AlertDialogHeader>
                                                        <AlertDialogTitle>Удалить сессию</AlertDialogTitle>
                                                        <AlertDialogDescription>
                                                            Это действие нельзя отменить. Сессия &quot;{selectedSession?.name}&quot; и все связанные данные будут удалены навсегда.
                                                        </AlertDialogDescription>
                                                    </AlertDialogHeader>
                                                    <AlertDialogFooter>
                                                        <AlertDialogCancel>Отмена</AlertDialogCancel>
                                                        <AlertDialogAction
                                                            onClick={() => {
                                                                if (selectedSession) {
                                                                    deleteSession(selectedSession.id)
                                                                    setShowSettingsDialog(false)
                                                                }
                                                            }}
                                                            className="bg-red-600 hover:bg-red-700"
                                                        >
                                                            Удалить навсегда
                                                        </AlertDialogAction>
                                                    </AlertDialogFooter>
                                                </AlertDialogContent>
                                            </AlertDialog>
                                        </div>
                                    </div>
                                </div>
                            </TabsContent>
                        </Tabs>

                        <DialogFooter>
                            <Button
                                variant="outline"
                                onClick={() => setShowSettingsDialog(false)}
                            >
                                Закрыть
                            </Button>
                            <Button>
                                Сохранить изменения
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        </TooltipProvider>
    )
}

export default SessionManagement