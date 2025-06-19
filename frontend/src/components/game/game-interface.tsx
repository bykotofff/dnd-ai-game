'use client'

// frontend/src/components/game/game-interface.tsx
import { useState, useRef, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { ChatPanel } from './chat-panel'
import { CharacterPanel } from './character-panel'
import { DiceRoller } from './dice-roller'
import { ActionLog } from './action-log'
import { SceneDisplay } from './scene-display'
import { CombatTracker } from './combat-tracker'
import { useGameStore } from '@/stores/game-store'
import { useSocket } from '@/hooks/use-socket'
import {
    Send,
    Dice6,
    User,
    MessageCircle,
    Swords,
    Eye,
    Settings,
    LogOut,
    Crown,
    Users,
    Clock,
    MapPin
} from 'lucide-react'
import { GameSession, Character } from '@/types'
import { cn } from '@/lib/utils'
import toast from 'react-hot-toast'

interface GameInterfaceProps {
    session: GameSession
    character: Character | null
    onLeaveSession: () => void
}

type PanelType = 'chat' | 'character' | 'dice' | 'log' | 'combat'

export function GameInterface({ session, character, onLeaveSession }: GameInterfaceProps) {
    const [activePanel, setActivePanel] = useState<PanelType>('chat')
    const [playerAction, setPlayerAction] = useState('')
    const [isSubmittingAction, setIsSubmittingAction] = useState(false)
    const textareaRef = useRef<HTMLTextAreaElement>(null)

    const {
        actionLog,
        combatState,
        lastAIResponse,
        pendingAIRequest,
        sendGameAction,
        rollDice,
        updateCharacter
    } = useGameStore()

    const { isConnected } = useSocket()

    // Автофокус на текстовом поле
    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.focus()
        }
    }, [])

    // Обработка отправки действия игрока
    const handleSubmitAction = async () => {
        if (!playerAction.trim() || !character || isSubmittingAction) return

        try {
            setIsSubmittingAction(true)

            await sendGameAction({
                type: 'player_action',
                playerId: character.id,
                sessionId: session.id,
                content: playerAction.trim(),
                metadata: {
                    characterName: character.name,
                    characterClass: character.class,
                    characterLevel: character.level
                }
            })

            setPlayerAction('')
            toast.success('Действие отправлено!')

            // Возвращаем фокус на поле ввода
            if (textareaRef.current) {
                textareaRef.current.focus()
            }
        } catch (error) {
            console.error('Ошибка отправки действия:', error)
            toast.error('Ошибка отправки действия')
        } finally {
            setIsSubmittingAction(false)
        }
    }

    // Обработка нажатия Enter (с Shift для новой строки)
    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            handleSubmitAction()
        }
    }

    // Быстрый бросок d20
    const handleQuickRoll = async () => {
        if (!character) return

        try {
            await rollDice({
                type: 'd20',
                modifier: 0,
                characterId: character.id,
                purpose: 'general'
            })
        } catch (error) {
            console.error('Ошибка броска кости:', error)
            toast.error('Ошибка броска кости')
        }
    }

    const panelButtons = [
        { type: 'chat' as PanelType, icon: MessageCircle, label: 'Чат', color: 'text-blue-500' },
        { type: 'character' as PanelType, icon: User, label: 'Персонаж', color: 'text-green-500' },
        { type: 'dice' as PanelType, icon: Dice6, label: 'Кости', color: 'text-purple-500' },
        { type: 'log' as PanelType, icon: Eye, label: 'Журнал', color: 'text-amber-500' },
        ...(session.worldState?.inCombat ? [{ type: 'combat' as PanelType, icon: Swords, label: 'Бой', color: 'text-red-500' }] : [])
    ]

    return (
        <div className="h-screen flex flex-col">
            {/* Заголовок игры */}
            <div className="bg-slate-800/90 backdrop-blur-sm border-b border-slate-700 p-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                        <div className="flex items-center space-x-2">
                            <Crown className="h-6 w-6 text-amber-500" />
                            <h1 className="text-xl font-bold text-white">{session.name}</h1>
                        </div>

                        {session.worldState && (
                            <div className="flex items-center space-x-4 text-sm">
                                {session.worldState.currentLocation && (
                                    <div className="flex items-center space-x-1 text-muted-foreground">
                                        <MapPin className="h-4 w-4" />
                                        <span>{session.worldState.currentLocation}</span>
                                    </div>
                                )}

                                {session.worldState.timeOfDay && (
                                    <div className="flex items-center space-x-1 text-muted-foreground">
                                        <Clock className="h-4 w-4" />
                                        <span className="capitalize">
                      {session.worldState.timeOfDay === 'morning' && 'Утро'}
                                            {session.worldState.timeOfDay === 'afternoon' && 'День'}
                                            {session.worldState.timeOfDay === 'evening' && 'Вечер'}
                                            {session.worldState.timeOfDay === 'night' && 'Ночь'}
                    </span>
                                    </div>
                                )}

                                {session.worldState.inCombat && (
                                    <Badge className="bg-red-500/20 text-red-400 border-red-500/30">
                                        <Swords className="h-3 w-3 mr-1" />
                                        Бой {session.worldState.combatRound && `(раунд ${session.worldState.combatRound})`}
                                    </Badge>
                                )}
                            </div>
                        )}
                    </div>

                    <div className="flex items-center space-x-3">
                        {character && (
                            <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                                <User className="h-4 w-4" />
                                <span>{character.name}</span>
                                <Badge variant="outline" className="text-xs">
                                    Ур. {character.level}
                                </Badge>
                            </div>
                        )}

                        <div className="flex items-center space-x-2">
                            <Button variant="ghost" size="sm">
                                <Settings className="h-4 w-4" />
                            </Button>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={onLeaveSession}
                                className="text-red-400 hover:text-red-300"
                            >
                                <LogOut className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Основной контент */}
            <div className="flex-1 flex">
                {/* Левая панель - Сцена и действия */}
                <div className="flex-1 flex flex-col">
                    {/* Отображение сцены */}
                    <div className="flex-1 p-4">
                        <SceneDisplay
                            session={session}
                            actionLog={actionLog}
                            lastAIResponse={lastAIResponse}
                            pendingAIRequest={pendingAIRequest}
                        />
                    </div>

                    {/* Панель ввода действий */}
                    <div className="p-4 bg-slate-800/50 backdrop-blur-sm border-t border-slate-700">
                        <div className="space-y-3">
                            {/* Индикатор ожидания ответа ИИ */}
                            {pendingAIRequest && (
                                <div className="flex items-center space-x-2 text-sm text-amber-400">
                                    <div className="animate-pulse w-2 h-2 bg-amber-400 rounded-full" />
                                    <span>Мастер думает...</span>
                                </div>
                            )}

                            {/* Поле ввода */}
                            <div className="flex space-x-3">
                                <div className="flex-1">
                                    <Textarea
                                        ref={textareaRef}
                                        value={playerAction}
                                        onChange={(e) => setPlayerAction(e.target.value)}
                                        onKeyDown={handleKeyDown}
                                        placeholder={character
                                            ? `Что делает ${character.name}?`
                                            : "Опишите действие вашего персонажа..."
                                        }
                                        rows={2}
                                        className="resize-none bg-slate-700/50 border-slate-600 text-white placeholder-slate-400"
                                        disabled={!character || !isConnected || isSubmittingAction}
                                    />
                                </div>

                                <div className="flex flex-col space-y-2">
                                    <Button
                                        onClick={handleSubmitAction}
                                        disabled={!playerAction.trim() || !character || !isConnected || isSubmittingAction}
                                        className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                                    >
                                        <Send className="h-4 w-4" />
                                    </Button>

                                    <Button
                                        variant="outline"
                                        onClick={handleQuickRoll}
                                        disabled={!character || !isConnected}
                                        className="border-slate-600 text-slate-300 hover:bg-slate-700"
                                    >
                                        <Dice6 className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>

                            {/* Подсказка */}
                            <div className="text-xs text-muted-foreground">
                                {character ? (
                                    <>Enter - отправить, Shift+Enter - новая строка</>
                                ) : (
                                    <>Выберите персонажа для участия в игре</>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Правая панель */}
                <div className="w-80 border-l border-slate-700 bg-slate-800/30 backdrop-blur-sm flex flex-col">
                    {/* Переключатели панелей */}
                    <div className="flex border-b border-slate-700">
                        {panelButtons.map((panel) => {
                            const Icon = panel.icon
                            return (
                                <button
                                    key={panel.type}
                                    onClick={() => setActivePanel(panel.type)}
                                    className={cn(
                                        "flex-1 flex items-center justify-center space-x-1 p-3 text-sm font-medium transition-colors",
                                        activePanel === panel.type
                                            ? "bg-slate-700 text-white border-b-2 border-purple-500"
                                            : "text-slate-400 hover:text-white hover:bg-slate-700/50"
                                    )}
                                >
                                    <Icon className={cn("h-4 w-4", activePanel === panel.type && panel.color)} />
                                    <span className="hidden sm:inline">{panel.label}</span>
                                </button>
                            )
                        })}
                    </div>

                    {/* Содержимое панели */}
                    <div className="flex-1 overflow-hidden">
                        {activePanel === 'chat' && <ChatPanel />}
                        {activePanel === 'character' && <CharacterPanel character={character} />}
                        {activePanel === 'dice' && <DiceRoller character={character} />}
                        {activePanel === 'log' && <ActionLog actionLog={actionLog} />}
                        {activePanel === 'combat' && combatState && <CombatTracker combatState={combatState} />}
                    </div>
                </div>
            </div>
        </div>
    )
}