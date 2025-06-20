// frontend/src/components/character/skills-panel.tsx
'use client'

import React, { useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import {
    Search,
    Star,
    CircleDot,
    Circle,
    Filter,
    BookOpen,
    Sword,
    Zap,
    Heart,
    Brain,
    Eye,
    Sparkles,
    ChevronDown,
    ChevronUp
} from 'lucide-react'
import { cn, getAbilityModifier, formatModifier } from '@/lib/utils'
import { AbilityScores } from '@/types'

interface SkillProficiency {
    proficient: boolean
    expertise: boolean
}

interface SkillsPanelProps {
    abilityScores: AbilityScores
    skills: Record<string, SkillProficiency>
    onSkillsChange?: (skills: Record<string, SkillProficiency>) => void
    proficiencyBonus: number
    isEditing?: boolean
    availableSkillPoints?: number
    className?: string
}

// Данные о навыках D&D 5e с русскими названиями
const SKILLS_DATA = {
    acrobatics: {
        name: 'Акробатика',
        ability: 'dexterity' as keyof AbilityScores,
        description: 'Сохранение равновесия, выполнение акробатических трюков'
    },
    animalHandling: {
        name: 'Обращение с животными',
        ability: 'wisdom' as keyof AbilityScores,
        description: 'Успокаивание и контроль животных'
    },
    arcana: {
        name: 'Магия',
        ability: 'intelligence' as keyof AbilityScores,
        description: 'Знания о заклинаниях, магических предметах, планах'
    },
    athletics: {
        name: 'Атлетика',
        ability: 'strength' as keyof AbilityScores,
        description: 'Лазание, прыжки, плавание, силовые трюки'
    },
    deception: {
        name: 'Обман',
        ability: 'charisma' as keyof AbilityScores,
        description: 'Убедительная ложь, сокрытие правды'
    },
    history: {
        name: 'История',
        ability: 'intelligence' as keyof AbilityScores,
        description: 'Знания об исторических событиях, легендах, войнах'
    },
    insight: {
        name: 'Проницательность',
        ability: 'wisdom' as keyof AbilityScores,
        description: 'Определение намерений, чтение языка тела'
    },
    intimidation: {
        name: 'Запугивание',
        ability: 'charisma' as keyof AbilityScores,
        description: 'Влияние через угрозы, враждебность'
    },
    investigation: {
        name: 'Расследование',
        ability: 'intelligence' as keyof AbilityScores,
        description: 'Поиск улик, дедуктивные рассуждения'
    },
    medicine: {
        name: 'Медицина',
        ability: 'wisdom' as keyof AbilityScores,
        description: 'Стабилизация умирающих, диагностика болезней'
    },
    nature: {
        name: 'Природа',
        ability: 'intelligence' as keyof AbilityScores,
        description: 'Знания о животных, растениях, погоде'
    },
    perception: {
        name: 'Восприятие',
        ability: 'wisdom' as keyof AbilityScores,
        description: 'Обнаружение скрытого, внимательность'
    },
    performance: {
        name: 'Выступление',
        ability: 'charisma' as keyof AbilityScores,
        description: 'Развлечение публики песнями, танцами, речами'
    },
    persuasion: {
        name: 'Убеждение',
        ability: 'charisma' as keyof AbilityScores,
        description: 'Влияние на других честными средствами'
    },
    religion: {
        name: 'Религия',
        ability: 'intelligence' as keyof AbilityScores,
        description: 'Знания о божествах, ритуалах, святых писаниях'
    },
    sleightOfHand: {
        name: 'Ловкость рук',
        ability: 'dexterity' as keyof AbilityScores,
        description: 'Карманные кражи, манипуляции предметами'
    },
    stealth: {
        name: 'Скрытность',
        ability: 'dexterity' as keyof AbilityScores,
        description: 'Незаметное передвижение, прятки'
    },
    survival: {
        name: 'Выживание',
        ability: 'wisdom' as keyof AbilityScores,
        description: 'Следопытство, поиск еды, ориентирование'
    }
}

// Иконки для характеристик
const ABILITY_ICONS = {
    strength: Sword,
    dexterity: Zap,
    constitution: Heart,
    intelligence: Brain,
    wisdom: Eye,
    charisma: Sparkles
}

// Группировка навыков по характеристикам
const SKILLS_BY_ABILITY = {
    strength: ['athletics'],
    dexterity: ['acrobatics', 'sleightOfHand', 'stealth'],
    constitution: [],
    intelligence: ['arcana', 'history', 'investigation', 'nature', 'religion'],
    wisdom: ['animalHandling', 'insight', 'medicine', 'perception', 'survival'],
    charisma: ['deception', 'intimidation', 'performance', 'persuasion']
}

export const SkillsPanel: React.FC<SkillsPanelProps> = ({
                                                            abilityScores,
                                                            skills,
                                                            onSkillsChange,
                                                            proficiencyBonus,
                                                            isEditing = false,
                                                            availableSkillPoints = 0,
                                                            className
                                                        }) => {
    const [searchTerm, setSearchTerm] = useState('')
    const [filterBy, setFilterBy] = useState<'all' | 'proficient' | 'expertise'>('all')
    const [groupBy, setGroupBy] = useState<'ability' | 'alphabetical'>('ability')
    const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set())

    // Подсчет использованных очков навыков
    const usedSkillPoints = useMemo(() => {
        return Object.values(skills).reduce((total, skill) => {
            return total + (skill.proficient ? 1 : 0) + (skill.expertise ? 1 : 0)
        }, 0)
    }, [skills])

    // Фильтрация и группировка навыков
    const processedSkills = useMemo(() => {
        let filteredSkills = Object.entries(SKILLS_DATA)

        // Поиск
        if (searchTerm) {
            filteredSkills = filteredSkills.filter(([key, data]) =>
                data.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                data.description.toLowerCase().includes(searchTerm.toLowerCase())
            )
        }

        // Фильтрация по владению
        if (filterBy !== 'all') {
            filteredSkills = filteredSkills.filter(([key]) => {
                const skill = skills[key]
                if (filterBy === 'proficient') return skill?.proficient
                if (filterBy === 'expertise') return skill?.expertise
                return true
            })
        }

        // Группировка
        if (groupBy === 'ability') {
            const grouped: Record<string, Array<[string, typeof SKILLS_DATA[keyof typeof SKILLS_DATA]]>> = {}

            Object.entries(SKILLS_BY_ABILITY).forEach(([ability, skillKeys]) => {
                grouped[ability] = filteredSkills.filter(([key]) => skillKeys.includes(key))
            })

            return grouped
        } else {
            // Алфавитная сортировка
            filteredSkills.sort(([, a], [, b]) => a.name.localeCompare(b.name))
            return { all: filteredSkills }
        }
    }, [searchTerm, filterBy, groupBy, skills])

    // Переключение владения навыком
    const toggleSkillProficiency = (skillKey: string) => {
        if (!onSkillsChange) return

        const currentSkill = skills[skillKey] || { proficient: false, expertise: false }
        const newSkills = {
            ...skills,
            [skillKey]: {
                ...currentSkill,
                proficient: !currentSkill.proficient,
                expertise: currentSkill.expertise && !currentSkill.proficient // Убираем экспертизу если убираем владение
            }
        }

        onSkillsChange(newSkills)
    }

    // Переключение экспертизы
    const toggleSkillExpertise = (skillKey: string) => {
        if (!onSkillsChange) return

        const currentSkill = skills[skillKey] || { proficient: false, expertise: false }
        if (!currentSkill.proficient) return // Нельзя иметь экспертизу без владения

        const newSkills = {
            ...skills,
            [skillKey]: {
                ...currentSkill,
                expertise: !currentSkill.expertise
            }
        }

        onSkillsChange(newSkills)
    }

    // Расчет бонуса навыка
    const getSkillBonus = (skillKey: string) => {
        const skillData = SKILLS_DATA[skillKey as keyof typeof SKILLS_DATA]
        const skill = skills[skillKey] || { proficient: false, expertise: false }
        const abilityModifier = getAbilityModifier(abilityScores[skillData.ability])

        let bonus = abilityModifier

        if (skill.proficient) {
            bonus += proficiencyBonus
        }

        if (skill.expertise) {
            bonus += proficiencyBonus // Удваиваем бонус мастерства
        }

        return bonus
    }

    // Переключение свернутости группы
    const toggleGroupCollapse = (groupKey: string) => {
        const newCollapsed = new Set(collapsedGroups)
        if (newCollapsed.has(groupKey)) {
            newCollapsed.delete(groupKey)
        } else {
            newCollapsed.add(groupKey)
        }
        setCollapsedGroups(newCollapsed)
    }

    // Получение названия группы
    const getGroupTitle = (groupKey: string) => {
        if (groupKey === 'all') return 'Все навыки'

        const abilityNames: Record<string, string> = {
            strength: 'Сила',
            dexterity: 'Ловкость',
            constitution: 'Телосложение',
            intelligence: 'Интеллект',
            wisdom: 'Мудрость',
            charisma: 'Харизма'
        }

        return abilityNames[groupKey] || groupKey
    }

    return (
        <TooltipProvider>
            <Card className={cn("w-full", className)}>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <CardTitle className="flex items-center gap-2">
                            <BookOpen className="h-5 w-5" />
                            Навыки
                            {isEditing && availableSkillPoints > 0 && (
                                <Badge variant="secondary">
                                    {availableSkillPoints - usedSkillPoints} доступно
                                </Badge>
                            )}
                        </CardTitle>

                        <div className="flex items-center gap-2">
                            {/* Поиск */}
                            <div className="relative">
                                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Поиск навыков..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="pl-8 w-48"
                                />
                            </div>

                            {/* Фильтрация */}
                            <Select value={filterBy} onValueChange={(value: any) => setFilterBy(value)}>
                                <SelectTrigger className="w-32">
                                    <Filter className="h-4 w-4 mr-1" />
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Все</SelectItem>
                                    <SelectItem value="proficient">Владение</SelectItem>
                                    <SelectItem value="expertise">Экспертиза</SelectItem>
                                </SelectContent>
                            </Select>

                            {/* Группировка */}
                            <Select value={groupBy} onValueChange={(value: any) => setGroupBy(value)}>
                                <SelectTrigger className="w-32">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="ability">По характеристике</SelectItem>
                                    <SelectItem value="alphabetical">По алфавиту</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {/* Итоговая информация */}
                    {!isEditing && (
                        <div className="grid grid-cols-3 gap-4 text-sm">
                            <div className="text-center">
                                <p className="text-muted-foreground">Владения</p>
                                <p className="font-semibold text-lg">
                                    {Object.values(skills).filter(s => s.proficient).length}
                                </p>
                            </div>
                            <div className="text-center">
                                <p className="text-muted-foreground">Экспертизы</p>
                                <p className="font-semibold text-lg">
                                    {Object.values(skills).filter(s => s.expertise).length}
                                </p>
                            </div>
                            <div className="text-center">
                                <p className="text-muted-foreground">Средний бонус</p>
                                <p className="font-semibold text-lg">
                                    {formatModifier(
                                        Math.round(
                                            Object.keys(SKILLS_DATA).reduce((sum, key) => sum + getSkillBonus(key), 0) /
                                            Object.keys(SKILLS_DATA).length
                                        )
                                    )}
                                </p>
                            </div>
                        </div>
                    )}
                </CardHeader>

                <CardContent>
                    <div className="space-y-4">
                        {Object.entries(processedSkills).map(([groupKey, groupSkills]) => {
                            if (groupSkills.length === 0) return null

                            const isCollapsed = collapsedGroups.has(groupKey)
                            const AbilityIcon = ABILITY_ICONS[groupKey as keyof typeof ABILITY_ICONS]

                            return (
                                <div key={groupKey} className="space-y-2">
                                    {/* Заголовок группы */}
                                    {groupBy === 'ability' && groupKey !== 'all' && (
                                        <div
                                            className="flex items-center gap-2 cursor-pointer hover:bg-muted/50 rounded p-2 -m-2"
                                            onClick={() => toggleGroupCollapse(groupKey)}
                                        >
                                            {AbilityIcon && <AbilityIcon className="h-4 w-4" />}
                                            <h3 className="font-semibold text-sm">{getGroupTitle(groupKey)}</h3>
                                            <Badge variant="outline" className="text-xs">
                                                {groupSkills.length}
                                            </Badge>
                                            {isCollapsed ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
                                        </div>
                                    )}

                                    {/* Навыки группы */}
                                    {!isCollapsed && (
                                        <div className="grid gap-2">
                                            {groupSkills.map(([skillKey, skillData]) => {
                                                const skill = skills[skillKey] || { proficient: false, expertise: false }
                                                const bonus = getSkillBonus(skillKey)
                                                const abilityModifier = getAbilityModifier(abilityScores[skillData.ability])

                                                return (
                                                    <div
                                                        key={skillKey}
                                                        className={cn(
                                                            "flex items-center justify-between p-3 rounded-lg border transition-all",
                                                            skill.expertise
                                                                ? "bg-purple-50 border-purple-200 dark:bg-purple-950/20 dark:border-purple-800"
                                                                : skill.proficient
                                                                    ? "bg-blue-50 border-blue-200 dark:bg-blue-950/20 dark:border-blue-800"
                                                                    : "bg-background hover:bg-muted/50"
                                                        )}
                                                    >
                                                        <div className="flex items-center gap-3 flex-1">
                                                            {/* Индикаторы владения */}
                                                            <div className="flex flex-col gap-1">
                                                                {isEditing ? (
                                                                    <>
                                                                        <Checkbox
                                                                            checked={skill.proficient}
                                                                            onCheckedChange={() => toggleSkillProficiency(skillKey)}
                                                                            className="h-4 w-4"
                                                                        />
                                                                        <Checkbox
                                                                            checked={skill.expertise}
                                                                            onCheckedChange={() => toggleSkillExpertise(skillKey)}
                                                                            disabled={!skill.proficient}
                                                                            className="h-4 w-4"
                                                                        />
                                                                    </>
                                                                ) : (
                                                                    <>
                                                                        {skill.proficient ? (
                                                                            <CircleDot className="h-4 w-4 text-blue-600" />
                                                                        ) : (
                                                                            <Circle className="h-4 w-4 text-muted-foreground" />
                                                                        )}
                                                                        {skill.expertise && (
                                                                            <Star className="h-4 w-4 text-purple-600" />
                                                                        )}
                                                                    </>
                                                                )}
                                                            </div>

                                                            {/* Информация о навыке */}
                                                            <div className="flex-1">
                                                                <div className="flex items-center gap-2">
                                                                    <h4 className="font-medium">{skillData.name}</h4>
                                                                    <Badge variant="outline" className="text-xs">
                                                                        {skillData.ability.toUpperCase().slice(0, 3)}
                                                                    </Badge>
                                                                </div>
                                                                <p className="text-sm text-muted-foreground">
                                                                    {skillData.description}
                                                                </p>
                                                            </div>
                                                        </div>

                                                        {/* Бонус */}
                                                        <div className="text-right">
                                                            <div className="text-lg font-bold">
                                                                {formatModifier(bonus)}
                                                            </div>
                                                            <div className="text-xs text-muted-foreground">
                                                                {formatModifier(abilityModifier)}
                                                                {skill.proficient && ` + ${proficiencyBonus}`}
                                                                {skill.expertise && ` × 2`}
                                                            </div>
                                                        </div>

                                                        {/* Тултип с подробностями */}
                                                        <Tooltip>
                                                            <TooltipTrigger asChild>
                                                                <div className="absolute inset-0" />
                                                            </TooltipTrigger>
                                                            <TooltipContent side="left" className="max-w-xs">
                                                                <div className="text-sm">
                                                                    <p className="font-semibold mb-1">{skillData.name}</p>
                                                                    <p className="mb-2">{skillData.description}</p>
                                                                    <div className="text-xs space-y-1">
                                                                        <div>Характеристика: {skillData.ability.toUpperCase()}</div>
                                                                        <div>Модификатор: {formatModifier(abilityModifier)}</div>
                                                                        {skill.proficient && <div>Бонус мастерства: +{proficiencyBonus}</div>}
                                                                        {skill.expertise && <div>Экспертиза: удваивает бонус мастерства</div>}
                                                                        <div className="font-medium">Итоговый бонус: {formatModifier(bonus)}</div>
                                                                    </div>
                                                                </div>
                                                            </TooltipContent>
                                                        </Tooltip>
                                                    </div>
                                                )
                                            })}
                                        </div>
                                    )}
                                </div>
                            )
                        })}
                    </div>

                    {/* Легенда */}
                    {!isEditing && (
                        <div className="mt-6 pt-4 border-t">
                            <div className="flex items-center justify-center gap-6 text-sm text-muted-foreground">
                                <div className="flex items-center gap-1">
                                    <CircleDot className="h-4 w-4 text-blue-600" />
                                    <span>Владение</span>
                                </div>
                                <div className="flex items-center gap-1">
                                    <Star className="h-4 w-4 text-purple-600" />
                                    <span>Экспертиза</span>
                                </div>
                                <div className="flex items-center gap-1">
                                    <Circle className="h-4 w-4" />
                                    <span>Без владения</span>
                                </div>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>
        </TooltipProvider>
    )
}