// frontend/src/components/game/scene-display.tsx
import { useEffect, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
    Bot,
    User,
    Dice6,
    MessageCircle,
    Clock,
    Sparkles,
    Scroll,
    MapPin,
    Eye,
    Lightbulb,
    AlertTriangle
} from 'lucide-react'
import { GameSession, ActionLog, AIResponse } from '@/types'
import { cn } from '@/lib/utils'
import { formatDistanceToNow } from 'date-fns'
import { ru } from 'date-fns/locale'

interface SceneDisplayProps {
    session: GameSession
    actionLog: ActionLog[]
    lastAIResponse?: AIResponse | null
    pendingAIRequest: boolean
}

interface ActionLogItemProps {
    action: ActionLog
    isLatest: boolean
}

function ActionLogItem({ action, isLatest }: ActionLogItemProps) {
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
                return <Scroll className="h-4 w-4 text-muted-foreground" />
        }
    }

    const getActionColor = () => {
        switch (action.actionType) {
            case 'ai_response':
                return 'border-l-purple-500 bg-purple-50/5'
            case 'player_action':
                return 'border-l-blue-500 bg-blue-50/5'
            case 'dice_roll':
                return 'border-l-green-500 bg-green-50/5'
            case 'chat_message':
                return 'border-l-amber-500 bg-amber-50/5'
            default:
                return 'border-l-muted bg-muted/5'
        }
    }

    const formatTimestamp = (timestamp: string) => {
        try {
            return formatDistanceToNow(new Date(timestamp), {
                addSuffix: true,
                locale: ru
            })
        } catch {
            return 'недавно'
        }
    }

    return (
        <div className={cn(
            "p-4 border-l-4 rounded-r-lg transition-all duration-300",
            getActionColor(),
            isLatest && "ring-2 ring-purple-500/20 shadow-lg"
        )}>
            <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 mt-1">
                    {getActionIcon()}
                </div>

                <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2">
                            <Badge
                                variant="outline"
                                className={cn(
                                    "text-xs",
                                    action.actionType === 'ai_response' && "border-purple-500 text-purple-400",
                                    action.actionType === 'player_action' && "border-blue-500 text-blue-400",
                                    action.actionType === 'dice_roll' && "border-green-500 text-green-400",
                                    action.actionType === 'chat_message' && "border-amber-500 text-amber-400"
                                )}
                            >
                                {action.actionType === 'ai_response' && '🎭 Мастер'}
                                {action.actionType === 'player_action' && '👤 Игрок'}
                                {action.actionType === 'dice_roll' && '🎲 Бросок'}
                                {action.actionType === 'chat_message' && '💬 Чат'}
                            </Badge>

                            {action.metadata?.characterName && (
                                <span className="text-xs text-muted-foreground">
                  {action.metadata.characterName}
                </span>
                            )}
                        </div>

                        <div className="flex items-center space-x-1 text-xs text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            <span>{formatTimestamp(action.timestamp)}</span>
                        </div>
                    </div>

                    <div className="text-sm leading-relaxed text-foreground">
                        {action.content}
                    </div>

                    {/* Дополнительная информация */}
                    {action.actionType === 'dice_roll' && action.metadata && (
                        <div className="mt-2 flex items-center space-x-3 text-xs">
                            {action.metadata.diceType && (
                                <Badge variant="outline" className="text-xs">
                                    {action.metadata.diceType}
                                </Badge>
                            )}
                            {action.metadata.result && (
                                <span className="text-muted-foreground">
                  Результат: {action.metadata.result}
                </span>
                            )}
                            {action.metadata.modifier && action.metadata.modifier !== 0 && (
                                <span className="text-muted-foreground">
                  Модификатор: {action.metadata.modifier > 0 ? '+' : ''}{action.metadata.modifier}
                </span>
                            )}
                        </div>
                    )}

                    {/* Предложения ИИ */}
                    {action.actionType === 'ai_response' && action.metadata?.suggestions && (
                        <div className="mt-3 space-y-2">
                            <h5 className="text-xs font-medium text-muted-foreground flex items-center space-x-1">
                                <Lightbulb className="h-3 w-3" />
                                <span>Предложения:</span>
                            </h5>
                            <div className="flex flex-wrap gap-2">
                                {action.metadata.suggestions.map((suggestion: string, index: number) => (
                                    <Button
                                        key={index}
                                        variant="outline"
                                        size="sm"
                                        className="h-auto py-1 px-2 text-xs border-muted hover:border-purple-500 hover:text-purple-400"
                                        onClick={() => {
                                            // TODO: Реализовать быстрое действие
                                            console.log('Quick action:', suggestion)
                                        }}
                                    >
                                        {suggestion}
                                    </Button>
                                ))}
                            </div>
                        </div>