// frontend/src/components/combat/combat-enhancements.tsx
'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Progress } from '@/components/ui/progress'
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog'
import {
    Sword,
    Shield,
    Target,
    Zap,
    Clock,
    AlertTriangle,
    Eye,
    Flame,
    Snowflake,
    Heart,
    Brain,
    Crosshair,
    Users,
    MapPin,
    Timer,
    CheckCircle,
    XCircle,
    RotateCcw
} from 'lucide-react'
import { cn, formatModifier } from '@/lib/utils'
import { motion, AnimatePresence } from 'framer-motion'
import { useDice } from '@/hooks/use-dice'

// Типы для боевой системы
export interface CombatAction {
    id: string
    type: 'attack' | 'spell' | 'ability' | 'movement' | 'defense'
    name: string
    description: string
    attackBonus?: number
    damageFormula?: string
    damageType?: DamageType
    savingThrow?: {
        ability: string
        dc: number
    }
    range: number | 'touch' | 'self'
    areaOfEffect?: AreaOfEffect
    concentration?: boolean
    duration?: Duration
    uses?: {
        max: number
        current: number
        resetOn: 'short rest' | 'long rest' | 'dawn'
    }
}

export interface AreaOfEffect {
    type: 'sphere' | 'cube' | 'cylinder' | 'cone' | 'line' | 'square'
    size: number // в футах
    origin: 'self' | 'point' | 'target'
    excludeSelf?: boolean
}

export interface Duration {
    type: 'instantaneous' | 'rounds' | 'minutes' | 'hours' | 'until dispelled' | 'concentration'
    value?: number
}

export interface TemporaryEffect {
    id: string
    name: string
    description: string
    type: 'buff' | 'debuff' | 'condition' | 'damage over time' | 'healing over time'
    targetId: string
    targetName: string
    sourceId: string
    sourceName: string
    duration: Duration
    remainingDuration: number
    isConcentration: boolean
    effects: {
        abilityModifiers?: Record<string, number>
        armorClassModifier?: number
        speedModifier?: number
        damageResistance?: DamageType[]
        damageImmunity?: DamageType[]
        damageVulnerability?: DamageType[]
        conditions?: Condition[]
        savingThrowAdvantage?: string[]
        savingThrowDisadvantage?: string[]
        attackAdvantage?: boolean
        attackDisadvantage?: boolean
        periodicDamage?: {
            formula: string
            type: DamageType
            saveForHalf?: { ability: string, dc: number }
        }
        periodicHealing?: {
            formula: string
        }
    }
    createdAt: Date
    expiresAt?: Date
}

export interface ConcentrationCheck {
    characterId: string
    characterName: string
    spellName: string
    dc: number
    required: boolean
    result?: {
        roll: number
        total: number
        success: boolean
    }
}

export interface AutoAttackResult {
    attackRoll: {
        result: number
        total: number
        critical: boolean
        fumble: boolean
    }
    hit: boolean
    damage?: {
        total: number
        breakdown: Array<{
            type: DamageType
            amount: number
        }>
        critical?: boolean
    }
    effects?: TemporaryEffect[]
}

export interface MassEffect {
    id: string
    name: string
    originPoint: { x: number, y: number }
    areaOfEffect: AreaOfEffect
    affectedTargets: string[]
    damage?: {
        formula: string
        type: DamageType
        saveForHalf?: { ability: string, dc: number }
    }
    effects?: Partial<TemporaryEffect>[]
    duration: number // в раундах
    remainingDuration: number
}

type DamageType = 'acid' | 'bludgeoning' | 'cold' | 'fire' | 'force' | 'lightning' | 'necrotic' | 'piercing' | 'poison' | 'psychic' | 'radiant' | 'slashing' | 'thunder'
type Condition = 'blinded' | 'charmed' | 'deafened' | 'frightened' | 'grappled' | 'incapacitated' | 'invisible' | 'paralyzed' | 'petrified' | 'poisoned' | 'prone' | 'restrained' | 'stunned' | 'unconscious'

interface CombatEnhancementsProps {
    sessionId: string
    characterId: string
    targets: Array<{ id: string, name: string, ac: number, hp: number, maxHp: number }>
    onAttack?: (result: AutoAttackResult) => void
    onMassEffect?: (effect: MassEffect) => void
    onEffectApplied?: (effect: TemporaryEffect) => void
    className?: string
}

export const CombatEnhancements: React.FC<CombatEnhancementsProps> = ({
                                                                          sessionId,
                                                                          characterId,
                                                                          targets,
                                                                          onAttack,
                                                                          onMassEffect,
                                                                          onEffectApplied,
                                                                          className
                                                                      }) => {
    const [activeTab, setActiveTab] = useState<'attacks' | 'effects' | 'concentration' | 'areas'>('attacks')
    const [selectedTarget, setSelectedTarget] = useState<string>('')
    const [selectedAction, setSelectedAction] = useState<CombatAction | null>(null)
    const [temporaryEffects, setTemporaryEffects] = useState<TemporaryEffect[]>([])
    const [concentrationSpells, setConcentrationSpells] = useState<Map<string, TemporaryEffect>>(new Map())
    const [massEffects, setMassEffects] = useState<MassEffect[]>([])
    const [isExecuting, setIsExecuting] = useState(false)

    const { rollDice, quickRolls } = useDice({ sessionId, characterId })

    // Предустановленные действия D&D 5e
    const combatActions: CombatAction[] = [
        {
            id: 'longsword_attack',
            type: 'attack',
            name: 'Атака длинным мечом',
            description: 'Рукопашная атака длинным мечом',
            attackBonus: 5,
            damageFormula: '1d8+3',
            damageType: 'slashing',
            range: 5
        },
        {
            id: 'fireball',
            type: 'spell',
            name: 'Огненный шар',
            description: 'Заклинание 3 уровня',
            damageFormula: '8d6',
            damageType: 'fire',
            savingThrow: { ability: 'dexterity', dc: 15 },
            range: 150,
            areaOfEffect: {
                type: 'sphere',
                size: 20,
                origin: 'point'
            }
        },
        {
            id: 'cure_wounds',
            type: 'spell',
            name: 'Лечение ран',
            description: 'Заклинание лечения 1 уровня',
            damageFormula: '1d8+3', // Лечение
            range: 'touch'
        },
        {
            id: 'haste',
            type: 'spell',
            name: 'Ускорение',
            description: 'Заклинание усиления 3 уровня',
            range: 30,
            concentration: true,
            duration: { type: 'concentration', value: 10 }
        },
        {
            id: 'web',
            type: 'spell',
            name: 'Паутина',
            description: 'Заклинание контроля 2 уровня',
            savingThrow: { ability: 'dexterity', dc: 15 },
            range: 60,
            concentration: true,
            duration: { type: 'concentration', value: 10 },
            areaOfEffect: {
                type: 'cube',
                size: 20,
                origin: 'point'
            }
        }
    ]

    // Автоматическая атака с расчетом попадания
    const executeAutoAttack = useCallback(async (action: CombatAction, targetId: string) => {
        if (!action.attackBonus) return

        setIsExecuting(true)

        try {
            const target = targets.find(t => t.id === targetId)
            if (!target) {
                throw new Error('Цель не найдена')
            }

            // Бросок атаки
            const attackResult = await rollDice({
                id: `attack_${action.id}`,
                name: `Атака: ${action.name}`,
                formula: `1d20+${action.attackBonus}`,
                category: 'attack'
            })

            const hit = attackResult.total >= target.ac
            const critical = attackResult.critical
            const fumble = attackResult.rolls.includes(1)

            let damageResult = null
            let effects: TemporaryEffect[] = []

            if (hit && action.damageFormula) {
                // Удваиваем кубики урона при крите
                const damageFormula = critical
                    ? `${action.damageFormula}+${action.damageFormula}`
                    : action.damageFormula

                damageResult = await rollDice({
                    id: `damage_${action.id}`,
                    name: `Урон: ${action.name}${critical ? ' (Критический)' : ''}`,
                    formula: damageFormula,
                    category: 'damage'
                })

                // Применяем временные эффекты если есть
                if (action.concentration && action.duration) {
                    const effect: TemporaryEffect = {
                        id: `effect_${Date.now()}`,
                        name: action.name,
                        description: action.description,
                        type: 'buff',
                        targetId,
                        targetName: target.name,
                        sourceId: characterId,
                        sourceName: 'Player Character',
                        duration: action.duration,
                        remainingDuration: action.duration.value || 1,
                        isConcentration: true,
                        effects: {},
                        createdAt: new Date()
                    }

                    effects.push(effect)
                    addTemporaryEffect(effect)
                }
            }

            const result: AutoAttackResult = {
                attackRoll: {
                    result: attackResult.rolls[0],
                    total: attackResult.total,
                    critical,
                    fumble
                },
                hit,
                damage: damageResult ? {
                    total: damageResult.total,
                    breakdown: [{
                        type: action.damageType || 'bludgeoning',
                        amount: damageResult.total
                    }],
                    critical
                } : undefined,
                effects
            }

            onAttack?.(result)
            return result

        } finally {
            setIsExecuting(false)
        }
    }, [rollDice, targets, characterId, onAttack])

    // Создание областного эффекта
    const createMassEffect = useCallback(async (action: CombatAction, originPoint: { x: number, y: number }) => {
        if (!action.areaOfEffect) return

        const massEffect: MassEffect = {
            id: `mass_effect_${Date.now()}`,
            name: action.name,
            originPoint,
            areaOfEffect: action.areaOfEffect,
            affectedTargets: [], // Будет заполнено на основе позиций
            duration: action.duration?.value || 1,
            remainingDuration: action.duration?.value || 1
        }

        if (action.damageFormula) {
            massEffect.damage = {
                formula: action.damageFormula,
                type: action.damageType || 'force',
                saveForHalf: action.savingThrow
            }
        }

        setMassEffects(prev => [...prev, massEffect])
        onMassEffect?.(massEffect)

        return massEffect
    }, [onMassEffect])

    // Управление временными эффектами
    const addTemporaryEffect = useCallback((effect: TemporaryEffect) => {
        setTemporaryEffects(prev => [...prev, effect])

        if (effect.isConcentration) {
            setConcentrationSpells(prev => new Map(prev.set(effect.sourceId, effect)))
        }

        onEffectApplied?.(effect)
    }, [onEffectApplied])

    const removeTemporaryEffect = useCallback((effectId: string) => {
        setTemporaryEffects(prev => {
            const effect = prev.find(e => e.id === effectId)
            if (effect?.isConcentration) {
                setConcentrationSpells(prevConc => {
                    const newMap = new Map(prevConc)
                    newMap.delete(effect.sourceId)
                    return newMap
                })
            }
            return prev.filter(e => e.id !== effectId)
        })
    }, [])

    // Проверка концентрации
    const rollConcentrationCheck = useCallback(async (damage: number, spellEffect: TemporaryEffect) => {
        const dc = Math.max(10, Math.floor(damage / 2))

        const checkResult = await rollDice({
            id: `concentration_check_${Date.now()}`,
            name: `Проверка концентрации: ${spellEffect.name}`,
            formula: '1d20+3', // +3 за КОН модификатор, нужно брать из персонажа
            category: 'save'
        })

        const success = checkResult.total >= dc

        if (!success) {
            removeTemporaryEffect(spellEffect.id)
        }

        return {
            dc,
            roll: checkResult.rolls[0],
            total: checkResult.total,
            success
        }
    }, [rollDice, removeTemporaryEffect])

    // Обновление эффектов по времени
    useEffect(() => {
        const interval = setInterval(() => {
            setTemporaryEffects(prev => prev.map(effect => {
                if (effect.duration.type === 'rounds' && effect.remainingDuration > 0) {
                    return { ...effect, remainingDuration: effect.remainingDuration - 1 }
                }
                return effect
            }).filter(effect =>
                effect.duration.type === 'until dispelled' ||
                effect.duration.type === 'concentration' ||
                effect.remainingDuration > 0
            ))

            setMassEffects(prev => prev.map(effect => ({
                ...effect,
                remainingDuration: Math.max(0, effect.remainingDuration - 1)
            })).filter(effect => effect.remainingDuration > 0))
        }, 6000) // 6 секунд = 1 раунд в D&D

        return () => clearInterval(interval)
    }, [])

    // Компонент атаки
    const AttackPanel = () => (
        <div className="space-y-4">
            <div className="grid gap-4">
                <div>
                    <Label>Выберите цель</Label>
                    <Select value={selectedTarget} onValueChange={setSelectedTarget}>
                        <SelectTrigger>
                            <SelectValue placeholder="Выберите цель..." />
                        </SelectTrigger>
                        <SelectContent>
                            {targets.map(target => (
                                <SelectItem key={target.id} value={target.id}>
                                    {target.name} (AC {target.ac}, HP {target.hp}/{target.maxHp})
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {combatActions
                        .filter(action => action.type === 'attack' || action.type === 'spell')
                        .map(action => (
                            <Card
                                key={action.id}
                                className={cn(
                                    "cursor-pointer transition-all hover:scale-105",
                                    selectedAction?.id === action.id && "ring-2 ring-primary"
                                )}
                                onClick={() => setSelectedAction(action)}
                            >
                                <CardContent className="p-4">
                                    <div className="flex items-center gap-2 mb-2">
                                        {action.type === 'attack' ? (
                                            <Sword className="h-4 w-4 text-red-600" />
                                        ) : (
                                            <Zap className="h-4 w-4 text-blue-600" />
                                        )}
                                        <span className="font-medium">{action.name}</span>
                                    </div>
                                    <p className="text-sm text-muted-foreground mb-2">
                                        {action.description}
                                    </p>
                                    <div className="flex gap-2 text-xs">
                                        {action.attackBonus && (
                                            <Badge variant="outline">
                                                Атака {formatModifier(action.attackBonus)}
                                            </Badge>
                                        )}
                                        {action.damageFormula && (
                                            <Badge variant="outline">
                                                Урон {action.damageFormula}
                                            </Badge>
                                        )}
                                        {action.areaOfEffect && (
                                            <Badge variant="outline">
                                                Область {action.areaOfEffect.type} {action.areaOfEffect.size}фт
                                            </Badge>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                </div>

                {selectedAction && selectedTarget && (
                    <Button
                        onClick={() => executeAutoAttack(selectedAction, selectedTarget)}
                        disabled={isExecuting}
                        className="w-full"
                        size="lg"
                    >
                        {isExecuting ? (
                            <>
                                <RotateCcw className="h-4 w-4 mr-2 animate-spin" />
                                Выполняется...
                            </>
                        ) : (
                            <>
                                <Target className="h-4 w-4 mr-2" />
                                {selectedAction.type === 'attack' ? 'Атаковать' : 'Применить заклинание'}
                            </>
                        )}
                    </Button>
                )}
            </div>
        </div>
    )

    // Компонент временных эффектов
    const EffectsPanel = () => (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h3 className="font-semibold">Активные эффекты</h3>
                <Badge variant="secondary">
                    {temporaryEffects.length} активных
                </Badge>
            </div>

            {temporaryEffects.length === 0 ? (
                <div className="text-center text-muted-foreground py-8">
                    <Clock className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>Нет активных временных эффектов</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {temporaryEffects.map(effect => (
                        <Card key={effect.id}>
                            <CardContent className="p-4">
                                <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center gap-2">
                                        <div className={cn(
                                            "w-3 h-3 rounded-full",
                                            effect.type === 'buff' ? "bg-green-500" :
                                                effect.type === 'debuff' ? "bg-red-500" :
                                                    "bg-yellow-500"
                                        )} />
                                        <span className="font-medium">{effect.name}</span>
                                        {effect.isConcentration && (
                                            <Badge variant="outline" className="text-xs">
                                                <Brain className="h-3 w-3 mr-1" />
                                                Концентрация
                                            </Badge>
                                        )}
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => removeTemporaryEffect(effect.id)}
                                    >
                                        <XCircle className="h-4 w-4" />
                                    </Button>
                                </div>

                                <p className="text-sm text-muted-foreground mb-2">
                                    На {effect.targetName} от {effect.sourceName}
                                </p>

                                {effect.duration.type === 'rounds' && (
                                    <div className="space-y-1">
                                        <div className="flex justify-between text-xs">
                                            <span>Длительность</span>
                                            <span>{effect.remainingDuration} раундов</span>
                                        </div>
                                        <Progress
                                            value={(effect.remainingDuration / (effect.duration.value || 1)) * 100}
                                            className="h-2"
                                        />
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    )

    // Компонент концентрации
    const ConcentrationPanel = () => (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h3 className="font-semibold">Заклинания концентрации</h3>
                <Badge variant="secondary">
                    {concentrationSpells.size} активных
                </Badge>
            </div>

            {concentrationSpells.size === 0 ? (
                <div className="text-center text-muted-foreground py-8">
                    <Brain className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>Нет заклинаний концентрации</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {Array.from(concentrationSpells.values()).map(spell => (
                        <Card key={spell.id} className="border-blue-200 bg-blue-50/50 dark:border-blue-800 dark:bg-blue-950/20">
                            <CardContent className="p-4">
                                <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center gap-2">
                                        <Brain className="h-4 w-4 text-blue-600" />
                                        <span className="font-medium">{spell.name}</span>
                                    </div>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => rollConcentrationCheck(10, spell)}
                                    >
                                        Проверка концентрации
                                    </Button>
                                </div>

                                <p className="text-sm text-muted-foreground">
                                    {spell.description}
                                </p>

                                <div className="mt-2 text-xs text-blue-600">
                                    💡 При получении урона автоматически запросится проверка концентрации
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    )

    // Компонент областных эффектов
    const AreaEffectsPanel = () => (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h3 className="font-semibold">Областные эффекты</h3>
                <Badge variant="secondary">
                    {massEffects.length} активных
                </Badge>
            </div>

            {massEffects.length === 0 ? (
                <div className="text-center text-muted-foreground py-8">
                    <MapPin className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>Нет активных областных эффектов</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {massEffects.map(effect => (
                        <Card key={effect.id}>
                            <CardContent className="p-4">
                                <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center gap-2">
                                        <MapPin className="h-4 w-4 text-purple-600" />
                                        <span className="font-medium">{effect.name}</span>
                                    </div>
                                    <Badge variant="outline">
                                        {effect.remainingDuration} раундов
                                    </Badge>
                                </div>

                                <div className="grid grid-cols-2 gap-2 text-sm">
                                    <div>
                                        <span className="text-muted-foreground">Тип области:</span>
                                        <div>{effect.areaOfEffect.type}</div>
                                    </div>
                                    <div>
                                        <span className="text-muted-foreground">Размер:</span>
                                        <div>{effect.areaOfEffect.size} футов</div>
                                    </div>
                                </div>

                                {effect.damage && (
                                    <div className="mt-2 p-2 bg-red-50 dark:bg-red-950/20 rounded text-sm">
                                        <span className="font-medium">Урон:</span> {effect.damage.formula} ({effect.damage.type})
                                        {effect.damage.saveForHalf && (
                                            <div className="text-xs mt-1">
                                                Спасбросок {effect.damage.saveForHalf.ability.toUpperCase()}
                                                DC {effect.damage.saveForHalf.dc} для половины урона
                                            </div>
                                        )}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            <Card className="border-dashed">
                <CardContent className="p-4 text-center">
                    <Button
                        variant="outline"
                        onClick={() => {
                            const fireballAction = combatActions.find(a => a.id === 'fireball')
                            if (fireballAction) {
                                createMassEffect(fireballAction, { x: 100, y: 100 })
                            }
                        }}
                    >
                        <Flame className="h-4 w-4 mr-2" />
                        Создать тестовый эффект
                    </Button>
                </CardContent>
            </Card>
        </div>
    )

    return (
        <TooltipProvider>
            <Card className={cn("w-full", className)}>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Crosshair className="h-5 w-5" />
                        Улучшенная боевая система
                    </CardTitle>

                    {/* Навигация */}
                    <div className="flex gap-1 bg-muted p-1 rounded-lg">
                        {[
                            { id: 'attacks', label: 'Атаки', icon: Sword },
                            { id: 'effects', label: 'Эффекты', icon: Clock },
                            { id: 'concentration', label: 'Концентрация', icon: Brain },
                            { id: 'areas', label: 'Области', icon: MapPin }
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
                </CardHeader>

                <CardContent>
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={activeTab}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            transition={{ duration: 0.3 }}
                        >
                            {activeTab === 'attacks' && <AttackPanel />}
                            {activeTab === 'effects' && <EffectsPanel />}
                            {activeTab === 'concentration' && <ConcentrationPanel />}
                            {activeTab === 'areas' && <AreaEffectsPanel />}
                        </motion.div>
                    </AnimatePresence>
                </CardContent>
            </Card>
        </TooltipProvider>
    )
}

// Хук для управления боевыми механиками
export function useCombatEnhancements(sessionId: string, characterId: string) {
    const [combatState, setCombatState] = useState<{
        inCombat: boolean
        round: number
        turn: number
        initiative: Array<{ characterId: string, name: string, initiative: number }>
    }>({
        inCombat: false,
        round: 0,
        turn: 0,
        initiative: []
    })

    const [temporaryEffects, setTemporaryEffects] = useState<TemporaryEffect[]>([])
    const [concentrationSpells, setConcentrationSpells] = useState<Map<string, TemporaryEffect>>(new Map())
    const [massEffects, setMassEffects] = useState<MassEffect[]>([])

    // Автоматический расчет попадания
    const calculateHit = useCallback((attackRoll: number, targetAC: number): boolean => {
        return attackRoll >= targetAC
    }, [])

    // Расчет урона с учетом сопротивлений
    const calculateDamage = useCallback((
        baseDamage: number,
        damageType: DamageType,
        target: {
            resistances?: DamageType[]
            immunities?: DamageType[]
            vulnerabilities?: DamageType[]
        }
    ): number => {
        if (target.immunities?.includes(damageType)) {
            return 0
        }

        if (target.resistances?.includes(damageType)) {
            return Math.floor(baseDamage / 2)
        }

        if (target.vulnerabilities?.includes(damageType)) {
            return baseDamage * 2
        }

        return baseDamage
    }, [])

    // Применение временного эффекта
    const applyTemporaryEffect = useCallback((effect: TemporaryEffect) => {
        setTemporaryEffects(prev => {
            // Удаляем эффект с тем же именем от того же источника, если есть
            const filtered = prev.filter(e =>
                !(e.name === effect.name && e.sourceId === effect.sourceId && e.targetId === effect.targetId)
            )
            return [...filtered, effect]
        })

        if (effect.isConcentration) {
            setConcentrationSpells(prev => new Map(prev.set(effect.sourceId, effect)))
        }
    }, [])

    // Удаление временного эффекта
    const removeTemporaryEffect = useCallback((effectId: string) => {
        setTemporaryEffects(prev => {
            const effect = prev.find(e => e.id === effectId)
            if (effect?.isConcentration) {
                setConcentrationSpells(prevConc => {
                    const newMap = new Map(prevConc)
                    newMap.delete(effect.sourceId)
                    return newMap
                })
            }
            return prev.filter(e => e.id !== effectId)
        })
    }, [])

    // Проверка концентрации при получении урона
    const checkConcentration = useCallback(async (
        damage: number,
        casterId: string,
        constitutionModifier: number = 0
    ): Promise<{ success: boolean, roll: number, dc: number }> => {
        const dc = Math.max(10, Math.floor(damage / 2))
        const roll = Math.floor(Math.random() * 20) + 1
        const total = roll + constitutionModifier
        const success = total >= dc

        if (!success) {
            // Прерываем все заклинания концентрации от этого персонажа
            const concentrationSpell = concentrationSpells.get(casterId)
            if (concentrationSpell) {
                removeTemporaryEffect(concentrationSpell.id)
            }
        }

        return { success, roll: total, dc }
    }, [concentrationSpells, removeTemporaryEffect])

    // Получение целей в области поражения
    const getTargetsInArea = useCallback((
        areaOfEffect: AreaOfEffect,
        originPoint: { x: number, y: number },
        allTargets: Array<{ id: string, position: { x: number, y: number } }>
    ): string[] => {
        return allTargets.filter(target => {
            const distance = Math.sqrt(
                Math.pow(target.position.x - originPoint.x, 2) +
                Math.pow(target.position.y - originPoint.y, 2)
            )

            switch (areaOfEffect.type) {
                case 'sphere':
                case 'cylinder':
                    return distance <= areaOfEffect.size
                case 'cube':
                case 'square':
                    return Math.abs(target.position.x - originPoint.x) <= areaOfEffect.size / 2 &&
                        Math.abs(target.position.y - originPoint.y) <= areaOfEffect.size / 2
                case 'cone':
                    // Упрощенная логика конуса
                    return distance <= areaOfEffect.size
                case 'line':
                    // Упрощенная логика линии
                    return Math.abs(target.position.x - originPoint.x) <= 5 ||
                        Math.abs(target.position.y - originPoint.y) <= 5
                default:
                    return false
            }
        }).map(target => target.id)
    }, [])

    // Обновление эффектов в конце раунда
    const advanceRound = useCallback(() => {
        setCombatState(prev => ({ ...prev, round: prev.round + 1 }))

        // Уменьшаем длительность всех временных эффектов
        setTemporaryEffects(prev => prev.map(effect => {
            if (effect.duration.type === 'rounds') {
                return { ...effect, remainingDuration: effect.remainingDuration - 1 }
            }
            return effect
        }).filter(effect =>
            effect.duration.type === 'until dispelled' ||
            effect.duration.type === 'concentration' ||
            effect.remainingDuration > 0
        ))

        // Уменьшаем длительность областных эффектов
        setMassEffects(prev => prev.map(effect => ({
            ...effect,
            remainingDuration: Math.max(0, effect.remainingDuration - 1)
        })).filter(effect => effect.remainingDuration > 0))
    }, [])

    // Получение модификаторов от активных эффектов
    const getActiveModifiers = useCallback((targetId: string) => {
        const targetEffects = temporaryEffects.filter(e => e.targetId === targetId)

        const modifiers = {
            abilityScores: {} as Record<string, number>,
            armorClass: 0,
            speed: 0,
            resistances: [] as DamageType[],
            immunities: [] as DamageType[],
            vulnerabilities: [] as DamageType[],
            conditions: [] as Condition[],
            attackAdvantage: false,
            attackDisadvantage: false,
            savingThrowAdvantage: [] as string[],
            savingThrowDisadvantage: [] as string[]
        }

        targetEffects.forEach(effect => {
            if (effect.effects.abilityModifiers) {
                Object.entries(effect.effects.abilityModifiers).forEach(([ability, modifier]) => {
                    modifiers.abilityScores[ability] = (modifiers.abilityScores[ability] || 0) + modifier
                })
            }

            if (effect.effects.armorClassModifier) {
                modifiers.armorClass += effect.effects.armorClassModifier
            }

            if (effect.effects.speedModifier) {
                modifiers.speed += effect.effects.speedModifier
            }

            if (effect.effects.damageResistance) {
                modifiers.resistances.push(...effect.effects.damageResistance)
            }

            if (effect.effects.damageImmunity) {
                modifiers.immunities.push(...effect.effects.damageImmunity)
            }

            if (effect.effects.damageVulnerability) {
                modifiers.vulnerabilities.push(...effect.effects.damageVulnerability)
            }

            if (effect.effects.conditions) {
                modifiers.conditions.push(...effect.effects.conditions)
            }

            if (effect.effects.attackAdvantage) {
                modifiers.attackAdvantage = true
            }

            if (effect.effects.attackDisadvantage) {
                modifiers.attackDisadvantage = true
            }

            if (effect.effects.savingThrowAdvantage) {
                modifiers.savingThrowAdvantage.push(...effect.effects.savingThrowAdvantage)
            }

            if (effect.effects.savingThrowDisadvantage) {
                modifiers.savingThrowDisadvantage.push(...effect.effects.savingThrowDisadvantage)
            }
        })

        return modifiers
    }, [temporaryEffects])

    return {
        combatState,
        temporaryEffects,
        concentrationSpells: Array.from(concentrationSpells.values()),
        massEffects,

        // Методы
        calculateHit,
        calculateDamage,
        applyTemporaryEffect,
        removeTemporaryEffect,
        checkConcentration,
        getTargetsInArea,
        advanceRound,
        getActiveModifiers,

        // Состояние
        setCombatState,
        setMassEffects
    }
}

// Компонент таймера эффектов
export function EffectTimers({ effects }: { effects: TemporaryEffect[] }) {
    return (
        <div className="space-y-2">
            {effects
                .filter(effect => effect.duration.type === 'rounds')
                .map(effect => (
                    <div key={effect.id} className="flex items-center gap-2 p-2 bg-muted/50 rounded">
                        <Timer className="h-4 w-4" />
                        <span className="flex-1 text-sm font-medium">{effect.name}</span>
                        <Badge variant="outline" className="text-xs">
                            {effect.remainingDuration}р
                        </Badge>
                        <div className="w-16">
                            <Progress
                                value={(effect.remainingDuration / (effect.duration.value || 1)) * 100}
                                className="h-1"
                            />
                        </div>
                    </div>
                ))}
        </div>
    )
}

// Компонент индикатора концентрации
export function ConcentrationIndicator({
                                           isConcentrating,
                                           spellName,
                                           onBreak
                                       }: {
    isConcentrating: boolean
    spellName?: string
    onBreak?: () => void
}) {
    if (!isConcentrating) return null

    return (
        <div className="flex items-center gap-2 p-2 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded">
            <Brain className="h-4 w-4 text-blue-600 animate-pulse" />
            <span className="flex-1 text-sm font-medium">
                Концентрация: {spellName}
            </span>
            <Button
                variant="ghost"
                size="sm"
                onClick={onBreak}
                className="h-6 w-6 p-0 text-blue-600 hover:text-blue-800"
            >
                <XCircle className="h-4 w-4" />
            </Button>
        </div>
    )
}