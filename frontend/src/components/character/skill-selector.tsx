// frontend/src/components/character/skill-selector.tsx
import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import {
    Target,
    Eye,
    Heart,
    Brain,
    Zap,
    Users,
    Sword,
    Shield,
    BookOpen,
    Sparkles
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface SkillSelectorProps {
    selectedClass: string
    selectedSkills: string[]
    onSkillsChange: (skills: string[]) => void
    error?: string
}

// Информация о навыках
const SKILLS_INFO = {
    'acrobatics': {
        name: 'Акробатика',
        ability: 'Ловкость',
        description: 'Выполнение трюков, балансирование, уклонение',
        icon: Target,
        color: 'from-green-500 to-emerald-500'
    },
    'animalHandling': {
        name: 'Обращение с животными',
        ability: 'Мудрость',
        description: 'Успокоение, дрессировка и понимание животных',
        icon: Heart,
        color: 'from-amber-500 to-yellow-500'
    },
    'arcana': {
        name: 'Магия',
        ability: 'Интеллект',
        description: 'Знания о заклинаниях, магических предметах',
        icon: Sparkles,
        color: 'from-purple-500 to-pink-500'
    },
    'athletics': {
        name: 'Атлетика',
        ability: 'Сила',
        description: 'Лазание, прыжки, плавание, борьба',
        icon: Sword,
        color: 'from-red-500 to-orange-500'
    },
    'deception': {
        name: 'Обман',
        ability: 'Харизма',
        description: 'Введение в заблуждение словами и действиями',
        icon: Eye,
        color: 'from-slate-500 to-gray-500'
    },
    'history': {
        name: 'История',
        ability: 'Интеллект',
        description: 'Знания о прошлых событиях и цивилизациях',
        icon: BookOpen,
        color: 'from-blue-500 to-indigo-500'
    },
    'insight': {
        name: 'Проницательность',
        ability: 'Мудрость',
        description: 'Понимание истинных намерений других',
        icon: Eye,
        color: 'from-amber-500 to-yellow-500'
    },
    'intimidation': {
        name: 'Запугивание',
        ability: 'Харизма',
        description: 'Принуждение через угрозы и враждебность',
        icon: Sword,
        color: 'from-red-500 to-rose-500'
    },
    'investigation': {
        name: 'Расследование',
        ability: 'Интеллект',
        description: 'Поиск улик и разгадывание загадок',
        icon: Eye,
        color: 'from-blue-500 to-indigo-500'
    },
    'medicine': {
        name: 'Медицина',
        ability: 'Мудрость',
        description: 'Лечение ран и определение болезней',
        icon: Heart,
        color: 'from-pink-500 to-red-500'
    },
    'nature': {
        name: 'Природа',
        ability: 'Интеллект',
        description: 'Знания о природе, растениях и животных',
        icon: Sparkles,
        color: 'from-green-500 to-emerald-500'
    },
    'perception': {
        name: 'Восприятие',
        ability: 'Мудрость',
        description: 'Замечание скрытых объектов и деталей',
        icon: Eye,
        color: 'from-amber-500 to-yellow-500'
    },
    'performance': {
        name: 'Выступление',
        ability: 'Харизма',
        description: 'Развлечение аудитории через искусство',
        icon: Sparkles,
        color: 'from-purple-500 to-pink-500'
    },
    'persuasion': {
        name: 'Убеждение',
        ability: 'Харизма',
        description: 'Влияние на других добротой и дипломатией',
        icon: Users,
        color: 'from-purple-500 to-pink-500'
    },
    'religion': {
        name: 'Религия',
        ability: 'Интеллект',
        description: 'Знания о божествах и религиозных практиках',
        icon: BookOpen,
        color: 'from-blue-500 to-indigo-500'
    },
    'sleightOfHand': {
        name: 'Ловкость рук',
        ability: 'Ловкость',
        description: 'Карманные кражи и манипуляции предметами',
        icon: Target,
        color: 'from-green-500 to-emerald-500'
    },
    'stealth': {
        name: 'Скрытность',
        ability: 'Ловкость',
        description: 'Незаметное передвижение и сокрытие',
        icon: Shield,
        color: 'from-slate-500 to-gray-500'
    },
    'survival': {
        name: 'Выживание',
        ability: 'Мудрость',
        description: 'Следование по следам, навигация, добыча пищи',
        icon: Target,
        color: 'from-amber-500 to-yellow-500'
    }
}

// Навыки доступные для каждого класса
const CLASS_SKILLS: Record<string, { available: string[], choose: number }> = {
    'BARBARIAN': {
        available: ['animalHandling', 'athletics', 'intimidation', 'nature', 'perception', 'survival'],
        choose: 2
    },
    'BARD': {
        available: Object.keys(SKILLS_INFO), // Барды могут выбрать любые навыки
        choose: 3
    },
    'CLERIC': {
        available: ['history', 'insight', 'medicine', 'persuasion', 'religion'],
        choose: 2
    },
    'DRUID': {
        available: ['arcana', 'animalHandling', 'insight', 'medicine', 'nature', 'perception', 'religion', 'survival'],
        choose: 2
    },
    'FIGHTER': {
        available: ['acrobatics', 'animalHandling', 'athletics', 'history', 'insight', 'intimidation', 'perception', 'survival'],
        choose: 2
    },
    'MONK': {
        available: ['acrobatics', 'athletics', 'history', 'insight', 'religion', 'stealth'],
        choose: 2
    },
    'PALADIN': {
        available: ['athletics', 'insight', 'intimidation', 'medicine', 'persuasion', 'religion'],
        choose: 2
    },
    'RANGER': {
        available: ['animalHandling', 'athletics', 'insight', 'investigation', 'nature', 'perception', 'stealth', 'survival'],
        choose: 3
    },
    'ROGUE': {
        available: ['acrobatics', 'athletics', 'deception', 'insight', 'intimidation', 'investigation', 'perception', 'performance', 'persuasion', 'sleightOfHand', 'stealth'],
        choose: 4
    },
    'SORCERER': {
        available: ['arcana', 'deception', 'insight', 'intimidation', 'persuasion', 'religion'],
        choose: 2
    },
    'WARLOCK': {
        available: ['arcana', 'deception', 'history', 'intimidation', 'investigation', 'nature', 'religion'],
        choose: 2
    },
    'WIZARD': {
        available: ['arcana', 'history', 'insight', 'investigation', 'medicine', 'religion'],
        choose: 2
    }
}

// Группировка навыков по связанным характеристикам
const SKILLS_BY_ABILITY = {
    'Сила': ['athletics'],
    'Ловкость': ['acrobatics', 'sleightOfHand', 'stealth'],
    'Интеллект': ['arcana', 'history', 'investigation', 'nature', 'religion'],
    'Мудрость': ['animalHandling', 'insight', 'medicine', 'perception', 'survival'],
    'Харизма': ['deception', 'intimidation', 'performance', 'persuasion']
}

function SkillCard({
                       skillId,
                       skill,
                       isSelected,
                       onToggle,
                       isAvailable,
                       isRecommended
                   }: {
    skillId: string
    skill: any
    isSelected: boolean
    onToggle: () => void
    isAvailable: boolean
    isRecommended: boolean
}) {
    const Icon = skill.icon

    return (
        <Card
            className={cn(
                "cursor-pointer transition-all duration-200 border-2",
                !isAvailable && "opacity-50 cursor-not-allowed",
                isSelected && isAvailable && "border-purple-500 bg-purple-50 dark:bg-purple-950/30",
                !isSelected && isAvailable && "border-muted hover:border-purple-200 dark:hover:border-purple-800",
                isRecommended && !isSelected && "border-amber-300 bg-amber-50 dark:bg-amber-950/30"
            )}
            onClick={isAvailable ? onToggle : undefined}
        >
            <CardContent className="p-4">
                <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0">
                        <Checkbox
                            checked={isSelected}
                            disabled={!isAvailable}
                            className="mt-1"
                        />
                    </div>

                    <div className={cn(
                        "w-8 h-8 rounded-lg flex items-center justify-center text-white bg-gradient-to-br flex-shrink-0",
                        skill.color
                    )}>
                        <Icon className="h-4 w-4" />
                    </div>

                    <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                            <h4 className={cn(
                                "font-semibold text-sm",
                                isSelected && "text-purple-700 dark:text-purple-300"
                            )}>
                                {skill.name}
                            </h4>
                            <div className="flex items-center space-x-1">
                                <Badge variant="outline" className="text-xs">
                                    {skill.ability}
                                </Badge>
                                {isRecommended && (
                                    <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300 text-xs">
                                        Рекомендуется
                                    </Badge>
                                )}
                            </div>
                        </div>
                        <p className="text-xs text-muted-foreground leading-relaxed">
                            {skill.description}
                        </p>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}

export function SkillSelector({ selectedClass, selectedSkills, onSkillsChange, error }: SkillSelectorProps) {
    const [groupBy, setGroupBy] = useState<'all' | 'ability'>('ability')

    if (!selectedClass) {
        return (
            <div className="text-center py-8">
                <p className="text-muted-foreground">Сначала выберите класс персонажа</p>
            </div>
        )
    }

    const classSkillData = CLASS_SKILLS[selectedClass]
    if (!classSkillData) {
        return (
            <div className="text-center py-8">
                <p className="text-muted-foreground">Информация о навыках для этого класса недоступна</p>
            </div>
        )
    }

    const { available, choose } = classSkillData
    const remaining = choose - selectedSkills.length

    // Рекомендуемые навыки в зависимости от класса
    const getRecommendedSkills = (): string[] => {
        const recommendations: Record<string, string[]> = {
            'BARBARIAN': ['athletics', 'intimidation'],
            'BARD': ['persuasion', 'performance', 'deception'],
            'CLERIC': ['insight', 'religion'],
            'DRUID': ['nature', 'survival'],
            'FIGHTER': ['athletics', 'intimidation'],
            'MONK': ['acrobatics', 'stealth'],
            'PALADIN': ['athletics', 'persuasion'],
            'RANGER': ['survival', 'perception', 'stealth'],
            'ROGUE': ['stealth', 'sleightOfHand', 'perception', 'investigation'],
            'SORCERER': ['arcana', 'persuasion'],
            'WARLOCK': ['arcana', 'deception'],
            'WIZARD': ['arcana', 'investigation']
        }
        return recommendations[selectedClass] || []
    }

    const recommendedSkills = getRecommendedSkills()

    const handleSkillToggle = (skillId: string) => {
        if (selectedSkills.includes(skillId)) {
            // Убираем навык
            onSkillsChange(selectedSkills.filter(id => id !== skillId))
        } else if (remaining > 0) {
            // Добавляем навык
            onSkillsChange([...selectedSkills, skillId])
        }
    }

    const renderSkillsByAbility = () => {
        return Object.entries(SKILLS_BY_ABILITY).map(([ability, skillIds]) => {
            const availableSkillsInGroup = skillIds.filter(skillId => available.includes(skillId))

            if (availableSkillsInGroup.length === 0) return null

            return (
                <div key={ability} className="space-y-3">
                    <h4 className="text-lg font-semibold flex items-center space-x-2">
                        <div className="w-6 h-6 rounded bg-gradient-to-r from-purple-500 to-blue-500 flex items-center justify-center">
              <span className="text-white text-xs font-bold">
                {ability.charAt(0)}
              </span>
                        </div>
                        <span>{ability}</span>
                        <Badge variant="outline" className="text-xs">
                            {availableSkillsInGroup.length} навык{availableSkillsInGroup.length === 1 ? '' : availableSkillsInGroup.length < 5 ? 'а' : 'ов'}
                        </Badge>
                    </h4>

                    <div className="grid gap-3">
                        {availableSkillsInGroup.map(skillId => (
                            <SkillCard
                                key={skillId}
                                skillId={skillId}
                                skill={SKILLS_INFO[skillId as keyof typeof SKILLS_INFO]}
                                isSelected={selectedSkills.includes(skillId)}
                                onToggle={() => handleSkillToggle(skillId)}
                                isAvailable={available.includes(skillId)}
                                isRecommended={recommendedSkills.includes(skillId)}
                            />
                        ))}
                    </div>
                </div>
            )
        }).filter(Boolean)
    }

    const renderAllSkills = () => {
        return (
            <div className="grid gap-3">
                {available.map(skillId => (
                    <SkillCard
                        key={skillId}
                        skillId={skillId}
                        skill={SKILLS_INFO[skillId as keyof typeof SKILLS_INFO]}
                        isSelected={selectedSkills.includes(skillId)}
                        onToggle={() => handleSkillToggle(skillId)}
                        isAvailable={true}
                        isRecommended={recommendedSkills.includes(skillId)}
                    />
                ))}
            </div>
        )
    }

    return (
        <div className="space-y-6">
            <div>
                <h3 className="text-lg font-semibold mb-2">Выберите навыки персонажа</h3>
                <p className="text-muted-foreground">
                    Ваш класс позволяет выбрать {choose} навык{choose === 1 ? '' : choose < 5 ? 'а' : 'ов'} из доступного списка.
                </p>
                {error && (
                    <p className="text-sm text-red-600 dark:text-red-400 mt-2">
                        {error}
                    </p>
                )}
            </div>

            {/* Счетчик выбранных навыков */}
            <Card className={cn(
                "border-2",
                remaining === 0 ? "border-green-500 bg-green-50 dark:bg-green-950/30" : "border-blue-500 bg-blue-50 dark:bg-blue-950/30"
            )}>
                <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                            <div className={cn(
                                "w-8 h-8 rounded-full flex items-center justify-center text-white",
                                remaining === 0 ? "bg-green-500" : "bg-blue-500"
                            )}>
                                <span className="text-sm font-bold">{selectedSkills.length}</span>
                            </div>
                            <div>
                                <h4 className={cn(
                                    "font-semibold",
                                    remaining === 0 ? "text-green-900 dark:text-green-100" : "text-blue-900 dark:text-blue-100"
                                )}>
                                    Выбрано навыков: {selectedSkills.length} из {choose}
                                </h4>
                                <p className={cn(
                                    "text-sm",
                                    remaining === 0 ? "text-green-800 dark:text-green-200" : "text-blue-800 dark:text-blue-200"
                                )}>
                                    {remaining > 0
                                        ? `Можно выбрать еще ${remaining} навык${remaining === 1 ? '' : remaining < 5 ? 'а' : 'ов'}`
                                        : 'Все навыки выбраны!'
                                    }
                                </p>
                            </div>
                        </div>

                        {/* Переключатель группировки */}
                        <div className="flex space-x-2">
                            <Button
                                variant={groupBy === 'ability' ? 'default' : 'outline'}
                                size="sm"
                                onClick={() => setGroupBy('ability')}
                            >
                                По характеристикам
                            </Button>
                            <Button
                                variant={groupBy === 'all' ? 'default' : 'outline'}
                                size="sm"
                                onClick={() => setGroupBy('all')}
                            >
                                Все навыки
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Список выбранных навыков */}
            {selectedSkills.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">Выбранные навыки</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex flex-wrap gap-2">
                            {selectedSkills.map(skillId => {
                                const skill = SKILLS_INFO[skillId as keyof typeof SKILLS_INFO]
                                return (
                                    <Badge
                                        key={skillId}
                                        className="bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300 cursor-pointer hover:bg-purple-200 dark:hover:bg-purple-800"
                                        onClick={() => handleSkillToggle(skillId)}
                                    >
                                        {skill.name} ({skill.ability})
                                        <span className="ml-1">×</span>
                                    </Badge>
                                )
                            })}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Навыки */}
            <div className="space-y-6">
                {groupBy === 'ability' ? renderSkillsByAbility() : renderAllSkills()}
            </div>

            {/* Подсказки */}
            {recommendedSkills.length > 0 && (
                <Card className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30 border-amber-200 dark:border-amber-800">
                    <CardContent className="p-4">
                        <div className="flex items-start space-x-3">
                            <Sparkles className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                            <div>
                                <h4 className="font-semibold text-amber-900 dark:text-amber-100 mb-2">
                                    Рекомендуемые навыки для {selectedClass}
                                </h4>
                                <div className="flex flex-wrap gap-2">
                                    {recommendedSkills.map(skillId => {
                                        const skill = SKILLS_INFO[skillId as keyof typeof SKILLS_INFO]
                                        const isAvailable = available.includes(skillId)
                                        if (!isAvailable) return null

                                        return (
                                            <Badge
                                                key={skillId}
                                                className={cn(
                                                    "cursor-pointer transition-colors",
                                                    selectedSkills.includes(skillId)
                                                        ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
                                                        : "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300 hover:bg-amber-200 dark:hover:bg-amber-800"
                                                )}
                                                onClick={() => remaining > 0 || selectedSkills.includes(skillId) ? handleSkillToggle(skillId) : undefined}
                                            >
                                                {skill.name}
                                                {selectedSkills.includes(skillId) && <span className="ml-1">✓</span>}
                                            </Badge>
                                        )
                                    })}
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    )
}