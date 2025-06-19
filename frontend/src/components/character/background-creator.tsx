// frontend/src/components/character/background-creator.tsx
import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import {
    Wand2,
    BookOpen,
    Heart,
    Target,
    AlertTriangle,
    Lightbulb,
    Scroll,
    Users,
    Crown,
    Swords
} from 'lucide-react'
import { PersonalityTraits } from '@/types'
import { cn } from '@/lib/utils'
import { UseFormRegister } from 'react-hook-form'

interface BackgroundCreatorProps {
    race: string
    characterClass: string
    alignment: string
    backstory: string
    motivation: string
    personalityTraits?: PersonalityTraits
    onAlignmentChange: (alignment: string) => void
    onBackstoryChange: (backstory: string) => void
    onMotivationChange: (motivation: string) => void
    onPersonalityChange: (traits: PersonalityTraits) => void
    errors: {
        alignment?: string
        backstory?: string
        motivation?: string
    }
    register: UseFormRegister<any>
}

// Мировоззрения
const ALIGNMENTS = [
    { id: 'LG', name: 'Законно-добрый', description: 'Действует в рамках закона для достижения добра' },
    { id: 'NG', name: 'Нейтрально-добрый', description: 'Стремится к добру, не ограничиваясь законами' },
    { id: 'CG', name: 'Хаотично-добрый', description: 'Добро через свободу и независимость' },
    { id: 'LN', name: 'Законно-нейтральный', description: 'Следует традициям и порядку' },
    { id: 'TN', name: 'Истинно нейтральный', description: 'Сохраняет баланс между крайностями' },
    { id: 'CN', name: 'Хаотично-нейтральный', description: 'Ценит личную свободу превыше всего' },
    { id: 'LE', name: 'Законно-злой', description: 'Использует власть и законы для личной выгоды' },
    { id: 'NE', name: 'Нейтрально-злой', description: 'Эгоистичен, но без фанатизма' },
    { id: 'CE', name: 'Хаотично-злой', description: 'Разрушительность и жестокость' }
]

// Шаблоны предысторий по расам и классам
const BACKSTORY_TEMPLATES: Record<string, string[]> = {
    'ELF_WIZARD': [
        'Выросший в древней библиотеке, вы посвятили столетия изучению магических искусств.',
        'Изгнанный из эльфийского общества за запрещенные эксперименты, вы ищете новые знания.',
        'Хранитель древних тайн, вы покинули родные леса, чтобы предотвратить катастрофу.'
    ],
    'HUMAN_FIGHTER': [
        'Бывший солдат королевской армии, вы стали наемником после окончания войны.',
        'Выходец из семьи кузнецов, вы выковали свой собственный путь воина.',
        'Защитник деревни, вы отправились в путь, чтобы стать сильнее и защитить родных.'
    ],
    'DWARF_CLERIC': [
        'Служитель горного храма, вы получили видение от богов о великой миссии.',
        'Целитель, потерявший семью в обвале шахты, вы посвятили жизнь служению другим.',
        'Бывший воин, обретший веру после чудесного спасения в бою.'
    ]
}

// Шаблоны мотиваций
const MOTIVATION_TEMPLATES: Record<string, string[]> = {
    'LG': [
        'Защитить невинных и восстановить справедливость в мире.',
        'Служить высшему благу и быть примером для других.',
        'Искупить грехи прошлого через добрые дела.'
    ],
    'CG': [
        'Освободить угнетенных и бороться с тиранией.',
        'Следовать зову сердца и помогать нуждающимся.',
        'Доказать, что добро может существовать без жестких правил.'
    ],
    'LE': [
        'Достичь власти и контроля через дисциплину и порядок.',
        'Создать империю, основанную на железных законах.',
        'Использовать систему для достижения личных целей.'
    ]
}

// Генераторы черт характера
const PERSONALITY_GENERATORS = {
    traits: [
        'Всегда говорю правду, даже когда это неудобно',
        'Обожаю рассказывать истории и байки',
        'Коллекционирую редкие предметы и артефакты',
        'Никогда не отступаю от данного слова',
        'Предпочитаю действовать, а не планировать',
        'Всегда ищу мирное решение конфликтов',
        'Испытываю странную тягу к опасности',
        'Помню каждую мелочь, но забываю важное'
    ],
    ideals: [
        'Справедливость - основа цивилизованного общества',
        'Свобода важнее безопасности',
        'Знания должны быть доступны всем',
        'Сила дается для защиты слабых',
        'Честь дороже жизни',
        'Красота и искусство облагораживают мир',
        'Перемены - единственная константа',
        'Традиции хранят мудрость предков'
    ],
    bonds: [
        'Моя семья - самое дорогое, что у меня есть',
        'Я должен отомстить за смерть наставника',
        'Мой родной город нуждается в защите',
        'Я ищу потерянный артефакт моего народа',
        'Мой лучший друг попал в беду из-за меня',
        'Я обязан долгом перед тем, кто спас мне жизнь',
        'Священное место моего народа было осквернено',
        'Я храню тайну, которая может изменить мир'
    ],
    flaws: [
        'Не могу устоять перед азартными играми',
        'Слишком доверяю незнакомцам',
        'Боюсь темноты больше, чем должен',
        'Не переношу критики в свой адрес',
        'Часто лгу даже в мелочах',
        'Не умею обращаться с деньгами',
        'Имею склонность к алкоголю',
        'Не выношу несправедливости, даже мелкой'
    ]
}

export function BackgroundCreator({
                                      race,
                                      characterClass,
                                      alignment,
                                      backstory,
                                      motivation,
                                      personalityTraits = { traits: [], ideals: [], bonds: [], flaws: [] },
                                      onAlignmentChange,
                                      onBackstoryChange,
                                      onMotivationChange,
                                      onPersonalityChange,
                                      errors,
                                      register
                                  }: BackgroundCreatorProps) {
    const [isGeneratingBackstory, setIsGeneratingBackstory] = useState(false)
    const [isGeneratingMotivation, setIsGeneratingMotivation] = useState(false)

    // Генерация предыстории
    const generateBackstory = async () => {
        setIsGeneratingBackstory(true)
        try {
            // Пытаемся найти шаблон для комбинации расы и класса
            const key = `${race}_${characterClass}`
            const templates = BACKSTORY_TEMPLATES[key] || BACKSTORY_TEMPLATES[race] || [
                'Вы выросли в обычной семье, но судьба привела вас к приключениям.',
                'Таинственные события в прошлом изменили вашу жизнь навсегда.',
                'Вы покинули родные места в поисках своего предназначения.'
            ]

            const randomTemplate = templates[Math.floor(Math.random() * templates.length)]
            onBackstoryChange(randomTemplate)
        } catch (error) {
            console.error('Ошибка генерации предыстории:', error)
        } finally {
            setIsGeneratingBackstory(false)
        }
    }

    // Генерация мотивации
    const generateMotivation = () => {
        setIsGeneratingMotivation(true)
        try {
            const templates = MOTIVATION_TEMPLATES[alignment] || [
                'Найти свое место в этом мире и оставить след в истории.',
                'Стать сильнее и защитить то, что дорого.',
                'Раскрыть тайны прошлого и познать истину.'
            ]

            const randomTemplate = templates[Math.floor(Math.random() * templates.length)]
            onMotivationChange(randomTemplate)
        } catch (error) {
            console.error('Ошибка генерации мотивации:', error)
        } finally {
            setIsGeneratingMotivation(false)
        }
    }

    // Добавление случайной черты характера
    const addRandomTrait = (type: keyof PersonalityTraits) => {
        const traits = PERSONALITY_GENERATORS[type]
        const currentTraits = personalityTraits[type] || []
        const availableTraits = traits.filter(trait => !currentTraits.includes(trait))

        if (availableTraits.length > 0) {
            const randomTrait = availableTraits[Math.floor(Math.random() * availableTraits.length)]
            const newTraits = { ...personalityTraits }
            newTraits[type] = [...currentTraits, randomTrait]
            onPersonalityChange(newTraits)
        }
    }

    // Удаление черты характера
    const removeTrait = (type: keyof PersonalityTraits, index: number) => {
        const newTraits = { ...personalityTraits }
        newTraits[type] = newTraits[type]?.filter((_, i) => i !== index) || []
        onPersonalityChange(newTraits)
    }

    return (
        <div className="space-y-6">
            <div>
                <h3 className="text-lg font-semibold mb-2">Создайте предыстория персонажа</h3>
                <p className="text-muted-foreground">
                    Определите мировоззрение, историю и личность вашего героя.
                </p>
            </div>

            {/* Мировоззрение */}
            <div className="space-y-4">
                <Label className="text-base font-semibold">Мировоззрение</Label>
                {errors.alignment && (
                    <p className="text-sm text-red-600 dark:text-red-400">{errors.alignment}</p>
                )}

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {ALIGNMENTS.map((align) => (
                        <Card
                            key={align.id}
                            className={cn(
                                "cursor-pointer transition-all duration-200 border-2",
                                alignment === align.id
                                    ? "border-purple-500 bg-purple-50 dark:bg-purple-950/30"
                                    : "border-muted hover:border-purple-200 dark:hover:border-purple-800"
                            )}
                            onClick={() => onAlignmentChange(align.id)}
                        >
                            <CardContent className="p-4">
                                <div className="flex items-center justify-between mb-2">
                                    <h4 className={cn(
                                        "font-semibold text-sm",
                                        alignment === align.id && "text-purple-700 dark:text-purple-300"
                                    )}>
                                        {align.name}
                                    </h4>
                                    {alignment === align.id && (
                                        <div className="w-4 h-4 rounded-full bg-purple-500 flex items-center justify-center">
                                            <div className="w-1.5 h-1.5 bg-white rounded-full" />
                                        </div>
                                    )}
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    {align.description}
                                </p>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>

            {/* Предыстория */}
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <Label className="text-base font-semibold">Предыстория</Label>
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={generateBackstory}
                        disabled={isGeneratingBackstory}
                    >
                        <Wand2 className="h-4 w-4 mr-2" />
                        {isGeneratingBackstory ? 'Генерация...' : 'Сгенерировать'}
                    </Button>
                </div>

                <Textarea
                    {...register('backstory')}
                    value={backstory}
                    onChange={(e) => onBackstoryChange(e.target.value)}
                    placeholder="Расскажите историю вашего персонажа: где он родился, что с ним происходило, как он стал тем, кто есть сейчас..."
                    rows={4}
                    error={errors.backstory}
                />

                <div className="text-xs text-muted-foreground">
                    Хорошая предыстория включает: происхождение, ключевые события, причины стать авантюристом
                </div>
            </div>

            {/* Мотивация */}
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <Label className="text-base font-semibold">Мотивация</Label>
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={generateMotivation}
                        disabled={isGeneratingMotivation || !alignment}
                    >
                        <Target className="h-4 w-4 mr-2" />
                        {isGeneratingMotivation ? 'Генерация...' : 'Сгенерировать'}
                    </Button>
                </div>

                <Textarea
                    {...register('motivation')}
                    value={motivation}
                    onChange={(e) => onMotivationChange(e.target.value)}
                    placeholder="Что движет вашим персонажем? Какие цели он преследует? Чего он хочет достичь?"
                    rows={3}
                    error={errors.motivation}
                />

                <div className="text-xs text-muted-foreground">
                    Мотивация помогает ведущему создавать интересные сюжетные линии для вашего персонажа
                </div>
            </div>

            {/* Черты характера */}
            <div className="space-y-6">
                <div className="flex items-center space-x-2">
                    <BookOpen className="h-5 w-5 text-purple-500" />
                    <h4 className="text-base font-semibold">Черты характера</h4>
                    <Badge variant="outline" className="text-xs">Опционально</Badge>
                </div>

                <div className="grid gap-6">
                    {/* Особенности характера */}
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <Label className="text-sm font-medium flex items-center space-x-2">
                                <Heart className="h-4 w-4 text-pink-500" />
                                <span>Особенности характера</span>
                            </Label>
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => addRandomTrait('traits')}
                            >
                                <Wand2 className="h-3 w-3 mr-1" />
                                Добавить
                            </Button>
                        </div>

                        <div className="space-y-2">
                            {personalityTraits.traits?.map((trait, index) => (
                                <div key={index} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                                    <span className="text-sm">{trait}</span>
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => removeTrait('traits', index)}
                                        className="h-6 w-6 p-0"
                                    >
                                        ×
                                    </Button>
                                </div>
                            ))}
                            {(!personalityTraits.traits || personalityTraits.traits.length === 0) && (
                                <p className="text-sm text-muted-foreground italic p-3 bg-muted/50 rounded-lg">
                                    Добавьте особенности характера, которые отличают вашего героя
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Идеалы */}
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <Label className="text-sm font-medium flex items-center space-x-2">
                                <Crown className="h-4 w-4 text-amber-500" />
                                <span>Идеалы</span>
                            </Label>
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => addRandomTrait('ideals')}
                            >
                                <Wand2 className="h-3 w-3 mr-1" />
                                Добавить
                            </Button>
                        </div>

                        <div className="space-y-2">
                            {personalityTraits.ideals?.map((ideal, index) => (
                                <div key={index} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                                    <span className="text-sm">{ideal}</span>
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => removeTrait('ideals', index)}
                                        className="h-6 w-6 p-0"
                                    >
                                        ×
                                    </Button>
                                </div>
                            ))}
                            {(!personalityTraits.ideals || personalityTraits.ideals.length === 0) && (
                                <p className="text-sm text-muted-foreground italic p-3 bg-muted/50 rounded-lg">
                                    Во что верит ваш персонаж? Какие принципы им движут?
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Привязанности */}
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <Label className="text-sm font-medium flex items-center space-x-2">
                                <Users className="h-4 w-4 text-blue-500" />
                                <span>Привязанности</span>
                            </Label>
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => addRandomTrait('bonds')}
                            >
                                <Wand2 className="h-3 w-3 mr-1" />
                                Добавить
                            </Button>
                        </div>

                        <div className="space-y-2">
                            {personalityTraits.bonds?.map((bond, index) => (
                                <div key={index} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                                    <span className="text-sm">{bond}</span>
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => removeTrait('bonds', index)}
                                        className="h-6 w-6 p-0"
                                    >
                                        ×
                                    </Button>
                                </div>
                            ))}
                            {(!personalityTraits.bonds || personalityTraits.bonds.length === 0) && (
                                <p className="text-sm text-muted-foreground italic p-3 bg-muted/50 rounded-lg">
                                    Кто или что важно для вашего персонажа? Семья, друзья, места?
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Недостатки */}
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <Label className="text-sm font-medium flex items-center space-x-2">
                                <AlertTriangle className="h-4 w-4 text-red-500" />
                                <span>Недостатки</span>
                            </Label>
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => addRandomTrait('flaws')}
                            >
                                <Wand2 className="h-3 w-3 mr-1" />
                                Добавить
                            </Button>
                        </div>

                        <div className="space-y-2">
                            {personalityTraits.flaws?.map((flaw, index) => (
                                <div key={index} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                                    <span className="text-sm">{flaw}</span>
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => removeTrait('flaws', index)}
                                        className="h-6 w-6 p-0"
                                    >
                                        ×
                                    </Button>
                                </div>
                            ))}
                            {(!personalityTraits.flaws || personalityTraits.flaws.length === 0) && (
                                <p className="text-sm text-muted-foreground italic p-3 bg-muted/50 rounded-lg">
                                    Какие слабости или пороки есть у вашего персонажа?
                                </p>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Информационная панель */}
            <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border-blue-200 dark:border-blue-800">
                <CardContent className="p-4">
                    <div className="flex items-start space-x-3">
                        <Lightbulb className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                        <div>
                            <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
                                Советы по созданию интересного персонажа
                            </h4>
                            <div className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
                                <p>• <strong>Мотивация</strong> должна давать возможности для развития сюжета</p>
                                <p>• <strong>Недостатки</strong> делают персонажа более живым и интересным</p>
                                <p>• <strong>Привязанности</strong> могут стать источником конфликтов и драмы</p>
                                <p>• <strong>Предыстория</strong> объясняет, как персонаж получил свои навыки</p>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}