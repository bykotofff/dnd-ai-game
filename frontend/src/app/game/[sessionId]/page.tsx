'use client'

// frontend/src/app/game/[sessionId]/page.tsx
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useGameStore } from '@/stores/game-store'
import { useAuthStore } from '@/stores/auth-store'
import { GameInterface } from '@/components/game/game-interface'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { AlertCircle, ArrowLeft, Users, Wifi, WifiOff } from 'lucide-react'
import { cn } from '@/lib/utils'

export default function GamePage() {
    const params = useParams()
    const router = useRouter()
    const sessionId = params?.sessionId as string

    const { user } = useAuthStore()
    const {
        currentSession,
        selectedCharacter,
        connectionStatus,
        isLoading,
        error,
        loadSession,
        joinSession,
        clearError
    } = useGameStore()

    const [isInitialized, setIsInitialized] = useState(false)

    useEffect(() => {
        const initializeGame = async () => {
            if (!sessionId || !user || isInitialized) return

            try {
                // Загружаем данные сессии
                await loadSession(sessionId)

                // Присоединяемся к сессии через Socket.IO
                await joinSession(sessionId)

                setIsInitialized(true)
            } catch (error) {
                console.error('Ошибка инициализации игры:', error)
            }
        }

        initializeGame()
    }, [sessionId, user, isInitialized, loadSession, joinSession])

    // Показываем лоадер во время загрузки
    if (isLoading || !isInitialized) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
                <Card className="w-full max-w-md mx-4">
                    <CardContent className="p-8 text-center space-y-4">
                        <LoadingSpinner size="lg" />
                        <div>
                            <h3 className="text-lg font-semibold mb-2">Подключение к игре...</h3>
                            <div className="space-y-1 text-sm text-muted-foreground">
                                <p>• Загрузка данных сессии</p>
                                <p>• Подключение к серверу</p>
                                <p>• Синхронизация состояния</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        )
    }

    // Показываем ошибку если что-то пошло не так
    if (error) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-900 via-red-900 to-slate-900 flex items-center justify-center">
                <Card className="w-full max-w-md mx-4 border-red-500">
                    <CardContent className="p-8 text-center space-y-4">
                        <AlertCircle className="h-12 w-12 text-red-500 mx-auto" />
                        <div>
                            <h3 className="text-lg font-semibold text-red-600 mb-2">Ошибка подключения</h3>
                            <p className="text-sm text-muted-foreground mb-4">{error}</p>
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
                                onClick={() => {
                                    clearError()
                                    setIsInitialized(false)
                                }}
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

    // Проверяем что сессия загружена
    if (!currentSession) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
                <Card className="w-full max-w-md mx-4">
                    <CardContent className="p-8 text-center space-y-4">
                        <Users className="h-12 w-12 text-muted-foreground mx-auto" />
                        <div>
                            <h3 className="text-lg font-semibold mb-2">Сессия не найдена</h3>
                            <p className="text-sm text-muted-foreground">
                                Возможно сессия была удалена или у вас нет доступа к ней.
                            </p>
                        </div>
                        <Button
                            onClick={() => router.push('/dashboard')}
                            className="w-full"
                        >
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            Вернуться на главную
                        </Button>
                    </CardContent>
                </Card>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
            {/* Статус подключения */}
            <div className="fixed top-4 right-4 z-50">
                <div className={cn(
                    "flex items-center space-x-2 px-3 py-2 rounded-full text-sm font-medium shadow-lg backdrop-blur-sm",
                    connectionStatus === 'connected'
                        ? "bg-green-100/90 text-green-800 border border-green-200"
                        : connectionStatus === 'connecting'
                            ? "bg-yellow-100/90 text-yellow-800 border border-yellow-200"
                            : "bg-red-100/90 text-red-800 border border-red-200"
                )}>
                    {connectionStatus === 'connected' ? (
                        <Wifi className="h-4 w-4" />
                    ) : (
                        <WifiOff className="h-4 w-4" />
                    )}
                    <span>
            {connectionStatus === 'connected' && 'Подключено'}
                        {connectionStatus === 'connecting' && 'Подключение...'}
                        {connectionStatus === 'disconnected' && 'Отключено'}
          </span>
                </div>
            </div>

            {/* Основной игровой интерфейс */}
            <GameInterface
                session={currentSession}
                character={selectedCharacter}
                onLeaveSession={() => router.push('/dashboard')}
            />
        </div>
    )
}