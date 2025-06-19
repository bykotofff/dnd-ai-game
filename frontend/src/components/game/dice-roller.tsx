'use client'

// frontend/src/components/game/dice-roller.tsx
import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
    Dice1,
    Dice2,
    Dice3,
    Dice4,
    Dice5,
    Dice6,
    Plus,
    Minus,
    TrendingUp,
    TrendingDown,
    RotateCcw,
    Star,
    Activity,
    Zap
} from 'lucide-react'
import { Character, DiceRoll } from '@/types'
import { useGameStore } from '@/stores/game-store'
import { cn } from '@/lib/utils'
import toast from 'react-hot-toast'

interface DiceRollerProps {
    character: Character | null
}

type DiceType = 'd4' | 'd6' | 'd8' | 'd10' | 'd12' | 'd20' | 'd100'
type RollType = 'normal' | 'advantage' | 'disadvantage'

interface DiceConfig {
    type: DiceType
    count: number
    modifier: number
    rollType: RollType
    purpose: string
}

const DICE_TYPES: { type: DiceType; sides: number; color: string; icon: any }[] = [
    { type: 'd4', sides: 4, color: 'from-red-500 to-red-600', icon: Dice1 },
    { type: 'd6', sides: 6, color: 'from-orange-500 to-orange-600', icon: Dice2 },
    { type: 'd8', sides: 8, color: 'from-yellow-500 to-yellow-600', icon: Dice3 },
    { type: 'd10', sides: 10, color: 'from-green-500 to-green-600', icon: Dice4 },
    { type: 'd12', sides: 12, color: 'from-blue-500 to-blue-600', icon: Dice5 },
    { type: 'd20', sides: 20, color: 'from-purple-500 to-purple-600', icon: Dice6 },
    { type: 'd100', sides: 100, color: 'from-pink-500 to-pink-600', icon: Star }
]

const COMMON_ROLLS = [
    { name: 'Атака', dice: 'd20', purpose: 'attack' },
    { name: 'Урон', dice: 'd8', purpose: 'damage' },
    { name: 'Проверка навыка', dice: 'd20', purpose: 'skill_check' },
    { name: 'Спасбросок', dice: 'd20', purpose: 'saving_throw' },
    { name: 'Инициатива', dice: 'd20', purpose: 'initiative' },
    { name: 'Лечение', dice: 'd4', purpose: 'healing' }
]

const SKILL_MODIFIERS: Record<string, keyof Character['abilityScores']> = {
    'acrobatics': 'dexterity',
    'animalHandling': 'wisdom',
    'arcana': 'intelligence',
    'athletics': 'strength',
    'deception': 'charisma',
    'history': 'intelligence',
    'insight': 'wisdom',
    'intimidation': 'charisma',
    'investigation': 'intelligence',
    'medicine': 'wisdom',
    'nature': 'intelligence',
    'perception': 'wisdom',
    'performance': 'charisma',
    'persuasion': 'charisma',
    'religion': 'intelligence',
    'sleightOfHand': 'dexterity',
    'stealth': 'dexterity',
    'survival': 'wisdom'
}

function DiceAnimation({ isRolling, result }: { isRolling: boolean; result?: number }) {
    const [animationStage, setAnimationStage] = useState(0)

    useEffect(() => {
        if (isRolling) {
            const interval = setInterval(() => {
                setAnimationStage((prev) => (prev + 1) % 6)
            }, 100)

            return () => clearInterval(interval)
        }
    }, [isRolling])

    if (!isRolling && result !== undefined) {
        return (
            <div className="text-4xl font-bold text-center text-green-400 animate-bounce">
                {result}
            </div>
        )
    }

    if (isRolling) {
        return (
            <div className="text-2xl animate-spin">
                🎲
            </div>
        )
    }

    return (
        <div className="text-2xl text-muted-foreground">
            🎲
        </div>
    )
}

function QuickRolls({ character, onRoll }: {
    character: Character | null
    onRoll: (config: DiceConfig) => void
}) {
    const getAbilityModifier = (ability: keyof Character['abilityScores']) => {
        if (!character) return 0
        return Math.floor((character.abilityScores[ability] - 10) / 2)
    }

    const getProficiencyBonus = () => {
        if (!character) return 0
        return Math.ceil(character.level / 4) + 1 // Стандартный бонус мастерства D&D 5e
    }

    const getSkillModifier = (skill: string) => {
        if (!character) return 0

        const ability = SKILL_MODIFIERS[skill]
        if (!ability) return 0

        const abilityMod = getAbilityModifier(ability)
        const proficiencyMod = character.skills?.[skill]?.proficient ? getProficiencyBonus() : 0
        const expertiseMod = character.skills?.[skill]?.expertise ? getProficiencyBonus() : 0

        return abilityMod + proficiencyMod + expertiseMod
    }

    return (
        <div className="space-y-4">
            {/* Стандартные броски */}
            <div>
                <h4 className="text-sm font-medium mb-2 flex items-center">
                    <Zap className="h-4 w-4 mr-1 text-amber-500" />
                    Быстрые броски
                </h4>
                <div className="grid grid-cols-2 gap-2">
                    {COMMON_ROLLS.map((roll) => {
                        let modifier = 0

                        if (character) {
                            switch (roll.purpose) {
                                case 'attack':
                                    modifier = getAbilityModifier('strength') + getProficiencyBonus()
                                    break
                                case 'initiative':
                                    modifier = getAbilityModifier('dexterity')
                                    break
                                case 'skill_check':
                                    modifier = getAbilityModifier('wisdom')
                                    break
                                case 'saving_throw':
                                    modifier = getAbilityModifier('constitution')
                                    break
                            }
                        }

                        return (
                            <Button
                                key={roll.name}
                                variant="outline"
                                size="sm"
                                onClick={() => onRoll({
                                    type: roll.dice as DiceType,
                                    count: 1,
                                    modifier,
                                    rollType: 'normal',
                                    purpose: roll.purpose
                                })}
                                className="h-auto py-2 px-3 text-xs flex flex-col space-y-1"
                                disabled={!character}
                            >
                                <span className="font-medium">{roll.name}</span>
                                <span className="text-muted-foreground">
                  {roll.dice}{modifier !== 0 ? (modifier >= 0 ? `+${modifier}` : modifier) : ''}
                </span>
                            </Button>
                        )
                    })}
                </div>
            </div>

            {/* Проверки характеристик */}
            {character && (
                <div>
                    <h4 className="text-sm font-medium mb-2 flex items-center">
                        <Activity className="h-4 w-4 mr-1 text-blue-500" />
                        Проверки характеристик
                    </h4>
                    <div className="grid grid-cols-2 gap-2">
                        {Object.entries(character.abilityScores).map(([ability, score]) => {
                            const modifier = getAbilityModifier(ability as keyof Character['abilityScores'])
                            const abilityNames: Record<string, string> = {
                                strength: 'Сила',
                                dexterity: 'Ловкость',
                                constitution: 'Телосложение',
                                intelligence: 'Интеллект',
                                wisdom: 'Мудрость',
                                charisma: 'Харизма'
                            }

                            return (
                                <Button
                                    key={ability}
                                    variant="outline"
                                    size="sm"
                                    onClick={() => onRoll({
                                        type: 'd20',
                                        count: 1,
                                        modifier,
                                        rollType: 'normal',
                                        purpose: `${ability}_check`
                                    })}
                                    className="h-auto py-2 px-2 text-xs flex flex-col space-y-1"
                                >
                                    <span className="font-medium">{abilityNames[ability]}</span>
                                    <span className="text-muted-foreground">
                    d20{modifier >= 0 ? `+${modifier}` : modifier}
                  </span>
                                </Button>
                            )
                        })}
                    </div>
                </div>
            )}

            {/* Навыки */}
            {character && Object.keys(character.skills || {}).length > 0 && (
                <div>
                    <h4 className="text-sm font-medium mb-2 flex items-center">
                        <Star className="h-4 w-4 mr-1 text-green-500" />
                        Навыки персонажа
                    </h4>
                    <ScrollArea className="h-32">
                        <div className="grid grid-cols-1 gap-1">
                            {Object.entries(character.skills || {}).map(([skill, skillData]) => {
                                if (!skillData.proficient) return null

                                const modifier = getSkillModifier(skill)
                                const skillNames: Record<string, string> = {
                                    'acrobatics': 'Акробатика',
                                    'animalHandling': 'Обращение с животными',
                                    'arcana': 'Магия',
                                    'athletics': 'Атлетика',
                                    'deception': 'Обман',
                                    'history': 'История',
                                    'insight': 'Проницательность',
                                    'intimidation': 'Запугивание',
                                    'investigation': 'Расследование',
                                    'medicine': 'Медицина',
                                    'nature': 'Природа',
                                    'perception': 'Восприятие',
                                    'performance': 'Выступление',
                                    'persuasion': 'Убеждение',
                                    'religion': 'Религия',
                                    'sleightOfHand': 'Ловкость рук',
                                    'stealth': 'Скрытность',
                                    'survival': 'Выживание'
                                }

                                return (
                                    <Button
                                        key={skill}
                                        variant="outline"
                                        size="sm"
                                        onClick={() => onRoll({
                                            type: 'd20',
                                            count: 1,
                                            modifier,
                                            rollType: 'normal',
                                            purpose: `${skill}_check`
                                        })}
                                        className="h-auto py-1 px-2 text-xs justify-between"
                                    >
                                        <span className="font-medium">{skillNames[skill] || skill}</span>
                                        <div className="flex items-center space-x-1">
                                            {skillData.expertise && (
                                                <Star className="h-3 w-3 text-amber-400" />
                                            )}
                                            <span className="text-muted-foreground">
                        +{modifier}
                      </span>
                                        </div>
                                    </Button>
                                )
                            })}
                        </div>
                    </ScrollArea>
                </div>
            )}
        </div>
    )
}

function RollHistory({ rolls }: { rolls: DiceRoll[] }) {
    if (rolls.length === 0) {
        return (
            <div className="text-center py-8">
                <Dice6 className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">История бросков пуста</p>
            </div>
        )
    }

    return (
        <ScrollArea className="h-40">
            <div className="space-y-2">
                {rolls.slice(-10).reverse().map((roll) => {
                    const isCritical = roll.type === 'd20' && (roll.result === 20 || roll.result === 1)
                    const isSuccess = roll.type === 'd20' && roll.result >= 15

                    return (
                        <div
                            key={roll.id}
                            className={cn(
                                "p-2 rounded border-l-4 text-xs",
                                isCritical && roll.result === 20 && "border-l-green-500 bg-green-50/5",
                                isCritical && roll.result === 1 && "border-l-red-500 bg-red-50/5",
                                !isCritical && isSuccess && "border-l-blue-500 bg-blue-50/5",
                                !isCritical && !isSuccess && "border-l-muted bg-muted/5"
                            )}
                        >
                            <div className="flex items-center justify-between mb-1">
                                <div className="flex items-center space-x-2">
                                    <Badge variant="outline" className="text-xs">
                                        {roll.type}
                                    </Badge>
                                    {roll.advantage && (
                                        <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300 text-xs">
                                            Преимущество
                                        </Badge>
                                    )}
                                    {roll.disadvantage && (
                                        <Badge className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300 text-xs">
                                            Помеха
                                        </Badge>
                                    )}
                                    {isCritical && (
                                        <Badge className={cn(
                                            "text-xs",
                                            roll.result === 20 ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300" :
                                                "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300"
                                        )}>
                                            {roll.result === 20 ? 'Крит!' : 'Провал!'}
                                        </Badge>
                                    )}
                                </div>

                                <span className="font-mono font-bold">
                  {roll.total}
                </span>
                            </div>

                            <div className="text-muted-foreground">
                                {roll.result}{roll.modifier !== 0 && ` ${roll.modifier >= 0 ? '+' : ''}${roll.modifier}`} = {roll.total}
                            </div>
                        </div>
                    )
                })}
            </div>
        </ScrollArea>
    )
}

export function DiceRoller({ character }: DiceRollerProps) {
    const [diceConfig, setDiceConfig] = useState<DiceConfig>({
        type: 'd20',
        count: 1,
        modifier: 0,
        rollType: 'normal',
        purpose: 'general'
    })
    const [isRolling, setIsRolling] = useState(false)
    const [lastResult, setLastResult] = useState<number | null>(null)
    const [customPurpose, setCustomPurpose] = useState('')

    const {
        recentDiceRolls,
        rollDice,
        isLoading
    } = useGameStore()

    const rollDiceAction = async (config: DiceConfig = diceConfig) => {
        if (!character || isRolling || isLoading) return

        setIsRolling(true)
        setLastResult(null)

        try {
            // Симуляция анимации броска
            await new Promise(resolve => setTimeout(resolve, 1000))

            const result = await rollDice({
                type: config.type,
                modifier: config.modifier,
                characterId: character.id,
                purpose: config.purpose,
                advantage: config.rollType === 'advantage',
                disadvantage: config.rollType === 'disadvantage'
            })

            setLastResult(result.total)
            toast.success(`Бросок ${config.type}: ${result.total}!`)
        } catch (error) {
            console.error('Ошибка броска кости:', error)
            toast.error('Ошибка броска кости')
        } finally {
            setIsRolling(false)
        }
    }

    const selectedDice = DICE_TYPES.find(d => d.type === diceConfig.type)!

    return (
        <div className="h-full flex flex-col">
            <CardHeader className="pb-3 border-b border-slate-700">
                <CardTitle className="text-sm flex items-center space-x-2">
                    <Dice6 className="h-4 w-4 text-purple-500" />
                    <span>Броски костей</span>
                </CardTitle>
            </CardHeader>

            <CardContent className="flex-1 p-3 space-y-4 overflow-hidden">
                {!character ? (
                    <div className="flex flex-col items-center justify-center h-full text-center">
                        <Activity className="h-12 w-12 text-muted-foreground mb-4" />
                        <h3 className="text-sm font-semibold mb-2">Персонаж не выбран</h3>
                        <p className="text-xs text-muted-foreground">
                            Выберите персонажа для бросков костей
                        </p>
                    </div>
                ) : (
                    <>
                        {/* Основной бросок */}
                        <div className="space-y-4">
                            {/* Визуализация кости */}
                            <div className="text-center space-y-3">
                                <div className={cn(
                                    "w-20 h-20 mx-auto rounded-xl flex items-center justify-center bg-gradient-to-br",
                                    selectedDice.color,
                                    "shadow-lg"
                                )}>
                                    <DiceAnimation isRolling={isRolling} result={lastResult || undefined} />
                                </div>

                                <div className="text-sm text-muted-foreground">
                                    {diceConfig.count}x{diceConfig.type}
                                    {diceConfig.modifier !== 0 && (
                                        <span> {diceConfig.modifier >= 0 ? '+' : ''}{diceConfig.modifier}</span>
                                    )}
                                </div>
                            </div>

                            {/* Выбор типа кости */}
                            <div>
                                <label className="text-xs font-medium text-muted-foreground mb-2 block">
                                    Тип кости
                                </label>
                                <div className="grid grid-cols-4 gap-2">
                                    {DICE_TYPES.map((dice) => {
                                        const Icon = dice.icon
                                        return (
                                            <Button
                                                key={dice.type}
                                                variant={diceConfig.type === dice.type ? 'default' : 'outline'}
                                                size="sm"
                                                onClick={() => setDiceConfig(prev => ({ ...prev, type: dice.type }))}
                                                className={cn(
                                                    "h-auto py-2 flex flex-col space-y-1",
                                                    diceConfig.type === dice.type && `bg-gradient-to-br ${dice.color} hover:opacity-90`
                                                )}
                                            >
                                                <Icon className="h-4 w-4" />
                                                <span className="text-xs">{dice.type}</span>
                                            </Button>
                                        )
                                    })}
                                </div>
                            </div>

                            {/* Модификаторы */}
                            <div className="space-y-3">
                                <div>
                                    <label className="text-xs font-medium text-muted-foreground mb-2 block">
                                        Модификатор
                                    </label>
                                    <div className="flex items-center space-x-2">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => setDiceConfig(prev => ({ ...prev, modifier: prev.modifier - 1 }))}
                                            className="h-8 w-8 p-0"
                                        >
                                            <Minus className="h-3 w-3" />
                                        </Button>
                                        <Input
                                            type="number"
                                            value={diceConfig.modifier}
                                            onChange={(e) => setDiceConfig(prev => ({ ...prev, modifier: parseInt(e.target.value) || 0 }))}
                                            className="flex-1 h-8 text-center bg-slate-700/50 border-slate-600"
                                        />
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => setDiceConfig(prev => ({ ...prev, modifier: prev.modifier + 1 }))}
                                            className="h-8 w-8 p-0"
                                        >
                                            <Plus className="h-3 w-3" />
                                        </Button>
                                    </div>
                                </div>

                                {/* Преимущество/Помеха */}
                                {diceConfig.type === 'd20' && (
                                    <div>
                                        <label className="text-xs font-medium text-muted-foreground mb-2 block">
                                            Тип броска
                                        </label>
                                        <div className="grid grid-cols-3 gap-1">
                                            <Button
                                                variant={diceConfig.rollType === 'normal' ? 'default' : 'outline'}
                                                size="sm"
                                                onClick={() => setDiceConfig(prev => ({ ...prev, rollType: 'normal' }))}
                                                className="text-xs py-1"
                                            >
                                                Обычный
                                            </Button>
                                            <Button
                                                variant={diceConfig.rollType === 'advantage' ? 'default' : 'outline'}
                                                size="sm"
                                                onClick={() => setDiceConfig(prev => ({ ...prev, rollType: 'advantage' }))}
                                                className="text-xs py-1 border-green-500 text-green-400"
                                            >
                                                <TrendingUp className="h-3 w-3 mr-1" />
                                                Преим.
                                            </Button>
                                            <Button
                                                variant={diceConfig.rollType === 'disadvantage' ? 'default' : 'outline'}
                                                size="sm"
                                                onClick={() => setDiceConfig(prev => ({ ...prev, rollType: 'disadvantage' }))}
                                                className="text-xs py-1 border-red-500 text-red-400"
                                            >
                                                <TrendingDown className="h-3 w-3 mr-1" />
                                                Помеха
                                            </Button>
                                        </div>
                                    </div>
                                )}

                                {/* Цель броска */}
                                <div>
                                    <label className="text-xs font-medium text-muted-foreground mb-2 block">
                                        Цель броска
                                    </label>
                                    <Input
                                        value={customPurpose}
                                        onChange={(e) => {
                                            setCustomPurpose(e.target.value)
                                            setDiceConfig(prev => ({ ...prev, purpose: e.target.value || 'general' }))
                                        }}
                                        placeholder="Атака, проверка навыка, урон..."
                                        className="h-8 bg-slate-700/50 border-slate-600 text-xs"
                                    />
                                </div>
                            </div>

                            {/* Кнопка броска */}
                            <Button
                                onClick={() => rollDiceAction()}
                                disabled={isRolling || isLoading}
                                className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                            >
                                {isRolling ? (
                                    <div className="flex items-center space-x-2">
                                        <RotateCcw className="h-4 w-4 animate-spin" />
                                        <span>Бросаем...</span>
                                    </div>
                                ) : (
                                    <div className="flex items-center space-x-2">
                                        <Dice6 className="h-4 w-4" />
                                        <span>Бросить {diceConfig.type}</span>
                                    </div>
                                )}
                            </Button>
                        </div>

                        {/* Быстрые броски */}
                        <div className="border-t border-slate-700 pt-4">
                            <QuickRolls character={character} onRoll={rollDiceAction} />
                        </div>

                        {/* История бросков */}
                        <div className="border-t border-slate-700 pt-4">
                            <h4 className="text-sm font-medium mb-2 flex items-center">
                                <Activity className="h-4 w-4 mr-1 text-muted-foreground" />
                                История бросков
                            </h4>
                            <RollHistory rolls={recentDiceRolls} />
                        </div>
                    </>
                )}
            </CardContent>
        </div>
    )
}