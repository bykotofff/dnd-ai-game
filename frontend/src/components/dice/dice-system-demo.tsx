// frontend/src/components/dice/dice-system-demo.tsx
'use client'

import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { AdvancedDicePanel } from './advanced-dice-panel'
import { QuickDiceBar, DiceStatistics, useDice } from '@/hooks/use-dice'
import {
    Sword,
    Shield,
    Wand2,
    Heart,
    Target,
    Zap,
    Dice6,
    TrendingUp,
    Users,
    Sparkles
} from 'lucide-react'
import { cn } from '@/lib/utils'

// Демонстрационные данные персонажа
const DEMO_CHARACTER = {
    id: 'demo-char-1',
    name: 'Эльдра Звездопад',
    class: 'Волшебник',
    level: 5,
    proficiencyBonus: 3,
    abilityScores: {
        strength: 8,
        dexterity: 14,
        constitution: 13,
        intelligence: 18,
        wisdom: 12,
        charisma: 10
    },
    abilityModifiers: {
        strength: -1,
        dexterity: 2,
        constitution: 1,
        intelligence: 4,
        wisdom: 1,
        charisma: 0
    },
    attackBonus: 7, // +4 Int + 3 профiciency
    damageBonus: 4,
    saveBonus: 7,
    spellAttackBonus: 7,
    spellSaveDC: 15
}

// Предустановленные групповые броски для демонстрации
const DEMO_GROUPS = [
    {
        id: 'combat_round',
        name: 'Полный раунд боя',
        description: 'Инициатива + атака + урон + спасбросок',
        rolls: [
            { id: 'initiative', name: 'Инициатива', formula: '1d20+2', category: 'check' as const },
            { id: 'spell_attack', name: 'Атака заклинанием', formula: '1d20+7', category: 'attack' as const },
            { id: 'spell_damage', name: 'Урон (Огненный шар)', formula: '8d6', category: 'damage' as const },
            { id: 'dex_save', name: 'Спасбросок Ловкости', formula: '1d20+2', category: 'save' as const }
        ]
    },
    {
        id: 'exploration',
        name: 'Исследование',
        description: 'Проверки для исследования подземелья',
        rolls: [
            { id: 'perception', name: 'Восприятие', formula: '1d20+1', category: 'skill' as const },
            { id: 'investigation', name: 'Расследование', formula: '1d20+4', category: 'skill' as const },
            { id: 'arcana', name: 'Магия', formula: '1d20+7', category: 'skill' as const },
            { id: 'stealth', name: 'Скрытность', formula: '1d20+2', category: 'skill' as const }
        ]
    },
    {
        id: 'level_up_hp',
        name: 'Повышение уровня',
        description: 'Броски хит-поинтов и прочих характеристик',
        rolls: [
            { id: 'hit_points', name: 'Хит-поинты (d6)', formula: '1d6+1', category: 'hp' as const },
            { id: 'gold_find', name: 'Найденное золото', formula: '3d6*10', category: 'treasure' as const }
        ]
    }
]

// Составные броски для демонстрации
const DEMO_COMPOUNDS = [
    {
        id: 'fireball_attack',
        name: 'Огненный шар',
        attackRoll: {
            id: 'fireball_spell_attack',
            name: 'Точность заклинания',
            formula: '1d20+7',
            category: 'attack' as const
        },
        damageRolls: [
            {
                id: 'fireball_damage',
                name: 'Урон огнем',
                formula: '8d6',
                category: 'damage' as const
            }
        ],
        conditions: ['при попадании или в области'],
        description: 'Мощное заклинание 3 уровня с уроном по области'
    },
    {
        id: 'magic_missile',
        name: 'Волшебная стрела',
        attackRoll: {
            id: 'auto_hit',
            name: 'Автопопадание',
            formula: '1d1+99', // Всегда попадает
            category: 'attack' as const
        },
        damageRolls: [
            {
                id: 'missile_1',
                name: 'Стрела 1',
                formula: '1d4+1',
                category: 'damage' as const
            },
            {
                id: 'missile_2',
                name: 'Стрела 2',
                formula: '1d4+1',
                category: 'damage' as const
            },
            {
                id: 'missile_3',
                name: 'Стрела 3',
                formula: '1d4+1',
                category: 'damage' as const
            }
        ],
        conditions: ['автоматическое попадание'],
        description: 'Надежное заклинание 1 уровня с гарантированным попаданием'
    },
    {
        id: 'sneak_attack',
        name: 'Скрытая атака',
        attackRoll: {
            id: 'sneak_attack_roll',
            name: 'Атака кинжалом',
            formula: '1d20+5',
            category: 'attack' as const,
            advantage: true
        },
        damageRolls: [
            {
                id: 'weapon_damage',
                name: 'Урон оружием',
                formula: '1d4+3',
                category: 'damage' as const
            },
            {
                id: 'sneak_damage',
                name: 'Скрытая атака',
                formula: '3d6',
                category: 'damage' as const
            }
        ],
        conditions: ['при преимуществе или союзнике рядом'],
        description: 'Специальная атака плута с дополнительным уроном'
    }
]

export function DiceSystemDemo() {
    const [activeDemo, setActiveDemo] = useState<string>('quick')
    const { rollHistory, getStatistics } = useDice({
        characterId: DEMO_CHARACTER.id,
        autoSendToServer: false, // Для демо не отправляем на сервер
        enableSound: true
    })

    const stats = getStatistics()

    return (
        <div className="w-full max-w-6xl mx-auto space-y-6">
            {/* Заголовок демо */}
            <Card>
                <CardHeader className="text-center">
                    <CardTitle className="flex items-center justify-center gap-2 text-2xl">
                        <Dice6 className="h-8 w-8 text-purple-600" />
                        Расширенная система бросков D&D 5e
                        <Sparkles className="h-8 w-8 text-yellow-500" />
                    </CardTitle>
                    <p className="text-muted-foreground">
                        Демонстрация групповых бросков, составных атак и продвинутых механик
                    </p>

                    {/* Информация о персонаже */}
                    <div className="flex justify-center items-center gap-4 mt-4">
                        <Badge variant="outline" className="flex items-center gap-1">
                            <Users className="h-4 w-4" />
                            {DEMO_CHARACTER.name}
                        </Badge>
                        <Badge variant="outline">
                            {DEMO_CHARACTER.class} {DEMO_CHARACTER.level} уровня
                        </Badge>
                        <Badge variant="outline">
                            Бонус мастерства: +{DEMO_CHARACTER.proficiencyBonus}
                        </Badge>
                    </div>
                </CardHeader>
            </Card>

            {/* Быстрая панель бросков */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Zap className="h-5 w-5" />
                        Быстрые броски
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <QuickDiceBar
                        characterData={DEMO_CHARACTER}
                        className="justify-center"
                    />
                </CardContent>
            </Card>

            {/* Основной интерфейс */}
            <Tabs value={activeDemo} onValueChange={setActiveDemo}>
                <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="quick" className="flex items-center gap-1">
                        <Zap className="h-4 w-4" />
                        Быстрые
                    </TabsTrigger>
                    <TabsTrigger value="groups" className="flex items-center gap-1">
                        <Users className="h-4 w-4" />
                        Группы
                    </TabsTrigger>
                    <TabsTrigger value="compounds" className="flex items-center gap-1">
                        <Sword className="h-4 w-4" />
                        Составные
                    </TabsTrigger>
                    <TabsTrigger value="stats" className="flex items-center gap-1">
                        <TrendingUp className="h-4 w-4" />
                        Статистика
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="quick" className="space-y-4">
                    <AdvancedDicePanel
                        characterId={DEMO_CHARACTER.id}
                        savedPresets={{
                            formulas: [],
                            groups: DEMO_GROUPS,
                            compounds: DEMO_COMPOUNDS
                        }}
                    />
                </TabsContent>

                <TabsContent value="groups" className="space-y-4">
                    <div className="grid gap-4">
                        <h3 className="text-lg font-semibold flex items-center gap-2">
                            <Users className="h-5 w-5" />
                            Групповые броски
                        </h3>
                        <p className="text-muted-foreground">
                            Выполните несколько связанных бросков одной кнопкой. Идеально для сложных действий в бою или исследовании.
                        </p>

                        {DEMO_GROUPS.map(group => (
                            <Card key={group.id}>
                                <CardContent className="p-6">
                                    <div className="flex items-center justify-between mb-4">
                                        <div>
                                            <h4 className="font-semibold text-lg">{group.name}</h4>
                                            <p className="text-sm text-muted-foreground">{group.description}</p>
                                        </div>
                                        <Button
                                            size="lg"
                                            className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
                                        >
                                            <Dice6 className="h-4 w-4 mr-2" />
                                            Выполнить группу
                                        </Button>
                                    </div>

                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                        {group.rolls.map(roll => {
                                            const icons = {
                                                check: Target,
                                                skill: Zap,
                                                attack: Sword,
                                                damage: Heart,
                                                save: Shield,
                                                hp: Heart,
                                                treasure: Sparkles
                                            }
                                            const Icon = icons[roll.category] || Dice6

                                            return (
                                                <div key={roll.id} className="flex items-center gap-2 p-2 bg-muted/50 rounded">
                                                    <Icon className="h-4 w-4 text-muted-foreground" />
                                                    <div className="flex-1 min-w-0">
                                                        <div className="text-sm font-medium truncate">{roll.name}</div>
                                                        <div className="text-xs text-muted-foreground">{roll.formula}</div>
                                                    </div>
                                                </div>
                                            )
                                        })}
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </TabsContent>

                <TabsContent value="compounds" className="space-y-4">
                    <div className="grid gap-4">
                        <h3 className="text-lg font-semibold flex items-center gap-2">
                            <Sword className="h-5 w-5" />
                            Составные броски
                        </h3>
                        <p className="text-muted-foreground">
                            Комбинированные броски атак с автоматическим уроном. Поддерживает критические попадания и условную логику.
                        </p>

                        {DEMO_COMPOUNDS.map(compound => (
                            <Card key={compound.id}>
                                <CardContent className="p-6">
                                    <div className="flex items-center justify-between mb-4">
                                        <div>
                                            <h4 className="font-semibold text-lg">{compound.name}</h4>
                                            <p className="text-sm text-muted-foreground">{compound.description}</p>
                                        </div>
                                        <Button
                                            size="lg"
                                            variant="fantasy"
                                            className="bg-gradient-to-r from-red-500 to-orange-600 hover:from-red-600 hover:to-orange-700"
                                        >
                                            <Sword className="h-4 w-4 mr-2" />
                                            Атаковать!
                                        </Button>
                                    </div>

                                    <div className="space-y-4">
                                        <h4 className="font-semibold text-green-600">✅ Групповые броски</h4>
                                        <ul className="space-y-2 text-sm">
                                            <li>• Несколько бросков одной кнопкой</li>
                                            <li>• Анимированная последовательность</li>
                                            <li>• Настраиваемые задержки между бросками</li>
                                            <li>• Сохранение и загрузка групп</li>
                                        </ul>

                                        <h4 className="font-semibold text-blue-600">⚔️ Составные атаки</h4>
                                        <ul className="space-y-2 text-sm">
                                            <li>• Атака + урон автоматически</li>
                                            <li>• Удвоение урона при критах</li>
                                            <li>• Условная логика выполнения</li>
                                            <li>• Поддержка множественного урона</li>
                                        </ul>
                                    </div>

                                    <div className="space-y-4">
                                        <h4 className="font-semibold text-purple-600">🎯 Продвинутые формулы</h4>
                                        <ul className="space-y-2 text-sm">
                                            <li>• Keep Highest/Lowest (4d6kh3)</li>
                                            <li>• Взрывающиеся кубики (1d6!)</li>
                                            <li>• Перебросы (1d20r1)</li>
                                            <li>• Сложные комбинации (2d8+1d6+3)</li>
                                        </ul>

                                        <h4 className="font-semibold text-orange-600">📊 Умная статистика</h4>
                                        <ul className="space-y-2 text-sm">
                                            <li>• Отслеживание критов и провалов</li>
                                            <li>• Средние значения и тренды</li>
                                            <li>• История всех бросков</li>
                                            <li>• Экспорт данных</li>
                                        </ul>
                                    </div>
                                </div>

                                <div className="mt-6 p-4 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-950/20 dark:to-blue-950/20 rounded-lg border">
                                    <h4 className="font-semibold mb-2 flex items-center gap-2">
                                        <Sparkles className="h-5 w-5 text-yellow-500" />
                                        Интеграция с игрой
                                    </h4>
                                    <p className="text-sm text-muted-foreground">
                                        Все броски автоматически отправляются в игровую сессию через Socket.IO,
                                        сохраняются в истории персонажа и учитываются ИИ мастером для создания
                                        динамичного игрового процесса.
                                    </p>
                                </div>
                            </CardContent>
                            </Card>
                            </div>
                            )
                        }y-3">
                        {/* Бросок атаки */}
                        <div className="flex items-center gap-3 p-3 bg-red-50 dark:bg-red-950/20 rounded-lg">
                            <Target className="h-5 w-5 text-red-600" />
                            <div className="flex-1">
                                <div className="font-medium">{compound.attackRoll.name}</div>
                                <div className="text-sm text-muted-foreground">
                                    {compound.attackRoll.formula}
                                    {compound.attackRoll.advantage && ' (с преимуществом)'}
                                </div>
                            </div>
                        </div>

                        {/* Броски урона */}
                        {compound.damageRolls.map((damage, idx) => (
                            <div key={idx} className="flex items-center gap-3 p-3 bg-orange-50 dark:bg-orange-950/20 rounded-lg">
                                <Heart className="h-5 w-5 text-orange-600" />
                                <div className="flex-1">
                                    <div className="font-medium">{damage.name}</div>
                                    <div className="text-sm text-muted-foreground">{damage.formula}</div>
                                </div>
                            </div>
                        ))}

                        {/* Условия */}
                        {compound.conditions && (
                            <div className="text-xs text-muted-foreground italic">
                                Условия: {compound.conditions.join(', ')}
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>
            ))}
</div>
</TabsContent>

<TabsContent value="stats" className="space-y-4">
    <div className="grid gap-4">
        <h3 className="text-lg font-semibold flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Статистика бросков
        </h3>

        <DiceStatistics />

        {rollHistory.length > 0 && (
            <Card>
                <CardHeader>
                    <CardTitle>Последние броски</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                        {rollHistory.slice(0, 10).map(result => (
                            <div key={result.id} className="flex items-center justify-between p-2 bg-muted/50 rounded">
                                <div className="flex items-center gap-2">
                                    <Badge variant={result.critical ? "destructive" : "secondary"}>
                                        {result.formula.name}
                                    </Badge>
                                    {result.advantage && <Badge variant="outline">Преимущество</Badge>}
                                    {result.disadvantage && <Badge variant="outline">Помеха</Badge>}
                                </div>
                                <div className="font-mono font-bold text-lg">
                                    {result.total}
                                    {result.critical && ' 🎯'}
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        )}
    </div>
</TabsContent>
</Tabs>

{/* Возможности системы */}
<Card>
    <CardHeader>
        <CardTitle>🎲 Возможности расширенной системы костей</CardTitle>
    </CardHeader>
    <CardContent>
        <div className="grid md:grid-cols-2 gap-6">
            <div className="space-