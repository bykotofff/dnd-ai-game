// frontend/src/components/character/ability-scores-panel.tsx
'use client'

import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import {
    Sword,
    Zap,
    Heart,
    Brain,
    Eye,
    Sparkles,
    Dice6,
    Plus,
    Minus,
    RotateCcw
} from 'lucide-react'
import { cn, getAbilityModifier, formatModifier } from '@/lib/utils'
import { AbilityScores } from '@/types'

interface AbilityScoresPanelProps {
    abilityScores: AbilityScores
    onAbilityScoresChange?: (scores: AbilityScores) => void
    isEditing?: boolean
    showRollButtons?: boolean
    remainingPoints?: number
    className?: string
}

// Данные о характеристиках D&D 5e
const ABILITY_DATA = {
    strength: {
        name: 'Сила',
        shortName: 'СИЛ',
        icon: Sword,
        description: 'Физическая мощь, способность к рукопашному бою',
        skills: ['Атлетика'],
        color: 'from-red-500 to-red-600'
    },
    dexterity: {
        name: 'Ловкость',
        shortName: 'ЛОВ',
        icon: Zap,
        description: 'Проворство, рефлексы, равновесие',
        skills: ['Акробатика', 'Ловкость рук', 'Скрытность'],
        color: 'from-green-500 to-green-600'
    },
    constitution: {
        name: 'Телосложение',
        shortName: 'ТЕЛ',
        icon: Heart,
        description: 'Здоровье, выносливость, жизненная сила',
        skills: [],
        color: 'from-orange-500 to-orange-600'
    },
    intelligence: {
        name: 'Интеллект',
        shortName: 'ИНТ',
        icon: Brain,
        description: 'Рассуждения, память, аналитические способности',
        skills: ['Анализ', 'История', 'Расследование', 'Природа', 'Религия'],
        color: 'from-blue-500 to-blue-600'
    },
    wisdom: {
        name: 'Мудрость',
        shortName: 'МУД',
        icon: Eye,
        description: 'Осведомленность, интуиция, проницательность',
        skills: ['Восприятие', 'Выживание', 'Медицина', 'Проницательность', 'Уход за животными'],
        color: 'from-purple-500 to-purple-600'
    },
    charisma: {
        name: 'Харизма',
        shortName: 'ХАР',
        icon: Sparkles,
        description: 'Сила личности, обаяние, лидерские качества',
        skills: ['Выступление', 'Запугивание', 'Обман', 'Убеждение'],
        color: 'from-pink-500 to-pink-600'
    }
}

// Методы распределения очков
const DISTRIBUTION_METHODS = {
    pointBuy: 'Покупка очков (27 очков)',
    standardArray: 'Стандартный набор',
    roll: 'Броски костей',
    manual: 'Ручное распределение'
}

const STANDARD_ARRAY = [15, 14, 13, 12, 10, 8]

export const AbilityScoresPanel: React.FC<AbilityScoresPanelProps> = ({
                                                                          abilityScores,
                                                                          onAbilityScoresChange,
                                                                          isEditing = false,
                                                                          showRollButtons = false,
                                                                          remainingPoints = 0,
                                                                          className
                                                                      }) => {
    const [distributionMethod, setDistributionMethod] = useState<string>('pointBuy')
    const [standardArrayAssigned, setStandardArrayAssigned] = useState<Record<string, number>>({})
    const [availableValues, setAvailableValues] = useState<number[]>(STANDARD_ARRAY)

    // Обновление характеристики
    const updateAbilityScore = (ability: keyof AbilityScores, value: number) => {
        if (!onAbilityScoresChange) return

        const newScores = {
            ...abilityScores,
            [ability]: Math.max(3, Math.min(18, value))
        }
        onAbilityScoresChange(newScores)
    }

    // Бросок кубиков для характеристики
    const rollAbilityScore = (ability: keyof AbilityScores) => {
        // 4d6, убираем наименьший
        const rolls = Array.from({ length: 4 }, () => Math.floor(Math.random() * 6) + 1)
        rolls.sort((a, b) => b - a)
        const total = rolls.slice(0, 3).reduce((sum, roll) => sum + roll, 0)

        updateAbilityScore(ability, total)
    }

    // Применение стандартного набора
    const applyStandardArray = () => {
        if (!onAbilityScoresChange) return

        const abilities = Object.keys(ABILITY_DATA) as (keyof AbilityScores)[]
        const newScores = { ...abilityScores }

        abilities.forEach((ability, index) => {
            if (STANDARD_ARRAY[index]) {
                newScores[ability] = STANDARD_ARRAY[index]
            }
        })

        onAbilityScoresChange(newScores)
    }

    // Сброс к значениям по умолчанию
    const resetToDefaults = () => {
        if (!onAbilityScoresChange) return

        const defaultScores: AbilityScores = {
            strength: 10,
            dexterity: 10,
            constitution: 10,
            intelligence: 10,
            wisdom: 10,
            charisma: 10
        }

        onAbilityScoresChange(defaultScores)
    }

    // Расчет общей стоимости очков (для Point Buy)
    const calculatePointBuyCost = () => {
        return Object.values(abilityScores).reduce((total, score) => {
            if (score <= 8) return total + 0
            if (score <= 13) return total + (score - 8)
            if (score <= 15) return total + (score - 8) + (score - 13)
            return total + (score - 8) + (score - 13) + ((score - 15) * 2)
        }, 0)
    }

    const pointBuyCost = calculatePointBuyCost()
    const maxPointBuy = 27

    return (
        <TooltipProvider>
            <Card className={cn("w-full", className)}>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <CardTitle className="flex items-center gap-2">
                            <Dice6 className="h-5 w-5" />
                            Характеристики
                        </CardTitle>

                        {isEditing && (
                            <div className="flex items-center gap-2">
                                <Select
                                    value={distributionMethod}
                                    onValueChange={setDistributionMethod}
                                >
                                    <SelectTrigger className="w-48">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {Object.entries(DISTRIBUTION_METHODS).map(([key, label]) => (
                                            <SelectItem key={key} value={key}>
                                                {label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>

                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={resetToDefaults}
                                    className="px-3"
                                >
                                    <RotateCcw className="h-4 w-4" />
                                </Button>
                            </div>
                        )}
                    </div>

                    {/* Информация о методе распределения */}
                    {isEditing && distributionMethod === 'pointBuy' && (
                        <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">
                                Очки потрачено: {pointBuyCost} из {maxPointBuy}
                            </span>
                            <Badge variant={pointBuyCost > maxPointBuy ? "destructive" : "secondary"}>
                                Осталось: {maxPointBuy - pointBuyCost}
                            </Badge>
                        </div>
                    )}

                    {isEditing && distributionMethod === 'standardArray' && (
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">
                                Стандартный набор: 15, 14, 13, 12, 10, 8
                            </span>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={applyStandardArray}
                            >
                                Применить
                            </Button>
                        </div>
                    )}
                </CardHeader>

                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                        {(Object.entries(ABILITY_DATA) as [keyof AbilityScores, typeof ABILITY_DATA[keyof typeof ABILITY_DATA]][]).map(([ability, data]) => {
                            const score = abilityScores[ability]
                            const modifier = getAbilityModifier(score)
                            const Icon = data.icon

                            return (
                                <div
                                    key={ability}
                                    className={cn(
                                        "ability-score group relative overflow-hidden",
                                        "bg-gradient-to-br",
                                        data.color,
                                        "text-white rounded-lg p-4 transition-all duration-200",
                                        "hover:shadow-lg hover:scale-105"
                                    )}
                                >
                                    {/* Фон с иконкой */}
                                    <div className="absolute top-2 right-2 opacity-20">
                                        <Icon className="h-8 w-8" />
                                    </div>

                                    {/* Название характеристики */}
                                    <div className="flex items-center gap-2 mb-3">
                                        <Icon className="h-5 w-5" />
                                        <div>
                                            <h3 className="font-semibold text-lg">{data.name}</h3>
                                            <p className="text-xs opacity-80">{data.shortName}</p>
                                        </div>
                                    </div>

                                    {/* Значение и модификатор */}
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="text-center">
                                            {isEditing ? (
                                                <div className="flex items-center gap-1">
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="h-6 w-6 p-0 text-white hover:bg-white/20"
                                                        onClick={() => updateAbilityScore(ability, score - 1)}
                                                        disabled={score <= 3}
                                                    >
                                                        <Minus className="h-3 w-3" />
                                                    </Button>

                                                    <Input
                                                        type="number"
                                                        min={3}
                                                        max={18}
                                                        value={score}
                                                        onChange={(e) => updateAbilityScore(ability, parseInt(e.target.value) || 3)}
                                                        className="w-16 h-8 text-center text-black bg-white border-0"
                                                    />

                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="h-6 w-6 p-0 text-white hover:bg-white/20"
                                                        onClick={() => updateAbilityScore(ability, score + 1)}
                                                        disabled={score >= 18}
                                                    >
                                                        <Plus className="h-3 w-3" />
                                                    </Button>
                                                </div>
                                            ) : (
                                                <span className="text-3xl font-bold">{score}</span>
                                            )}
                                        </div>

                                        <div className="text-center">
                                            <div className="ability-modifier text-2xl font-bold">
                                                {formatModifier(modifier)}
                                            </div>
                                            <div className="text-xs opacity-80">модификатор</div>
                                        </div>
                                    </div>

                                    {/* Кнопка броска (если доступна) */}
                                    {isEditing && showRollButtons && distributionMethod === 'roll' && (
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="w-full text-white border-white/30 hover:bg-white/20"
                                            onClick={() => rollAbilityScore(ability)}
                                        >
                                            <Dice6 className="h-4 w-4 mr-1" />
                                            Бросок
                                        </Button>
                                    )}

                                    {/* Тултип с описанием */}
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <div className="absolute inset-0" />
                                        </TooltipTrigger>
                                        <TooltipContent side="top" className="max-w-xs">
                                            <div className="text-sm">
                                                <p className="font-semibold mb-1">{data.name}</p>
                                                <p className="mb-2">{data.description}</p>
                                                {data.skills.length > 0 && (
                                                    <div>
                                                        <p className="font-medium mb-1">Связанные навыки:</p>
                                                        <p className="text-xs">{data.skills.join(', ')}</p>
                                                    </div>
                                                )}
                                            </div>
                                        </TooltipContent>
                                    </Tooltip>
                                </div>
                            )
                        })}
                    </div>

                    {/* Итоговая информация */}
                    {!isEditing && (
                        <div className="mt-6 pt-4 border-t">
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                <div className="text-center">
                                    <p className="text-muted-foreground">Общий модификатор</p>
                                    <p className="font-semibold text-lg">
                                        {formatModifier(
                                            Object.values(abilityScores)
                                                .map(score => getAbilityModifier(score))
                                                .reduce((sum, mod) => sum + mod, 0)
                                        )}
                                    </p>
                                </div>

                                <div className="text-center">
                                    <p className="text-muted-foreground">Наивысшая</p>
                                    <p className="font-semibold text-lg">
                                        {Math.max(...Object.values(abilityScores))}
                                    </p>
                                </div>

                                <div className="text-center">
                                    <p className="text-muted-foreground">Средняя</p>
                                    <p className="font-semibold text-lg">
                                        {Math.round(
                                            Object.values(abilityScores).reduce((sum, score) => sum + score, 0) / 6
                                        )}
                                    </p>
                                </div>

                                <div className="text-center">
                                    <p className="text-muted-foreground">Общий балл</p>
                                    <p className="font-semibold text-lg">
                                        {Object.values(abilityScores).reduce((sum, score) => sum + score, 0)}
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>
        </TooltipProvider>
    )
}