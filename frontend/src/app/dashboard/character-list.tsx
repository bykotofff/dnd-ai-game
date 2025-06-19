// frontend/src/components/dashboard/character-list.tsx
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
    Crown,
    Plus,
    Heart,
    Shield,
    Zap,
    Eye,
    MoreHorizontal,
    Sword,
    User
} from 'lucide-react'
import { Character } from '@/types'
import { cn } from '@/lib/utils'

interface CharacterListProps {
    characters: Character[]
    onCreateCharacter: () => void
    onViewCharacter: (characterId: string) => void
}

interface CharacterCardProps {
    character: Character
    onView: (characterId: string) => void
}

// Маппинг рас и классов для отображения на русском
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

// Цвета для классов
const CLASS_COLORS: Record<string, string> = {
    'BARBARIAN': 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
    'BARD': 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-300',
    'CLERIC': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
    'DRUID': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
    'FIGHTER': 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300',
    'MONK': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
    'PALADIN': 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-300',
    'RANGER': 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-300',
    'ROGUE': 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300',
    'SORCERER': 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300',
    'WARLOCK': 'bg-violet-100 text-violet-800 dark:bg-violet-900 dark:text-violet-300',
    'WIZARD': 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-300'
}

function CharacterCard({ character, onView }: CharacterCardProps) {
    const raceTranslation = RACE_TRANSLATIONS[character.race] || character.race
    const classTranslation = CLASS_TRANSLATIONS[character.class] || character.class
    const classColor = CLASS_COLORS[character.class] || 'bg-gray-100 text-gray-800'

    // Вычисляем процент здоровья
    const healthPercent = (character.currentHP / character.maxHP) * 100
    const healthColor = healthPercent > 50
        ? 'bg-green-500'
        : healthPercent > 25
            ? 'bg-yellow-500'
            : 'bg-red-500'

    return (
        <Card className="group hover:shadow-md transition-all duration-300 cursor-pointer border-0 bg-gradient-to-br from-white/80 to-white/60 dark:from-slate-800/80 dark:to-slate-900/60 backdrop-blur-sm">
            <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-3">
                        {/* Аватар персонажа */}
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white font-bold text-lg">
                            {character.profileImage ? (
                                <img
                                    src={character.profileImage}
                                    alt={character.name}
                                    className="w-full h-full rounded-full object-cover"
                                />
                            ) : (
                                character.name.charAt(0).toUpperCase()
                            )}
                        </div>

                        <div>
                            <CardTitle className="text-lg font-bold group-hover:text-purple-600 transition-colors">
                                {character.name}
                            </CardTitle>
                            <div className="flex items-center space-x-2 mt-1">
                                <Badge className={cn("text-xs", classColor)}>
                                    {classTranslation}
                                </Badge>
                                <span className="text-sm text-muted-foreground">
                  {raceTranslation}
                </span>
                            </div>
                        </div>
                    </div>

                    {/* Уровень */}
                    <div className="flex items-center space-x-1 bg-gradient-to-r from-amber-500 to-orange-500 text-white px-2 py-1 rounded-full">
                        <Crown className="h-3 w-3" />
                        <span className="text-sm font-bold">{character.level}</span>
                    </div>
                </div>
            </CardHeader>

            <CardContent className="pt-0">
                {/* Статистики */}
                <div className="grid grid-cols-3 gap-4 mb-4">
                    {/* Здоровье */}
                    <div className="text-center">
                        <div className="flex items-center justify-center space-x-1 mb-1">
                            <Heart className="h-4 w-4 text-red-500" />
                            <span className="text-sm font-medium">
                {character.currentHP}/{character.maxHP}
              </span>
                        </div>
                        <div className="w-full bg-secondary rounded-full h-1.5">
                            <div
                                className={cn("h-1.5 rounded-full transition-all duration-300", healthColor)}
                                style={{ width: `${healthPercent}%` }}
                            />
                        </div>
                    </div>

                    {/* Класс брони */}
                    <div className="text-center">
                        <div className="flex items-center justify-center space-x-1 mb-1">
                            <Shield className="h-4 w-4 text-blue-500" />
                            <span className="text-sm font-medium">{character.armorClass}</span>
                        </div>
                        <p className="text-xs text-muted-foreground">КБ</p>
                    </div>

                    {/* Инициатива */}
                    <div className="text-center">
                        <div className="flex items-center justify-center space-x-1 mb-1">
                            <Zap className="h-4 w-4 text-yellow-500" />
                            <span className="text-sm font-medium">
                {character.initiative > 0 ? '+' : ''}{character.initiative}
              </span>
                        </div>
                        <p className="text-xs text-muted-foreground">Инициатива</p>
                    </div>
                </div>

                {/* Основные характеристики */}
                <div className="grid grid-cols-6 gap-1 mb-4">
                    {Object.entries(character.abilityScores).map(([ability, value]) => {
                        const modifier = Math.floor((value - 10) / 2)
                        const abilityNames: Record<string, string> = {
                            strength: 'СИЛ',
                            dexterity: 'ЛОВ',
                            constitution: 'ТЕЛ',
                            intelligence: 'ИНТ',
                            wisdom: 'МУД',
                            charisma: 'ХАР'
                        }

                        return (
                            <div key={ability} className="text-center bg-secondary/50 rounded p-1">
                                <p className="text-xs font-medium text-muted-foreground">
                                    {abilityNames[ability]}
                                </p>
                                <p className="text-sm font-bold">{value}</p>
                                <p className="text-xs text-muted-foreground">
                                    {modifier >= 0 ? '+' : ''}{modifier}
                                </p>
                            </div>
                        )
                    })}
                </div>

                {/* Кнопки действий */}
                <div className="flex space-x-2">
                    <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => onView(character.id)}
                    >
                        <Eye className="h-4 w-4 mr-2" />
                        Подробнее
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => {
                            // TODO: Логика быстрого перехода в игру с этим персонажем
                            console.log('Quick play with character:', character.id)
                        }}
                    >
                        <Sword className="h-4 w-4 mr-2" />
                        Играть
                    </Button>
                </div>
            </CardContent>
        </Card>
    )
}

function EmptyState({ onCreateCharacter }: { onCreateCharacter: () => void }) {
    return (
        <Card className="border-2 border-dashed border-muted-foreground/25 bg-gradient-to-br from-slate-50/50 to-slate-100/50 dark:from-slate-800/50 dark:to-slate-900/50">
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-500/20 to-blue-500/20 flex items-center justify-center mb-4">
                    <User className="h-8 w-8 text-muted-foreground" />
                </div>
                <CardTitle className="mb-2">Создайте первого персонажа</CardTitle>
                <CardDescription className="mb-6 max-w-sm">
                    Начните свое приключение в мире D&D, создав уникального персонажа со своей историей и способностями.
                </CardDescription>
                <Button
                    onClick={onCreateCharacter}
                    className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                >
                    <Plus className="h-4 w-4 mr-2" />
                    Создать персонажа
                </Button>
            </CardContent>
        </Card>
    )
}

export function CharacterList({ characters, onCreateCharacter, onViewCharacter }: CharacterListProps) {
    if (characters.length === 0) {
        return (
            <div>
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h2 className="text-2xl font-bold">Мои персонажи</h2>
                        <p className="text-muted-foreground">Управляйте своими героями</p>
                    </div>
                </div>
                <EmptyState onCreateCharacter={onCreateCharacter} />
            </div>
        )
    }

    return (
        <div>
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h2 className="text-2xl font-bold">Мои персонажи</h2>
                    <p className="text-muted-foreground">
                        {characters.length} {characters.length === 1 ? 'персонаж' : 'персонажей'} готов к приключениям
                    </p>
                </div>
                <Button
                    onClick={onCreateCharacter}
                    variant="outline"
                    className="hover:bg-gradient-to-r hover:from-purple-50 hover:to-blue-50 dark:hover:from-purple-950 dark:hover:to-blue-950"
                >
                    <Plus className="h-4 w-4 mr-2" />
                    Новый персонаж
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {characters.map((character) => (
                    <CharacterCard
                        key={character.id}
                        character={character}
                        onView={onViewCharacter}
                    />
                ))}
            </div>

            {/* Показываем заглушку для дополнительных слотов */}
            {characters.length < 6 && (
                <Card
                    className="mt-6 border-2 border-dashed border-muted-foreground/25 hover:border-muted-foreground/50 transition-colors cursor-pointer bg-gradient-to-br from-slate-50/30 to-slate-100/30 dark:from-slate-800/30 dark:to-slate-900/30"
                    onClick={onCreateCharacter}
                >
                    <CardContent className="flex flex-col items-center justify-center py-8 text-center">
                        <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-3">
                            <Plus className="h-6 w-6 text-muted-foreground" />
                        </div>
                        <p className="font-medium text-muted-foreground">Создать еще одного персонажа</p>
                        <p className="text-sm text-muted-foreground/70 mt-1">
                            Слотов доступно: {6 - characters.length}
                        </p>
                    </CardContent>
                </Card>
            )}
        </div>
    )
}