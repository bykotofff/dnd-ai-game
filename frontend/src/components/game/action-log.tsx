// frontend/src/components/game/action-log.tsx
import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
    Eye,
    Search,
    Filter,
    Download,
    Clock,
    Bot,
    User,
    Dice6,
    MessageCircle,
    Settings,
    ChevronDown,
    ChevronUp,
    ExternalLink
} from 'lucide-react'
import { ActionLog } from '@/types'
import { cn } from '@/lib/utils'
import { formatDistanceToNow, format } from 'date-fns'
import { ru } from 'date-fns/locale'

interface ActionLogProps {
    actionLog: ActionLog[]
}

type LogFilter = 'all' | 'ai_response' | 'player_action' | 'dice_roll' | 'chat_message'

interface LogFilterConfig {
    type: LogFilter
    label: string
    icon: any
    color: string
}

const LOG_FILTERS: LogFilterConfig[] = [
    { type: 'all', label: 'Все', icon: Eye, color: 'text-muted-foreground' },
    { type: 'ai_response', label: 'ИИ Мастер', icon: Bot, color: 'text-purple-500' },
    { type: 'player_action', label: 'Действия', icon: User, color: 'text-blue-500' },
    { type: 'dice_roll', label: 'Броски', icon: Dice6, color: 'text-green-500' },
    { type: 'chat_message', label: 'Чат', icon: MessageCircle, color: 'text-amber-500' }
]

function ActionLogItem({ action, isExpanded, onToggleExpand }: {
    action: ActionLog
    isExpanded: boolean
    onToggleExpand: () => void
}) {
    const getActionIcon = () => {
        switch (action.actionType) {
            case 'ai_response':
                return <Bot className="h-4 w-4 text-purple-500" />
            case 'player_action':
                return <User className="h-4 w-4 text-blue-500" />
            case 'dice_roll':
                return <Dice6 className="h-4 w-4 text-green-500" />
            case 'chat_message':
                return <MessageCircle className="h-4 w-4 text-amber-500" />
            default:
                return <Eye className="h-4 w-4 text-muted-foreground" />
        }
    }

    const getActionTypeLabel = () => {
        switch (action.actionType) {
            case 'ai_response':
                return '🎭 Мастер'
            case 'player_action':
                return '👤 Действие'
            case 'dice_roll':
                return '🎲 Бросок'
            case 'chat_message':
                return '💬 Чат'
            default:
                return '📝 Событие'
        }
    }

    const getActionBorderColor = () => {
        switch (action.actionType) {
            case 'ai_response':
                return 'border-l-purple-500'
            case 'player_action':
                return 'border-l-blue-500'
            case 'dice_roll':
                return 'border-l-green-500'
            case 'chat_message':
                return 'border-l-amber-500'
            default:
                return 'border-l-muted'
        }
    }

    const formatTimestamp = (timestamp: string) => {
        try {
            const date = new Date(timestamp)
            return {
                relative: formatDistanceToNow(date, { addSuffix: true, locale: ru }),
                absolute: format(date, 'dd.MM.yyyy HH:mm:ss', { locale: ru })
            }
        } catch {
            return { relative: 'недавно', absolute: 'Неизвестно' }
        }
    }

    const timeInfo = formatTimestamp(action.timestamp)
    const shouldShowExpand = action.content.length > 150 || action.metadata

    return (
        <div className={cn(
            "border-l-4 rounded-r-lg p-3 transition-all duration-200 hover:bg-muted/5",
            getActionBorderColor(),
            "bg-background/50"
        )}>
            <div className="space-y-2">
                {/* Заголовок */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                        {getActionIcon()}
                        <Badge variant="outline" className="text-xs">
                            {getActionTypeLabel()}
                        </Badge>
                        {action.metadata?.characterName && (
                            <span className="text-xs text-muted-foreground">
                {action.metadata.characterName}
              </span>
                        )}
                    </div>

                    <div className="flex items-center space-x-2">
            <span className="text-xs text-muted-foreground" title={timeInfo.absolute}>
              {timeInfo.relative}
            </span>
                        {shouldShowExpand && (
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={onToggleExpand}
                                className="h-6 w-6 p-0"
                            >
                                {isExpanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                            </Button>
                        )}
                    </div>
                </div>

                {/* Содержимое */}
                <div className="text-sm leading-relaxed">
                    {isExpanded || action.content.length <= 150 ? (
                        action.content
                    ) : (
                        <>
                            {action.content.substring(0, 150)}...
                            <Button
                                variant="link"
                                size="sm"
                                onClick={onToggleExpand}
                                className="h-auto p-0 ml-1 text-xs text-primary"
                            >
                                показать больше
                            </Button>
                        </>
                    )}
                </div>

                {/* Метаданные */}
                {isExpanded && action.metadata && (
                    <div className="pt-2 border-t border-muted space-y-2">
                        {/* Данные броска костей */}
                        {action.actionType === 'dice_roll' && action.metadata && (
                            <div className="grid grid-cols-2 gap-2 text-xs">
                                {action.metadata.diceType && (
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Кость:</span>
                                        <Badge variant="outline" className="text-xs">
                                            {action.metadata.diceType}
                                        </Badge>
                                    </div>
                                )}
                                {action.metadata.result !== undefined && (
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Результат:</span>
                                        <span className="font-mono">{action.metadata.result}</span>
                                    </div>
                                )}
                                {action.metadata.modifier !== undefined && action.metadata.modifier !== 0 && (
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Модификатор:</span>
                                        <span className="font-mono">
                      {action.metadata.modifier > 0 ? '+' : ''}{action.metadata.modifier}
                    </span>
                                    </div>
                                )}
                                {action.metadata.purpose && (
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Цель:</span>
                                        <span>{action.metadata.purpose}</span>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Данные ответа ИИ */}
                        {action.actionType === 'ai_response' && action.metadata && (
                            <div className="space-y-2">
                                {action.metadata.suggestions && action.metadata.suggestions.length > 0 && (
                                    <div>
                                        <h5 className="text-xs font-medium text-muted-foreground mb-1">
                                            Предложения:
                                        </h5>
                                        <div className="flex flex-wrap gap-1">
                                            {action.metadata.suggestions.map((suggestion: string, index: number) => (
                                                <Badge key={index} variant="outline" className="text-xs">
                                                    {suggestion}
                                                </Badge>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {action.metadata.diceRollsRequired && action.metadata.diceRollsRequired.length > 0 && (
                                    <div>
                                        <h5 className="text-xs font-medium text-muted-foreground mb-1">
                                            Требуемые броски:
                                        </h5>
                                        <div className="flex flex-wrap gap-1">
                                            {action.metadata.diceRollsRequired.map((roll: any, index: number) => (
                                                <Badge key={index} variant="outline" className="text-xs border-green-500 text-green-400">
                                                    {roll.type} {roll.purpose && `(${roll.purpose})`}
                                                </Badge>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {action.metadata.sceneUpdates && action.metadata.sceneUpdates.length > 0 && (
                                    <div>
                                        <h5 className="text-xs font-medium text-muted-foreground mb-1">
                                            Обновления сцены:
                                        </h5>
                                        <div className="space-y-1">
                                            {action.metadata.sceneUpdates.map((update: any, index: number) => (
                                                <div key={index} className="text-xs text-muted-foreground">
                                                    • {update.description}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Дополнительные метаданные */}
                        {action.metadata.characterClass && (
                            <div className="text-xs text-muted-foreground">
                                Класс персонажа: {action.metadata.characterClass} {action.metadata.characterLevel && `(ур. ${action.metadata.characterLevel})`}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    )
}

export function ActionLog({ actionLog }: ActionLogProps) {
    const [searchQuery, setSearchQuery] = useState('')
    const [activeFilter, setActiveFilter] = useState<LogFilter>('all')
    const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set())
    const [showSettings, setShowSettings] = useState(false)

    // Фильтрация логов
    const filteredLogs = actionLog.filter(action => {
        // Фильтр по типу
        if (activeFilter !== 'all' && action.actionType !== activeFilter) {
            return false
        }

        // Поиск по содержимому
        if (searchQuery) {
            const query = searchQuery.toLowerCase()
            return (
                action.content.toLowerCase().includes(query) ||
                action.metadata?.characterName?.toLowerCase().includes(query) ||
                action.metadata?.purpose?.toLowerCase().includes(query)
            )
        }

        return true
    })

    const toggleExpanded = (actionId: string) => {
        setExpandedItems(prev => {
            const newSet = new Set(prev)
            if (newSet.has(actionId)) {
                newSet.delete(actionId)
            } else {
                newSet.add(actionId)
            }
            return newSet
        })
    }

    const exportLog = () => {
        const logData = filteredLogs.map(action => ({
            timestamp: action.timestamp,
            type: action.actionType,
            character: action.metadata?.characterName || 'Неизвестно',
            content: action.content,
            metadata: action.metadata
        }))

        const dataStr = JSON.stringify(logData, null, 2)
        const dataBlob = new Blob([dataStr], { type: 'application/json' })
        const url = URL.createObjectURL(dataBlob)

        const link = document.createElement('a')
        link.href = url
        link.download = `game-log-${new Date().toISOString().split('T')[0]}.json`
        link.click()

        URL.revokeObjectURL(url)
    }

    const getFilterCount = (filter: LogFilter) => {
        if (filter === 'all') return actionLog.length
        return actionLog.filter(action => action.actionType === filter).length
    }

    return (
        <div className="h-full flex flex-col">
            <CardHeader className="pb-3 border-b border-slate-700">
                <div className="flex items-center justify-between">
                    <CardTitle className="text-sm flex items-center space-x-2">
                        <Eye className="h-4 w-4 text-amber-500" />
                        <span>Журнал действий</span>
                    </CardTitle>

                    <div className="flex items-center space-x-2">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setShowSettings(!showSettings)}
                            className="h-6 w-6 p-0"
                        >
                            <Settings className="h-3 w-3" />
                        </Button>

                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={exportLog}
                            disabled={filteredLogs.length === 0}
                            className="h-6 w-6 p-0"
                        >
                            <Download className="h-3 w-3" />
                        </Button>
                    </div>
                </div>

                {/* Панель настроек */}
                {showSettings && (
                    <div className="space-y-3 pt-3">
                        {/* Поиск */}
                        <div className="relative">
                            <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-3 w-3 text-muted-foreground" />
                            <Input
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Поиск по действиям..."
                                className="pl-7 h-7 bg-slate-700/50 border-slate-600 text-xs"
                            />
                        </div>

                        {/* Фильтры */}
                        <div className="flex flex-wrap gap-1">
                            {LOG_FILTERS.map((filter) => {
                                const Icon = filter.icon
                                const count = getFilterCount(filter.type)

                                return (
                                    <Button
                                        key={filter.type}
                                        variant={activeFilter === filter.type ? 'default' : 'outline'}
                                        size="sm"
                                        onClick={() => setActiveFilter(filter.type)}
                                        className={cn(
                                            "h-7 text-xs flex items-center space-x-1",
                                            activeFilter === filter.type && filter.color
                                        )}
                                    >
                                        <Icon className="h-3 w-3" />
                                        <span>{filter.label}</span>
                                        <Badge variant="secondary" className="text-xs ml-1">
                                            {count}
                                        </Badge>
                                    </Button>
                                )
                            })}
                        </div>
                    </div>
                )}
            </CardHeader>

            <CardContent className="flex-1 p-0 overflow-hidden">
                {filteredLogs.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center p-4">
                        {searchQuery || activeFilter !== 'all' ? (
                            <>
                                <Search className="h-8 w-8 text-muted-foreground mb-3" />
                                <h3 className="text-sm font-semibold mb-2">Ничего не найдено</h3>
                                <p className="text-xs text-muted-foreground mb-4">
                                    Попробуйте изменить фильтры или поисковый запрос
                                </p>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                        setSearchQuery('')
                                        setActiveFilter('all')
                                    }}
                                >
                                    Сбросить фильтры
                                </Button>
                            </>
                        ) : (
                            <>
                                <Eye className="h-8 w-8 text-muted-foreground mb-3" />
                                <h3 className="text-sm font-semibold mb-2">Журнал пуст</h3>
                                <p className="text-xs text-muted-foreground">
                                    Здесь будут отображаться все действия в игре
                                </p>
                            </>
                        )}
                    </div>
                ) : (
                    <ScrollArea className="h-full">
                        <div className="p-3 space-y-3">
                            {filteredLogs.map((action) => (
                                <ActionLogItem
                                    key={action.id}
                                    action={action}
                                    isExpanded={expandedItems.has(action.id)}
                                    onToggleExpand={() => toggleExpanded(action.id)}
                                />
                            ))}
                        </div>
                    </ScrollArea>
                )}
            </CardContent>

            {/* Статистика */}
            {filteredLogs.length > 0 && (
                <div className="p-3 border-t border-slate-700 text-xs text-muted-foreground">
                    Показано {filteredLogs.length} из {actionLog.length} записей
                    {searchQuery && ` • Поиск: "${searchQuery}"`}
                    {activeFilter !== 'all' && ` • Фильтр: ${LOG_FILTERS.find(f => f.type === activeFilter)?.label}`}
                </div>
            )}
        </div>
    )
}