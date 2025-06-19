// frontend/src/components/character/class-selector.tsx
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
    Sword,
    Shield,
    Wand2,
    Heart,
    Music,
    Leaf,
    Flame,
    Moon,
    Zap,
    BookOpen,
    Crown,
    Eye,
    Users,
    Target,
    Star
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface CharacterClass {
    id: string
    name: string
    description: string
    hitDie: number
    primaryAbility: string[]
    savingThrowProficiencies: string[]
    armorProficiencies: string[]
    weaponProficiencies: string[]
    skillChoices: {
        options: string[]
        choose: number
    }
    features: string[]
    role: 'tank' | 'damage' | 'support' | 'utility'
    complexity: 'простой' | 'средний' | 'сложный'
}

interface ClassSelectorProps {
    classes: CharacterClass[]
    selectedClass: string
    selectedRace: string
    onClassChange: (classId: string) => void
    error?: string
}

// Иконки для классов
const CLASS_ICONS: Record<string, any> = {
    'BARBARIAN': Sword,
    'BARD': Music,
    'CLERIC': Heart,
    'DRUID': Leaf,
    'FIGHTER': Shield,
    'MONK': Zap,
    'PALADIN': Crown,
    'RANGER': Target,
    'ROGUE': Eye,
    'SORCERER': Flame,
    'WARLOCK': Moon,
    'WIZARD': BookOpen
}

// Цвета для классов
const CLASS_COLORS: Record<string, string> = {
    'BARBARIAN': 'from-red-500 to-orange-500',
    'BARD': 'from-pink-500 to-purple-500',
    'CLERIC': 'from-yellow-500 to-amber-500',
    'DRUID': 'from-green-500 to-emerald-500',
    'FIGHTER': 'from-gray-500 to-slate-500',
    'MONK': 'from-blue-500 to-indigo-500',
    'PALADIN': 'from-indigo-500 to-purple-500',
    'RANGER': 'from-teal-500 to-green-500',
    'ROGUE': 'from-slate-500 to-gray-500',
    'SORCERER': 'from-orange-500 to-red-500',
    'WARLOCK': 'from-purple-500 to-pink-500',
    'WIZARD': 'from-cyan-500 to-blue-500'
}

// Цвета для ролей
const ROLE_COLORS: Record<string, string> = {
    'tank': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
    'damage': 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
    'support': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
    'utility': 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300'
}

// Перевод ролей
const ROLE_TRANSLATIONS: Record<string, string> = {
    'tank': 'Защитник',
    'damage': 'Урон',
    'support': 'Поддержка',
    'utility': 'Универсал'
}

// Переводы характеристик
const ABILITY_TRANSLATIONS: Record<string, string> = {
    'strength': 'Сила',
    'dexterity': 'Ловкость',
    'constitution': 'Телосложение',
    'intelligence': 'Интеллект',
    'wisdom': 'Мудрость',
    'charisma': 'Харизма'
}

// Цвета сложности
const COMPLEXITY_COLORS: Record<string, string> = {
    'простой': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
    'средний': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
    'сложный': 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
}

function ClassCard({ characterClass, isSelected, onSelect, selectedRace }: {
    characterClass: CharacterClass
    isSelected: boolean
    onSelect: () => void
    selectedRace: string
}) {
    const Icon = CLASS_ICONS[characterClass.id] || Sword
    const colorGradient = CLASS_COLORS[characterClass.id] || 'from-gray-500 to-slate-500'
    const roleColor = ROLE_COLORS[characterClass.role]
    const complexityColor = COMPLEXITY_COLORS[characterClass.complexity]

    // Проверяем синергию расы и класса (базовая логика)
    const getSynergy = () => {
        // Это упрощенная логика, в реальном приложении она была бы более сложной
        if (selectedRace === 'ELF' && ['RANGER', 'WIZARD'].includes(characterClass.id)) return 'отличная'
        if (selectedRace === 'DWARF' && ['FIGHTER', 'CLERIC'].includes(characterClass.id)) return 'хорошая'
        if (selectedRace === 'HALFLING' && ['ROGUE', 'BARD'].includes(characterClass.id)) return 'хорошая'
        return 'нормальная'
    }

    const synergy = getSynergy()
    const synergyColor = {
        'отличная': 'text-green-600 dark:text-green-400',
        'хорошая': 'text-blue-600 dark:text-blue-400',
        'нормальная': 'text-muted-foreground'
    }[synergy]

    return (
        <Card
            className={cn(
                "cursor-pointer transition-all duration-300 hover:shadow-lg group border-2",
                isSelected
                    ? "border-purple-500 shadow-lg bg-purple-50 dark:bg-purple-950/30"
                    : "border-muted hover:border-purple-200 dark:hover:border-purple-800 bg-gradient-to-br from-white/80 to-white/60 dark:from-slate-800/80 dark:to-slate-900/60 backdrop-blur-sm"
            )}
            onClick={onSelect}
        >
            <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                        <div className={cn(
                            "w-12 h-12 rounded-lg flex items-center justify-center text-white bg-gradient-to-br",
                            colorGradient,
                            "group-hover:scale-105 transition-transform"
                        )}>
                            <Icon className="h-6 w-6" />
                        </div>
                        <div>
                            <CardTitle className={cn(
                                "text-lg font-bold transition-colors",
                                isSelected && "text-purple-700 dark:text-purple-300"
                            )}>
                                {characterClass.name}
                            </CardTitle>
                            <div className="flex items-center space-x-2 mt-1">
                                <Badge className={roleColor}>
                                    {ROLE_TRANSLATIONS[characterClass.role]}
                                </Badge>
                                <Badge className={complexityColor}>
                                    {characterClass.complexity}
                                </Badge>
                            </div>
                        </div>
                    </div>

                    {isSelected && (
                        <div className="w-6 h-6 rounded-full bg-purple-500 flex items-center justify-center">
                            <div className="w-2 h-2 bg-white rounded-full" />
                        </div>
                    )}
                </div>
            </CardHeader>

            <CardContent className="space-y-4">
                <CardDescription className="text-sm leading-relaxed">
                    {characterClass.description}
                </CardDescription>

                {/* Базовые характеристики */}
                <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                        <span className="text-muted-foreground">Кость здоровья:</span>
                        <div className="font-semibold">d{characterClass.hitDie}</div>
                    </div>
                    <div>
                        <span className="text-muted-foreground">Навыков на выбор:</span>
                        <div className="font-semibold">{characterClass.skillChoices.choose}</div>
                    </div>
                </div>

                {/* Ключевые характеристики */}
                <div>
                    <h4 className="text-sm font-semibold mb-2 text-muted-foreground">
                        Ключевые характеристики:
                    </h4>
                    <div className="flex flex-wrap gap-1">
                        {characterClass.primaryAbility.map((ability) => (
                            <Badge
                                key={ability}
                                variant="outline"
                                className="text-xs"
                            >
                                {ABILITY_TRANSLATIONS[ability]}
                            </Badge>
                        ))}
                    </div>
                </div>

                {/* Спасительные броски */}
                <div>
                    <h4 className="text-sm font-semibold mb-2 text-muted-foreground">
                        Спасительные броски:
                    </h4>
                    <div className="flex flex-wrap gap-1">
                        {characterClass.savingThrowProficiencies.map((save) => (
                            <Badge
                                key={save}
                                variant="outline"
                                className="text-xs"
                            >
                                {ABILITY_TRANSLATIONS[save]}
                            </Badge>
                        ))}
                    </div>
                </div>

                {/* Особенности класса */}
                <div>
                    <h4 className="text-sm font-semibold mb-2 text-muted-foreground">
                        Особенности 1-го уровня:
                    </h4>
                    <div className="space-y-1">
                        {characterClass.features.slice(0, 2).map((feature, index) => (
                            <div key={index} className="text-sm text-muted-foreground flex items-center">
                                <div className="w-1 h-1 bg-muted-foreground rounded-full mr-2 flex-shrink-0" />
                                {feature}
                            </div>
                        ))}
                        {characterClass.features.length > 2 && (
                            <div className="text-xs text-muted-foreground/70 italic">
                                и еще {characterClass.features.length - 2} особенност{characterClass.features.length - 2 === 1 ? 'ь' : 'и'}...
                            </div>
                        )}
                    </div>
                </div>

                {/* Синергия с расой */}
                {selectedRace && (
                    <div className="pt-2 border-t border-muted">
                        <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">Синергия с расой:</span>
                            <span className={cn("font-medium capitalize", synergyColor)}>
                {synergy}
              </span>
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    )
}

export function ClassSelector({ classes, selectedClass, selectedRace, onClassChange, error }: ClassSelectorProps) {
    if (!classes || classes.length === 0) {
        return (
            <div className="text-center py-8">
                <div className="animate-spin w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full mx-auto mb-4" />
                <p className="text-muted-foreground">Загрузка классов...</p>
            </div>
        )
    }

    // Группируем классы по ролям
    const groupedClasses = classes.reduce((acc, characterClass) => {
        if (!acc[characterClass.role]) {
            acc[characterClass.role] = []
        }
        acc[characterClass.role].push(characterClass)
        return acc
    }, {} as Record<string, CharacterClass[]>)

    return (
        <div className="space-y-6">
            <div>
                <h3 className="text-lg font-semibold mb-2">Выберите класс персонажа</h3>
                <p className="text-muted-foreground">
                    Класс определяет роль вашего персонажа в группе, способности и стиль игры.
                </p>
                {error && (
                    <p className="text-sm text-red-600 dark:text-red-400 mt-2">
                        {error}
                    </p>
                )}
            </div>

            {/* Фильтры по ролям */}
            <div className="flex flex-wrap gap-2">
                {Object.entries(ROLE_TRANSLATIONS).map(([role, translation]) => {
                    const count = groupedClasses[role]?.length || 0
                    return (
                        <Badge key={role} variant="outline" className="text-sm">
                            {translation} ({count})
                        </Badge>
                    )
                })}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {classes.map((characterClass) => (
                    <ClassCard
                        key={characterClass.id}
                        characterClass={characterClass}
                        isSelected={selectedClass === characterClass.id}
                        onSelect={() => onClassChange(characterClass.id)}
                        selectedRace={selectedRace}
                    />
                ))}
            </div>

            {/* Информационная панель */}
            {selectedClass && (
                <Card className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-950/30 dark:to-blue-950/30 border-purple-200 dark:border-purple-800">
                    <CardContent className="p-4">
                        <div className="flex items-start space-x-3">
                            <div className="w-8 h-8 rounded-full bg-purple-500 flex items-center justify-center flex-shrink-0">
                                <Star className="h-4 w-4 text-white" />
                            </div>
                            <div>
                                <h4 className="font-semibold text-purple-900 dark:text-purple-100 mb-1">
                                    Выбран класс: {classes.find(c => c.id === selectedClass)?.name}
                                </h4>
                                <p className="text-sm text-purple-800 dark:text-purple-200">
                                    Превосходно! Теперь переходите к распределению характеристик.
                                    Обратите внимание на ключевые характеристики вашего класса.
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    )
}