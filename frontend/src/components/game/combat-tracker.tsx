// frontend/src/components/game/combat-tracker.tsx
import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
    Swords,
    Clock,
    Crown,
    Heart,
    Shield,
    Zap,
    SkipForward,
    Pause,
    Play,
    RotateCcw,
    AlertTriangle,
    Target,
    Eye,
    Settings
} from 'lucide-react'
import { CombatState, InitiativeEntry } from '@/types'
import { cn } from '@/lib/utils'
import { useGameStore } from '@/stores/game-store'
import toast from 'react-hot-toast'

interface CombatTrackerProps {
    combatState: CombatState
}

interface InitiativeItemProps {
    entry: InitiativeEntry
    isActive: boolean
    round: number
    onUpdateHP: (characterId: string, newHP: number) => void
    onAddCondition: (characterId: string, condition: string) => void
    onRemoveCondition: (characterId: string, condition: string) => void
}

// Состояния D&D 5e
const COMBAT_CONDITIONS = [
    { id: 'blinded', name: 'Ослеплён', color: 'bg-gray-500', description: 'Не может видеть, атаки с помехой' },
    { id: 'charmed', name: 'Очарован', color: 'bg-pink-500', description: 'Не может атаковать очаровавшего' },
    { id: 'deafened', name: 'Оглушён', color: 'bg-yellow-500', description: 'Не может слышать, провал проверок слуха' },
    { id: 'frightened', name: 'Напуган', color: 'bg-orange-500', description: 'Помеха на броски атак и проверки способностей' },
    { id: 'grappled', name: 'Схвачен', color: 'bg-brown-500', description: 'Скорость становится 0' },
    { id: 'incapacitated', name: 'Недееспособен', color: 'bg-red-500', description: 'Не может совершать действия или реакции' },
    { id: 'invisible', name: 'Невидим', color: 'bg-blue-500', description: 'Не может быть замечен без магии' },
    { id: 'paralyzed', name: 'Парализован', color: 'bg-purple-500', description: 'Недееспособен и не может двигаться' },
    { id: 'petrified', name: 'Окаменел', color: 'bg-gray-600', description: 'Превращён в неживую субстанцию' },
    { id: 'poisoned', name: 'Отравлен', color: 'bg-green-500', description: 'Помеха на броски атак и проверки способностей' },
    { id: 'prone', name: 'Сбит с ног', color: 'bg-amber-500', description: 'Помеха на атаки дальнего боя против него' },
    { id: 'restrained', name: 'Опутан', color: 'bg-indigo-500', description: 'Скорость 0, помеха на атаки и ловкость' },
    { id: 'stunned', name: 'Ошеломлён', color: 'bg-red-600', description: 'Недееспособен, провал спасбросков Силы и Ловкости' },
    { id: 'unconscious', name: 'Без сознания', color: 'bg-black', description: 'Недееспособен, не может двигаться или говорить' }
]

function InitiativeItem({
                            entry,
                            isActive,
                            round,
                            onUpdateHP,
                            onAddCondition,
                            onRemoveCondition
                        }: InitiativeItemProps) {
    const [showDetails, setShowDetails] = useState(false)
    const [tempHP, setTempHP] = useState('')

    const healthPercent = entry.character ? (entry.character.currentHP / entry.character.maxHP) * 100 : 100
    const conditions = entry.conditions || []

    const getHealthColor = () => {
        if (healthPercent > 75) return 'bg-green-500'
        if (healthPercent > 50) return 'bg-yellow-500'
        if (healthPercent > 25) return 'bg-orange-500'
        return 'bg-red-500'
    }

    const handleHPChange = () => {
        if (!entry.character || !tempHP) return

        const newHP = parseInt(tempHP)
        if (isNaN(newHP)) return

        onUpdateHP(entry.character.id, Math.max(0, Math.min(newHP, entry.character.maxHP)))
        setTempHP('')
        toast.success('Здоровье обновлено')
    }

    return (
        <div className={cn(
            "p-3 rounded-lg border transition-all duration-200",
            isActive
                ? "border-amber-500 bg-amber-50/10 shadow-lg ring-2 ring-amber-500/20"
                : "border-muted bg-muted/5 hover:bg-muted/10"
        )}>
            <div className="space-y-3">
                {/* Основная информация */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                        {/* Индикатор активного хода */}
                        {isActive && (
                            <div className="w-3 h-3 bg-amber-500 rounded-full animate-pulse" />
                        )}

                        {/* Имя и инициатива */}
                        <div>
                            <div className="flex items-center space-x-2">
                                <h4 className={cn(
                                    "font-semibold",
                                    isActive && "text-amber-400"
                                )}>
                                    {entry.name}
                                </h4>
                                {entry.isNPC && (
                                    <Badge variant="outline" className="text-xs">
                                        NPC
                                    </Badge>
                                )}
                            </div>
                            <div className="text-xs text-muted-foreground">
                                Инициатива: {entry.initiative}
                            </div>
                        </div>
                    </div>

                    {/* Статусы */}
                    <div className="flex items-center space-x-2">
                        {conditions.length > 0 && (
                            <div className="flex space-x-1">
                                {conditions.slice(0, 3).map((condition) => {
                                    const conditionData = COMBAT_CONDITIONS.find(c => c.id === condition)
                                    return (
                                        <div
                                            key={condition}
                                            className={cn(
                                                "w-2 h-2 rounded-full",
                                                conditionData?.color || "bg-gray-500"
                                            )}
                                            title={conditionData?.name || condition}
                                        />
                                    )
                                })}
                                {conditions.length > 3 && (
                                    <div className="text-xs text-muted-foreground">
                                        +{conditions.length - 3}
                                    </div>
                                )}
                            </div>
                        )}

                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setShowDetails(!showDetails)}
                            className="h-6 w-6 p-0"
                        >
                            <Eye className="h-3 w-3" />
                        </Button>
                    </div>
                </div>

                {/* Здоровье */}
                {entry.character && (
                    <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                            <span>Здоровье</span>
                            <span className="font-mono">
                {entry.character.currentHP}/{entry.character.maxHP}
                                {entry.character.temporaryHP > 0 && (
                                    <span className="text-blue-400 ml-1">
                    (+{entry.character.temporaryHP})
                  </span>
                                )}
              </span>
                        </div>
                        <Progress value={healthPercent} className="h-2" />

                        {/* Быстрое изменение HP */}
                        {showDetails && (
                            <div className="flex items-center space-x-2">
                                <input
                                    type="number"
                                    value={tempHP}
                                    onChange={(e) => setTempHP(e.target.value)}
                                    placeholder="Новое HP"
                                    className="flex-1 h-6 px-2 text-xs bg-slate-700 border border-slate-600 rounded text-white"
                                    min="0"
                                    max={entry.character.maxHP}
                                />
                                <Button
                                    size="sm"
                                    onClick={handleHPChange}
                                    disabled={!tempHP}
                                    className="h-6 text-xs px-2"
                                >
                                    Обновить
                                </Button>
                            </div>
                        )}
                    </div>
                )}

                {/* Детальная информация */}
                {showDetails && (
                    <div className="pt-2 border-t border-muted space-y-3">
                        {/* Характеристики */}
                        {entry.character && (
                            <div className="grid grid-cols-3 gap-2 text-xs">
                                <div className="text-center p-1 bg-muted rounded">
                                    <div className="text-muted-foreground">КБ</div>
                                    <div className="font-bold">{entry.character.armorClass}</div>
                                </div>
                                <div className="text-center p-1 bg-muted rounded">
                                    <div className="text-muted-foreground">Скорость</div>
                                    <div className="font-bold">{entry.character.speed} фт</div>
                                </div>
                                <div className="text-center p-1 bg-muted rounded">
                                    <div className="text-muted-foreground">Уровень</div>
                                    <div className="font-bold">{entry.character.level}</div>
                                </div>
                            </div>
                        )}

                        {/* Состояния */}
                        <div>
                            <h5 className="text-xs font-medium mb-2">Состояния</h5>
                            {conditions.length > 0 ? (
                                <div className="flex flex-wrap gap-1">
                                    {conditions.map((condition) => {
                                        const conditionData = COMBAT_CONDITIONS.find(c => c.id === condition)
                                        return (
                                            <Badge
                                                key={condition}
                                                variant="outline"
                                                className="text-xs cursor-pointer hover:bg-red-100"
                                                onClick={() => onRemoveCondition(entry.character?.id || entry.name, condition)}
                                                title={`${conditionData?.name}: ${conditionData?.description}`}
                                            >
                                                {conditionData?.name || condition}
                                                <span className="ml-1">×</span>
                                            </Badge>
                                        )
                                    })}
                                </div>
                            ) : (
                                <p className="text-xs text-muted-foreground">Нет активных состояний</p>
                            )}

                            {/* Добавление состояния */}
                            <div className="mt-2 flex flex-wrap gap-1">
                                {COMBAT_CONDITIONS.filter(c => !conditions.includes(c.id)).slice(0, 4).map((condition) => (
                                    <Button
                                        key={condition.id}
                                        variant="outline"
                                        size="sm"
                                        onClick={() => onAddCondition(entry.character?.id || entry.name, condition.id)}
                                        className="h-5 text-xs px-2"
                                        title={condition.description}
                                    >
                                        +{condition.name}
                                    </Button>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}

export function CombatTracker({ combatState }: CombatTrackerProps) {
    const [isPaused, setIsPaused] = useState(false)
    const [showSettings, setShowSettings] = useState(false)

    const {
        nextTurn,
        endCombat,
        updateCharacterHP,
        addCondition,
        removeCondition,
        isLoading
    } = useGameStore()

    const currentEntry = combatState.initiativeOrder[combatState.currentTurn] || null
    const totalParticipants = combatState.initiativeOrder.length

    const handleNextTurn = async () => {
        try {
            await nextTurn()
            toast.success('Ход передан')
        } catch (error) {
            console.error('Ошибка перехода хода:', error)
            toast.error('Ошибка перехода хода')
        }
    }

    const handleEndCombat = async () => {
        try {
            await endCombat()
            toast.success('Бой завершён')
        } catch (error) {
            console.error('Ошибка завершения боя:', error)
            toast.error('Ошибка завершения боя')
        }
    }

    const handleUpdateHP = async (characterId: string, newHP: number) => {
        try {
            await updateCharacterHP(characterId, { currentHP: newHP })
        } catch (error) {
            console.error('Ошибка обновления здоровья:', error)
            toast.error('Ошибка обновления здоровья')
        }
    }

    const handleAddCondition = async (characterId: string, condition: string) => {
        try {
            await addCondition(characterId, condition)
            toast.success('Состояние добавлено')
        } catch (error) {
            console.error('Ошибка добавления состояния:', error)
            toast.error('Ошибка добавления состояния')
        }
    }

    const handleRemoveCondition = async (characterId: string, condition: string) => {
        try {
            await removeCondition(characterId, condition)
            toast.success('Состояние удалено')
        } catch (error) {
            console.error('Ошибка удаления состояния:', error)
            toast.error('Ошибка удаления состояния')
        }
    }

    return (
        <div className="h-full flex flex-col">
            <CardHeader className="pb-3 border-b border-slate-700">
                <div className="flex items-center justify-between">
                    <CardTitle className="text-sm flex items-center space-x-2">
                        <Swords className="h-4 w-4 text-red-500" />
                        <span>Трекер боя</span>
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
                    </div>
                </div>

                {/* Информация о раунде */}
                <div className="flex items-center justify-between pt-2">
                    <div className="flex items-center space-x-4 text-sm">
                        <div className="flex items-center space-x-1">
                            <Clock className="h-4 w-4 text-amber-500" />
                            <span>Раунд {combatState.round}</span>
                        </div>

                        <div className="flex items-center space-x-1">
                            <Crown className="h-4 w-4 text-blue-500" />
                            <span>
                Ход {combatState.currentTurn + 1} из {totalParticipants}
              </span>
                        </div>
                    </div>

                    {currentEntry && (
                        <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30">
                            {currentEntry.name}
                        </Badge>
                    )}
                </div>

                {/* Панель управления */}
                {showSettings && (
                    <div className="pt-3 space-y-3">
                        <div className="flex items-center space-x-2">
                            <Button
                                size="sm"
                                onClick={() => setIsPaused(!isPaused)}
                                variant={isPaused ? "default" : "outline"}
                                className="flex items-center space-x-1"
                            >
                                {isPaused ? <Play className="h-3 w-3" /> : <Pause className="h-3 w-3" />}
                                <span>{isPaused ? 'Продолжить' : 'Пауза'}</span>
                            </Button>

                            <Button
                                size="sm"
                                onClick={handleEndCombat}
                                variant="outline"
                                className="text-red-400 border-red-500 hover:bg-red-500/10"
                                disabled={isLoading}
                            >
                                <AlertTriangle className="h-3 w-3 mr-1" />
                                Завершить бой
                            </Button>
                        </div>

                        {/* Быстрые действия */}
                        <div className="grid grid-cols-2 gap-2">
                            <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                    // TODO: Реализовать добавление участника
                                    toast.info('Функция в разработке')
                                }}
                                className="text-xs"
                            >
                                <Target className="h-3 w-3 mr-1" />
                                Добавить NPC
                            </Button>

                            <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                    // TODO: Реализовать пересчет инициативы
                                    toast.info('Функция в разработке')
                                }}
                                className="text-xs"
                            >
                                <RotateCcw className="h-3 w-3 mr-1" />
                                Пересчитать
                            </Button>
                        </div>
                    </div>
                )}
            </CardHeader>

            <CardContent className="flex-1 p-0 overflow-hidden">
                <ScrollArea className="h-full">
                    <div className="p-3 space-y-3">
                        {combatState.initiativeOrder.map((entry, index) => (
                            <InitiativeItem
                                key={`${entry.name}-${entry.initiative}`}
                                entry={entry}
                                isActive={index === combatState.currentTurn}
                                round={combatState.round}
                                onUpdateHP={handleUpdateHP}
                                onAddCondition={handleAddCondition}
                                onRemoveCondition={handleRemoveCondition}
                            />
                        ))}
                    </div>
                </ScrollArea>
            </CardContent>

            {/* Управление ходом */}
            <div className="p-3 border-t border-slate-700">
                <div className="space-y-3">
                    {/* Текущий ход */}
                    {currentEntry && (
                        <div className="text-center p-2 bg-amber-500/10 border border-amber-500/20 rounded">
                            <p className="text-sm font-medium text-amber-400">
                                Ход игрока: {currentEntry.name}
                            </p>
                            {currentEntry.character && (
                                <p className="text-xs text-muted-foreground">
                                    {currentEntry.character.class} {currentEntry.character.level} уровня
                                </p>
                            )}
                        </div>
                    )}

                    {/* Кнопка следующего хода */}
                    <Button
                        onClick={handleNextTurn}
                        disabled={isPaused || isLoading}
                        className="w-full bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700"
                    >
                        <SkipForward className="h-4 w-4 mr-2" />
                        {combatState.currentTurn === totalParticipants - 1
                            ? `Следующий раунд (${combatState.round + 1})`
                            : 'Следующий ход'
                        }
                    </Button>

                    {/* Статистика раунда */}
                    <div className="grid grid-cols-3 gap-2 text-xs text-muted-foreground">
                        <div className="text-center">
                            <div className="font-medium">{combatState.round}</div>
                            <div>Раунд</div>
                        </div>
                        <div className="text-center">
                            <div className="font-medium">{combatState.currentTurn + 1}</div>
                            <div>Ход</div>
                        </div>
                        <div className="text-center">
                            <div className="font-medium">{totalParticipants}</div>
                            <div>Участников</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}