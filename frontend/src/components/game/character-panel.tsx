// frontend/src/components/game/character-panel.tsx
import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
    Heart,
    Shield,
    Zap,
    Plus,
    Minus,
    Sword,
    Eye,
    BookOpen,
    Backpack,
    Star,
    Activity
} from 'lucide-react'
import { Character } from '@/types'
import { cn } from '@/lib/utils'
import { useGameStore } from '@/stores/game-store'
import toast from 'react-hot-toast'

interface CharacterPanelProps {
    character: Character | null
}

// Переводы
const ABILITY_TRANSLATIONS: Record<string, string> = {
    'strength': 'Сила',
    'dexterity': 'Ловкость',
    'constitution': 'Телосложение',
    'intelligence': 'Интеллект',
    'wisdom': 'Мудрость',
    'charisma': 'Харизма'
}

const CLASS_TRANSLATIONS: Record<string, string> = {
    'BARBARIAN': 'Варвар',
    'BARD': 'Бард',
    'CLERIC': 'Жрец',
    'DRUID': 'Друид',
    'FIGHTER': 'Воин',
    'MONK': 'Монах',
    'PALADIN': 'Паладин',
    'RANGER': 'Следопыт',
    'ROGUE': 'Плут',
    'SORCERER': 'Чародей',
    'WARLOCK': 'Колдун',
    'WIZARD': 'Волшебник'
}

const RACE_TRANSLATIONS: Record<string, string> = {
    'HUMAN': 'Человек',
    'ELF': 'Эльф',
    'DWARF': 'Дварф',
    'HALFLING': 'Полурослик',
    'DRAGONBORN': 'Драконорожденный',
    'GNOME': 'Гном',
    'HALF_ELF': 'Полуэльф',
    'HALF_ORC': 'Полуорк',
    'TIEFLING': 'Тифлинг'
}

function HealthControls({ character }: { character: Character }) {
    const [tempHP, setTempHP] = useState(0)
    const { updateCharacterHP } = useGameStore()

    const handleHealDamage = async (amount: number, type: 'heal' | 'damage' | 'temp') => {
        try {
            let newCurrentHP = character.currentHP
            let newTempHP = character.temporaryHP

            switch (type) {
                case 'heal':
                    newCurrentHP = Math.min(character.currentHP + amount, character.maxHP)
                    break
                case 'damage':
                    if (character.temporaryHP > 0) {
                        const tempDamage = Math.min(amount, character.temporaryHP)
                        newTempHP = character.temporaryHP - tempDamage
                        const remainingDamage = amount - tempDamage
                        newCurrentHP = Math.max(0, character.currentHP - remainingDamage)
                    } else {
                        newCurrentHP = Math.max(0, character.currentHP - amount)
                    }
                    break
                case 'temp':
                    newTempHP = Math.max(amount, character.temporaryHP) // Temp HP не складываются
                    break
            }

            await updateCharacterHP(character.id, {
                currentHP: newCurrentHP,
                temporaryHP: newTempHP
            })

            toast.success(
                type === 'heal' ? 'Здоровье восстановлено' :
                    type === 'damage' ? 'Урон получен' :
                        'Временные ОЗ добавлены'
            )
        } catch (error) {
            console.error('Ошибка обновления здоровья:', error)
            toast.error('Ошибка обновления здоровья')
        }
    }

    const healthPercent = ((character.currentHP + character.temporaryHP) / character.maxHP) * 100
    const baseHealthPercent = (character.currentHP / character.maxHP) * 100

    return (
        <div className="space-y-3">
            {/* Полоса здоровья */}
            <div className="relative">
                <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium">Очки здоровья</span>
                    <span className="text-sm font-mono">
            {character.currentHP + character.temporaryHP}/{character.maxHP}
                        {character.temporaryHP > 0 && (
                            <span className="text-blue-400 ml-1">
                (+{character.temporaryHP})
              </span>
                        )}
          </span>
                </div>

                <div className="relative w-full bg-gray-700 rounded-full h-3 overflow-hidden">
                    {/* Базовое здоровье */}
                    <div
                        className={cn(
                            "h-full transition-all duration-300",
                            baseHealthPercent > 50 ? "bg-green-500" :
                                baseHealthPercent > 25 ? "bg-yellow-500" : "bg-red-500"
                        )}
                        style={{ width: `${baseHealthPercent}%` }}
                    />

                    {/* Временные ОЗ */}
                    {character.temporaryHP > 0 && (
                        <div
                            className="h-full bg-blue-500 absolute top-0"
                            style={{
                                left: `${baseHealthPercent}%`,
                                width: `${((character.temporaryHP) / character.maxHP) * 100}%`
                            }}
                        />
                    )}