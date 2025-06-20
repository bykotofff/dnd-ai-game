// frontend/src/components/combat/combat-automation.tsx
'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip'
import {
    Zap,
    Shield,
    Target,
    Brain,
    Clock,
    AlertTriangle,
    CheckCircle,
    XCircle,
    Flame,
    Snowflake,
    Skull,
    Heart,
    Eye,
    Timer,
    RotateCcw,
    Play,
    Pause,
    FastForward
} from 'lucide-react'
import { cn, formatModifier } from '@/lib/utils'
import { motion, AnimatePresence } from 'framer-motion'
import { useSocket } from '@/hooks/use-socket'
import { useGameStore } from '@/stores/game-store'
import { useDice } from '@/hooks/use-dice'
import toast from 'react-hot-toast'

// Расширенные типы для автоматизации боя
export interface AutoCombatSettings {
    enableAutoHit: boolean
    enableAutoRolls: boolean
    enableAreaEffects: boolean
    enableConcentrationChecks: boolean
    animationSpeed: 'slow' | 'normal' | 'fast'
    confirmCriticalHits: boolean
    confirmMassEffects: boolean
}

export interface CombatTarget {
    id: string
    name: string
    type: 'player' | 'npc' | 'monster'
    position: { x: number, y: number }
    stats: {
        ac: number
        hp: number
        maxHp: number
        speed: number
        savingThrows: Record<string, number>
        resistances: string[]
        immunities: string[]
        vulnerabilities: string[]
        conditions: string[]
    }
    isVisible: boolean
    isDead: boolean
}

export interface AutoAttackSequence {
    id: string
    attackerId: string
    targetId: string
    weaponName: string
    attackBonus: number
    damageFormula: string
    damageType: string
    criticalRange: number
    isRanged: boolean
    range: number
    isAutoHit?: boolean
}

export interface AreaEffectTemplate {
    id: string
    name: string
    type: 'sphere' | 'cube' | 'cone' | 'line' | 'cylinder'
    size: number
    color: string
    opacity: number
    duration: number
    remainingDuration: number
    effects: {
        damage?: {
            formula: string
            type: string
            saveForHalf?: { ability: string, dc: number }
        }
        healing?: {
            formula: string
        }
        conditions?: string[]
        movement?: {
            speedModifier: number
            restrictMovement: boolean
        }
    }
    position: { x: number, y: number }
    affectedTargets: string[]
    createdBy: string
    persistent: boolean
}

interface CombatAutomationProps {
    sessionId: string
    targets: CombatTarget[]
    currentTurn: string
    settings: AutoCombatSettings
    onSettingsChange: (settings: AutoCombatSettings) => void
    onTargetUpdate: (targetId: string, updates: Partial<CombatTarget>) => void
    onEffectCreate: (effect: AreaEffectTemplate) => void
    className?: string
}

export const CombatAutomation: React.FC<CombatAutomationProps> = ({
                                                                      sessionId,
                                                                      targets,
                                                                      currentTurn,
                                                                      settings,
                                                                      onSettingsChange,
                                                                      onTargetUpdate,
                                                                      onEffectCreate,
                                                                      className
                                                                  }) => {
    const [activeEffects, setActiveEffects] = useState<AreaEffectTemplate[]>([])
    const [pendingAttacks, setPendingAttacks] = useState<AutoAttackSequence[]>([])
    const [concentrationChecks, setConcentrationChecks] = useState<Array<{
        characterId: string
        spellName: string
        damage: number
        dc: number
        pending: boolean
    }>>([])
    const [combatLog, setCombatLog] = useState<Array<{
        id: string
        timestamp: Date
        type: 'attack' | 'damage' | 'heal' | 'effect' | 'concentration'
        message: string
        details: any
    }>>([])
    const [isProcessing, setIsProcessing] = useState(false)
    const [showAreaEffectDialog, setShowAreaEffectDialog] = useState<{
        show: boolean
        template?: AreaEffectTemplate
        position?: { x: number, y: number }
    }>({ show: false })

    const { socket } = useSocket()
    const { currentSession } = useGameStore()
    const { rollDice, quickRolls } = useDice({ sessionId })

    // Автоматический расчет попадания
    const executeAutoAttack = useCallback(async (attack: AutoAttackSequence) => {
        const target = targets.find(t => t.id === attack.targetId)
        if (!target) return

        setIsProcessing(true)

        try {
            // Бросок атаки
            const attackRoll = await rollDice({
                id: `auto_attack_${attack.id}`,
                name: `Автоатака: ${attack.weaponName}`,
                formula: `1d20+${attack.attackBonus}`,
                category: 'attack'
            })

            const naturalRoll = attackRoll.rolls[0]
            const isCritical = naturalRoll >= attack.criticalRange
            const isFumble = naturalRoll === 1
            const hits = attack.isAutoHit || (!isFumble && attackRoll.total >= target.stats.ac)

            let damageResult = null
            let appliedDamage = 0

            if (hits) {
                // Формула урона (удваиваем кубики при крите)
                const damageFormula = isCritical
                    ? `${attack.damageFormula}+${attack.damageFormula}`
                    : attack.damageFormula

                damageResult = await rollDice({
                    id: `auto_damage_${attack.id}`,
                    name: `Урон: ${attack.weaponName}${isCritical ? ' (КРИТ!)' : ''}`,
                    formula: damageFormula,
                    category: 'damage'
                })

                // Применяем сопротивления/уязвимости
                let finalDamage = damageResult.total

                if (target.stats.immunities.includes(attack.damageType)) {
                    finalDamage = 0
                } else if (target.stats.resistances.includes(attack.damageType)) {
                    finalDamage = Math.floor(finalDamage / 2)
                } else if (target.stats.vulnerabilities.includes(attack.damageType)) {
                    finalDamage = finalDamage * 2
                }

                appliedDamage = finalDamage

                // Обновляем HP цели
                const newHp = Math.max(0, target.stats.hp - appliedDamage)
                onTargetUpdate(target.id, {
                    stats: { ...target.stats, hp: newHp },
                    isDead: newHp === 0
                })

                // Проверка концентрации если цель получила урон
                if (appliedDamage > 0 && settings.enableConcentrationChecks) {
                    const concentratingSpells = getConcentratingSpells(target.id)
                    for (const spell of concentratingSpells) {
                        triggerConcentrationCheck(target.id, spell.name, appliedDamage)
                    }
                }
            }

            // Лог результата
            const logEntry = {
                id: `log_${Date.now()}`,
                timestamp: new Date(),
                type: 'attack' as const,
                message: `${getCharacterName(attack.attackerId)} атакует ${target.name}: ${
                    hits ?
                        `Попадание! ${appliedDamage} урона${isCritical ? ' (КРИТИЧЕСКИЙ УСПЕХ!)' : ''}` :
                        isFumble ? 'КРИТИЧЕСКИЙ ПРОВАЛ!' : 'Промах'
                }`,
                details: {
                    attackRoll: attackRoll.total,
                    damage: appliedDamage,
                    critical: isCritical,
                    fumble: isFumble,
                    targetAC: target.stats.ac
                }
            }

            setCombatLog(prev => [logEntry, ...prev].slice(0, 50))

            // Отправляем событие через Socket.IO
            if (socket) {
                socket.emit('combat_action', {
                    sessionId,
                    type: 'auto_attack',
                    attackerId: attack.attackerId,
                    targetId: attack.targetId,
                    result: logEntry.details
                })
            }

            // Показываем результат
            if (isCritical && settings.confirmCriticalHits) {
                toast.success(`🎯 КРИТИЧЕСКИЙ УСПЕХ! ${appliedDamage} урона!`, { duration: 4000 })
            } else if (hits) {
                toast.success(`Попадание! ${appliedDamage} урона`)
            } else {
                toast.error('Промах!')
            }

        } finally {
            setIsProcessing(false)
        }
    }, [targets, onTargetUpdate, settings, rollDice, socket, sessionId])

    // Создание областного эффекта
    const createAreaEffect = useCallback(async (template: Omit<AreaEffectTemplate, 'id' | 'affectedTargets'>) => {
        const effect: AreaEffectTemplate = {
            ...template,
            id: `area_effect_${Date.now()}`,
            affectedTargets: []
        }

        // Определяем затронутые цели
        const affectedTargets = targets.filter(target => {
            if (!target.isVisible || target.isDead) return false

            const distance = Math.sqrt(
                Math.pow(target.position.x - effect.position.x, 2) +
                Math.pow(target.position.y - effect.position.y, 2)
            )

            switch (effect.type) {
                case 'sphere':
                case 'cylinder':
                    return distance <= effect.size / 2
                case 'cube':
                    return Math.abs(target.position.x - effect.position.x) <= effect.size / 2 &&
                        Math.abs(target.position.y - effect.position.y) <= effect.size / 2
                case 'cone':
                    // Упрощенная логика конуса - 90 градусов
                    return distance <= effect.size &&
                        target.position.x >= effect.position.x &&
                        Math.abs(target.position.y - effect.position.y) <= distance
                case 'line':
                    // Линия шириной 5 футов
                    return (Math.abs(target.position.x - effect.position.x) <= 2.5 ||
                            Math.abs(target.position.y - effect.position.y) <= 2.5) &&
                        distance <= effect.size
                default:
                    return false
            }
        })

        effect.affectedTargets = affectedTargets.map(t => t.id)

        // Применяем эффекты урона немедленно
        if (effect.effects.damage) {
            for (const target of affectedTargets) {
                await applyAreaDamage(effect, target)
            }
        }

        // Применяем лечение
        if (effect.effects.healing) {
            for (const target of affectedTargets) {
                await applyAreaHealing(effect, target)
            }
        }

        setActiveEffects(prev => [...prev, effect])
        onEffectCreate(effect)

        // Лог создания эффекта
        const logEntry = {
            id: `log_${Date.now()}`,
            timestamp: new Date(),
            type: 'effect' as const,
            message: `${effect.name} активирован! Затронуто целей: ${affectedTargets.length}`,
            details: { effect, affectedTargets: affectedTargets.map(t => t.name) }
        }

        setCombatLog(prev => [logEntry, ...prev].slice(0, 50))

        if (settings.confirmMassEffects && affectedTargets.length > 1) {
            toast.success(`${effect.name} затронул ${affectedTargets.length} целей!`)
        }

    }, [targets, onEffectCreate, settings])

    // Применение урона от областного эффекта
    const applyAreaDamage = useCallback(async (effect: AreaEffectTemplate, target: CombatTarget) => {
        if (!effect.effects.damage) return

        let damage = 0

        // Спасательный бросок если требуется
        if (effect.effects.damage.saveForHalf) {
            const save = effect.effects.damage.saveForHalf
            const saveBonus = target.stats.savingThrows[save.ability] || 0

            const saveRoll = await rollDice({
                id: `save_${effect.id}_${target.id}`,
                name: `Спасбросок ${save.ability.toUpperCase()}: ${target.name}`,
                formula: `1d20+${saveBonus}`,
                category: 'save'
            })

            const saved = saveRoll.total >= save.dc

            // Бросаем урон
            const damageRoll = await rollDice({
                id: `area_damage_${effect.id}_${target.id}`,
                name: `Урон от ${effect.name}`,
                formula: effect.effects.damage.formula,
                category: 'damage'
            })

            damage = saved ? Math.floor(damageRoll.total / 2) : damageRoll.total

            setCombatLog(prev => [{
                id: `log_${Date.now()}`,
                timestamp: new Date(),
                type: 'damage' as const,
                message: `${target.name}: Спасбросок ${saved ? 'УСПЕХ' : 'ПРОВАЛ'} - ${damage} урона`,
                details: { saveRoll: saveRoll.total, damage, saved }
            }, ...prev].slice(0, 50))

        } else {
            // Прямой урон без спасброска
            const damageRoll = await rollDice({
                id: `area_damage_${effect.id}_${target.id}`,
                name: `Урон от ${effect.name}`,
                formula: effect.effects.damage.formula,
                category: 'damage'
            })
            damage = damageRoll.total
        }

        // Применяем сопротивления
        if (target.stats.immunities.includes(effect.effects.damage.type)) {
            damage = 0
        } else if (target.stats.resistances.includes(effect.effects.damage.type)) {
            damage = Math.floor(damage / 2)
        } else if (target.stats.vulnerabilities.includes(effect.effects.damage.type)) {
            damage = damage * 2
        }

        if (damage > 0) {
            const newHp = Math.max(0, target.stats.hp - damage)
            onTargetUpdate(target.id, {
                stats: { ...target.stats, hp: newHp },
                isDead: newHp === 0
            })

            // Проверка концентрации
            if (settings.enableConcentrationChecks) {
                const concentratingSpells = getConcentratingSpells(target.id)
                for (const spell of concentratingSpells) {
                    triggerConcentrationCheck(target.id, spell.name, damage)
                }
            }
        }
    }, [rollDice, onTargetUpdate, settings])

    // Применение лечения от областного эффекта
    const applyAreaHealing = useCallback(async (effect: AreaEffectTemplate, target: CombatTarget) => {
        if (!effect.effects.healing || target.isDead) return

        const healingRoll = await rollDice({
            id: `area_healing_${effect.id}_${target.id}`,
            name: `Лечение от ${effect.name}`,
            formula: effect.effects.healing.formula,
            category: 'healing'
        })

        const healing = healingRoll.total
        const newHp = Math.min(target.stats.maxHp, target.stats.hp + healing)

        onTargetUpdate(target.id, {
            stats: { ...target.stats, hp: newHp }
        })

        setCombatLog(prev => [{
            id: `log_${Date.now()}`,
            timestamp: new Date(),
            type: 'heal' as const,
            message: `${target.name} восстанавливает ${healing} HP от ${effect.name}`,
            details: { healing, newHp }
        }, ...prev].slice(0, 50))
    }, [rollDice, onTargetUpdate])

    // Проверка концентрации
    const triggerConcentrationCheck = useCallback((characterId: string, spellName: string, damage: number) => {
        const dc = Math.max(10, Math.floor(damage / 2))

        setConcentrationChecks(prev => [...prev, {
            characterId,
            spellName,
            damage,
            dc,
            pending: true
        }])
    }, [])

    // Выполнение проверки концентрации
    const executeConcentrationCheck = useCallback(async (checkIndex: number) => {
        const check = concentrationChecks[checkIndex]
        if (!check || !check.pending) return

        const target = targets.find(t => t.id === check.characterId)
        if (!target) return

        // Предполагаем модификатор Телосложения +2 (можно настроить)
        const constitutionModifier = 2

        const concentrationRoll = await rollDice({
            id: `concentration_${check.characterId}_${Date.now()}`,
            name: `Концентрация: ${check.spellName}`,
            formula: `1d20+${constitutionModifier}`,
            category: 'save'
        })

        const success = concentrationRoll.total >= check.dc

        setCombatLog(prev => [{
            id: `log_${Date.now()}`,
            timestamp: new Date(),
            type: 'concentration' as const,
            message: `${getCharacterName(check.characterId)}: Концентрация на ${check.spellName} ${
                success ? 'СОХРАНЕНА' : 'ПРЕРВАНА'
            } (${concentrationRoll.total} vs DC ${check.dc})`,
            details: { roll: concentrationRoll.total, dc: check.dc, success, spellName: check.spellName }
        }, ...prev].slice(0, 50))

        // Удаляем проверку из списка
        setConcentrationChecks(prev => prev.filter((_, index) => index !== checkIndex))

        if (!success) {
            toast.error(`Концентрация на ${check.spellName} прервана!`)
            // Здесь можно добавить логику удаления заклинания концентрации
        } else {
            toast.success(`Концентрация на ${check.spellName} сохранена`)
        }

        // Отправляем событие
        if (socket) {
            socket.emit('concentration_check', {
                sessionId,
                characterId: check.characterId,
                spellName: check.spellName,
                result: { roll: concentrationRoll.total, dc: check.dc, success }
            })
        }
    }, [concentrationChecks, targets, rollDice, socket, sessionId])

    // Обновление активных эффектов
    useEffect(() => {
        const interval = setInterval(() => {
            setActiveEffects(prev => prev.map(effect => {
                if (effect.persistent) return effect

                const newDuration = Math.max(0, effect.remainingDuration - 1)
                return { ...effect, remainingDuration: newDuration }
            }).filter(effect => effect.persistent || effect.remainingDuration > 0))
        }, 6000) // 6 секунд = 1 раунд

        return () => clearInterval(interval)
    }, [])

    // Вспомогательные функции
    const getCharacterName = (characterId: string): string => {
        const target = targets.find(t => t.id === characterId)
        return target?.name || 'Неизвестный персонаж'
    }

    const getConcentratingSpells = (characterId: string): Array<{ name: string }> => {
        // Здесь должна быть логика получения активных заклинаний концентрации
        // Для примера возвращаем пустой массив
        return []
    }

    // Предустановленные шаблоны областных эффектов
    const areaEffectTemplates: Omit<AreaEffectTemplate, 'id' | 'position' | 'affectedTargets'>[] = [
        {
            name: 'Огненный шар',
            type: 'sphere',
            size: 20,
            color: '#ff4444',
            opacity: 0.6,
            duration: 1,
            remainingDuration: 1,
            effects: {
                damage: {
                    formula: '8d6',
                    type: 'fire',
                    saveForHalf: { ability: 'dexterity', dc: 15 }
                }
            },
            createdBy: currentTurn,
            persistent: false
        },
        {
            name: 'Лечащий дождь',
            type: 'cylinder',
            size: 30,
            color: '#44ff44',
            opacity: 0.4,
            duration: 10,
            remainingDuration: 10,
            effects: {
                healing: {
                    formula: '2d4+2'
                }
            },
            createdBy: currentTurn,
            persistent: false
        },
        {
            name: 'Ледяная буря',
            type: 'cube',
            size: 20,
            color: '#4444ff',
            opacity: 0.5,
            duration: 3,
            remainingDuration: 3,
            effects: {
                damage: {
                    formula: '3d8',
                    type: 'cold',
                    saveForHalf: { ability: 'dexterity', dc: 16 }
                },
                conditions: ['restrained']
            },
            createdBy: currentTurn,
            persistent: false
        },
        {
            name: 'Зона безмолвия',
            type: 'sphere',
            size: 20,
            color: '#888888',
            opacity: 0.3,
            duration: 100,
            remainingDuration: 100,
            effects: {
                conditions: ['silenced']
            },
            createdBy: currentTurn,
            persistent: true
        }
    ]

    return (
        <TooltipProvider>
            <div className={cn("space-y-4", className)}>
                {/* Панель управления */}
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Zap className="h-5 w-5" />
                                Автоматизация боя
                            </div>
                            <div className="flex items-center gap-2">
                                <Badge variant={isProcessing ? "secondary" : "outline"}>
                                    {isProcessing ? 'Обработка...' : 'Готов'}
                                </Badge>
                                {activeEffects.length > 0 && (
                                    <Badge variant="secondary">
                                        {activeEffects.length} активных эффектов
                                    </Badge>
                                )}
                            </div>
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {/* Быстрые действия */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setShowAreaEffectDialog({ show: true, position: { x: 100, y: 100 } })}
                                className="flex items-center gap-1"
                            >
                                <Flame className="h-4 w-4" />
                                Огненный шар
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => createAreaEffect({
                                    ...areaEffectTemplates[1],
                                    position: { x: 150, y: 150 }
                                })}
                                className="flex items-center gap-1"
                            >
                                <Heart className="h-4 w-4" />
                                Лечение
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => createAreaEffect({
                                    ...areaEffectTemplates[2],
                                    position: { x: 200, y: 200 }
                                })}
                                className="flex items-center gap-1"
                            >
                                <Snowflake className="h-4 w-4" />
                                Лед
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                    // Массовая проверка концентрации для всех
                                    targets.forEach(target => {
                                        if (!target.isDead) {
                                            triggerConcentrationCheck(target.id, 'Тестовое заклинание', 10)
                                        }
                                    })
                                }}
                                className="flex items-center gap-1"
                            >
                                <Brain className="h-4 w-4" />
                                Тест концентрации
                            </Button>
                        </div>

                        {/* Настройки автоматизации */}
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 p-3 bg-muted/50 rounded-lg">
                            <label className="flex items-center gap-2 text-sm">
                                <input
                                    type="checkbox"
                                    checked={settings.enableAutoHit}
                                    onChange={(e) => onSettingsChange({
                                        ...settings,
                                        enableAutoHit: e.target.checked
                                    })}
                                    className="rounded"
                                />
                                Авто-попадания
                            </label>
                            <label className="flex items-center gap-2 text-sm">
                                <input
                                    type="checkbox"
                                    checked={settings.enableAreaEffects}
                                    onChange={(e) => onSettingsChange({
                                        ...settings,
                                        enableAreaEffects: e.target.checked
                                    })}
                                    className="rounded"
                                />
                                Областные эффекты
                            </label>
                            <label className="flex items-center gap-2 text-sm">
                                <input
                                    type="checkbox"
                                    checked={settings.enableConcentrationChecks}
                                    onChange={(e) => onSettingsChange({
                                        ...settings,
                                        enableConcentrationChecks: e.target.checked
                                    })}
                                    className="rounded"
                                />
                                Проверки концентрации
                            </label>
                        </div>
                    </CardContent>
                </Card>

                {/* Активные эффекты области */}
                {activeEffects.length > 0 && (
                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="flex items-center gap-2">
                                <Target className="h-4 w-4" />
                                Активные областные эффекты
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-3">
                                {activeEffects.map(effect => (
                                    <div
                                        key={effect.id}
                                        className="flex items-center justify-between p-3 border rounded-lg"
                                        style={{
                                            borderColor: effect.color,
                                            backgroundColor: `${effect.color}10`
                                        }}
                                    >
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="font-medium">{effect.name}</span>
                                                <Badge variant="outline" className="text-xs">
                                                    {effect.type} {effect.size}фт
                                                </Badge>
                                                <Badge variant="secondary" className="text-xs">
                                                    {effect.affectedTargets.length} целей
                                                </Badge>
                                            </div>

                                            {!effect.persistent && (
                                                <div className="flex items-center gap-2">
                                                    <Timer className="h-3 w-3" />
                                                    <Progress
                                                        value={(effect.remainingDuration / effect.duration) * 100}
                                                        className="h-2 flex-1 max-w-32"
                                                    />
                                                    <span className="text-xs text-muted-foreground">
                                                        {effect.remainingDuration}р
                                                    </span>
                                                </div>
                                            )}
                                        </div>

                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => setActiveEffects(prev =>
                                                prev.filter(e => e.id !== effect.id)
                                            )}
                                        >
                                            <XCircle className="h-4 w-4" />
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Ожидающие проверки концентрации */}
                {concentrationChecks.length > 0 && (
                    <Card className="border-yellow-200 bg-yellow-50/50 dark:border-yellow-800 dark:bg-yellow-950/20">
                        <CardHeader className="pb-3">
                            <CardTitle className="flex items-center gap-2 text-yellow-800 dark:text-yellow-200">
                                <Brain className="h-4 w-4" />
                                Проверки концентрации
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-2">
                                {concentrationChecks.map((check, index) => (
                                    <div key={index} className="flex items-center justify-between p-2 bg-white dark:bg-gray-800 rounded border">
                                        <div>
                                            <span className="font-medium">{getCharacterName(check.characterId)}</span>
                                            <div className="text-sm text-muted-foreground">
                                                {check.spellName} • {check.damage} урона • DC {check.dc}
                                            </div>
                                        </div>
                                        <Button
                                            size="sm"
                                            onClick={() => executeConcentrationCheck(index)}
                                            disabled={!check.pending}
                                        >
                                            {check.pending ? 'Проверить' : 'Выполнено'}
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Лог боя */}
                <Card>
                    <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                            <CardTitle className="flex items-center gap-2">
                                <Clock className="h-4 w-4" />
                                Лог боя
                            </CardTitle>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setCombatLog([])}
                            >
                                Очистить
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2 max-h-64 overflow-y-auto">
                            <AnimatePresence>
                                {combatLog.slice(0, 20).map(entry => (
                                    <motion.div
                                        key={entry.id}
                                        initial={{ opacity: 0, y: -10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -10 }}
                                        className={cn(
                                            "p-2 rounded text-sm border-l-4",
                                            entry.type === 'attack' && "border-l-red-500 bg-red-50/50 dark:bg-red-950/20",
                                            entry.type === 'damage' && "border-l-orange-500 bg-orange-50/50 dark:bg-orange-950/20",
                                            entry.type === 'heal' && "border-l-green-500 bg-green-50/50 dark:bg-green-950/20",
                                            entry.type === 'effect' && "border-l-purple-500 bg-purple-50/50 dark:bg-purple-950/20",
                                            entry.type === 'concentration' && "border-l-blue-500 bg-blue-50/50 dark:bg-blue-950/20"
                                        )}
                                    >
                                        <div className="flex items-start justify-between">
                                            <span className="flex-1">{entry.message}</span>
                                            <span className="text-xs text-muted-foreground ml-2">
                                                {entry.timestamp.toLocaleTimeString()}
                                            </span>
                                        </div>
                                    </motion.div>
                                ))}
                            </AnimatePresence>

                            {combatLog.length === 0 && (
                                <div className="text-center text-muted-foreground py-4">
                                    Лог боя пуст
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Диалог создания областного эффекта */}
                <Dialog
                    open={showAreaEffectDialog.show}
                    onOpenChange={(open) => setShowAreaEffectDialog({ show: open })}
                >
                    <DialogContent className="max-w-2xl">
                        <DialogHeader>
                            <DialogTitle>Создать областной эффект</DialogTitle>
                            <DialogDescription>
                                Выберите тип и параметры областного эффекта
                            </DialogDescription>
                        </DialogHeader>

                        <div className="grid grid-cols-2 gap-4 mt-4">
                            {areaEffectTemplates.map((template, index) => (
                                <Card
                                    key={index}
                                    className="cursor-pointer hover:scale-105 transition-transform"
                                    onClick={() => {
                                        createAreaEffect({
                                            ...template,
                                            position: showAreaEffectDialog.position || { x: 100, y: 100 }
                                        })
                                        setShowAreaEffectDialog({ show: false })
                                    }}
                                >
                                    <CardContent className="p-4">
                                        <div className="flex items-center gap-2 mb-2">
                                            <div
                                                className="w-4 h-4 rounded"
                                                style={{ backgroundColor: template.color }}
                                            />
                                            <span className="font-medium">{template.name}</span>
                                        </div>
                                        <div className="text-sm text-muted-foreground space-y-1">
                                            <div>{template.type} • {template.size} футов</div>
                                            {template.effects.damage && (
                                                <div>Урон: {template.effects.damage.formula}</div>
                                            )}
                                            {template.effects.healing && (
                                                <div>Лечение: {template.effects.healing.formula}</div>
                                            )}
                                            <div>Длительность: {template.duration} раундов</div>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </DialogContent>
                </Dialog>
            </div>
        </TooltipProvider>
    )
}

// Компонент индикатора состояния цели
export function TargetStatusIndicator({
                                          target,
                                          showEffects = true
                                      }: {
    target: CombatTarget
    showEffects?: boolean
}) {
    const hpPercentage = (target.stats.hp / target.stats.maxHp) * 100

    return (
        <div className="space-y-2">
            {/* Полоса здоровья */}
            <div className="space-y-1">
                <div className="flex justify-between text-sm">
                    <span>{target.name}</span>
                    <span>{target.stats.hp}/{target.stats.maxHp}</span>
                </div>
                <Progress
                    value={hpPercentage}
                    className={cn(
                        "h-2",
                        hpPercentage <= 25 && "bg-red-100",
                        hpPercentage <= 50 && hpPercentage > 25 && "bg-yellow-100"
                    )}
                />
            </div>

            {/* Статусы и условия */}
            {showEffects && target.stats.conditions.length > 0 && (
                <div className="flex flex-wrap gap-1">
                    {target.stats.conditions.map(condition => (
                        <Badge key={condition} variant="outline" className="text-xs">
                            {condition}
                        </Badge>
                    ))}
                </div>
            )}

            {/* Сопротивления */}
            {(target.stats.resistances.length > 0 || target.stats.immunities.length > 0) && (
                <div className="text-xs text-muted-foreground">
                    {target.stats.resistances.length > 0 && (
                        <span>Сопротивления: {target.stats.resistances.join(', ')}</span>
                    )}
                    {target.stats.immunities.length > 0 && (
                        <span>Иммунитеты: {target.stats.immunities.join(', ')}</span>
                    )}
                </div>
            )}
        </div>
    )
}