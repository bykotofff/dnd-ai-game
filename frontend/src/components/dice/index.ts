// frontend/src/components/dice/index.ts
// Центральный экспорт всех компонентов системы костей

export { AdvancedDicePanel } from './advanced-dice-panel'
export { DiceSystemDemo } from './dice-system-demo'
export { QuickDiceBar, DiceStatistics, useDice } from '@/hooks/use-dice'
export type {
    DiceFormula,
    RollResult,
    DiceRollGroup,
    CompoundRoll
} from './advanced-dice-panel'

// frontend/src/components/game/dice-integration.tsx
'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog'
import { AdvancedDicePanel } from '@/components/dice/advanced-dice-panel'
import { QuickDiceBar, DiceStatistics, useDice } from '@/hooks/use-dice'
import { useGameStore } from '@/stores/game-store'
import { useSocket } from '@/hooks/use-socket'
import {
    Dice6,
    Settings,
    History,
    Zap,
    Users,
    Maximize2,
    Minimize2
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { motion, AnimatePresence } from 'framer-motion'

interface DiceIntegrationProps {
    sessionId?: string
    characterId?: string
    compact?: boolean
    showHistory?: boolean
    className?: string
}

export function DiceIntegration({
                                    sessionId,
                                    characterId,
                                    compact = false,
                                    showHistory = true,
                                    className
                                }: DiceIntegrationProps) {
    const [isExpanded, setIsExpanded] = useState(!compact)
    const [showSettings, setShowSettings] = useState(false)
    const [enableAutoSend, setEnableAutoSend] = useState(true)
    const [enableSound, setEnableSound] = useState(true)

    const { selectedCharacter, recentDiceRolls } = useGameStore()
    const { isConnected } = useSocket()

    const {
        rollHistory,
        isRolling,
        savedPresets,
        getStatistics,
        loadPresets
    } = useDice({
        sessionId,
        characterId: characterId || selectedCharacter?.id,
        autoSendToServer: enableAutoSend && !!sessionId,
        enableSound
    })

    const stats = getStatistics()
    const character = selectedCharacter

    // Загружаем сохраненные пресеты при инициализации
    useEffect(() => {
        loadPresets()
    }, [loadPresets])

    if (!character && !characterId) {
        return (
            <Card className={cn("w-full", className)}>
        <CardContent className="flex items-center justify-center p-6">
        <div className="text-center text-muted-foreground">
        <Dice6 className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>Выберите персонажа для использования системы костей</p>
        </div>
        </CardContent>
        </Card>
    )
    }

    return (
        <div className={cn("w-full space-y-4", className)}>
    {/* Компактная панель быстрых бросков */}
    <Card>
        <CardHeader className="pb-3">
    <div className="flex items-center justify-between">
    <CardTitle className="flex items-center gap-2 text-lg">
    <Dice6 className="h-5 w-5" />
        Система костей
    {isConnected && sessionId && (
        <Badge variant="outline" className="text-xs">
        Online
        </Badge>
    )}
    </CardTitle>

    <div className="flex items-center gap-2">
        {/* Статистика */}
    {stats && (
        <Badge variant="secondary" className="text-xs">
        {stats.totalRolls} бросков
    </Badge>
    )}

    {/* Настройки */}
    <Dialog open={showSettings} onOpenChange={setShowSettings}>
    <DialogTrigger asChild>
    <Button variant="ghost" size="sm">
    <Settings className="h-4 w-4" />
        </Button>
        </DialogTrigger>
        <DialogContent>
        <DialogHeader>
            <DialogTitle>Настройки системы костей</DialogTitle>
    <DialogDescription>
    Настройте поведение бросков костей
    </DialogDescription>
    </DialogHeader>

    <div className="space-y-4">
    <div className="flex items-center justify-between">
        <span>Автоотправка в сессию</span>
    <Button
    variant={enableAutoSend ? "default" : "outline"}
    size="sm"
    onClick={() => setEnableAutoSend(!enableAutoSend)}
>
    {enableAutoSend ? "Включено" : "Выключено"}
    </Button>
    </div>

    <div className="flex items-center justify-between">
        <span>Звуковые эффекты</span>
    <Button
    variant={enableSound ? "default" : "outline"}
    size="sm"
    onClick={() => setEnableSound(!enableSound)}
>
    {enableSound ? "Включены" : "Выключены"}
    </Button>
    </div>
    </div>
    </DialogContent>
    </Dialog>

    {/* Расширение/сворачивание */}
    <Button
        variant="ghost"
    size="sm"
    onClick={() => setIsExpanded(!isExpanded)}
>
    {isExpanded ? (
        <Minimize2 className="h-4 w-4" />
    ) : (
        <Maximize2 className="h-4 w-4" />
    )}
    </Button>
    </div>
    </div>
    </CardHeader>

    <CardContent className="pt-0">
        {/* Всегда видимая быстрая панель */}
        <QuickDiceBar
    characterData={character}
    className="mb-4"
        />

        {/* Индикатор активного броска */}
        <AnimatePresence>
        {isRolling && (
            <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
    animate={{ opacity: 1, scale: 1 }}
    exit={{ opacity: 0, scale: 0.8 }}
    className="flex items-center justify-center gap-2 p-2 bg-primary/10 rounded-lg text-primary"
    >
    <Dice6 className="h-4 w-4 animate-spin" />
    <span className="text-sm font-medium">Бросаем кости...</span>
    </motion.div>
)}
    </AnimatePresence>

    {/* Расширенная панель */}
    <AnimatePresence>
        {isExpanded && (
        <motion.div
            initial={{ opacity: 0, height: 0 }}
    animate={{ opacity: 1, height: "auto" }}
    exit={{ opacity: 0, height: 0 }}
    className="mt-4"
    >
    <AdvancedDicePanel
        characterId={characterId || character?.id}
    savedPresets={savedPresets}
    onRoll={(results) => {
        // Дополнительная обработка результатов
        console.log('Dice roll results:', results)
    }}
    className="border-0 shadow-none bg-transparent"
        />
        </motion.div>
)}
    </AnimatePresence>
    </CardContent>
    </Card>

    {/* История и статистика */}
    {showHistory && rollHistory.length > 0 && (
        <Card>
            <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
        <History className="h-4 w-4" />
            Последние броски
    </CardTitle>
    </CardHeader>
    <CardContent className="pt-0">
        {/* Краткая статистика */}
        {stats && (
            <div className="grid grid-cols-4 gap-2 mb-4 text-center">
            <div>
                <div className="text-lg font-bold">{stats.totalRolls}</div>
                <div className="text-xs text-muted-foreground">Всего</div>
        </div>
        <div>
        <div className="text-lg font-bold">{stats.averageRoll}</div>
            <div className="text-xs text-muted-foreground">Средний</div>
        </div>
        <div>
        <div className="text-lg font-bold text-yellow-600">{stats.criticals}</div>
            <div className="text-xs text-muted-foreground">Криты</div>
        </div>
        <div>
        <div className="text-lg font-bold text-red-600">{stats.fumbles}</div>
            <div className="text-xs text-muted-foreground">Провалы</div>
            </div>
            </div>
        )}

        {/* Последние результаты */}
        <div className="space-y-2 max-h-32 overflow-y-auto">
            {rollHistory.slice(0, 5).map(result => (
                    <div
                        key={result.id}
                className="flex items-center justify-between p-2 bg-muted/50 rounded text-sm"
                >
                <div className="flex items-center gap-2">
                <span className="font-medium">{result.formula.name}</span>
        {result.critical && <span className="text-yellow-600">🎯</span>}
            {result.advantage && (
                <Badge variant="outline" className="text-xs py-0">ADV</Badge>
            )}
            {result.disadvantage && (
                <Badge variant="outline" className="text-xs py-0">DIS</Badge>
            )}
            </div>
            <div className="font-mono font-bold">
            {result.total}
            </div>
            </div>
        ))}
        </div>
        </CardContent>
        </Card>
    )}

        {/* Интеграция с игровой сессией */}
        {sessionId && isConnected && (
            <Card className="border-green-200 bg-green-50/50 dark:border-green-800 dark:bg-green-950/20">
            <CardContent className="p-3">
            <div className="flex items-center gap-2 text-sm">
            <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse" />
            <span className="font-medium">Подключено к игровой сессии</span>
        <Badge variant="outline" className="text-xs">
            {recentDiceRolls.length} бросков в сессии
        </Badge>
        </div>
        <p className="text-xs text-muted-foreground mt-1">
            Все броски автоматически отправляются другим игрокам и ИИ мастеру
        </p>
        </CardContent>
        </Card>
        )}
        </div>
    )
    }

// Компонент для встраивания в игровой интерфейс
    export function GameDicePanel({ className }: { className?: string }) {
        const { currentSession, selectedCharacter } = useGameStore()

        return (
            <DiceIntegration
                sessionId={currentSession?.id}
        characterId={selectedCharacter?.id}
        compact={false}
        showHistory={true}
        className={className}
        />
    )
    }

// Мини-компонент для боковой панели
    export function DiceSidebar({ className }: { className?: string }) {
        const { currentSession, selectedCharacter } = useGameStore()

        return (
            <DiceIntegration
                sessionId={currentSession?.id}
        characterId={selectedCharacter?.id}
        compact={true}
        showHistory={false}
        className={className}
        />
    )
    }

// Компонент для мобильных устройств
    export function MobileDiceInterface({ className }: { className?: string }) {
        const { currentSession, selectedCharacter } = useGameStore()
        const [isOpen, setIsOpen] = useState(false)

        return (
            <>
                {/* Floating Action Button */}
            <Button
        onClick={() => setIsOpen(true)}
        className={cn(
            "fixed bottom-4 right-4 h-14 w-14 rounded-full shadow-lg z-50",
            "bg-gradient-to-r from-purple-500 to-blue-600",
            "hover:from-purple-600 hover:to-blue-700",
            className
    )}
    >
        <Dice6 className="h-6 w-6" />
            </Button>

        {/* Fullscreen Dice Panel */}
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-full h-full m-0 rounded-none">
        <DialogHeader className="pb-2">
        <DialogTitle className="flex items-center gap-2">
        <Dice6 className="h-5 w-5" />
            Система костей
        </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto">
        <DiceIntegration
            sessionId={currentSession?.id}
        characterId={selectedCharacter?.id}
        compact={false}
        showHistory={true}
        />
        </div>
        </DialogContent>
        </Dialog>
        </>
    )
    }

// Хук для программного управления бросками
    export function useDiceCommands() {
        const { quickRolls } = useDice()

        return {
            // Команды для ИИ мастера
            rollInitiative: (modifier: number = 0) => quickRolls.initiative(modifier),
            rollSkillCheck: (skill: string, modifier: number) => quickRolls.skillCheck(skill, modifier),
            rollSavingThrow: (save: string, modifier: number) => quickRolls.savingThrow(save, modifier),
            rollAttack: (modifier: number, advantage?: boolean) => quickRolls.attack(modifier, advantage),
            rollDamage: (dieType: string, modifier: number = 0) => quickRolls.damage(dieType, modifier),
            rollHealing: () => quickRolls.healingPotion(),
            rollDeathSave: () => quickRolls.deathSave(),

            // Пакетные команды
            rollCombatRound: async (character: any) => {
                const initiative = await quickRolls.initiative(character.initiativeModifier)
                // Можно добавить другие броски при необходимости
                return { initiative }
            }
        }
    }