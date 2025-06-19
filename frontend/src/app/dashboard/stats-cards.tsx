// frontend/src/components/dashboard/stats-cards.tsx
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
    Users,
    Swords,
    Crown,
    TrendingUp,
    Activity,
    Calendar,
    Timer,
    Zap
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface StatsCardsProps {
    stats: {
        totalCharacters: number
        activeSessions: number
        totalSessions: number
        highestLevel: number
    }
}

interface StatCardProps {
    title: string
    value: string | number
    description: string
    icon: React.ReactNode
    color: string
    trend?: {
        value: number
        isPositive: boolean
    }
}

function StatCard({ title, value, description, icon, color, trend }: StatCardProps) {
    return (
        <Card className="group hover:shadow-lg transition-all duration-300 border-0 bg-gradient-to-br from-white/50 to-white/30 dark:from-slate-800/50 dark:to-slate-900/30 backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                    {title}
                </CardTitle>
                <div className={cn(
                    "p-2 rounded-lg transition-all duration-300 group-hover:scale-110",
                    color
                )}>
                    {icon}
                </div>
            </CardHeader>
            <CardContent>
                <div className="flex items-baseline space-x-2">
                    <div className="text-2xl font-bold">{value}</div>
                    {trend && (
                        <div className={cn(
                            "flex items-center text-xs font-medium",
                            trend.isPositive ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"
                        )}>
                            <TrendingUp className={cn(
                                "h-3 w-3 mr-1",
                                !trend.isPositive && "rotate-180"
                            )} />
                            {Math.abs(trend.value)}%
                        </div>
                    )}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                    {description}
                </p>
            </CardContent>
        </Card>
    )
}

export function StatsCards({ stats }: StatsCardsProps) {
    const { totalCharacters, activeSessions, totalSessions, highestLevel } = stats

    // Вычисляем некоторые дополнительные метрики
    const averageLevel = totalCharacters > 0
        ? (stats.totalCharacters * 2.5) // Примерное вычисление
        : 0

    const activityRate = totalSessions > 0
        ? Math.round((activeSessions / totalSessions) * 100)
        : 0

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard
                title="Мои персонажи"
                value={totalCharacters}
                description={totalCharacters === 0 ? "Создайте первого персонажа" : "Готовы к приключениям"}
                icon={<Crown className="h-4 w-4 text-white" />}
                color="bg-gradient-to-br from-purple-500 to-purple-600"
                trend={totalCharacters > 0 ? { value: 12, isPositive: true } : undefined}
            />

            <StatCard
                title="Активные игры"
                value={activeSessions}
                description={activeSessions === 0 ? "Нет активных сессий" : "Приключения в процессе"}
                icon={<Swords className="h-4 w-4 text-white" />}
                color="bg-gradient-to-br from-blue-500 to-blue-600"
                trend={activeSessions > 0 ? { value: 8, isPositive: true } : undefined}
            />

            <StatCard
                title="Всего сессий"
                value={totalSessions}
                description={totalSessions === 0 ? "Начните первую игру" : "Опыт приключений"}
                icon={<Activity className="h-4 w-4 text-white" />}
                color="bg-gradient-to-br from-amber-500 to-amber-600"
                trend={totalSessions > 0 ? { value: 15, isPositive: true } : undefined}
            />

            <StatCard
                title="Высший уровень"
                value={highestLevel === 0 ? "—" : highestLevel}
                description={highestLevel === 0 ? "Начните развивать персонажа" : "Максимальный достигнутый уровень"}
                icon={<Zap className="h-4 w-4 text-white" />}
                color="bg-gradient-to-br from-green-500 to-green-600"
                trend={highestLevel > 3 ? { value: 20, isPositive: true } : undefined}
            />
        </div>
    )
}