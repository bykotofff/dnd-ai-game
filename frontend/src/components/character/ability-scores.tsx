// frontend/src/components/character/ability-scores.tsx
import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Slider } from '@/components/ui/slider'
import {
    Minus,
    Plus,
    RotateCcw,
    Info,
    TrendingUp,
    TrendingDown,
    AlertTriangle
} from 'lucide-react'
import { AbilityScores as AbilityScoresType } from '@/types'
import { cn } from '@/lib/utils'

interface AbilityScoresProps {
    scores: AbilityScoresType
    onScoresChange: (scores: AbilityScoresType) => void
    selectedRace?: string
    selectedClass?: string
    error?: string
}

// Информация о характеристиках
const ABILITY_INFO = {
    strength: {
        name: 'Сила',
        shortName: 'СИЛ',
        description: 'Определяет физическую мощь, урон оружием ближнего боя',
        icon: '💪',
        color: 'from-red-500 to-orange-500',
        skills: ['Атлетика']
    },
    dexterity: {
        name: 'Ловкость',
        shortName: 'ЛОВ',
        description: 'Влияет на КБ, инициативу, скрытность и точность',
        icon: '🏃',
        color: 'from-green-500 to-emerald-500',
        skills: ['Акробатика', 'Ловкость рук', 'Скрытность']
    },
    constitution: {
        name: 'Телосложение',
        shortName: 'ТЕЛ',
        description: 'Определяет количество здоровья и выносливость',
        icon: '❤️',
        color: 'from-pink-500 to-red-500',
        skills: ['Спасброски на концентрацию']
    },
    intelligence: {
        name: 'Интеллект',
        shortName: 'ИНТ',
        description: 'Влияет на магию волшебников и аналитические навыки',
        icon: '🧠',
        color: 'from-blue-500 to-indigo-500',
        skills: ['Аркана', 'История', 'Расследование', 'Природа', 'Религия']
    },
    wisdom: {
        name: 'Мудрость',
        shortName: 'МУД',
        description: 'Определяет восприятие и интуицию',
        icon: '👁️',
        color: 'from-amber-500 to-yellow-500',
        skills: ['Восприятие', 'Проницательность', 'Медицина', 'Выживание', 'Обращение с животными']
    },
    charisma: {
        name: 'Харизма',
        shortName: 'ХАР',
        description: 'Влияет на социальные взаимодействия и некоторую магию',
        icon: '✨',
        color: 'from-purple-500 to-pink-500',
        skills: ['Убеждение', 'Обман', 'Запугивание', 'Выступление']
    }
} as const

// Приоритеты характеристик для классов
const CLASS_PRIORITIES: Record<string, { primary: string[], secondary: string[] }> = {
    'BARBARIAN': { primary: ['strength', 'constitution'], secondary: ['dexterity'] },
    'BARD': { primary: ['charisma'], secondary: ['dexterity', 'constitution'] },
    'CLERIC': { primary: ['wisdom'], secondary: ['strength', 'constitution'] },
    'DRUID': { primary: ['wisdom'], secondary: ['constitution', 'dexterity'] },
    'FIGHTER': { primary: ['strength', 'dexterity'], secondary: ['constitution'] },
    'MONK': { primary: ['dexterity', 'wisdom'], secondary: ['constitution'] },
    'PALADIN': { primary: ['strength', 'charisma'], secondary: ['constitution'] },
    'RANGER': { primary: ['dexterity', 'wisdom'], secondary: ['constitution'] },
    'ROGUE': { primary: ['dexterity'], secondary: ['intelligence', 'wisdom'] },
    'SORCERER': { primary: ['charisma'], secondary: ['constitution', 'dexterity'] },
    'WARLOCK': { primary: ['charisma'], secondary: ['constitution', 'dexterity'] },
    'WIZARD': { primary: ['intelligence'], secondary: ['constitution', 'dexterity'] }
}

// Расовые бонусы (упрощенные)
const RACIAL_BONUSES: Record<string, Partial<AbilityScoresType>> = {
    'HUMAN': { strength: 1, dexterity: 1, constitution: 1, intelligence: 1, wisdom: 1, charisma: 1 },
    'ELF': { dexterity: 2 },
    'DWARF': { constitution: 2 },
    'HALFLING': { dexterity: 2 },
    'DRAGONBORN': { strength: 2, charisma: 1 },
    'GNOME': { intelligence: 2 },
    'HALF_ELF': { charisma: 2 },
    'HALF_ORC': { strength: 2, constitution: 1 },
    'TIEFLING': { intelligence: 1, charisma: 2 }
}

function AbilityScoreInput({
                               ability,
                               value,
                               onChange,
                               isPrimary,
                               isSecondary,
                               racialBonus = 0,
                               remainingPoints,
                               maxPoints
                           }: {
    ability: keyof AbilityScoresType
    value: number
    onChange: (value: number) => void
    isPrimary: boolean
    isSecondary: boolean
    racialBonus?: number
    remainingPoints: number
    maxPoints: number
}) {
    const abilityInfo = ABILITY_INFO[ability]
    const finalValue = value + racialBonus
    const modifier = Math.floor((finalValue - 10) / 2)
    const cost = calculatePointCost(value)

    const canIncrease = value < 15 && remainingPoints >= calculatePointCost(value + 1) - cost
    const canDecrease = value > 8

    return (
        <Card className={cn(
            "transition-all duration-200 border-2",
            isPrimary && "border-green-500 bg-green-50 dark:bg-green-950/30",
            isSecondary && !isPrimary && "border-blue-500 bg-blue-50 dark:bg-blue-950/30",
            !isPrimary && !isSecondary && "border-muted"
        )}>
            <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                        <div className={cn(
                            "w-10 h-10 rounded-lg flex items-center justify-center text-white bg-gradient-to-br text-lg",
                            abilityInfo.color
                        )}>
                            {abilityInfo.icon}
                        </div>
                        <div>
                            <CardTitle className="text-lg">{abilityInfo.name}</CardTitle>
                            <div className="flex items-center space-x-2">
                                <Badge
                                    variant="outline"
                                    className={cn(
                                        "text-xs",
                                        isPrimary && "border-green-500 text-green-700 dark:text-green-300",
                                        isSecondary && !isPrimary && "border-blue-500 text-blue-700 dark:text-blue-300"
                                    )}
                                >
                                    {abilityInfo.shortName}
                                </Badge>
                                {isPrimary && (
                                    <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300 text-xs">
                                        Ключевая
                                    </Badge>
                                )}
                                {isSecondary && !isPrimary && (
                                    <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300 text-xs">
                                        Важная
                                    </Badge>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Итоговое значение и модификатор */}
                    <div className="text-right">
                        <div className="text-2xl font-bold flex items-baseline space-x-1">
                            <span>{finalValue}</span>
                            {racialBonus > 0 && (
                                <span className="text-sm text-green-600 dark:text-green-400">
                  (+{racialBonus})
                </span>
                            )}
                        </div>
                        <div className={cn(
                            "text-sm font-medium",
                            modifier >= 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"
                        )}>
                            {modifier >= 0 ? '+' : ''}{modifier}
                        </div>
                    </div>
                </div>
            </CardHeader>

            <CardContent className="space-y-4">
                <CardDescription className="text-sm">
                    {abilityInfo.description}
                </CardDescription>

                {/* Ползунок для настройки */}
                <div className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Базовое значение:</span>
                        <span className="font-medium">{value}</span>
                    </div>

                    <div className="flex items-center space-x-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onChange(value - 1)}
                            disabled={!canDecrease}
                            className="h-8 w-8 p-0"
                        >
                            <Minus className="h-3 w-3" />
                        </Button>

                        <div className="flex-1">
                            <Slider
                                value={[value]}
                                onValueChange={([newValue]) => onChange(newValue)}
                                min={8}
                                max={15}
                                step={1}
                                className="w-full"
                            />
                        </div>

                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onChange(value + 1)}
                            disabled={!canIncrease}
                            className="h-8 w-8 p-0"
                        >
                            <Plus className="h-3 w-3" />
                        </Button>
                    </div>

                    <div className="flex justify-between text-xs text-muted-foreground">
                        <span>8</span>
                        <span>15</span>
                    </div>
                </div>

                {/* Стоимость в очках */}
                <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">Стоимость:</span>
                    <span className="font-medium">{cost} очк.</span>
                </div>

                {/* Связанные навыки */}
                {abilityInfo.skills.length > 0 && (
                    <div>
                        <h5 className="text-xs font-medium text-muted-foreground mb-1">
                            Связанные навыки:
                        </h5>
                        <div className="flex flex-wrap gap-1">
                            {abilityInfo.skills.slice(0, 2).map((skill) => (
                                <Badge key={skill} variant="outline" className="text-xs">
                                    {skill}
                                </Badge>
                            ))}
                            {abilityInfo.skills.length > 2 && (
                                <Badge variant="outline" className="text-xs">
                                    +{abilityInfo.skills.length - 2}
                                </Badge>
                            )}
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    )
}

// Функция расчета стоимости очков
function calculatePointCost(score: number): number {
    if (score <= 8) return 0
    if (score <= 13) return score - 8
    if (score === 14) return 7
    if (score === 15) return 9
    return 0
}

export function AbilityScores({
                                  scores,
                                  onScoresChange,
                                  selectedRace,
                                  selectedClass,
                                  error
                              }: AbilityScoresProps) {
    const [method, setMethod] = useState<'pointBuy' | 'standard' | 'rolled'>('pointBuy')
    const maxPoints = 27

    // Получаем приоритеты для выбранного класса
    const classPriorities = selectedClass ? CLASS_PRIORITIES[selectedClass] : { primary: [], secondary: [] }

    // Получаем расовые бонусы
    const racialBonuses = selectedRace ? RACIAL_BONUSES[selectedRace] || {} : {}

    // Подсчет использованных очков
    const usedPoints = Object.values(scores).reduce((total, score) => total + calculatePointCost(score), 0)
    const remainingPoints = maxPoints - usedPoints

    // Стандартный набор характеристик
    const standardArray = [15, 14, 13, 12, 10, 8]

    // Применение стандартного набора
    const applyStandardArray = () => {
        const newScores = { ...scores }
        const abilities = Object.keys(scores) as (keyof AbilityScoresType)[]

        // Сортируем способности по приоритету
        const sortedAbilities = abilities.sort((a, b) => {
            const aIsPrimary = classPriorities.primary.includes(a)
            const bIsPrimary = classPriorities.primary.includes(b)
            const aIsSecondary = classPriorities.secondary.includes(a)
            const bIsSecondary = classPriorities.secondary.includes(b)

            if (aIsPrimary && !bIsPrimary) return -1
            if (!aIsPrimary && bIsPrimary) return 1
            if (aIsSecondary && !bIsSecondary) return -1
            if (!aIsSecondary && bIsSecondary) return 1
            return 0
        })

        // Применяем стандартные значения
        sortedAbilities.forEach((ability, index) => {
            newScores[ability] = standardArray[index] || 8
        })

        onScoresChange(newScores)
        setMethod('standard')
    }

    // Сброс к базовым значениям
    const resetToBase = () => {
        const baseScores: AbilityScoresType = {
            strength: 8,
            dexterity: 8,
            constitution: 8,
            intelligence: 8,
            wisdom: 8,
            charisma: 8
        }
        onScoresChange(baseScores)
        setMethod('pointBuy')
    }

    const updateAbilityScore = (ability: keyof AbilityScoresType, value: number) => {
        const newScores = { ...scores, [ability]: value }
        onScoresChange(newScores)
    }

    return (
        <div className="space-y-6">
            <div>
                <h3 className="text-lg font-semibold mb-2">Распределите характеристики</h3>
                <p className="text-muted-foreground mb-4">
                    Определите сильные и слабые стороны вашего персонажа. Используйте систему покупки очками или стандартный набор.
                </p>
                {error && (
                    <p className="text-sm text-red-600 dark:text-red-400 mb-4">
                        {error}
                    </p>
                )}

                {/* Методы распределения */}
                <div className="flex flex-wrap gap-3 mb-6">
                    <Button
                        variant={method === 'pointBuy' ? 'default' : 'outline'}
                        onClick={() => setMethod('pointBuy')}
                        size="sm"
                    >
                        Покупка очками
                    </Button>
                    <Button
                        variant={method === 'standard' ? 'default' : 'outline'}
                        onClick={applyStandardArray}
                        size="sm"
                    >
                        Стандартный набор
                    </Button>
                    <Button
                        variant="outline"
                        onClick={resetToBase}
                        size="sm"
                    >
                        <RotateCcw className="h-4 w-4 mr-2" />
                        Сброс
                    </Button>
                </div>

                {/* Информация о методе */}
                {method === 'pointBuy' && (
                    <Card className="mb-6 bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800">
                        <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-3">
                                    <Info className="h-5 w-5 text-blue-600" />
                                    <div>
                                        <h4 className="font-semibold text-blue-900 dark:text-blue-100">
                                            Покупка очками
                                        </h4>
                                        <p className="text-sm text-blue-800 dark:text-blue-200">
                                            У вас есть {maxPoints} очков для распределения. Высокие значения стоят дороже.
                                        </p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                                        {remainingPoints}
                                    </div>
                                    <div className="text-sm text-blue-700 dark:text-blue-300">
                                        очков осталось
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {method === 'standard' && (
                    <Card className="mb-6 bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800">
                        <CardContent className="p-4">
                            <div className="flex items-center space-x-3">
                                <TrendingUp className="h-5 w-5 text-green-600" />
                                <div>
                                    <h4 className="font-semibold text-green-900 dark:text-green-100">
                                        Стандартный набор
                                    </h4>
                                    <p className="text-sm text-green-800 dark:text-green-200">
                                        Характеристики автоматически распределены с учетом приоритетов вашего класса: {standardArray.join(', ')}
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>

            {/* Предупреждения */}
            {remainingPoints < 0 && method === 'pointBuy' && (
                <Card className="bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800">
                    <CardContent className="p-4">
                        <div className="flex items-center space-x-3">
                            <AlertTriangle className="h-5 w-5 text-red-600" />
                            <div>
                                <h4 className="font-semibold text-red-900 dark:text-red-100">
                                    Превышен лимит очков
                                </h4>
                                <p className="text-sm text-red-800 dark:text-red-200">
                                    Вы потратили на {Math.abs(remainingPoints)} очков больше лимита. Уменьшите некоторые характеристики.
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Сетка характеристик */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {(Object.keys(scores) as (keyof AbilityScoresType)[]).map((ability) => (
                    <AbilityScoreInput
                        key={ability}
                        ability={ability}
                        value={scores[ability]}
                        onChange={(value) => updateAbilityScore(ability, value)}
                        isPrimary={classPriorities.primary.includes(ability)}
                        isSecondary={classPriorities.secondary.includes(ability)}
                        racialBonus={racialBonuses[ability] || 0}
                        remainingPoints={remainingPoints}
                        maxPoints={maxPoints}
                    />
                ))}
            </div>

            {/* Итоговая информация */}
            <Card className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-950/30 dark:to-blue-950/30 border-purple-200 dark:border-purple-800">
                <CardContent className="p-4">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                        <div>
                            <div className="text-lg font-bold text-purple-900 dark:text-purple-100">
                                {Object.values(scores).reduce((sum, score) => sum + score, 0) + Object.values(racialBonuses).reduce((sum, bonus) => sum + (bonus || 0), 0)}
                            </div>
                            <div className="text-sm text-purple-700 dark:text-purple-300">
                                Итого очков
                            </div>
                        </div>
                        <div>
                            <div className="text-lg font-bold text-purple-900 dark:text-purple-100">
                                {Math.floor((Math.max(...Object.values(scores).map((score, i) => score + Object.values(racialBonuses)[i] || 0)) - 10) / 2)}
                            </div>
                            <div className="text-sm text-purple-700 dark:text-purple-300">
                                Лучший модификатор
                            </div>
                        </div>
                        <div>
                            <div className="text-lg font-bold text-purple-900 dark:text-purple-100">
                                {Object.values(racialBonuses).reduce((sum, bonus) => sum + (bonus || 0), 0)}
                            </div>
                            <div className="text-sm text-purple-700 dark:text-purple-300">
                                Расовые бонусы
                            </div>
                        </div>
                        <div>
                            <div className="text-lg font-bold text-purple-900 dark:text-purple-100">
                                {method === 'pointBuy' ? remainingPoints : 'N/A'}
                            </div>
                            <div className="text-sm text-purple-700 dark:text-purple-300">
                                Очков осталось
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}