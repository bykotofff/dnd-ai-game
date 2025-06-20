// frontend/src/components/combat/index.ts
// Центральный экспорт всех боевых компонентов

export { CombatEnhancements } from './combat-enhancements'
export { CombatAutomation, TargetStatusIndicator } from './combat-automation'
export { EffectTimers, ConcentrationIndicator } from './combat-enhancements'
export { useCombatEnhancements } from './combat-enhancements'

// frontend/src/components/combat/complete-combat-interface.tsx
'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import { CombatEnhancements } from './combat-enhancements'
import { CombatAutomation, TargetStatusIndicator } from './combat-automation'
import { EffectTimers, ConcentrationIndicator } from './combat-enhancements'
import { useCombatEnhancements } from './combat-enhancements'
import { useDice } from '@/hooks/use-dice'
import { useSocket } from '@/hooks/use-socket'
import { useGameStore } from '@/stores/game-store'
import {
    Sword,
    Shield,
    Target,
    Clock,
    Brain,
    Zap,
    Users,
    Settings,
    Play,
    Pause,
    RotateCcw,
    AlertTriangle,
    CheckCircle
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { motion, AnimatePresence } from 'framer-motion'
import toast from 'react-hot-toast'

// Типы для полной боевой системы
interface CombatParticipant {
    id: string
    name: string
    type: 'player' | 'npc' | 'monster'
    initiative: number
    hasActed: boolean
    position: { x: number, y: number }
    stats: {
        ac: number
        hp: number
        maxHp: number
        speed: number
        level?: number
        proficiencyBonus?: number
        abilityModifiers: Record<string, number>
        savingThrows: Record<string, number>
        skills: Record<string, number>
        resistances: string[]
        immunities: string[]
        vulnerabilities: string[]
        conditions: string[]
    }
    equipment: {
        weapons: Array<{
            name: string
            attackBonus: number
            damageFormula: string
            damageType: string
            range: number
            isRanged: boolean
        }>
        armor: {
            name: string
            ac: number
            type: string
        }
    }
    spells: Array<{
        name: string
        level: number
        isConcentration: boolean
        range: number
        areaOfEffect?: {
            type: string
            size: number
        }
        damage?: {
            formula: string
            type: string
            saveForHalf?: { ability: string, dc: number }
        }
    }>
    isVisible: boolean
    isDead: boolean
    isUnconscious: boolean
}

interface CombatRound {
    number: number
    startTime: Date
    participants: CombatParticipant[]
    currentTurn: number
    isActive: boolean
}

interface CompleteCombatInterfaceProps {
    sessionId: string
    isGameMaster?: boolean
    onCombatStateChange?: (state: any) => void
    className?: string
}

export const CompleteCombatInterface: React.FC<CompleteCombatInterfaceProps> = ({
                                                                                    sessionId,
                                                                                    isGameMaster = false,
                                                                                    onCombatStateChange,
                                                                                    className
                                                                                }) => {
    const [combatRound, setCombatRound] = useState<CombatRound>({
        number: 0,
        startTime: new Date(),
        participants: [],
        currentTurn: 0,
        isActive: false
    })

    const [autoSettings, setAutoSettings] = useState({
        enableAutoHit: false,
        enableAutoRolls: true,
        enableAreaEffects: true,
        enableConcentrationChecks: true,
        animationSpeed: 'normal' as const,
        confirmCriticalHits: true,
        confirmMassEffects: true
    })

    const [selectedParticipant, setSelectedParticipant] = useState<string>('')
    const [combatMode, setCombatMode] = useState<'manual' | 'assisted' | 'auto'>('assisted')
    const [showCombatSettings, setShowCombatSettings] = useState(false)

    const { socket, isConnected } = useSocket()
    const { currentSession, selectedCharacter } = useGameStore()
    const { rollDice } = useDice({ sessionId })
    const {
        temporaryEffects,
        concentrationSpells,
        massEffects,
        calculateHit,
        calculateDamage,
        applyTemporaryEffect,
        removeTemporaryEffect,
        checkConcentration,
        advanceRound,
        getActiveModifiers
    } = useCombatEnhancements(sessionId, selectedCharacter?.id || '')

    // Демонстрационные участники боя
    const demoParticipants: CombatParticipant[] = [
        {
            id: 'player_1',
            name: 'Эльдра Звездопад',
            type: 'player',
            initiative: 18,
            hasActed: false,
            position: { x: 100, y: 100 },
            stats: {
                ac: 15,
                hp: 45,
                maxHp: 45,
                speed: 30,
                level: 5,
                proficiencyBonus: 3,
                abilityModifiers: { strength: -1, dexterity: 2, constitution: 1, intelligence: 4, wisdom: 1, charisma: 0 },
                savingThrows: { intelligence: 7, wisdom: 4 },
                skills: { arcana: 10, investigation: 7 },
                resistances: [],
                immunities: [],
                vulnerabilities: [],
                conditions: []
            },
            equipment: {
                weapons: [{
                    name: 'Кинжал',
                    attackBonus: 5,
                    damageFormula: '1d4+2',
                    damageType: 'piercing',
                    range: 20,
                    isRanged: true
                }],
                armor: { name: 'Мантия', ac: 13, type: 'light' }
            },
            spells: [
                {
                    name: 'Огненный шар',
                    level: 3,
                    isConcentration: false,
                    range: 150,
                    areaOfEffect: { type: 'sphere', size: 20 },
                    damage: { formula: '8d6', type: 'fire', saveForHalf: { ability: 'dexterity', dc: 15 } }
                },
                {
                    name: 'Ускорение',
                    level: 3,
                    isConcentration: true,
                    range: 30
                }
            ],
            isVisible: true,
            isDead: false,
            isUnconscious: false
        },
        {
            id: 'monster_1',
            name: 'Орк-воин',
            type: 'monster',
            initiative: 12,
            hasActed: false,
            position: { x: 200, y: 150 },
            stats: {
                ac: 13,
                hp: 22,
                maxHp: 22,
                speed: 30,
                abilityModifiers: { strength: 3, dexterity: 1, constitution: 3, intelligence: -1, wisdom: 1, charisma: 0 },
                savingThrows: {},
                skills: { intimidation: 2 },
                resistances: [],
                immunities: [],
                vulnerabilities: [],
                conditions: []
            },
            equipment: {
                weapons: [{
                    name: 'Боевой топор',
                    attackBonus: 5,
                    damageFormula: '1d8+3',
                    damageType: 'slashing',
                    range: 5,
                    isRanged: false
                }],
                armor: { name: 'Кольчуга', ac: 13, type: 'medium' }
            },
            spells: [],
            isVisible: true,
            isDead: false,
            isUnconscious: false
        },
        {
            id: 'npc_1',
            name: 'Клерик Амара',
            type: 'npc',
            initiative: 15,
            hasActed: false,
            position: { x: 80, y: 120 },
            stats: {
                ac: 16,
                hp: 38,
                maxHp: 38,
                speed: 25,
                level: 4,
                proficiencyBonus: 2,
                abilityModifiers: { strength: 1, dexterity: 0, constitution: 2, intelligence: 1, wisdom: 4, charisma: 2 },
                savingThrows: { wisdom: 6, charisma: 4 },
                skills: { medicine: 6, religion: 3 },
                resistances: [],
                immunities: [],
                vulnerabilities: [],
                conditions: []
            },
            equipment: {
                weapons: [{
                    name: 'Булава',
                    attackBonus: 3,
                    damageFormula: '1d6+1',
                    damageType: 'bludgeoning',
                    range: 5,
                    isRanged: false
                }],
                armor: { name: 'Кольчуга', ac: 16, type: 'medium' }
            },
            spells: [
                {
                    name: 'Лечение ран',
                    level: 1,
                    isConcentration: false,
                    range: 5
                },
                {
                    name: 'Благословение',
                    level: 1,
                    isConcentration: true,
                    range: 30
                }
            ],
            isVisible: true,
            isDead: false,
            isUnconscious: false
        }
    ]

    // Инициализация боя
    useEffect(() => {
        if (combatRound.participants.length === 0) {
            setCombatRound(prev => ({
                ...prev,
                participants: demoParticipants.sort((a, b) => b.initiative - a.initiative)
            }))
        }
    }, [])

    // Начало боя
    const startCombat = useCallback(async () => {
        // Сброс состояния участников
        const resetParticipants = combatRound.participants.map(p => ({
            ...p,
            hasActed: false
        }))

        setCombatRound(prev => ({
            ...prev,
            number: 1,
            startTime: new Date(),
            participants: resetParticipants,
            currentTurn: 0,
            isActive: true
        }))

        toast.success('Бой начался!')

        // Отправляем событие через Socket.IO
        if (socket && isConnected) {
            socket.emit('combat_state_change', {
                sessionId,
                inCombat: true,
                round: 1
            })
        }

        onCombatStateChange?.({
            inCombat: true,
            round: 1,
            participants: resetParticipants
        })
    }, [combatRound.participants, socket, isConnected, sessionId, onCombatStateChange])

    // Следующий ход
    const nextTurn = useCallback(() => {
        setCombatRound(prev => {
            const currentParticipant = prev.participants[prev.currentTurn]
            if (currentParticipant) {
                // Отмечаем, что текущий участник действовал
                const updatedParticipants = prev.participants.map((p, index) =>
                    index === prev.currentTurn ? { ...p, hasActed: true } : p
                )

                let newTurn = prev.currentTurn + 1
                let newRound = prev.number

                // Если все участники действовали, начинаем новый раунд
                if (newTurn >= prev.participants.length) {
                    newTurn = 0
                    newRound += 1

                    // Сбрасываем флаги действий
                    updatedParticipants.forEach(p => p.hasActed = false)

                    // Обновляем эффекты
                    advanceRound()

                    toast.success(`Раунд ${newRound} начался!`)
                }

                const newState = {
                    ...prev,
                    participants: updatedParticipants,
                    currentTurn: newTurn,
                    number: newRound
                }

                // Отправляем обновление
                if (socket && isConnected) {
                    socket.emit('player_turn', {
                        sessionId,
                        playerId: newState.participants[newTurn]?.id,
                        playerName: newState.participants[newTurn]?.name,
                        round: newRound
                    })
                }

                return newState
            }
            return prev
        })
    }, [socket, isConnected, sessionId, advanceRound])

    // Завершение боя
    const endCombat = useCallback(() => {
        setCombatRound(prev => ({
            ...prev,
            isActive: false,
            currentTurn: 0
        }))

        toast.success('Бой завершен!')

        if (socket && isConnected) {
            socket.emit('combat_state_change', {
                sessionId,
                inCombat: false
            })
        }

        onCombatStateChange?.({
            inCombat: false,
            round: combatRound.number
        })
    }, [socket, isConnected, sessionId, onCombatStateChange, combatRound.number])

    // Обновление участника
    const updateParticipant = useCallback((participantId: string, updates: Partial<CombatParticipant>) => {
        setCombatRound(prev => ({
            ...prev,
            participants: prev.participants.map(p =>
                p.id === participantId ? { ...p, ...updates } : p
            )
        }))
    }, [])

    // Автоматическая атака
    const executeAutoAttack = useCallback(async (attackerId: string, targetId: string, weaponIndex: number = 0) => {
        const attacker = combatRound.participants.find(p => p.id === attackerId)
        const target = combatRound.participants.find(p => p.id === targetId)

        if (!attacker || !target || !attacker.equipment.weapons[weaponIndex]) return

        const weapon = attacker.equipment.weapons[weaponIndex]

        // Получаем модификаторы от эффектов
        const attackerMods = getActiveModifiers(attackerId)
        const targetMods = getActiveModifiers(targetId)

        // Бросок атаки с учетом преимущества/помехи
        const hasAdvantage = attackerMods.attackAdvantage
        const hasDisadvantage = attackerMods.attackDisadvantage

        const attackRoll = await rollDice({
            id: `attack_${attackerId}_${targetId}`,
            name: `${attacker.name} атакует ${target.name}`,
            formula: `1d20+${weapon.attackBonus}`,
            category: 'attack',
            advantage: hasAdvantage,
            disadvantage: hasDisadvantage
        })

        const targetAC = target.stats.ac + targetMods.armorClass
        const hits = calculateHit(attackRoll.total, targetAC)
        const critical = attackRoll.critical

        if (hits) {
            // Бросок урона
            const damageFormula = critical ? `${weapon.damageFormula}+${weapon.damageFormula}` : weapon.damageFormula
            const damageRoll = await rollDice({
                id: `damage_${attackerId}_${targetId}`,
                name: `Урон: ${weapon.name}${critical ? ' (КРИТ!)' : ''}`,
                formula: damageFormula,
                category: 'damage'
            })

            const finalDamage = calculateDamage(
                damageRoll.total,
                weapon.damageType as any,
                {
                    resistances: target.stats.resistances as any,
                    immunities: target.stats.immunities as any,
                    vulnerabilities: target.stats.vulnerabilities as any
                }
            )

            // Обновляем HP
            const newHp = Math.max(0, target.stats.hp - finalDamage)
            updateParticipant(targetId, {
                stats: {
                    ...target.stats,
                    hp: newHp
                },
                isDead: newHp === 0,
                isUnconscious: newHp === 0
            })

            // Проверка концентрации
            if (finalDamage > 0 && autoSettings.enableConcentrationChecks) {
                const concentratingSpells = target.spells.filter(s => s.isConcentration)
                for (const spell of concentratingSpells) {
                    const concentrationResult = await checkConcentration(
                        finalDamage,
                        targetId,
                        target.stats.abilityModifiers.constitution || 0
                    )

                    if (!concentrationResult.success) {
                        toast.error(`${target.name} теряет концентрацию на ${spell.name}!`)
                    }
                }
            }

            if (critical) {
                toast.success(`🎯 КРИТИЧЕСКИЙ УСПЕХ! ${finalDamage} урона!`, { duration: 4000 })
            } else {
                toast.success(`Попадание! ${finalDamage} урона`)
            }
        } else {
            toast.error('Промах!')
        }
    }, [combatRound.participants, calculateHit, calculateDamage, rollDice, updateParticipant, getActiveModifiers, autoSettings.enableConcentrationChecks, checkConcentration])

    const currentParticipant = combatRound.participants[combatRound.currentTurn]

    return (
        <div className={cn("w-full space-y-4", className)}>
    {/* Панель управления боем */}
    <Card>
        <CardHeader className="pb-3">
    <div className="flex items-center justify-between">
    <CardTitle className="flex items-center gap-2">
    <Sword className="h-5 w-5" />
        Боевая система D&D 5e
    {combatRound.isActive && (
        <Badge variant="destructive" className="animate-pulse">
        Раунд {combatRound.number}
        </Badge>
    )}
    </CardTitle>

    <div className="flex items-center gap-2">
        {!combatRound.isActive ? (
        <Button onClick={startCombat} className="bg-green-600 hover:bg-green-700">
    <Play className="h-4 w-4 mr-1" />
        Начать бой
    </Button>
) : (
        <div className="flex gap-2">
        <Button onClick={nextTurn} variant="outline">
    <RotateCcw className="h-4 w-4 mr-1" />
        Следующий ход
    </Button>
    <Button onClick={endCombat} variant="destructive">
    <Pause className="h-4 w-4 mr-1" />
        Завершить бой
    </Button>
    </div>
)}

    <Button
        variant="ghost"
    size="sm"
    onClick={() => setShowCombatSettings(true)}
>
    <Settings className="h-4 w-4" />
        </Button>
        </div>
        </div>

    {/* Текущий ход */}
    {combatRound.isActive && currentParticipant && (
        <div className="flex items-center gap-2 p-2 bg-primary/10 rounded-lg">
        <Target className="h-4 w-4 text-primary" />
        <span className="font-medium">
            Ход: {currentParticipant.name}
        </span>
        <Badge variant="outline">
        Инициатива {currentParticipant.initiative}
        </Badge>
        {currentParticipant.hasActed && (
            <Badge variant="secondary">Действовал</Badge>
        )}
        </div>
    )}
    </CardHeader>
    </Card>

    {/* Основной интерфейс боя */}
    <Tabs defaultValue="participants" className="w-full">
    <TabsList className="grid w-full grid-cols-4">
    <TabsTrigger value="participants">Участники</TabsTrigger>
        <TabsTrigger value="actions">Действия</TabsTrigger>
        <TabsTrigger value="effects">Эффекты</TabsTrigger>
        <TabsTrigger value="automation">Автоматизация</TabsTrigger>
        </TabsList>

        <TabsContent value="participants" className="space-y-3">
    <div className="grid gap-3">
        {combatRound.participants.map((participant, index) => (
                <Card
                    key={participant.id}
            className={cn(
                "transition-all",
                combatRound.currentTurn === index && combatRound.isActive && "ring-2 ring-primary",
                participant.isDead && "opacity-50 grayscale",
                participant.hasActed && "bg-muted/50"
)}
>
    <CardContent className="p-4">
    <div className="flex items-center justify-between mb-3">
    <div className="flex items-center gap-3">
    <div className="text-center">
    <div className="font-bold text-lg">
        {participant.initiative}
        </div>
        <div className="text-xs text-muted-foreground">
    Инициатива
    </div>
    </div>
    <div>
    <h3 className="font-semibold">{participant.name}</h3>
        <div className="flex items-center gap-2">
    <Badge variant="outline" className="text-xs">
        {participant.type}
        </Badge>
        <Badge variant="outline" className="text-xs">
        AC {participant.stats.ac}
    </Badge>
    {participant.stats.level && (
        <Badge variant="outline" className="text-xs">
        Уровень {participant.stats.level}
        </Badge>
    )}
    </div>
    </div>
    </div>

    <div className="flex items-center gap-2">
        {participant.hasActed && (
                <CheckCircle className="h-4 w-4 text-green-600" />
            )}
    {participant.isDead && (
        <AlertTriangle className="h-4 w-4 text-red-600" />
    )}
    </div>
    </div>

    {/* Статус здоровья */}
    <TargetStatusIndicator
        target={{
        id: participant.id,
            name: participant.name,
            type: participant.type,
            position: participant.position,
            stats: participant.stats,
            isVisible: participant.isVisible,
            isDead: participant.isDead
    }}
    />

    {/* Быстрые действия */}
    {combatRound.isActive && isGameMaster && (
        <div className="flex gap-2 mt-3">
            {combatRound.participants
                    .filter(p => p.id !== participant.id && !p.isDead)
                    .map(target => (
                        <Button
                            key={target.id}
                variant="outline"
                size="sm"
                onClick={() => executeAutoAttack(participant.id, target.id)}
        disabled={participant.isDead}
            >
            Атаковать {target.name}
        </Button>
    ))}
        </div>
    )}
    </CardContent>
    </Card>
))}
    </div>
    </TabsContent>

    <TabsContent value="actions">
    <CombatEnhancements
        sessionId={sessionId}
    characterId={selectedCharacter?.id || ''}
    targets={combatRound.participants.map(p => ({
            id: p.id,
            name: p.name,
            ac: p.stats.ac,
            hp: p.stats.hp,
            maxHp: p.stats.maxHp
        }))}
    onAttack={(result) => {
        console.log('Attack result:', result)
    }}
    onEffectApplied={(effect) => {
        applyTemporaryEffect(effect)
    }}
    />
    </TabsContent>

    <TabsContent value="effects" className="space-y-4">
        {/* Индикаторы концентрации */}
    {concentrationSpells.length > 0 && (
        <Card>
            <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2">
        <Brain className="h-4 w-4" />
            Активная концентрация
    </CardTitle>
    </CardHeader>
    <CardContent>
    <div className="space-y-2">
        {concentrationSpells.map(spell => (
                <ConcentrationIndicator
                    key={spell.id}
            isConcentrating={true}
            spellName={spell.name}
            onBreak={() => removeTemporaryEffect(spell.id)}
        />
    ))}
        </div>
        </CardContent>
        </Card>
    )}

    {/* Таймеры эффектов */}
    {temporaryEffects.length > 0 && (
        <Card>
            <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2">
        <Clock className="h-4 w-4" />
            Временные эффекты
    </CardTitle>
    </CardHeader>
    <CardContent>
    <EffectTimers effects={temporaryEffects} />
    </CardContent>
    </Card>
    )}

    {(concentrationSpells.length === 0 && temporaryEffects.length === 0) && (
        <div className="text-center text-muted-foreground py-12">
        <Clock className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>Нет активных эффектов</p>
    </div>
    )}
    </TabsContent>

    <TabsContent value="automation">
    <CombatAutomation
        sessionId={sessionId}
    targets={combatRound.participants.map(p => ({
            id: p.id,
            name: p.name,
            type: p.type,
            position: p.position,
            stats: p.stats,
            isVisible: p.isVisible,
            isDead: p.isDead
        }))}
    currentTurn={currentParticipant?.id || ''}
    settings={autoSettings}
    onSettingsChange={setAutoSettings}
    onTargetUpdate={(targetId, updates) => {
        updateParticipant(targetId, updates as any)
    }}
    onEffectCreate={(effect) => {
        console.log('Area effect created:', effect)
    }}
    />
    </TabsContent>
    </Tabs>

    {/* Диалог настроек */}
    <Dialog open={showCombatSettings} onOpenChange={setShowCombatSettings}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>Настройки боевой системы</DialogTitle>
    <DialogDescription>
    Настройте параметры автоматизации и поведения боя
    </DialogDescription>
    </DialogHeader>

    <div className="space-y-4">
    <div>
        <label className="text-sm font-medium">Режим боя</label>
    <div className="grid grid-cols-3 gap-2 mt-1">
        {(['manual', 'assisted', 'auto'] as const).map(mode => (
            <Button
                key={mode}
    variant={combatMode === mode ? 'default' : 'outline'}
    size="sm"
    onClick={() => setCombatMode(mode)}
>
    {mode === 'manual' && 'Ручной'}
    {mode === 'assisted' && 'Ассистент'}
    {mode === 'auto' && 'Авто'}
    </Button>
))}
    </div>
    </div>

    <div className="space-y-3">
        {Object.entries({
                enableAutoHit: 'Автоматические попадания',
                enableAutoRolls: 'Автоматические броски',
                enableAreaEffects: 'Областные эффекты',
                enableConcentrationChecks: 'Проверки концентрации',
                confirmCriticalHits: 'Подтверждать критические успехи',
                confirmMassEffects: 'Подтверждать массовые эффекты'
            }).map(([key, label]) => (
                <label key={key} className="flex items-center gap-2">
            <input
                type="checkbox"
            checked={autoSettings[key as keyof typeof autoSettings] as boolean}
            onChange={(e) => setAutoSettings(prev => ({
        ...prev,
        [key]: e.target.checked
    }))}
    className="rounded"
    />
    <span className="text-sm">{label}</span>
        </label>
))}
    </div>
    </div>
    </DialogContent>
    </Dialog>
    </div>
)
}

// Экспорт основного компонента
export default CompleteCombatInterface