// frontend/src/components/dashboard/recent-sessions.tsx
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
    Play,
    Plus,
    Users,
    Clock,
    MapPin,
    Crown,
    Swords,
    Calendar,
    Eye,
    MoreHorizontal,
    Activity
} from 'lucide-react'
import { GameSession } from '@/types'
import { cn } from '@/lib/utils'
import { formatDistanceToNow } from 'date-fns'
import { ru } from 'date-fns/locale'

interface RecentSessionsProps {
    sessions: GameSession[]
    onJoinSession: (sessionId: string) => void
    onCreateSession: () => void
}

interface SessionCardProps {
    session: GameSession
    onJoin: (sessionId: string) => void
}

function SessionCard({ session, onJoin }: SessionCardProps) {
    const timeAgo = formatDistanceToNow(new Date(session.updatedAt), {
        addSuffix: true,
        locale: ru
    })

    const isActive = session.isActive
    const isInCombat = session.worldState?.inCombat || false

    return (
        <Card className="group hover:shadow-md transition-all duration-300 border-0 bg-gradient-to-br from-white/80 to-white/60 dark:from-slate-800/80 dark:to-slate-900/60 backdrop-blur-sm">
            <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                    <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                            <CardTitle className="text-lg font-bold group-hover:text-purple-600 transition-colors">
                                {session.name}
                            </CardTitle>
                            <div className="flex items-center space-x-1">
                                {isActive && (
                                    <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">
                                        <div className="w-1.5 h-1.5 bg-green-500 rounded-full mr-1 animate-pulse" />
                                        Активна
                                    </Badge>
                                )}
                                {isInCombat && (
                                    <Badge className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300">
                                        <Swords className="h-3 w-3 mr-1" />
                                        Бой
                                    </Badge>
                                )}
                            </div>
                        </div>

                        {session.description && (
                            <CardDescription className="line-clamp-2 mb-3">
                                {session.description}
                            </CardDescription>
                        )}

                        {/* Информация о сессии */}
                        <div className="space-y-2">
                            {session.worldState?.currentLocation && (
                                <div className="flex items-center text-sm text-muted-foreground">
                                    <MapPin className="h-3 w-3 mr-2" />
                                    {session.worldState.currentLocation}
                                </div>
                            )}

                            <div className="flex items-center justify-between text-sm text-muted-foreground">
                                <div className="flex items-center">
                                    <Users className="h-3 w-3 mr-2" />
                                    <span>До {session.maxPlayers} игроков</span>
                                </div>
                                <div className="flex items-center">
                                    <Clock className="h-3 w-3 mr-2" />
                                    <span>{timeAgo}</span>
                                </div>
                            </div>

                            {/* Время дня и погода */}
                            {session.worldState && (
                                <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                                    {session.worldState.timeOfDay && (
                                        <div className="flex items-center">
                                            <Calendar className="h-3 w-3 mr-1" />
                                            <span className="capitalize">
                        {session.worldState.timeOfDay === 'morning' && 'Утро'}
                                                {session.worldState.timeOfDay === 'afternoon' && 'День'}
                                                {session.worldState.timeOfDay === 'evening' && 'Вечер'}
                                                {session.worldState.timeOfDay === 'night' && 'Ночь'}
                      </span>
                                        </div>
                                    )}
                                    {session.worldState.weather && (
                                        <span>{session.worldState.weather}</span>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Превью изображения сессии */}
                    {session.sceneImage && (
                        <div className="w-16 h-16 rounded-lg overflow-hidden bg-muted ml-4 flex-shrink-0">
                            <img
                                src={session.sceneImage}
                                alt={session.name}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                        </div>
                    )}
                </div>
            </CardHeader>

            <CardContent className="pt-0">
                {/* Прогресс боя (если активен) */}
                {isInCombat && session.worldState?.combatRound && (
                    <div className="mb-4 p-3 bg-red-50 dark:bg-red-950/30 rounded-lg border border-red-200 dark:border-red-800">
                        <div className="flex items-center justify-between text-sm">
              <span className="font-medium text-red-800 dark:text-red-300">
                Раунд боя: {session.worldState.combatRound}
              </span>
                            {session.worldState.currentTurn && (
                                <span className="text-red-600 dark:text-red-400">
                  Ход: {session.worldState.currentTurn}
                </span>
                            )}
                        </div>
                    </div>
                )}

                {/* Кнопки действий */}
                <div className="flex space-x-2">
                    <Button
                        size="sm"
                        className="flex-1 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                        onClick={() => onJoin(session.id)}
                    >
                        <Play className="h-4 w-4 mr-2" />
                        {isActive ? 'Продолжить' : 'Присоединиться'}
                    </Button>

                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                            // TODO: Открыть детали сессии
                            console.log('View session details:', session.id)
                        }}
                    >
                        <Eye className="h-4 w-4" />
                    </Button>
                </div>
            </CardContent>
        </Card>
    )
}

function EmptyState({ onCreateSession }: { onCreateSession: () => void }) {
    return (
        <Card className="border-2 border-dashed border-muted-foreground/25 bg-gradient-to-br from-slate-50/50 to-slate-100/50 dark:from-slate-800/50 dark:to-slate-900/50">
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center mb-4">
                    <Activity className="h-8 w-8 text-muted-foreground" />
                </div>
                <CardTitle className="mb-2">Начните новое приключение</CardTitle>
                <CardDescription className="mb-6 max-w-sm">
                    Создайте игровую сессию и пригласите друзей, или найдите существующую игру для присоединения.
                </CardDescription>
                <div className="flex space-x-3">
                    <Button
                        onClick={onCreateSession}
                        className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                    >
                        <Plus className="h-4 w-4 mr-2" />
                        Создать сессию
                    </Button>
                    <Button
                        variant="outline"
                        onClick={() => {
                            // TODO: Navigate to browse sessions
                            console.log('Browse sessions')
                        }}
                    >
                        <Users className="h-4 w-4 mr-2" />
                        Найти игру
                    </Button>
                </div>
            </CardContent>
        </Card>
    )
}

export function RecentSessions({ sessions, onJoinSession, onCreateSession }: RecentSessionsProps) {
    if (sessions.length === 0) {
        return (
            <div>
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h2 className="text-2xl font-bold">Игровые сессии</h2>
                        <p className="text-muted-foreground">Ваши приключения ждут</p>
                    </div>
                </div>
                <EmptyState onCreateSession={onCreateSession} />
            </div>
        )
    }

    return (
        <div>
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h2 className="text-2xl font-bold">Последние сессии</h2>
                    <p className="text-muted-foreground">
                        {sessions.length} {sessions.length === 1 ? 'сессия' : 'сессий'} в истории
                    </p>
                </div>
                <div className="flex space-x-2">
                    <Button
                        onClick={onCreateSession}
                        variant="outline"
                        className="hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 dark:hover:from-blue-950 dark:hover:to-purple-950"
                    >
                        <Plus className="h-4 w-4 mr-2" />
                        Новая сессия
                    </Button>
                    <Button
                        variant="outline"
                        onClick={() => {
                            // TODO: Navigate to all sessions
                            console.log('View all sessions')
                        }}
                    >
                        <Eye className="h-4 w-4 mr-2" />
                        Все сессии
                    </Button>
                </div>
            </div>

            <div className="space-y-4">
                {sessions.map((session) => (
                    <SessionCard
                        key={session.id}
                        session={session}
                        onJoin={onJoinSession}
                    />
                ))}
            </div>

            {/* Кнопка для просмотра всех сессий */}
            {sessions.length >= 3 && (
                <Card
                    className="mt-4 border-2 border-dashed border-muted-foreground/25 hover:border-muted-foreground/50 transition-colors cursor-pointer bg-gradient-to-br from-slate-50/30 to-slate-100/30 dark:from-slate-800/30 dark:to-slate-900/30"
                    onClick={() => {
                        // TODO: Navigate to all sessions
                        console.log('View all sessions')
                    }}
                >
                    <CardContent className="flex items-center justify-center py-6 text-center">
                        <div className="flex items-center space-x-2 text-muted-foreground">
                            <Eye className="h-5 w-5" />
                            <span className="font-medium">Показать все сессии</span>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    )
}