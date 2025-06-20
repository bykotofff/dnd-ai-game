// frontend/src/components/dice/advanced-dice-panel.tsx
'use client'

import React, { useState, useCallback, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
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
import { Checkbox } from '@/components/ui/checkbox'
import { Separator } from '@/components/ui/separator'
import {
    Dice1,
    Dice2,
    Dice3,
    Dice4,
    Dice5,
    Dice6,
    Sword,
    Shield,
    Wand2,
    Heart,
    Target,
    Zap,
    Plus,
    Minus,
    RotateCcw,
    Save,
    Trash2,
    Copy,
    Play,
    History,
    Settings
} from 'lucide-react'
import { cn, formatModifier } from '@/lib/utils'
import { motion, AnimatePresence } from 'framer-motion'

// Типы для расширенной системы костей
export interface DiceFormula {
    id: string
    name: string
    formula: string // Например: "1d20+5", "3d6+2", "2d8+1d6+3"
    description?: string
    category: 'attack' | 'damage' | 'skill' | 'save' | 'other' | 'custom'
    advantage?: boolean
    disadvantage?: boolean
    criticalRange?: number // 20 по умолчанию, 19-20 для улучшенной критической атаки
}

export interface DiceRollGroup {
    id: string
    name: string
    rolls: DiceFormula[]
    description?: string
    autoExecute?: boolean // Выполнять все броски автоматически
}

export interface CompoundRoll {
    id: string
    name: string
    attackRoll: DiceFormula
    damageRolls: DiceFormula[]
    conditions?: string[] // Условия выполнения (например, "если попадание")
    description?: string
}

export interface RollResult {
    id: string
    formula: DiceFormula
    rolls: number[] // Индивидуальные результаты кубиков
    modifier: number
    total: number
    critical: boolean
    advantage?: boolean
    disadvantage?: boolean
    timestamp: Date
}

interface AdvancedDicePanelProps {
    onRoll?: (results: RollResult[]) => void
    onSavePreset?: (preset: DiceFormula | DiceRollGroup | CompoundRoll) => void
    savedPresets?: {
        formulas: DiceFormula[]
        groups: DiceRollGroup[]
        compounds: CompoundRoll[]
    }
    characterId?: string
    className?: string
}

// Предустановленные формулы D&D 5e
const DEFAULT_FORMULAS: DiceFormula[] = [
    {
        id: 'attack_d20',
        name: 'Атака',
        formula: '1d20',
        category: 'attack',
        description: 'Бросок атаки'
    },
    {
        id: 'skill_check',
        name: 'Проверка навыка',
        formula: '1d20',
        category: 'skill',
        description: 'Проверка навыка или характеристики'
    },
    {
        id: 'saving_throw',
        name: 'Спасбросок',
        formula: '1d20',
        category: 'save',
        description: 'Спасательный бросок'
    },
    {
        id: 'damage_1d6',
        name: 'Урон 1d6',
        formula: '1d6',
        category: 'damage',
        description: 'Базовый урон кинжала'
    },
    {
        id: 'damage_1d8',
        name: 'Урон 1d8',
        formula: '1d8',
        category: 'damage',
        description: 'Урон длинного меча'
    },
    {
        id: 'damage_2d6',
        name: 'Урон 2d6',
        formula: '2d6',
        category: 'damage',
        description: 'Урон двуручного меча'
    },
    {
        id: 'healing_1d4',
        name: 'Лечение 1d4+1',
        formula: '1d4+1',
        category: 'other',
        description: 'Лечение зельем здоровья'
    }
]

// Составные броски
const DEFAULT_COMPOUNDS: CompoundRoll[] = [
    {
        id: 'melee_attack',
        name: 'Атака ближнего боя',
        attackRoll: {
            id: 'melee_attack_roll',
            name: 'Атака',
            formula: '1d20',
            category: 'attack'
        },
        damageRolls: [{
            id: 'melee_damage',
            name: 'Урон',
            formula: '1d8',
            category: 'damage'
        }],
        conditions: ['при попадании'],
        description: 'Полная атака ближнего боя с уроном'
    },
    {
        id: 'ranged_attack',
        name: 'Дальняя атака',
        attackRoll: {
            id: 'ranged_attack_roll',
            name: 'Атака',
            formula: '1d20',
            category: 'attack'
        },
        damageRolls: [{
            id: 'ranged_damage',
            name: 'Урон',
            formula: '1d6',
            category: 'damage'
        }],
        conditions: ['при попадании'],
        description: 'Дальняя атака с уроном'
    }
]

export const AdvancedDicePanel: React.FC<AdvancedDicePanelProps> = ({
                                                                        onRoll,
                                                                        onSavePreset,
                                                                        savedPresets = { formulas: [], groups: [], compounds: [] },
                                                                        characterId,
                                                                        className
                                                                    }) => {
    const [activeTab, setActiveTab] = useState<'quick' | 'custom' | 'groups' | 'compounds' | 'history'>('quick')
    const [customFormula, setCustomFormula] = useState('')
    const [customModifier, setCustomModifier] = useState(0)
    const [withAdvantage, setWithAdvantage] = useState(false)
    const [withDisadvantage, setWithDisadvantage] = useState(false)
    const [rollHistory, setRollHistory] = useState<RollResult[]>([])
    const [isRolling, setIsRolling] = useState<string | null>(null)

    // Парсер формулы костей
    const parseDiceFormula = useCallback((formula: string): { diceGroups: Array<{type: string, count: number}>, modifier: number } => {
        const cleaned = formula.replace(/\s+/g, '').toLowerCase()
        const diceGroups: Array<{type: string, count: number}> = []
        let modifier = 0

        // Регулярное выражение для парсинга формулы типа "3d6+2d4+5"
        const diceRegex = /(\d*)d(\d+)/g
        const modifierRegex = /[+-]\d+/g

        let match
        while ((match = diceRegex.exec(cleaned)) !== null) {
            const count = match[1] ? parseInt(match[1]) : 1
            const sides = parseInt(match[2])
            diceGroups.push({ type: `d${sides}`, count })
        }

        const modifierMatches = cleaned.match(modifierRegex)
        if (modifierMatches) {
            modifier = modifierMatches.reduce((sum, mod) => sum + parseInt(mod), 0)
        }

        return { diceGroups, modifier }
    }, [])

    // Функция броска одного кубика
    const rollDice = useCallback((sides: number): number => {
        return Math.floor(Math.random() * sides) + 1
    }, [])

    // Выполнение броска по формуле
    const executeRoll = useCallback(async (formula: DiceFormula): Promise<RollResult> => {
        const { diceGroups, modifier } = parseDiceFormula(formula.formula)
        const allRolls: number[] = []

        // Выполняем броски для каждой группы кубиков
        for (const group of diceGroups) {
            const sides = parseInt(group.type.substring(1))
            for (let i = 0; i < group.count; i++) {
                allRolls.push(rollDice(sides))
            }
        }

        // Применяем преимущество/помеха для d20
        let finalRolls = [...allRolls]
        if ((formula.advantage || withAdvantage) && diceGroups.some(g => g.type === 'd20')) {
            const d20Index = finalRolls.findIndex((_, idx) =>
                diceGroups[Math.floor(idx / diceGroups.reduce((acc, g, i) => i <= Math.floor(idx / diceGroups.length) ? acc + g.count : acc, 0))]?.type === 'd20'
            )
            if (d20Index !== -1) {
                const extraRoll = rollDice(20)
                finalRolls[d20Index] = Math.max(finalRolls[d20Index], extraRoll)
            }
        }

        if ((formula.disadvantage || withDisadvantage) && diceGroups.some(g => g.type === 'd20')) {
            const d20Index = finalRolls.findIndex((_, idx) =>
                diceGroups[Math.floor(idx / diceGroups.reduce((acc, g, i) => i <= Math.floor(idx / diceGroups.length) ? acc + g.count : acc, 0))]?.type === 'd20'
            )
            if (d20Index !== -1) {
                const extraRoll = rollDice(20)
                finalRolls[d20Index] = Math.min(finalRolls[d20Index], extraRoll)
            }
        }

        const total = finalRolls.reduce((sum, roll) => sum + roll, 0) + modifier + customModifier
        const critical = formula.category === 'attack' && finalRolls.some(roll => roll >= (formula.criticalRange || 20))

        return {
            id: `${formula.id}_${Date.now()}`,
            formula,
            rolls: finalRolls,
            modifier: modifier + customModifier,
            total,
            critical,
            advantage: formula.advantage || withAdvantage,
            disadvantage: formula.disadvantage || withDisadvantage,
            timestamp: new Date()
        }
    }, [parseDiceFormula, rollDice, customModifier, withAdvantage, withDisadvantage])

    // Выполнение группового броска
    const executeGroupRoll = useCallback(async (group: DiceRollGroup): Promise<RollResult[]> => {
        const results: RollResult[] = []

        for (const formula of group.rolls) {
            setIsRolling(formula.id)
            await new Promise(resolve => setTimeout(resolve, 300)) // Задержка для анимации
            const result = await executeRoll(formula)
            results.push(result)
        }

        setIsRolling(null)
        return results
    }, [executeRoll])

    // Выполнение составного броска
    const executeCompoundRoll = useCallback(async (compound: CompoundRoll): Promise<RollResult[]> => {
        const results: RollResult[] = []

        // Сначала бросок атаки
        setIsRolling(compound.attackRoll.id)
        await new Promise(resolve => setTimeout(resolve, 300))
        const attackResult = await executeRoll(compound.attackRoll)
        results.push(attackResult)

        // Если атака критическая или успешная (пользователь может решить), бросаем урон
        // Здесь можно добавить логику автоматического определения попадания по AC
        if (attackResult.critical || confirm(`Атака: ${attackResult.total}. Продолжить с броском урона?`)) {
            for (const damageFormula of compound.damageRolls) {
                setIsRolling(damageFormula.id)
                await new Promise(resolve => setTimeout(resolve, 300))

                // Удваиваем кубики урона при критическом попадании
                let actualFormula = damageFormula
                if (attackResult.critical) {
                    const { diceGroups, modifier } = parseDiceFormula(damageFormula.formula)
                    const doubledDice = diceGroups.map(group => `${group.count * 2}${group.type}`).join('+')
                    const modifierPart = modifier !== 0 ? (modifier > 0 ? `+${modifier}` : `${modifier}`) : ''

                    actualFormula = {
                        ...damageFormula,
                        formula: doubledDice + modifierPart,
                        name: `${damageFormula.name} (Критический)`
                    }
                }

                const damageResult = await executeRoll(actualFormula)
                results.push(damageResult)
            }
        }

        setIsRolling(null)
        return results
    }, [executeRoll, parseDiceFormula])

    // Обработка результатов и добавление в историю
    const handleRollResults = useCallback((results: RollResult[]) => {
        setRollHistory(prev => [...results, ...prev].slice(0, 50)) // Сохраняем последние 50 бросков
        onRoll?.(results)
    }, [onRoll])

    // Быстрый бросок одной формулы
    const handleQuickRoll = useCallback(async (formula: DiceFormula) => {
        setIsRolling(formula.id)
        const result = await executeRoll(formula)
        setIsRolling(null)
        handleRollResults([result])
    }, [executeRoll, handleRollResults])

    // Кастомный бросок
    const handleCustomRoll = useCallback(async () => {
        if (!customFormula.trim()) return

        const formula: DiceFormula = {
            id: `custom_${Date.now()}`,
            name: 'Кастомный бросок',
            formula: customFormula,
            category: 'custom'
        }

        setIsRolling(formula.id)
        const result = await executeRoll(formula)
        setIsRolling(null)
        handleRollResults([result])
    }, [customFormula, executeRoll, handleRollResults])

    // Получение иконки для категории
    const getCategoryIcon = (category: DiceFormula['category']) => {
        switch (category) {
            case 'attack': return Target
            case 'damage': return Sword
            case 'skill': return Zap
            case 'save': return Shield
            case 'other': return Heart
            default: return Dice6
        }
    }

    // Получение цвета для категории
    const getCategoryColor = (category: DiceFormula['category']) => {
        switch (category) {
            case 'attack': return 'from-red-500 to-red-600'
            case 'damage': return 'from-orange-500 to-orange-600'
            case 'skill': return 'from-blue-500 to-blue-600'
            case 'save': return 'from-green-500 to-green-600'
            case 'other': return 'from-purple-500 to-purple-600'
            default: return 'from-gray-500 to-gray-600'
        }
    }

    // Компонент результата броска
    const RollResultComponent: React.FC<{ result: RollResult }> = ({ result }) => {
        const Icon = getCategoryIcon(result.formula.category)
        const colorClass = getCategoryColor(result.formula.category)

        return (
            <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className={cn(
                    "p-3 rounded-lg bg-gradient-to-r text-white relative overflow-hidden",
                    colorClass,
                    result.critical && "ring-2 ring-yellow-400 ring-opacity-75"
                )}
            >
                {result.critical && (
                    <div className="absolute top-1 right-1">
                        <span className="text-yellow-300 text-xs font-bold">КРИТ!</span>
                    </div>
                )}

                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Icon className="h-4 w-4" />
                        <span className="font-medium text-sm">{result.formula.name}</span>
                    </div>
                    <div className="text-right">
                        <div className="text-lg font-bold">{result.total}</div>
                        <div className="text-xs opacity-80">
                            {result.rolls.join('+')}
                            {result.modifier !== 0 && formatModifier(result.modifier)}
                        </div>
                    </div>
                </div>

                {(result.advantage || result.disadvantage) && (
                    <div className="mt-1 text-xs opacity-80">
                        {result.advantage && '👍 Преимущество'}
                        {result.disadvantage && '👎 Помеха'}
                    </div>
                )}
            </motion.div>
        )
    }

    const allFormulas = [...DEFAULT_FORMULAS, ...savedPresets.formulas]

    return (
        <TooltipProvider>
            <Card className={cn("w-full max-w-4xl", className)}>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Dice6 className="h-5 w-5" />
                        Продвинутая система костей
                    </CardTitle>

                    {/* Навигация по табам */}
                    <div className="flex gap-1 bg-muted p-1 rounded-lg">
                        {[
                            { id: 'quick', label: 'Быстрые', icon: Zap },
                            { id: 'custom', label: 'Кастом', icon: Settings },
                            { id: 'groups', label: 'Группы', icon: Copy },
                            { id: 'compounds', label: 'Составные', icon: Sword },
                            { id: 'history', label: 'История', icon: History }
                        ].map(tab => {
                            const Icon = tab.icon
                            return (
                                <Button
                                    key={tab.id}
                                    variant={activeTab === tab.id ? 'default' : 'ghost'}
                                    size="sm"
                                    onClick={() => setActiveTab(tab.id as any)}
                                    className="flex items-center gap-1"
                                >
                                    <Icon className="h-4 w-4" />
                                    {tab.label}
                                </Button>
                            )
                        })}
                    </div>

                    {/* Глобальные модификаторы */}
                    <div className="flex items-center gap-4 text-sm">
                        <div className="flex items-center gap-2">
                            <Label htmlFor="modifier">Модификатор:</Label>
                            <Input
                                id="modifier"
                                type="number"
                                value={customModifier}
                                onChange={(e) => setCustomModifier(parseInt(e.target.value) || 0)}
                                className="w-16 h-8"
                            />
                        </div>
                        <Checkbox
                            id="advantage"
                            checked={withAdvantage}
                            onCheckedChange={setWithAdvantage}
                            disabled={withDisadvantage}
                        />
                        <Label htmlFor="advantage">Преимущество</Label>
                        <Checkbox
                            id="disadvantage"
                            checked={withDisadvantage}
                            onCheckedChange={setWithDisadvantage}
                            disabled={withAdvantage}
                        />
                        <Label htmlFor="disadvantage">Помеха</Label>
                    </div>
                </CardHeader>

                <CardContent className="space-y-4">
                    {/* Быстрые броски */}
                    {activeTab === 'quick' && (
                        <div className="space-y-4">
                            <h3 className="font-semibold">Стандартные броски D&D 5e</h3>
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                                {allFormulas.map(formula => {
                                    const Icon = getCategoryIcon(formula.category)
                                    const isRollingThis = isRolling === formula.id

                                    return (
                                        <Tooltip key={formula.id}>
                                            <TooltipTrigger asChild>
                                                <Button
                                                    variant="outline"
                                                    onClick={() => handleQuickRoll(formula)}
                                                    disabled={isRollingThis}
                                                    className={cn(
                                                        "h-auto p-3 flex flex-col items-center gap-2",
                                                        isRollingThis && "animate-pulse"
                                                    )}
                                                >
                                                    <Icon className="h-5 w-5" />
                                                    <div className="text-center">
                                                        <div className="font-medium text-xs">{formula.name}</div>
                                                        <div className="text-xs text-muted-foreground">{formula.formula}</div>
                                                    </div>
                                                </Button>
                                            </TooltipTrigger>
                                            <TooltipContent>
                                                <p>{formula.description}</p>
                                            </TooltipContent>
                                        </Tooltip>
                                    )
                                })}
                            </div>
                        </div>
                    )}

                    {/* Кастомные броски */}
                    {activeTab === 'custom' && (
                        <div className="space-y-4">
                            <h3 className="font-semibold">Создать кастомный бросок</h3>
                            <div className="flex gap-2">
                                <Input
                                    placeholder="Формула (например: 3d6+2, 2d8+1d6+5)"
                                    value={customFormula}
                                    onChange={(e) => setCustomFormula(e.target.value)}
                                    className="flex-1"
                                />
                                <Button onClick={handleCustomRoll} disabled={!customFormula.trim()}>
                                    <Play className="h-4 w-4 mr-1" />
                                    Бросить
                                </Button>
                            </div>
                            <div className="text-sm text-muted-foreground">
                                Примеры: 1d20+5, 3d6+2, 2d8+1d6+3, 4d6kh3 (высшие 3 из 4)
                            </div>
                        </div>
                    )}

                    {/* Групповые броски */}
                    {activeTab === 'groups' && (
                        <div className="space-y-4">
                            <h3 className="font-semibold">Групповые броски</h3>
                            {savedPresets.groups.map(group => (
                                <Card key={group.id}>
                                    <CardContent className="p-4">
                                        <div className="flex items-center justify-between mb-2">
                                            <h4 className="font-medium">{group.name}</h4>
                                            <Button
                                                size="sm"
                                                onClick={() => executeGroupRoll(group).then(handleRollResults)}
                                            >
                                                <Play className="h-4 w-4 mr-1" />
                                                Выполнить все
                                            </Button>
                                        </div>
                                        <p className="text-sm text-muted-foreground mb-3">{group.description}</p>
                                        <div className="flex flex-wrap gap-2">
                                            {group.rolls.map(formula => (
                                                <Badge key={formula.id} variant="outline">
                                                    {formula.name}: {formula.formula}
                                                </Badge>
                                            ))}
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    )}

                    {/* Составные броски */}
                    {activeTab === 'compounds' && (
                        <div className="space-y-4">
                            <h3 className="font-semibold">Составные броски</h3>
                            {DEFAULT_COMPOUNDS.concat(savedPresets.compounds).map(compound => (
                                <Card key={compound.id}>
                                    <CardContent className="p-4">
                                        <div className="flex items-center justify-between mb-2">
                                            <h4 className="font-medium">{compound.name}</h4>
                                            <Button
                                                size="sm"
                                                onClick={() => executeCompoundRoll(compound).then(handleRollResults)}
                                            >
                                                <Sword className="h-4 w-4 mr-1" />
                                                Атака
                                            </Button>
                                        </div>
                                        <p className="text-sm text-muted-foreground mb-3">{compound.description}</p>
                                        <div className="space-y-2">
                                            <div className="flex items-center gap-2">
                                                <Target className="h-4 w-4" />
                                                <span className="text-sm">
                                                    Атака: {compound.attackRoll.formula}
                                                </span>
                                            </div>
                                            {compound.damageRolls.map((damage, idx) => (
                                                <div key={idx} className="flex items-center gap-2">
                                                    <Sword className="h-4 w-4" />
                                                    <span className="text-sm">
                                                        {damage.name}: {damage.formula}
                                                    </span>
                                                </div>
                                            ))}
                                            {compound.conditions && (
                                                <div className="text-xs text-muted-foreground">
                                                    Условия: {compound.conditions.join(', ')}
                                                </div>
                                            )}
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    )}

                    {/* История бросков */}
                    {activeTab === 'history' && (
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <h3 className="font-semibold">История бросков</h3>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setRollHistory([])}
                                >
                                    <Trash2 className="h-4 w-4 mr-1" />
                                    Очистить
                                </Button>
                            </div>
                            {rollHistory.length === 0 ? (
                                <div className="text-center text-muted-foreground py-8">
                                    Пока нет бросков
                                </div>
                            ) : (
                                <div className="space-y-2 max-h-96 overflow-y-auto">
                                    <AnimatePresence>
                                        {rollHistory.map(result => (
                                            <RollResultComponent key={result.id} result={result} />
                                        ))}
                                    </AnimatePresence>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Живая лента результатов */}
                    {rollHistory.length > 0 && activeTab !== 'history' && (
                        <div className="border-t pt-4">
                            <h4 className="font-medium mb-2 text-sm">Последние броски:</h4>
                            <div className="space-y-2 max-h-32 overflow-y-auto">
                                {rollHistory.slice(0, 3).map(result => (
                                    <RollResultComponent key={result.id} result={result} />
                                ))}
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>
        </TooltipProvider>
    )
}