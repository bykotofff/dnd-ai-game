// frontend/src/components/sessions/session-invite.tsx
'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
    Users,
    Crown,
    MapPin,
    Clock,
    Shield,
    Sword,
    Heart,
    CheckCircle,
    XCircle,
    AlertTriangle,
    UserPlus,
    Globe,
    Lock
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/stores/auth-store'
import { useGameStore } from '@/stores/game-store'
import toast from 'react-hot-toast'

// Типы для приглашений
interface SessionInviteInfo {
    id: string
    sessionId: string
    sessionName: string
    sessionDescription?: string
    gameSettings: {
        experienceMode: string
        difficultyLevel: string
        maxPlayers: number
        allowPvP: boolean
    }
    currentPlayers: number
    gameMaster: {
        username: string
    }
    isActive: boolean
    isPublic: boolean
    expiresAt: string
    currentScene: string
}

interface PlayerCharacter {
    id: string
    name: string
    class: string
    level: number
    hp: number
    maxHp: number
    race: string
}

interface SessionInviteProps {
    inviteCode: string
    onJoinSuccess?: (sessionId: string) => void
    className?: string
}

export const SessionInvite: React.FC<SessionInviteProps> = ({
                                                                inviteCode,
                                                                onJoinSuccess,
                                                                className
                                                            }) => {
    const [inviteInfo, setInviteInfo] = useState<SessionInviteInfo | null>(null)
    const [userCharacters, setUserCharacters] = useState<PlayerCharacter[]>([])
    const [selectedCharacter, setSelectedCharacter] = useState<string>('')
    const [loading, setLoading] = useState(true)
    const [joining, setJoining] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [showConfirmDialog, setShowConfirmDialog] = useState(false)

    const router = useRouter()
    const { user } = useAuthStore()
    const { setCurrentSession } = useGameStore()

    // Загрузка информации о приглашении
    useEffect(() => {
        const loadInviteInfo = async () => {
            try {
                setLoading(true)
                setError(null)

                // Получаем информацию о приглашении
                const inviteResponse = await fetch(`/api/invites/${inviteCode}`, {
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    }
                })

                if (!inviteResponse.ok) {
                    if (inviteResponse.status === 404) {
                        throw new Error('Приглашение не найдено или истекло')
                    } else if (inviteResponse.status === 410) {
                        throw new Error('Приглашение больше не активно')
                    }
                    throw new Error('Ошибка загрузки приглашения')
                }

                const inviteData = await inviteResponse.json()
                setInviteInfo(inviteData.data)

                // Загружаем персонажей пользователя
                const charactersResponse = await fetch('/api/characters', {
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    }
                })

                if (charactersResponse.ok) {
                    const charactersData = await charactersResponse.json()
                    setUserCharacters(charactersData.data)
                }

            } catch (err) {
                setError(err instanceof Error ? err.message : 'Неизвестная ошибка')
            } finally {
                setLoading(false)
            }
        }

        if (inviteCode && user) {
            loadInviteInfo()
        }
    }, [inviteCode, user])

    // Присоединение к сессии
    const joinSession = async () => {
        if (!selectedCharacter || !inviteInfo) return

        try {
            setJoining(true)

            const response = await fetch(`/api/invites/${inviteCode}/join`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({
                    characterId: selectedCharacter
                })
            })

            if (!response.ok) {
                if (response.status === 409) {
                    throw new Error('Вы уже присоединились к этой сессии')
                } else if (response.status === 400) {
                    throw new Error('Сессия заполнена или неактивна')
                }
                throw new Error('Ошибка присоединения к сессии')
            }

            const result = await response.json()

            toast.success('Успешно присоединились к сессии!')
            setCurrentSession(result.data.session)
            onJoinSuccess?.(inviteInfo.sessionId)

            // Перенаправляем в игру
            router.push(`/game/${inviteInfo.sessionId}`)

        } catch (err) {
            console.error('Ошибка присоединения:', err)
            toast.error(err instanceof Error ? err.message : 'Не удалось присоединиться к сессии')
        } finally {
            setJoining(false)
            setShowConfirmDialog(false)
        }
    }

    // Компонент загрузки
    if (loading) {
        return (
            <div className={cn("flex items-center justify-center min-h-96", className)}>
                <div className="text-center space-y-4">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto" />
                    <p className="text-muted-foreground">Загрузка приглашения...</p>
                </div>
            </div>
        )
    }

    // Компонент ошибки
    if (error) {
        return (
            <div className={cn("flex items-center justify-center min-h-96", className)}>
                <Card className="max-w-md w-full">
                    <CardContent className="pt-6 text-center space-y-4">
                        <XCircle className="h-12 w-12 text-red-500 mx-auto" />
                        <div>
                            <h3 className="text-lg font-semibold mb-2">Ошибка приглашения</h3>
                            <p className="text-muted-foreground">{error}</p>
                        </div>
                        <Button onClick={() => router.push('/sessions')}>
                            Вернуться к сессиям
                        </Button>
                    </CardContent>
                </Card>
            </div>
        )
    }

    if (!inviteInfo) return null

    const isExpired = new Date(inviteInfo.expiresAt) < new Date()
    const isFull = inviteInfo.currentPlayers >= inviteInfo.gameSettings.maxPlayers
    const canJoin = !isExpired && !isFull && inviteInfo.isActive && userCharacters.length > 0

    return (
        <div className={cn("max-w-4xl mx-auto space-y-6", className)}>
            {/* Заголовок */}
            <div className="text-center space-y-2">
                <h1 className="text-3xl font-bold">Приглашение в игровую сессию</h1>
                <p className="text-muted-foreground">
                    Вас приглашают присоединиться к приключению D&D 5e
                </p>
            </div>

            {/* Информация о сессии */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
            >
                <Card>
                    <CardHeader>
                        <div className="flex items-start justify-between">
                            <div className="space-y-2">
                                <CardTitle className="flex items-center gap-2 text-2xl">
                                    {inviteInfo.isPublic ? <Globe className="h-6 w-6" /> : <Lock className="h-6 w-6" />}
                                    {inviteInfo.sessionName}
                                </CardTitle>
                                {inviteInfo.sessionDescription && (
                                    <p className="text-muted-foreground">
                                        {inviteInfo.sessionDescription}
                                    </p>
                                )}
                            </div>

                            <div className="text-right space-y-1">
                                {!inviteInfo.isActive && (
                                    <Badge variant="secondary">Неактивная</Badge>
                                )}
                                {isExpired && (
                                    <Badge variant="destructive">Истекла</Badge>
                                )}
                                {isFull && (
                                    <Badge variant="destructive">Заполнена</Badge>
                                )}
                                {canJoin && (
                                    <Badge variant="default">Доступна</Badge>
                                )}
                            </div>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4">
                            <div className="flex items-center gap-2">
                                <Users className="h-4 w-4 text-muted-foreground" />
                                <span className="text-sm">
                                    {inviteInfo.currentPlayers}/{inviteInfo.gameSettings.maxPlayers} игроков
                                </span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Crown className="h-4 w-4 text-yellow-500" />
                                <span className="text-sm">ГМ: {inviteInfo.gameMaster.username}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <MapPin className="h-4 w-4 text-muted-foreground" />
                                <span className="text-sm">{inviteInfo.currentScene}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Clock className="h-4 w-4 text-muted-foreground" />
                                <span className="text-sm">
                                    До {new Date(inviteInfo.expiresAt).toLocaleDateString()}
                                </span>
                            </div>
                        </div>
                    </CardHeader>

                    <CardContent>
                        {/* Настройки игры */}
                        <div className="space-y-3">
                            <h3 className="font-semibold">Правила игры</h3>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                <div className="text-center p-3 border rounded-lg">
                                    <div className="text-sm font-medium">Опыт</div>
                                    <div className="text-xs text-muted-foreground">
                                        {inviteInfo.gameSettings.experienceMode}
                                    </div>
                                </div>
                                <div className="text-center p-3 border rounded-lg">
                                    <div className="text-sm font-medium">Сложность</div>
                                    <div className="text-xs text-muted-foreground">
                                        {inviteInfo.gameSettings.difficultyLevel}
                                    </div>
                                </div>
                                <div className="text-center p-3 border rounded-lg">
                                    <div className="text-sm font-medium">PvP</div>
                                    <div className="text-xs text-muted-foreground">
                                        {inviteInfo.gameSettings.allowPvP ? 'Разрешен' : 'Запрещен'}
                                    </div>
                                </div>
                                <div className="text-center p-3 border rounded-lg">
                                    <div className="text-sm font-medium">Тип</div>
                                    <div className="text-xs text-muted-foreground">
                                        {inviteInfo.isPublic ? 'Публичная' : 'Приватная'}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </motion.div>

            {/* Выбор персонажа */}
            {canJoin && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                >
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Sword className="h-5 w-5" />
                                Выберите персонажа
                            </CardTitle>
                            <p className="text-sm text-muted-foreground">
                                Выберите персонажа, с которым хотите присоединиться к приключению
                            </p>
                        </CardHeader>
                        <CardContent>
                            {userCharacters.length === 0 ? (
                                <div className="text-center py-8 space-y-4">
                                    <AlertTriangle className="h-12 w-12 text-yellow-500 mx-auto" />
                                    <div>
                                        <h3 className="font-semibold mb-2">Нет доступных персонажей</h3>
                                        <p className="text-muted-foreground mb-4">
                                            Для присоединения к сессии нужно создать персонажа
                                        </p>
                                        <Button onClick={() => router.push('/characters/create')}>
                                            Создать персонажа
                                        </Button>
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                        {userCharacters.map(character => (
                                            <Card
                                                key={character.id}
                                                className={cn(
                                                    "cursor-pointer transition-all hover:scale-105",
                                                    selectedCharacter === character.id && "ring-2 ring-primary"
                                                )}
                                                onClick={() => setSelectedCharacter(character.id)}
                                            >
                                                <CardContent className="p-4">
                                                    <div className="space-y-2">
                                                        <div className="flex items-center justify-between">
                                                            <h3 className="font-semibold">{character.name}</h3>
                                                            {selectedCharacter === character.id && (
                                                                <CheckCircle className="h-4 w-4 text-green-600" />
                                                            )}
                                                        </div>

                                                        <div className="text-sm text-muted-foreground">
                                                            {character.race} {character.class}
                                                        </div>

                                                        <div className="flex items-center gap-4 text-xs">
                                                            <div className="flex items-center gap-1">
                                                                <Shield className="h-3 w-3" />
                                                                <span>Ур. {character.level}</span>
                                                            </div>
                                                            <div className="flex items-center gap-1">
                                                                <Heart className="h-3 w-3" />
                                                                <span>{character.hp}/{character.maxHp}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        ))}
                                    </div>

                                    {selectedCharacter && (
                                        <div className="text-center pt-4">
                                            <Button
                                                size="lg"
                                                onClick={() => setShowConfirmDialog(true)}
                                                className="bg-green-600 hover:bg-green-700"
                                            >
                                                <UserPlus className="h-4 w-4 mr-2" />
                                                Присоединиться к приключению
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </motion.div>
            )}

            {/* Статус недоступности */}
            {!canJoin && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                >
                    <Card className="border-red-200 bg-red-50/50 dark:border-red-800 dark:bg-red-950/20">
                        <CardContent className="pt-6 text-center space-y-4">
                            <XCircle className="h-12 w-12 text-red-500 mx-auto" />
                            <div>
                                <h3 className="text-lg font-semibold text-red-700 dark:text-red-300 mb-2">
                                    Невозможно присоединиться
                                </h3>
                                <div className="text-sm text-red-600 dark:text-red-400 space-y-1">
                                    {isExpired && <p>• Приглашение истекло</p>}
                                    {isFull && <p>• Сессия заполнена</p>}
                                    {!inviteInfo.isActive && <p>• Сессия неактивна</p>}
                                    {userCharacters.length === 0 && <p>• Нет доступных персонажей</p>}
                                </div>
                            </div>
                            <Button
                                variant="outline"
                                onClick={() => router.push('/sessions')}
                            >
                                Найти другие сессии
                            </Button>
                        </CardContent>
                    </Card>
                </motion.div>
            )}

            {/* Диалог подтверждения */}
            <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Подтвердите присоединение</DialogTitle>
                        <DialogDescription>
                            Вы присоединяетесь к сессии &quot;{inviteInfo.sessionName}&quot;
                            с персонажем {userCharacters.find(c => c.id === selectedCharacter)?.name}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4">
                        <div className="p-4 bg-muted/50 rounded-lg space-y-2">
                            <h4 className="font-medium">Детали присоединения:</h4>
                            <div className="text-sm space-y-1">
                                <p>• Мастер игры: {inviteInfo.gameMaster.username}</p>
                                <p>• Текущая локация: {inviteInfo.currentScene}</p>
                                <p>• Игроков в сессии: {inviteInfo.currentPlayers}/{inviteInfo.gameSettings.maxPlayers}</p>
                                <p>• Сложность: {inviteInfo.gameSettings.difficultyLevel}</p>
                                {inviteInfo.gameSettings.allowPvP && (
                                    <p className="text-red-600">• PvP разрешен - будьте осторожны!</p>
                                )}
                            </div>
                        </div>

                        <div className="text-xs text-muted-foreground">
                            После присоединения вы сможете взаимодействовать с другими игроками
                            и участвовать в развитии истории.
                        </div>
                    </div>

                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setShowConfirmDialog(false)}
                            disabled={joining}
                        >
                            Отмена
                        </Button>
                        <Button
                            onClick={joinSession}
                            disabled={joining}
                            className="bg-green-600 hover:bg-green-700"
                        >
                            {joining ? (
                                <>
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                                    Присоединяемся...
                                </>
                            ) : (
                                <>
                                    <CheckCircle className="h-4 w-4 mr-2" />
                                    Подтвердить
                                </>
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}

// Компонент страницы присоединения по ссылке
export const JoinSessionPage: React.FC<{ params: { code: string } }> = ({ params }) => {
    const { user } = useAuthStore()
    const router = useRouter()

    // Проверка авторизации
    useEffect(() => {
        if (!user) {
            router.push('/auth/login?redirect=' + encodeURIComponent(`/join/${params.code}`))
        }
    }, [user, router, params.code])

    if (!user) {
        return (
            <div className="flex items-center justify-center min-h-96">
                <div className="text-center space-y-4">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto" />
                    <p className="text-muted-foreground">Проверка авторизации...</p>
                </div>
            </div>
        )
    }

    return (
        <div className="container mx-auto px-4 py-8">
            <SessionInvite
                inviteCode={params.code}
                onJoinSuccess={(sessionId) => {
                    // Дополнительная логика после успешного присоединения
                    console.log('Successfully joined session:', sessionId)
                }}
            />
        </div>
    )
}

// Хук для управления приглашениями
export function useSessionInvitations(sessionId: string) {
    const [invitations, setInvitations] = useState<SessionInvite[]>([])
    const [loading, setLoading] = useState(false)

    const loadInvitations = async () => {
        try {
            setLoading(true)
            const response = await fetch(`/api/sessions/${sessionId}/invites`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            })

            if (response.ok) {
                const data = await response.json()
                setInvitations(data.data)
            }
        } catch (error) {
            console.error('Error loading invitations:', error)
        } finally {
            setLoading(false)
        }
    }

    const createInvitation = async (options: {
        expiresIn?: number // в часах
        maxUses?: number
    } = {}) => {
        try {
            const response = await fetch(`/api/sessions/${sessionId}/invites`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify(options)
            })

            if (response.ok) {
                const data = await response.json()
                await loadInvitations()
                return data.data
            }
            throw new Error('Failed to create invitation')
        } catch (error) {
            console.error('Error creating invitation:', error)
            throw error
        }
    }

    const revokeInvitation = async (inviteId: string) => {
        try {
            const response = await fetch(`/api/invites/${inviteId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            })

            if (response.ok) {
                await loadInvitations()
            }
        } catch (error) {
            console.error('Error revoking invitation:', error)
        }
    }

    return {
        invitations,
        loading,
        loadInvitations,
        createInvitation,
        revokeInvitation
    }
}

export default SessionInvite