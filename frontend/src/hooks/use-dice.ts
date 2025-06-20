// frontend/src/hooks/use-dice.ts
import { useState, useCallback, useRef } from 'react'
import { useSocket } from '@/hooks/use-socket'
import { useGameStore } from '@/stores/game-store'
import {
    executeAdvancedDiceFormula,
    formatDiceResult,
    checkCritical,
    applyAdvantageDisadvantage,
    DND5E_FORMULAS,
    validateDiceFormula
} from '@/lib/dice-utils'
import type { DiceFormula, RollResult, DiceRollGroup, CompoundRoll } from '@/components/dice/advanced-dice-panel'
import toast from 'react-hot-toast'

export interface UseDiceOptions {
    sessionId?: string
    characterId?: string
    autoSendToServer?: boolean
    enableSound?: boolean
}

export interface DiceRollAnimation {
    id: string
    isRolling: boolean
    duration: number
    startTime: number
}

export function useDice(options: UseDiceOptions = {}) {
    const { sessionId, characterId, autoSendToServer = true, enableSound = true } = options

    const { socket, isConnected } = useSocket()
    const { addDiceRoll } = useGameStore()

    const [rollHistory, setRollHistory] = useState<RollResult[]>([])
    const [isRolling, setIsRolling] = useState<string | null>(null)
    const [animations, setAnimations] = useState<Map<string, DiceRollAnimation>>(new Map())
    const [savedPresets, setSavedPresets] = useState<{
        formulas: DiceFormula[]
        groups: DiceRollGroup[]
        compounds: CompoundRoll[]
    }>({
        formulas: [],
        groups: [],
        compounds: []
    })

    const audioRef = useRef<HTMLAudioElement>()

    // Воспроизведение звука броска
    const playRollSound = useCallback(() => {
        if (!enableSound) return

        try {
            // Создаем простой звук програмно
            const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
            const oscillator = audioContext.createOscillator()
            const gainNode = audioContext.createGain()

            oscillator.connect(gainNode)
            gainNode.connect(audioContext.destination)

            oscillator.frequency.setValueAtTime(800, audioContext.currentTime)
            oscillator.frequency.exponentialRampToValueAtTime(400, audioContext.currentTime + 0.1)

            gainNode.gain.setValueAtTime(0.1, audioContext.currentTime)
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1)

            oscillator.start(audioContext.currentTime)
            oscillator.stop(audioContext.currentTime + 0.1)
        } catch (error) {
            console.warn('Could not play dice roll sound:', error)
        }
    }, [enableSound])

    // Отправка результата на сервер
    const sendToServer = useCallback(async (result: RollResult) => {
        if (!autoSendToServer || !sessionId || !characterId || !socket || !isConnected) {
            return
        }

        try {
            const diceRollData = {
                type: result.formula.formula.includes('d20') ? 'd20' : 'damage',
                result: result.total,
                modifier: result.modifier,
                total: result.total,
                purpose: result.formula.category,
                characterId,
                advantage: result.advantage,
                disadvantage: result.disadvantage
            }

            socket.emit('dice_roll', diceRollData)

            // Добавляем в локальное состояние
            addDiceRoll({
                id: result.id,
                type: diceRollData.type as any,
                result: result.total,
                modifier: result.modifier,
                total: result.total,
                advantage: result.advantage,
                disadvantage: result.disadvantage,
                critical: result.critical,
                timestamp: result.timestamp
            })

        } catch (error) {
            console.error('Failed to send dice roll to server:', error)
            toast.error('Ошибка отправки броска на сервер')
        }
    }, [autoSendToServer, sessionId, characterId, socket, isConnected, addDiceRoll])

    // Анимация броска
    const startRollAnimation = useCallback((rollId: string, duration: number = 1000) => {
        const animation: DiceRollAnimation = {
            id: rollId,
            isRolling: true,
            duration,
            startTime: Date.now()
        }

        setAnimations(prev => new Map(prev.set(rollId, animation)))
        setIsRolling(rollId)

        // Завершаем анимацию
        setTimeout(() => {
            setAnimations(prev => {
                const newMap = new Map(prev)
                newMap.delete(rollId)
                return newMap
            })
            setIsRolling(null)
        }, duration)
    }, [])

    // Основная функция броска
    const rollDice = useCallback(async (formula: DiceFormula, options: {
        advantage?: boolean
        disadvantage?: boolean
        modifier?: number
        animationDuration?: number
    } = {}): Promise<RollResult> => {
        const rollId = `${formula.id}_${Date.now()}`
        const { advantage = false, disadvantage = false, modifier = 0, animationDuration = 800 } = options

        // Валидация формулы
        const validation = validateDiceFormula(formula.formula)
        if (!validation.valid) {
            toast.error(`Ошибка в формуле: ${validation.error}`)
            throw new Error(validation.error)
        }

        // Запускаем анимацию
        startRollAnimation(rollId, animationDuration)
        playRollSound()

        // Задержка для анимации
        await new Promise(resolve => setTimeout(resolve, animationDuration))

        try {
            // Выполняем бросок
            const rollResult = executeAdvancedDiceFormula(formula.formula, modifier)

            // Применяем преимущество/помеха для d20
            let finalTotal = rollResult.total
            let appliedAdvantage = advantage || formula.advantage || false
            let appliedDisadvantage = disadvantage || formula.disadvantage || false

            if (formula.formula.includes('d20') && (appliedAdvantage || appliedDisadvantage)) {
                const d20Results = rollResult.results.filter(r => r.notation.sides === 20)
                if (d20Results.length > 0) {
                    const advantageResult = applyAdvantageDisadvantage(
                        d20Results[0].kept,
                        appliedAdvantage,
                        appliedDisadvantage
                    )

                    // Пересчитываем итоговый результат
                    const originalD20 = d20Results[0].kept[0]
                    const newD20 = advantageResult.finalRoll
                    finalTotal = rollResult.total - originalD20 + newD20
                }
            }

            // Проверяем критический успех/провал
            const critical = rollResult.results.some(r =>
                r.notation.sides === 20 &&
                r.kept.some(roll => checkCritical(roll, 20, formula.criticalRange) === 'critical')
            )

            const result: RollResult = {
                id: rollId,
                formula,
                rolls: rollResult.results.flatMap(r => r.rolls),
                modifier: rollResult.staticModifier + rollResult.globalModifier,
                total: finalTotal,
                critical,
                advantage: appliedAdvantage,
                disadvantage: appliedDisadvantage,
                timestamp: new Date()
            }

            // Добавляем в историю
            setRollHistory(prev => [result, ...prev].slice(0, 100))

            // Отправляем на сервер
            await sendToServer(result)

            // Показываем уведомление
            if (critical) {
                toast.success(`🎯 Критический успех! ${finalTotal}`, {
                    duration: 3000,
                    style: { background: '#fbbf24', color: '#000' }
                })
            } else if (finalTotal === 1 && formula.formula.includes('d20')) {
                toast.error(`💥 Критический провал! ${finalTotal}`, {
                    duration: 3000
                })
            }

            return result

        } catch (error) {
            console.error('Dice roll error:', error)
            toast.error('Ошибка при броске кубиков')
            throw error
        }
    }, [startRollAnimation, playRollSound, sendToServer])

    // Групповой бросок
    const rollGroup = useCallback(async (group: DiceRollGroup, options: {
        modifier?: number
        delayBetweenRolls?: number
    } = {}): Promise<RollResult[]> => {
        const { modifier = 0, delayBetweenRolls = 500 } = options
        const results: RollResult[] = []

        for (const formula of group.rolls) {
            const result = await rollDice(formula, { modifier })
            results.push(result)

            if (delayBetweenRolls > 0) {
                await new Promise(resolve => setTimeout(resolve, delayBetweenRolls))
            }
        }

        toast.success(`Групповой бросок завершен: ${group.name}`)
        return results
    }, [rollDice])

    // Составной бросок
    const rollCompound = useCallback(async (compound: CompoundRoll, options: {
        modifier?: number
        autoRollDamage?: boolean
    } = {}): Promise<RollResult[]> => {
        const { modifier = 0, autoRollDamage = false } = options
        const results: RollResult[] = []

        // Бросок атаки
        const attackResult = await rollDice(compound.attackRoll, { modifier })
        results.push(attackResult)

        // Определяем, нужно ли бросать урон
        const shouldRollDamage = autoRollDamage ||
            attackResult.critical ||
            confirm(`Атака: ${attackResult.total}. Продолжить с броском урона?`)

        if (shouldRollDamage) {
            await new Promise(resolve => setTimeout(resolve, 300))

            for (const damageFormula of compound.damageRolls) {
                // Удваиваем кубики урона при критическом попадании
                let actualFormula = damageFormula
                if (attackResult.critical) {
                    const critFormula = `${damageFormula.formula}+${damageFormula.formula}`
                    actualFormula = {
                        ...damageFormula,
                        formula: critFormula,
                        name: `${damageFormula.name} (Критический)`
                    }
                }

                const damageResult = await rollDice(actualFormula, { modifier })
                results.push(damageResult)

                await new Promise(resolve => setTimeout(resolve, 300))
            }
        }

        toast.success(`Составной бросок завершен: ${compound.name}`)
        return results
    }, [rollDice])

    // Быстрые броски для D&D 5e
    const quickRolls = {
        // Проверки характеристик
        abilityCheck: (ability: string, modifier: number) =>
            rollDice(DND5E_FORMULAS.abilityCheck(modifier), {}),

        skillCheck: (skill: string, modifier: number) =>
            rollDice(DND5E_FORMULAS.skillCheck(modifier), {}),

        savingThrow: (save: string, modifier: number) =>
            rollDice(DND5E_FORMULAS.savingThrow(modifier), {}),

        // Атаки и урон
        attack: (modifier: number, advantage?: boolean, disadvantage?: boolean) =>
            rollDice(DND5E_FORMULAS.attack(modifier), { advantage, disadvantage }),

        damage: (dieType: string, modifier: number = 0) => {
            const formula = DND5E_FORMULAS.damage[dieType as keyof typeof DND5E_FORMULAS.damage]
            if (typeof formula === 'function') {
                return rollDice(formula(modifier), {})
            }
            throw new Error(`Unknown damage die type: ${dieType}`)
        },

        // Лечение
        healingPotion: () => rollDice(DND5E_FORMULAS.healing.potion(), {}),

        // Особые броски
        deathSave: () => rollDice(DND5E_FORMULAS.d20(), {}),
        initiative: (modifier: number) => rollDice(DND5E_FORMULAS.abilityCheck(modifier), {})
    }

    // Управление пресетами
    const savePreset = useCallback((preset: DiceFormula | DiceRollGroup | CompoundRoll, type: 'formula' | 'group' | 'compound') => {
        setSavedPresets(prev => {
            const newPresets = { ...prev }

            switch (type) {
                case 'formula':
                    newPresets.formulas = [...prev.formulas, preset as DiceFormula]
                    break
                case 'group':
                    newPresets.groups = [...prev.groups, preset as DiceRollGroup]
                    break
                case 'compound':
                    newPresets.compounds = [...prev.compounds, preset as CompoundRoll]
                    break
            }

            // Сохраняем в localStorage
            try {
                localStorage.setItem('dnd-dice-presets', JSON.stringify(newPresets))
            } catch (error) {
                console.warn('Could not save presets to localStorage:', error)
            }

            return newPresets
        })

        toast.success('Пресет сохранен!')

        if (onSavePreset) {
            onSavePreset(preset)
        }
    }, [])

    const deletePreset = useCallback((id: string, type: 'formula' | 'group' | 'compound') => {
        setSavedPresets(prev => {
            const newPresets = { ...prev }

            switch (type) {
                case 'formula':
                    newPresets.formulas = prev.formulas.filter(f => f.id !== id)
                    break
                case 'group':
                    newPresets.groups = prev.groups.filter(g => g.id !== id)
                    break
                case 'compound':
                    newPresets.compounds = prev.compounds.filter(c => c.id !== id)
                    break
            }

            try {
                localStorage.setItem('dnd-dice-presets', JSON.stringify(newPresets))
            } catch (error) {
                console.warn('Could not save presets to localStorage:', error)
            }

            return newPresets
        })

        toast.success('Пресет удален!')
    }, [])

    // Загрузка сохраненных пресетов при инициализации
    const loadPresets = useCallback(() => {
        try {
            const saved = localStorage.getItem('dnd-dice-presets')
            if (saved) {
                const presets = JSON.parse(saved)
                setSavedPresets(presets)
            }
        } catch (error) {
            console.warn('Could not load presets from localStorage:', error)
        }
    }, [])

    // Очистка истории
    const clearHistory = useCallback(() => {
        setRollHistory([])
        toast.success('История очищена')
    }, [])

    // Статистика по истории
    const getStatistics = useCallback(() => {
        if (rollHistory.length === 0) return null

        const totals = rollHistory.map(r => r.total)
        const criticals = rollHistory.filter(r => r.critical).length
        const fumbles = rollHistory.filter(r =>
            r.formula.formula.includes('d20') && r.rolls.some(roll => roll === 1)
        ).length

        return {
            totalRolls: rollHistory.length,
            averageRoll: Math.round(totals.reduce((sum, total) => sum + total, 0) / totals.length),
            highestRoll: Math.max(...totals),
            lowestRoll: Math.min(...totals),
            criticals,
            fumbles,
            criticalRate: Math.round((criticals / rollHistory.length) * 100),
            fumbleRate: Math.round((fumbles / rollHistory.length) * 100)
        }
    }, [rollHistory])

    return {
        // Основные функции
        rollDice,
        rollGroup,
        rollCompound,
        quickRolls,

        // Состояние
        rollHistory,
        isRolling,
        animations,
        savedPresets,

        // Управление
        savePreset,
        deletePreset,
        loadPresets,
        clearHistory,

        // Утилиты
        getStatistics,

        // Настройки
        playRollSound,
        sendToServer
    }
}

// Компонент Quick Dice Bar для быстрого доступа
export function QuickDiceBar({ characterData, className }: {
    characterData?: any,
    className?: string
}) {
    const { quickRolls, isRolling } = useDice({
        characterId: characterData?.id,
        autoSendToServer: true
    })

    const commonRolls = [
        { name: 'd20', action: () => quickRolls.abilityCheck('general', 0), icon: '🎲' },
        { name: 'Атака', action: () => quickRolls.attack(characterData?.attackBonus || 0), icon: '⚔️' },
        { name: 'Урон', action: () => quickRolls.damage('d6', characterData?.damageBonus || 0), icon: '💥' },
        { name: 'Спасбросок', action: () => quickRolls.savingThrow('will', characterData?.saveBonus || 0), icon: '🛡️' },
        { name: 'Лечение', action: () => quickRolls.healingPotion(), icon: '💖' }
    ]

    return (
        <div className={cn("flex gap-2 p-2 bg-muted/30 rounded-lg", className)}>
    {commonRolls.map(roll => (
        <Button
            key={roll.name}
        variant="outline"
        size="sm"
        onClick={roll.action}
        disabled={isRolling !== null}
        className="flex items-center gap-1"
            >
            <span>{roll.icon}</span>
            <span className="hidden md:inline">{roll.name}</span>
        </Button>
    ))}
    </div>
)
}

// Компонент статистики бросков
export function DiceStatistics({ className }: { className?: string }) {
    const { getStatistics, rollHistory } = useDice()
    const stats = getStatistics()

    if (!stats) {
        return (
            <div className={cn("text-center text-muted-foreground py-4", className)}>
        Пока нет статистики бросков
        </div>
    )
    }

    return (
        <div className={cn("grid grid-cols-2 md:grid-cols-4 gap-4", className)}>
    <div className="text-center">
    <div className="text-2xl font-bold">{stats.totalRolls}</div>
        <div className="text-sm text-muted-foreground">Всего бросков</div>
    </div>
    <div className="text-center">
    <div className="text-2xl font-bold">{stats.averageRoll}</div>
        <div className="text-sm text-muted-foreground">Средний результат</div>
    </div>
    <div className="text-center">
    <div className="text-2xl font-bold text-yellow-600">{stats.criticals}</div>
        <div className="text-sm text-muted-foreground">Критические успехи</div>
    </div>
    <div className="text-center">
    <div className="text-2xl font-bold text-red-600">{stats.fumbles}</div>
        <div className="text-sm text-muted-foreground">Критические провалы</div>
    </div>
    </div>
)
}