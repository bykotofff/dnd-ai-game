// frontend/src/components/character/character-preview.tsx
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
    Edit,
    Crown,
    Heart,
    Shield,
    Zap,
    Users,
    Target,
    BookOpen,
    Sparkles,
    Eye,
    AlertTriangle
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface CharacterPreviewProps {
    characterData: any
    onEdit: (step: number) => void
}

// Переводы
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

const ABILITY_TRANSLATIONS: Record<string, string> = {
    'strength': 'Сила',
    'dexterity': 'Ловкость',
    'constitution': 'Телосложение',
    'intelligence': 'Интеллект',
    'wisdom': 'Мудрость',
    'charisma': 'Харизма'
}

const ALIGNMENT_TRANSLATIONS: Record<string, string> = {
    'LG': 'Законно-добрый',
    'NG': 'Нейтрально-добрый',
    'CG': 'Хаотично-добрый',
    'LN': 'Законно-нейтральный',
    'TN': 'Истинно нейтральный',
    'CN': 'Хаотично-нейтральный',
    'LE': 'Законно-злой',
    'NE': 'Нейтрально-злой',
    'CE': 'Хаотично-злой'
}

const SKILLS_TRANSLATIONS: Record<string, string> = {
    'acrobatics': 'Акробатика',
    'animalHandling': 'Обращение с животными',
    'arcana': 'Магия',
    'athletics': 'Атлетика',
    'deception': 'Обман',
    'history': 'История',
    'insight': 'Проницательность',
    'intimidation': 'Запугивание',
    'investigation': 'Расследование',
    'medicine': 'Медицина',
    'nature': 'Природа',
    'perception': 'Восприятие',
    'performance': 'Выступление',
    'persuasion': 'Убеждение',
    'religion': 'Религия',
    'sleightOfHand': 'Ловкость рук',
    'stealth': 'Скрытность',
    'survival': 'Выживание'
}

// Расовые бонусы (упрощенные)
const RACIAL_BONUSES: Record<string, Record<string, number>> = {
    'HUMAN': { strength: 1, dexterity: 1, constitution: 1, intelligence: 1, wisdom: 1, charisma: 1 },
    'ELF': { dexterity: 2 },
    'DWARF': { constitution: 2 },
    'HALFLING': { dexterity: 2 },
    'DRAGONBORN': { strength: 2, charisma: 1 },
    'GNOME': { intelligence: 2 },
    'HALF_ELF': { charisma: 2 },
    'HALF_ORC': { strength: 2, constitution: 1 },
    'TIEFLING': { intelligence: 1, charisma: 2 }
}

function StatBlock({ title, stats, onEdit, editStep }: {
    title: string
    stats: any
    onEdit: () => void
    editStep: number
}) {
    return (
        <Card>
            <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{title}</CardTitle>
                    <Button variant="outline" size="sm" onClick={onEdit}>
                        <Edit className="h-3 w-3 mr-1" />
                        Изменить
                    </Button>
                </div>
            </CardHeader>
            <CardContent>{stats}</CardContent>
        </Card>
    )
}

export function CharacterPreview({ characterData, onEdit }: CharacterPreviewProps) {
    const {
        name,
        race,
        class: characterClass,
        abilityScores,
        selectedSkills = [],
        alignment,
        backstory,
        motivation,
        personalityTraits = { traits: [], ideals: [], bonds: [], flaws: [] }
    } = characterData

    // Получаем расовые бонусы
    const racialBonuses = RACIAL_BONUSES[race] || {}

    // Вычисляем финальные характеристики
    const finalAbilities = Object.entries(abilityScores || {}).reduce((acc, [ability, value]) => {
        const bonus = racialBonuses[ability] || 0
        acc[ability] = {
            base: value as number,
            racial: bonus,
            total: (value as number) + bonus,
            modifier: Math.floor(((value as number) + bonus - 10) / 2)
        }
        return acc
    }, {} as Record<string, any>)

    // Базовая информация
    const basicInfo = (
        <div className="space-y-4">
            <div className="flex items-center space-x-4">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white text-2xl font-bold">
                    {name?.charAt(0)?.toUpperCase() || '?'}
                </div>
                <div>
                    <h3 className="text-2xl font-bold">{name || 'Безымянный'}</h3>
                    <div className="flex items-center space-x-2">
                        <Badge className="bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300">
                            {RACE_TRANSLATIONS[race] || race}
                        </Badge>
                        <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300">
                            {CLASS_TRANSLATIONS[characterClass] || characterClass}
                        </Badge>
                    </div>
                </div>
            </div>

            {alignment && (
                <div>
                    <h4 className="font-semibold mb-1">Мировоззрение</h4>
                    <Badge variant="outline">
                        {ALIGNMENT_TRANSLATIONS[alignment] || alignment}
                    </Badge>
                </div>
            )}
        </div>
    )

    // Характеристики
    const abilitiesDisplay = (
        <div className="grid grid-cols-2 gap-4">
            {Object.entries(finalAbilities).map(([ability, data]) => (
                <div key={ability} className="text-center p-3 bg-muted rounded-lg">
                    <div className="text-sm font-medium text-muted-foreground mb-1">
                        {ABILITY_TRANSLATIONS[ability]}
                    </div>
                    <div className="text-2xl font-bold">
                        {data.total}
                        {data.racial > 0 && (
                            <span className="text-sm text-green-600 dark:text-green-400 ml-1">
                (+{data.racial})
              </span>
                        )}
                    </div>
                    <div className={cn(
                        "text-sm font-medium",
                        data.modifier >= 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"
                    )}>
                        {data.modifier >= 0 ? '+' : ''}{data.modifier}
                    </div>
                </div>
            ))}
        </div>
    )

    // Навыки
    const skillsDisplay = selectedSkills.length > 0 ? (
        <div className="space-y-3">
            <h4 className="font-semibold">Выбранные навыки ({selectedSkills.length}):</h4>
            <div className="flex flex-wrap gap-2">
                {selectedSkills.map((skillId: string) => (
                    <Badge key={skillId} variant="outline">
                        {SKILLS_TRANSLATIONS[skillId] || skillId}
                    </Badge>
                ))}
            </div>
        </div>
    ) : (
        <p className="text-muted-foreground">Навыки не выбраны</p>
    )

    // Предыстория
    const backgroundDisplay = (
        <div className="space-y-4">
            {backstory && (
                <div>
                    <h4 className="font-semibold mb-2 flex items-center space-x-2">
                        <BookOpen className="h-4 w-4" />
                        <span>Предыстория</span>
                    </h4>
                    <p className="text-sm leading-relaxed bg-muted p-3 rounded-lg">
                        {backstory}
                    </p>
                </div>
            )}

            {motivation && (
                <div>
                    <h4 className="font-semibold mb-2 flex items-center space-x-2">
                        <Target className="h-4 w-4" />
                        <span>Мотивация</span>
                    </h4>
                    <p className="text-sm leading-relaxed bg-muted p-3 rounded-lg">
                        {motivation}
                    </p>
                </div>
            )}
        </div>
    )

    // Черты характера
    const personalityDisplay = (
        <div className="space-y-4">
            {personalityTraits.traits && personalityTraits.traits.length > 0 && (
                <div>
                    <h4 className="font-semibold mb-2 flex items-center space-x-2">
                        <Sparkles className="h-4 w-4 text-pink-500" />
                        <span>Особенности</span>
                    </h4>
                    <div className="space-y-1">
                        {personalityTraits.traits.map((trait: string, index: number) => (
                            <p key={index} className="text-sm bg-muted p-2 rounded">
                                {trait}
                            </p>
                        ))}
                    </div>
                </div>
            )}

            {personalityTraits.ideals && personalityTraits.ideals.length > 0 && (
                <div>
                    <h4 className="font-semibold mb-2 flex items-center space-x-2">
                        <Crown className="h-4 w-4 text-amber-500" />
                        <span>Идеалы</span>
                    </h4>
                    <div className="space-y-1">
                        {personalityTraits.ideals.map((ideal: string, index: number) => (
                            <p key={index} className="text-sm bg-muted p-2 rounded">
                                {ideal}
                            </p>
                        ))}
                    </div>
                </div>
            )}

            {personalityTraits.bonds && personalityTraits.bonds.length > 0 && (
                <div>
                    <h4 className="font-semibold mb-2 flex items-center space-x-2">
                        <Users className="h-4 w-4 text-blue-500" />
                        <span>Привязанности</span>
                    </h4>
                    <div className="space-y-1">
                        {personalityTraits.bonds.map((bond: string, index: number) => (
                            <p key={index} className="text-sm bg-muted p-2 rounded">
                                {bond}
                            </p>
                        ))}
                    </div>
                </div>
            )}

            {personalityTraits.flaws && personalityTraits.flaws.length > 0 && (
                <div>
                    <h4 className="font-semibold mb-2 flex items-center space-x-2">
                        <AlertTriangle className="h-4 w-4 text-red-500" />
                        <span>Недостатки</span>
                    </h4>
                    <div className="space-y-1">
                        {personalityTraits.flaws.map((flaw: string, index: number) => (
                            <p key={index} className="text-sm bg-muted p-2 rounded">
                                {flaw}
                            </p>
                        ))}
                    </div>
                </div>
            )}

            {(!personalityTraits.traits?.length && !personalityTraits.ideals?.length &&
                !personalityTraits.bonds?.length && !personalityTraits.flaws?.length) && (
                <p className="text-muted-foreground">Черты характера не добавлены</p>
            )}
        </div>
    )

    return (
        <div className="space-y-6">
            <div>
                <h3 className="text-lg font-semibold mb-2">Предпросмотр персонажа</h3>
                <p className="text-muted-foreground">
                    Проверьте все детали перед созданием персонажа. Вы можете вернуться к любому шагу для изменений.
                </p>
            </div>

            <div className="grid gap-6">
                {/* Основная информация */}
                <StatBlock
                    title="Основная информация"
                    stats={basicInfo}
                    onEdit={() => onEdit(0)}
                    editStep={0}
                />

                {/* Характеристики */}
                <StatBlock
                    title="Характеристики"
                    stats={abilitiesDisplay}
                    onEdit={() => onEdit(2)}
                    editStep={2}
                />

                {/* Навыки */}
                <StatBlock
                    title="Навыки"
                    stats={skillsDisplay}
                    onEdit={() => onEdit(3)}
                    editStep={3}
                />

                {/* Предыстория */}
                <StatBlock
                    title="Предыстория и мотивация"
                    stats={backgroundDisplay}
                    onEdit={() => onEdit(4)}
                    editStep={4}
                />

                {/* Черты характера */}
                <StatBlock
                    title="Черты характера"
                    stats={personalityDisplay}
                    onEdit={() => onEdit(4)}
                    editStep={4}
                />
            </div>

            {/* Итоговая информация */}
            <Card className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30 border-green-200 dark:border-green-800">
                <CardContent className="p-6">
                    <div className="flex items-center space-x-3 mb-4">
                        <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center">
                            <Crown className="h-4 w-4 text-white" />
                        </div>
                        <h4 className="text-lg font-semibold text-green-900 dark:text-green-100">
                            Персонаж готов к созданию!
                        </h4>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                        <div>
                            <div className="text-2xl font-bold text-green-900 dark:text-green-100">
                                {Object.values(finalAbilities).reduce((sum, ability) => sum + ability.total, 0)}
                            </div>
                            <div className="text-sm text-green-700 dark:text-green-300">
                                Сумма характеристик
                            </div>
                        </div>
                        <div>
                            <div className="text-2xl font-bold text-green-900 dark:text-green-100">
                                {Math.max(...Object.values(finalAbilities).map((ability: any) => ability.modifier))}
                            </div>
                            <div className="text-sm text-green-700 dark:text-green-300">
                                Лучший модификатор
                            </div>
                        </div>
                        <div>
                            <div className="text-2xl font-bold text-green-900 dark:text-green-100">
                                {selectedSkills.length}
                            </div>
                            <div className="text-sm text-green-700 dark:text-green-300">
                                Навыков выбрано
                            </div>
                        </div>
                        <div>
                            <div className="text-2xl font-bold text-green-900 dark:text-green-100">
                                1
                            </div>
                            <div className="text-sm text-green-700 dark:text-green-300">
                                Уровень
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}