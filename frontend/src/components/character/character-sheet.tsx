'use client'

// frontend/src/components/character/character-sheet.tsx
import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { AbilityScoresPanel } from './ability-scores-panel'
import { SkillsPanel } from './skills-panel'
import { InventoryPanel } from './inventory-panel'
import { SpellsPanel } from './spells-panel'
import { FeaturesPanel } from './features-panel'
import { BackgroundPanel } from './background-panel'
import { LevelUpDialog } from './level-up-dialog'
import {
    Heart,
    Shield,
    Zap,
    Crown,
    Sparkles,
    Backpack,
    BookOpen,
    User,
    TrendingUp,
    Star
} from 'lucide-react'
import { Character } from '@/types'
import { cn } from '@/lib/utils'

interface CharacterSheetProps {
    character: Character
    isEditing: boolean
    onSave: (character: Character) => void
    onLevelUp?: () => void
}

// Переводы
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

function CharacterHeader({ character, onLevelUp }: {
    character: Character
    onLevelUp?: () => void
}) {
    const healthPercent = ((character.currentHP + character.temporaryHP) / character.maxHP) * 100
    const baseHealthPercent = (character.currentHP / character.maxHP) * 100

    // Расчет опыта до следующего уровня
    const experienceTable = [0, 300, 900, 2700, 6500, 14000, 23000, 34000, 48000, 64000, 85000, 100000, 120000, 140000, 165000, 195000, 225000, 265000, 305000, 355000]
    const currentLevelExp = experienceTable[character.level - 1] || 0
    const nextLevelExp = experienceTable[character.level] || experienceTable[experienceTable.length - 1]
    const expProgress = character.level < 20 ? ((character.experience - currentLevelExp) / (nextLevelExp - currentLevelExp)) * 100 : 100

    const getAbilityModifier = (score: number) => Math.floor((score - 10) / 2)
    const getProficiencyBonus = () => Math.ceil(character.level / 4) + 1

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            {/* Основная информация */}
            <Card className="lg:col-span-2">
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle className="text-2xl">{character.name}</CardTitle>
                            <div className="flex items-center space-x-2 mt-2">
                                <Badge className="bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300">
                                    {RACE_TRANSLATIONS[character.race] || character.race}
                                </Badge>
                                <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300">
                                    {CLASS_TRANSLATIONS[character.class] || character.class}
                                </Badge>
                                <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300">
                                    <Crown className="h-3 w-3 mr-1" />
                                    {character.level} уровень
                                </Badge>
                            </div>
                        </div>

                        {onLevelUp && (
                            <Button
                                onClick={onLevelUp}
                                className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600"
                            >
                                <TrendingUp className="h-4 w-4 mr-2" />
                                Повысить уровень
                            </Button>
                        )}
                    </div>
                </CardHeader>

                <CardContent className="space-y-6">
                    {/* Здоровье */}
                    <div>
                        <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium flex items-center">
                <Heart className="h-4 w-4 mr-2 text-red-500" />
                Очки здоровья
              </span>
                            <span className="text-sm font-mono">
                {character.currentHP + character.temporaryHP}/{character.maxHP}
                                {character.temporaryHP > 0 && (
                                    <span className="text-blue-400 ml-1">
                    (+{character.temporaryHP})
                  </span>
                                )}
              </span>
                        </div>

                        <div className="relative w-full bg-gray-700 rounded-full h-4 overflow-hidden">
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
                        </div>
                    </div>

                    {/* Опыт */}
                    {character.level < 20 && (
                        <div>
                            <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium flex items-center">
                  <Star className="h-4 w-4 mr-2 text-amber-500" />
                  Опыт
                </span>
                                <span className="text-sm font-mono">
                  {character.experience} / {nextLevelExp}
                </span>
                            </div>
                            <Progress value={expProgress} className="h-2" />
                            <div className="text-xs text-muted-foreground mt-1">
                                До следующего уровня: {nextLevelExp - character.experience} опыта
                            </div>
                        </div>
                    )}

                    {/* Мировоззрение и предыстория */}
                    <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                            <span className="text-muted-foreground">Мировоззрение:</span>
                            <div className="font-medium">{character.alignment}</div>
                        </div>
                        <div>
                            <span className="text-muted-foreground">Бонус мастерства:</span>
                            <div className="font-medium">+{getProficiencyBonus()}</div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Быстрые характеристики */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg">Основные характеристики</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    {/* КБ, Инициатива, Скорость */}
                    <div className="grid grid-cols-3 gap-4">
                        <div className="text-center p-3 bg-gradient-to-br from-blue-500/10 to-blue-600/10 rounded-lg border border-blue-500/20">
                            <Shield className="h-5 w-5 mx-auto mb-1 text-blue-500" />
                            <div className="text-2xl font-bold">{character.armorClass}</div>
                            <div className="text-xs text-muted-foreground">Класс Брони</div>
                        </div>

                        <div className="text-center p-3 bg-gradient-to-br from-yellow-500/10 to-yellow-600/10 rounded-lg border border-yellow-500/20">
                            <Zap className="h-5 w-5 mx-auto mb-1 text-yellow-500" />
                            <div className="text-2xl font-bold">
                                {character.initiative >= 0 ? '+' : ''}{character.initiative}
                            </div>
                            <div className="text-xs text-muted-foreground">Инициатива</div>
                        </div>

                        <div className="text-center p-3 bg-gradient-to-br from-green-500/10 to-green-600/10 rounded-lg border border-green-500/20">
                            <Sparkles className="h-5 w-5 mx-auto mb-1 text-green-500" />
                            <div className="text-2xl font-bold">{character.speed}</div>
                            <div className="text-xs text-muted-foreground">Скорость</div>
                        </div>
                    </div>

                    {/* Модификаторы характеристик */}
                    <div className="space-y-2">
                        <h4 className="text-sm font-medium">Модификаторы характеристик</h4>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                            {Object.entries(character.abilityScores).map(([ability, score]) => {
                                const modifier = getAbilityModifier(score)
                                const abilityNames: Record<string, string> = {
                                    strength: 'СИЛ',
                                    dexterity: 'ЛОВ',
                                    constitution: 'ТЕЛ',
                                    intelligence: 'ИНТ',
                                    wisdom: 'МУД',
                                    charisma: 'ХАР'
                                }

                                return (
                                    <div key={ability} className="flex justify-between items-center p-2 bg-muted rounded">
                                        <span>{abilityNames[ability]}</span>
                                        <span className={cn(
                                            "font-mono font-bold",
                                            modifier >= 0 ? "text-green-600" : "text-red-600"
                                        )}>
                      {modifier >= 0 ? '+' : ''}{modifier}
                    </span>
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}

export function CharacterSheet({ character, isEditing, onSave, onLevelUp }: CharacterSheetProps) {
    const [activeTab, setActiveTab] = useState('abilities')
    const [showLevelUpDialog, setShowLevelUpDialog] = useState(false)
    const [characterData, setCharacterData] = useState<Character>(character)

    const handleSave = () => {
        onSave(characterData)
    }

    const handleLevelUpClick = () => {
        if (onLevelUp) {
            setShowLevelUpDialog(true)
        }
    }

    const tabs = [
        { id: 'abilities', label: 'Характеристики', icon: Zap },
        { id: 'skills', label: 'Навыки', icon: Star },
        { id: 'inventory', label: 'Инвентарь', icon: Backpack },
        { id: 'spells', label: 'Заклинания', icon: Sparkles },
        { id: 'features', label: 'Особенности', icon: Crown },
        { id: 'background', label: 'Предыстория', icon: User }
    ]

    return (
        <div className="space-y-8">
            {/* Заголовок персонажа */}
            <CharacterHeader character={characterData} onLevelUp={onLevelUp ? handleLevelUpClick : undefined} />

            {/* Основное содержимое */}
            <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-6 lg:w-auto lg:grid-cols-6 mb-8">
                    {tabs.map((tab) => {
                        const Icon = tab.icon
                        return (
                            <TabsTrigger
                                key={tab.id}
                                value={tab.id}
                                className="flex items-center space-x-2 data-[state=active]:bg-purple-100 data-[state=active]:text-purple-800"
                            >
                                <Icon className="h-4 w-4" />
                                <span className="hidden sm:inline">{tab.label}</span>
                            </TabsTrigger>
                        )
                    })}
                </TabsList>

                <TabsContent value="abilities">
                    <AbilityScoresPanel
                        character={characterData}
                        isEditing={isEditing}
                        onUpdate={(updates) => setCharacterData(prev => ({ ...prev, ...updates }))}
                    />
                </TabsContent>

                <TabsContent value="skills">
                    <SkillsPanel
                        character={characterData}
                        isEditing={isEditing}
                        onUpdate={(updates) => setCharacterData(prev => ({ ...prev, ...updates }))}
                    />
                </TabsContent>

                <TabsContent value="inventory">
                    <InventoryPanel
                        character={characterData}
                        isEditing={isEditing}
                        onUpdate={(updates) => setCharacterData(prev => ({ ...prev, ...updates }))}
                    />
                </TabsContent>

                <TabsContent value="spells">
                    <SpellsPanel
                        character={characterData}
                        isEditing={isEditing}
                        onUpdate={(updates) => setCharacterData(prev => ({ ...prev, ...updates }))}
                    />
                </TabsContent>

                <TabsContent value="features">
                    <FeaturesPanel
                        character={characterData}
                        isEditing={isEditing}
                        onUpdate={(updates) => setCharacterData(prev => ({ ...prev, ...updates }))}
                    />
                </TabsContent>

                <TabsContent value="background">
                    <BackgroundPanel
                        character={characterData}
                        isEditing={isEditing}
                        onUpdate={(updates) => setCharacterData(prev => ({ ...prev, ...updates }))}
                    />
                </TabsContent>
            </Tabs>

            {/* Кнопки сохранения для режима редактирования */}
            {isEditing && (
                <div className="sticky bottom-4 flex justify-center">
                    <Card className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm border shadow-lg">
                        <CardContent className="p-4">
                            <div className="flex items-center space-x-3">
                                <Button
                                    onClick={handleSave}
                                    className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
                                >
                                    Сохранить изменения
                                </Button>
                                <Button
                                    variant="outline"
                                    onClick={() => setCharacterData(character)}
                                >
                                    Отменить
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Диалог повышения уровня */}
            {showLevelUpDialog && onLevelUp && (
                <LevelUpDialog
                    character={characterData}
                    isOpen={showLevelUpDialog}
                    onClose={() => setShowLevelUpDialog(false)}
                    onLevelUp={onLevelUp}
                />
            )}
        </div>
    )
}