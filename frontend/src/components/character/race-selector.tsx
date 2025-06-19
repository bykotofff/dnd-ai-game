// frontend/src/components/character/race-selector.tsx
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
    Crown,
    Eye,
    Zap,
    Users,
    Heart,
    Shield,
    Sparkles,
    Sword
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface Race {
    id: string
    name: string
    description: string
    abilityScoreIncrease: Record<string, number>
    size: string
    speed: number
    languages: string[]
    traits: string[]
    image?: string
}

interface RaceSelectorProps {
    races: Race[]
    selectedRace: string
    onRaceChange: (raceId: string) => void
    error?: string
}

// Переводы характеристик
const ABILITY_TRANSLATIONS: Record<string, string> = {
    strength: 'Сила',
    dexterity: 'Ловкость',
    constitution: 'Телосложение',
    intelligence: 'Интеллект',
    wisdom: 'Мудрость',
    charisma: 'Харизма'
}

// Иконки для рас
const RACE_ICONS: Record<string, any> = {
    'HUMAN': Users,
    'ELF': Sparkles,
    'DWARF': Shield,
    'HALFLING': Heart,
    'DRAGONBORN': Sword,
    'GNOME': Zap,
    'HALF_ELF': Crown,
    'HALF_ORC': Sword,
    'TIEFLING': Eye
}

// Цвета для рас
const RACE_COLORS: Record<string, string> = {
    'HUMAN': 'from-blue-500 to-indigo-500',
    'ELF': 'from-green-500 to-emerald-500',
    'DWARF': 'from-amber-500 to-orange-500',
    'HALFLING': 'from-yellow-500 to-amber-500',
    'DRAGONBORN': 'from-red-500 to-rose-500',
    'GNOME': 'from-purple-500 to-violet-500',
    'HALF_ELF': 'from-teal-500 to-cyan-500',
    'HALF_ORC': 'from-gray-500 to-slate-500',
    'TIEFLING': 'from-pink-500 to-purple-500'
}

function RaceCard({ race, isSelected, onSelect }: {
    race: Race
    isSelected: boolean
    onSelect: () => void
}) {
    const Icon = RACE_ICONS[race.id] || Users
    const colorGradient = RACE_COLORS[race.id] || 'from-gray-500 to-slate-500'

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
                                {race.name}
                            </CardTitle>
                            <div className="flex items-center space-x-2 mt-1">
                                <Badge variant="outline" className="text-xs">
                                    {race.size}
                                </Badge>
                                <span className="text-sm text-muted-foreground">
                  {race.speed} фт.
                </span>
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
                    {race.description}
                </CardDescription>

                {/* Бонусы к характеристикам */}
                <div>
                    <h4 className="text-sm font-semibold mb-2 text-muted-foreground">
                        Бонусы к характеристикам:
                    </h4>
                    <div className="flex flex-wrap gap-1">
                        {Object.entries(race.abilityScoreIncrease).map(([ability, bonus]) => (
                            <Badge
                                key={ability}
                                className={cn(
                                    "text-xs",
                                    isSelected
                                        ? "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300"
                                        : "bg-muted text-muted-foreground"
                                )}
                            >
                                {ABILITY_TRANSLATIONS[ability]} +{bonus}
                            </Badge>
                        ))}
                    </div>
                </div>

                {/* Языки */}
                <div>
                    <h4 className="text-sm font-semibold mb-2 text-muted-foreground">
                        Языки:
                    </h4>
                    <p className="text-sm text-muted-foreground">
                        {race.languages.join(', ')}
                    </p>
                </div>

                {/* Расовые особенности */}
                <div>
                    <h4 className="text-sm font-semibold mb-2 text-muted-foreground">
                        Особенности:
                    </h4>
                    <div className="space-y-1">
                        {race.traits.slice(0, 3).map((trait, index) => (
                            <div key={index} className="text-sm text-muted-foreground flex items-center">
                                <div className="w-1 h-1 bg-muted-foreground rounded-full mr-2 flex-shrink-0" />
                                {trait}
                            </div>
                        ))}
                        {race.traits.length > 3 && (
                            <div className="text-xs text-muted-foreground/70 italic">
                                и еще {race.traits.length - 3} особенност{race.traits.length - 3 === 1 ? 'ь' : 'и'}...
                            </div>
                        )}
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}

export function RaceSelector({ races, selectedRace, onRaceChange, error }: RaceSelectorProps) {
    if (!races || races.length === 0) {
        return (
            <div className="text-center py-8">
                <div className="animate-spin w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full mx-auto mb-4" />
                <p className="text-muted-foreground">Загрузка рас...</p>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            <div>
                <h3 className="text-lg font-semibold mb-2">Выберите расу персонажа</h3>
                <p className="text-muted-foreground">
                    Раса определяет базовые характеристики, способности и внешний вид вашего персонажа.
                </p>
                {error && (
                    <p className="text-sm text-red-600 dark:text-red-400 mt-2">
                        {error}
                    </p>
                )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {races.map((race) => (
                    <RaceCard
                        key={race.id}
                        race={race}
                        isSelected={selectedRace === race.id}
                        onSelect={() => onRaceChange(race.id)}
                    />
                ))}
            </div>

            {/* Информационная панель */}
            {selectedRace && (
                <Card className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-950/30 dark:to-blue-950/30 border-purple-200 dark:border-purple-800">
                    <CardContent className="p-4">
                        <div className="flex items-start space-x-3">
                            <div className="w-8 h-8 rounded-full bg-purple-500 flex items-center justify-center flex-shrink-0">
                                <Sparkles className="h-4 w-4 text-white" />
                            </div>
                            <div>
                                <h4 className="font-semibold text-purple-900 dark:text-purple-100 mb-1">
                                    Выбрана раса: {races.find(r => r.id === selectedRace)?.name}
                                </h4>
                                <p className="text-sm text-purple-800 dark:text-purple-200">
                                    Отлично! Теперь ваш персонаж получит расовые бонусы и особенности.
                                    Переходите к выбору класса, чтобы определить роль в группе.
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    )
}