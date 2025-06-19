'use client'

// frontend/src/app/characters/[id]/page.tsx
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useGameStore } from '@/stores/game-store'
import { useAuthStore } from '@/stores/auth-store'
import { CharacterSheet } from '@/components/character/character-sheet'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { AlertCircle, ArrowLeft, Users, Edit, Settings, Share2 } from 'lucide-react'
import { Character } from '@/types'
import { cn } from '@/lib/utils'
import { apiClient } from '@/lib/api-client'
import toast from 'react-hot-toast'

export default function CharacterSheetPage() {
    const params = useParams()
    const router = useRouter()
    const characterId = params?.id as string

    const { user } = useAuthStore()
    const { characters, updateCharacter } = useGameStore()

    const [character, setCharacter] = useState<Character | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [isEditing, setIsEditing] = useState(false)

    useEffect(() => {
        const loadCharacter = async () => {
            if (!characterId || !user) return

            try {
                setIsLoading(true)
                setError(null)

                // Сначала пробуем найти в кэше
                const cachedCharacter = characters.find(c => c.id === characterId)
                if (cachedCharacter) {
                    setCharacter(cachedCharacter)
                    setIsLoading(false)
                }

                // Загружаем полные данные с сервера
                const response = await apiClient.get<Character>(`/characters/${characterId}`)

                if (response.success && response.data) {
                    setCharacter(response.data)
                    updateCharacter(response.data)
                } else {
                    throw new Error(response.error || 'Персонаж не найден')
                }
            } catch (error: any) {
                console.error('Ошибка загрузки персонажа:', error)
                setError(error.message || 'Ошибка загрузки персонажа')
            } finally {
                setIsLoading(false)
            }
        }

        loadCharacter()
    }, [characterId, user, characters, updateCharacter])

    const handleSaveCharacter = async (updatedCharacter: Character) => {
        try {
            const response = await apiClient.put<Character>(`/characters/${characterId}`, updatedCharacter)

            if (response.success && response.data) {
                setCharacter(response.data)
                updateCharacter(response.data)
                setIsEditing(false)
                toast.success('Персонаж сохранён!')
            } else {
                throw new Error(response.error || 'Ошибка сохранения')
            }
        } catch (error: any) {
            console.error('Ошибка сохранения персонажа:', error)
            toast.error(error.message || 'Ошибка сохранения персонажа')
        }
    }

    const handleLevelUp = async () => {
        if (!character) return

        try {
            const response = await apiClient.post(`/characters/${characterId}/level-up`)

            if (response.success) {
                // Перезагружаем персонажа для получения новых данных
                const updatedResponse = await apiClient.get<Character>(`/characters/${characterId}`)
                if (updatedResponse.success && updatedResponse.data) {
                    setCharacter(updatedResponse.data)
                    updateCharacter(updatedResponse.data)
                    toast.success('Уровень повышен!')
                }
            } else {
                throw new Error(response.error || 'Ошибка повышения уровня')
            }
        } catch (error: any) {
            console.error('Ошибка повышения уровня:', error)
            toast.error(error.message || 'Ошибка повышения уровня')
        }
    }

    const canLevelUp = () => {
        if (!character) return false

        // Упрощенная таблица опыта D&D 5e
        const experienceTable = [0, 300, 900, 2700, 6500, 14000, 23000, 34000, 48000, 64000, 85000, 100000, 120000, 140000, 165000, 195000, 225000, 265000, 305000, 355000]

        const nextLevelExp = experienceTable[character.level] || Infinity
        return character.experience >= nextLevelExp && character.level < 20
    }

    // Показываем лоадер во время загрузки
    if (isLoading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-blue-50 dark:from-slate-950 dark:via-purple-950 dark:to-blue-950 flex items-center justify-center">
                <Card className="w-full max-w-md mx-4">
                    <CardContent className="p-8 text-center space-y-4">
                        <LoadingSpinner size="lg" />
                        <div>
                            <h3 className="text-lg font-semibold mb-2">Загрузка персонажа...</h3>
                            <p className="text-sm text-muted-foreground">
                                Получение данных персонажа
                            </p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        )
    }

    // Показываем ошибку если что-то пошло не так
    if (error || !character) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 via-red-50 to-slate-50 dark:from-slate-950 dark:via-red-950 dark:to-slate-950 flex items-center justify-center">
                <Card className="w-full max-w-md mx-4 border-red-500">
                    <CardContent className="p-8 text-center space-y-4">
                        <AlertCircle className="h-12 w-12 text-red-500 mx-auto" />
                        <div>
                            <h3 className="text-lg font-semibold text-red-600 mb-2">
                                {error || 'Персонаж не найден'}
                            </h3>
                            <p className="text-sm text-muted-foreground mb-4">
                                Возможно персонаж был удален или у вас нет доступа к нему.
                            </p>
                        </div>
                        <div className="flex space-x-3">
                            <Button
                                variant="outline"
                                onClick={() => router.push('/dashboard')}
                                className="flex-1"
                            >
                                <ArrowLeft className="h-4 w-4 mr-2" />
                                На главную
                            </Button>
                            <Button
                                onClick={() => window.location.reload()}
                                className="flex-1"
                            >
                                Попробовать снова
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-blue-50 dark:from-slate-950 dark:via-purple-950 dark:to-blue-950">
            {/* Заголовок */}
            <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border-b border-slate-200 dark:border-slate-800 sticky top-0 z-50">
                <div className="container mx-auto px-4 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                            <Button
                                variant="ghost"
                                onClick={() => router.back()}
                                className="hover:bg-purple-100 dark:hover:bg-purple-900"
                            >
                                <ArrowLeft className="h-4 w-4 mr-2" />
                                Назад
                            </Button>

                            <div className="flex items-center space-x-3">
                                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white font-bold text-lg">
                                    {character.profileImage ? (
                                        <img
                                            src={character.profileImage}
                                            alt={character.name}
                                            className="w-full h-full rounded-full object-cover"
                                        />
                                    ) : (
                                        character.name.charAt(0).toUpperCase()
                                    )}
                                </div>

                                <div>
                                    <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                                        {character.name}
                                    </h1>
                                    <p className="text-muted-foreground">
                                        {character.race} {character.class} {character.level} уровня
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center space-x-3">
                            {/* Уведомление о возможности повышения уровня */}
                            {canLevelUp() && (
                                <Button
                                    onClick={handleLevelUp}
                                    className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white"
                                >
                                    <Users className="h-4 w-4 mr-2" />
                                    Повысить уровень!
                                </Button>
                            )}

                            <Button
                                variant="outline"
                                onClick={() => setIsEditing(!isEditing)}
                                className={cn(
                                    "border-purple-500 text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-950",
                                    isEditing && "bg-purple-100 dark:bg-purple-900"
                                )}
                            >
                                <Edit className="h-4 w-4 mr-2" />
                                {isEditing ? 'Просмотр' : 'Редактировать'}
                            </Button>

                            <Button variant="outline">
                                <Share2 className="h-4 w-4 mr-2" />
                                Поделиться
                            </Button>

                            <Button variant="ghost" className="h-10 w-10 p-0">
                                <Settings className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Основной контент */}
            <div className="container mx-auto px-4 py-8 max-w-7xl">
                <CharacterSheet
                    character={character}
                    isEditing={isEditing}
                    onSave={handleSaveCharacter}
                    onLevelUp={canLevelUp() ? handleLevelUp : undefined}
                />
            </div>
        </div>
    )
}