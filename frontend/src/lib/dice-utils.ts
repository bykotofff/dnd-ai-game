// frontend/src/lib/dice-utils.ts
export interface DiceNotation {
    count: number
    sides: number
    modifier: number
    keepHighest?: number
    keepLowest?: number
    exploding?: boolean
    reroll?: number[]
}

export interface ParsedDiceFormula {
    diceGroups: DiceNotation[]
    staticModifier: number
    totalDice: number
    formula: string
}

// Парсер формул костей D&D
export function parseDiceFormula(formula: string): ParsedDiceFormula {
    const cleaned = formula.replace(/\s+/g, '').toLowerCase()
    const diceGroups: DiceNotation[] = []
    let staticModifier = 0
    let totalDice = 0

    // Расширенный регекс для поддержки сложных формул
    const diceRegex = /(\d*)d(\d+)(?:kh(\d+))?(?:kl(\d+))?(?:!)?(?:r(\d+))?/g
    const modifierRegex = /[+-]\d+/g

    let match
    while ((match = diceRegex.exec(cleaned)) !== null) {
        const count = match[1] ? parseInt(match[1]) : 1
        const sides = parseInt(match[2])
        const keepHighest = match[3] ? parseInt(match[3]) : undefined
        const keepLowest = match[4] ? parseInt(match[4]) : undefined
        const exploding = formula.includes('!')
        const reroll = match[5] ? [parseInt(match[5])] : undefined

        diceGroups.push({
            count,
            sides,
            modifier: 0,
            keepHighest,
            keepLowest,
            exploding,
            reroll
        })

        totalDice += count
    }

    // Парсим статические модификаторы
    const modifierMatches = cleaned.match(modifierRegex)
    if (modifierMatches) {
        staticModifier = modifierMatches.reduce((sum, mod) => sum + parseInt(mod), 0)
    }

    return {
        diceGroups,
        staticModifier,
        totalDice,
        formula: cleaned
    }
}

// Симуляция броска одного кубика
export function rollSingleDie(sides: number): number {
    return Math.floor(Math.random() * sides) + 1
}

// Продвинутый бросок с поддержкой всех модификаторов
export function rollAdvancedDice(notation: DiceNotation): { rolls: number[], kept: number[], total: number } {
    let rolls: number[] = []

    // Основные броски
    for (let i = 0; i < notation.count; i++) {
        let roll = rollSingleDie(notation.sides)

        // Взрывающиеся кубики
        if (notation.exploding && roll === notation.sides) {
            rolls.push(roll)
            let extraRoll = rollSingleDie(notation.sides)
            while (extraRoll === notation.sides) {
                rolls.push(extraRoll)
                extraRoll = rollSingleDie(notation.sides)
            }
            rolls.push(extraRoll)
        }
        // Перебросы
        else if (notation.reroll && notation.reroll.includes(roll)) {
            roll = rollSingleDie(notation.sides)
            rolls.push(roll)
        } else {
            rolls.push(roll)
        }
    }

    // Применяем keep highest/lowest
    let kept = [...rolls]
    if (notation.keepHighest && notation.keepHighest < rolls.length) {
        kept = rolls.sort((a, b) => b - a).slice(0, notation.keepHighest)
    } else if (notation.keepLowest && notation.keepLowest < rolls.length) {
        kept = rolls.sort((a, b) => a - b).slice(0, notation.keepLowest)
    }

    const total = kept.reduce((sum, roll) => sum + roll, 0) + notation.modifier

    return { rolls, kept, total }
}

// Выполнение полной формулы
export function executeAdvancedDiceFormula(formula: string, globalModifier: number = 0): {
    results: Array<{ notation: DiceNotation, rolls: number[], kept: number[], subtotal: number }>,
    staticModifier: number,
    globalModifier: number,
    total: number,
    formula: string
} {
    const parsed = parseDiceFormula(formula)
    const results = parsed.diceGroups.map(notation => {
        const rollResult = rollAdvancedDice(notation)
        return {
            notation,
            rolls: rollResult.rolls,
            kept: rollResult.kept,
            subtotal: rollResult.total
        }
    })

    const diceTotal = results.reduce((sum, result) => sum + result.subtotal, 0)
    const total = diceTotal + parsed.staticModifier + globalModifier

    return {
        results,
        staticModifier: parsed.staticModifier,
        globalModifier,
        total,
        formula: parsed.formula
    }
}

// Проверка на критический успех/провал
export function checkCritical(roll: number, sides: number, critRange: number = 20): 'critical' | 'fumble' | 'normal' {
    if (sides === 20) {
        if (roll >= critRange) return 'critical'
        if (roll === 1) return 'fumble'
    }
    return 'normal'
}

// Применение преимущества/помехи к d20
export function applyAdvantageDisadvantage(rolls: number[], advantage: boolean, disadvantage: boolean): {
    originalRolls: number[],
    finalRoll: number,
    advantage: boolean,
    disadvantage: boolean
} {
    if (!advantage && !disadvantage) {
        return {
            originalRolls: rolls,
            finalRoll: rolls[0],
            advantage: false,
            disadvantage: false
        }
    }

    // Добавляем второй бросок d20 для преимущества/помехи
    const secondRoll = rollSingleDie(20)
    const allRolls = [rolls[0], secondRoll]

    const finalRoll = advantage
        ? Math.max(...allRolls)
        : Math.min(...allRolls)

    return {
        originalRolls: allRolls,
        finalRoll,
        advantage,
        disadvantage
    }
}

// Генерация стандартных формул D&D 5e
export const DND5E_FORMULAS = {
    // Проверки
    d20: () => ({ formula: '1d20', name: 'Проверка d20', category: 'check' as const }),
    abilityCheck: (modifier: number) => ({
        formula: `1d20${modifier >= 0 ? '+' : ''}${modifier}`,
        name: 'Проверка характеристики',
        category: 'check' as const
    }),
    skillCheck: (modifier: number) => ({
        formula: `1d20${modifier >= 0 ? '+' : ''}${modifier}`,
        name: 'Проверка навыка',
        category: 'skill' as const
    }),
    savingThrow: (modifier: number) => ({
        formula: `1d20${modifier >= 0 ? '+' : ''}${modifier}`,
        name: 'Спасательный бросок',
        category: 'save' as const
    }),

    // Атаки
    attack: (modifier: number) => ({
        formula: `1d20${modifier >= 0 ? '+' : ''}${modifier}`,
        name: 'Бросок атаки',
        category: 'attack' as const
    }),

    // Урон
    damage: {
        d4: (modifier: number = 0) => ({
            formula: `1d4${modifier !== 0 ? (modifier >= 0 ? '+' : '') + modifier : ''}`,
            name: 'Урон 1d4',
            category: 'damage' as const
        }),
        d6: (modifier: number = 0) => ({
            formula: `1d6${modifier !== 0 ? (modifier >= 0 ? '+' : '') + modifier : ''}`,
            name: 'Урон 1d6',
            category: 'damage' as const
        }),
        d8: (modifier: number = 0) => ({
            formula: `1d8${modifier !== 0 ? (modifier >= 0 ? '+' : '') + modifier : ''}`,
            name: 'Урон 1d8',
            category: 'damage' as const
        }),
        d10: (modifier: number = 0) => ({
            formula: `1d10${modifier !== 0 ? (modifier >= 0 ? '+' : '') + modifier : ''}`,
            name: 'Урон 1d10',
            category: 'damage' as const
        }),
        d12: (modifier: number = 0) => ({
            formula: `1d12${modifier !== 0 ? (modifier >= 0 ? '+' : '') + modifier : ''}`,
            name: 'Урон 1d12',
            category: 'damage' as const
        }),
        // Сложные формулы урона
        twoHanded: (dieType: string, modifier: number = 0) => ({
            formula: `2${dieType}${modifier !== 0 ? (modifier >= 0 ? '+' : '') + modifier : ''}`,
            name: `Двуручное оружие 2${dieType}`,
            category: 'damage' as const
        }),
        versatile: (dieType: string, modifier: number = 0) => ({
            formula: `1${dieType}${modifier !== 0 ? (modifier >= 0 ? '+' : '') + modifier : ''}`,
            name: `Универсальное оружие 1${dieType}`,
            category: 'damage' as const
        })
    },

    // Лечение
    healing: {
        potion: () => ({ formula: '2d4+2', name: 'Зелье лечения', category: 'healing' as const }),
        greaterPotion: () => ({ formula: '4d4+4', name: 'Большое зелье лечения', category: 'healing' as const }),
        superiorPotion: () => ({ formula: '8d4+8', name: 'Высшее зелье лечения', category: 'healing' as const }),
        supremePotion: () => ({ formula: '10d4+20', name: 'Наивысшее зелье лечения', category: 'healing' as const })
    },

    // Хит-поинты по уровню
    hitPoints: {
        d6: (level: number, conMod: number) => ({
            formula: `${level}d6${conMod !== 0 ? (conMod >= 0 ? '+' : '') + (conMod * level) : ''}`,
            name: `ХП ${level} уровня (d6)`,
            category: 'hp' as const
        }),
        d8: (level: number, conMod: number) => ({
            formula: `${level}d8${conMod !== 0 ? (conMod >= 0 ? '+' : '') + (conMod * level) : ''}`,
            name: `ХП ${level} уровня (d8)`,
            category: 'hp' as const
        }),
        d10: (level: number, conMod: number) => ({
            formula: `${level}d10${conMod !== 0 ? (conMod >= 0 ? '+' : '') + (conMod * level) : ''}`,
            name: `ХП ${level} уровня (d10)`,
            category: 'hp' as const
        }),
        d12: (level: number, conMod: number) => ({
            formula: `${level}d12${conMod !== 0 ? (conMod >= 0 ? '+' : '') + (conMod * level) : ''}`,
            name: `ХП ${level} уровня (d12)`,
            category: 'hp' as const
        })
    }
}

// Создание составных бросков для популярных комбинаций
export function createCompoundRolls(characterData: {
    level: number,
    proficiencyBonus: number,
    abilityModifiers: Record<string, number>,
    weaponProficiencies: string[]
}) {
    const { level, proficiencyBonus, abilityModifiers } = characterData

    return {
        meleeAttack: {
            name: 'Атака ближнего боя',
            attack: DND5E_FORMULAS.attack(abilityModifiers.strength + proficiencyBonus),
            damage: [DND5E_FORMULAS.damage.d8(abilityModifiers.strength)],
            conditions: ['при попадании']
        },
        rangedAttack: {
            name: 'Дальняя атака',
            attack: DND5E_FORMULAS.attack(abilityModifiers.dexterity + proficiencyBonus),
            damage: [DND5E_FORMULAS.damage.d6(abilityModifiers.dexterity)],
            conditions: ['при попадании']
        },
        finesseMeleeAttack: {
            name: 'Фехтовальное оружие',
            attack: DND5E_FORMULAS.attack(Math.max(abilityModifiers.strength, abilityModifiers.dexterity) + proficiencyBonus),
            damage: [DND5E_FORMULAS.damage.d6(Math.max(abilityModifiers.strength, abilityModifiers.dexterity))],
            conditions: ['при попадании']
        },
        spellAttack: {
            name: 'Атака заклинанием',
            attack: DND5E_FORMULAS.attack(abilityModifiers.wisdom + proficiencyBonus), // или intelligence/charisma
            damage: [DND5E_FORMULAS.damage.d8()], // без модификатора характеристики обычно
            conditions: ['при попадании']
        }
    }
}

// Валидация формул костей
export function validateDiceFormula(formula: string): { valid: boolean, error?: string } {
    try {
        const cleaned = formula.replace(/\s+/g, '').toLowerCase()

        // Базовая проверка на допустимые символы
        if (!/^[0-9d+\-khlr!]+$/.test(cleaned)) {
            return { valid: false, error: 'Недопустимые символы в формуле' }
        }

        // Проверка на наличие хотя бы одного кубика или числа
        if (!/\d/.test(cleaned)) {
            return { valid: false, error: 'Формула должна содержать числа' }
        }

        // Попытка парсинга
        const parsed = parseDiceFormula(formula)

        // Проверка разумных лимитов
        if (parsed.totalDice > 100) {
            return { valid: false, error: 'Слишком много кубиков (максимум 100)' }
        }

        if (parsed.diceGroups.some(group => group.sides > 100)) {
            return { valid: false, error: 'Слишком много граней у кубика (максимум 100)' }
        }

        return { valid: true }
    } catch (error) {
        return { valid: false, error: 'Ошибка в формуле кубиков' }
    }
}

// Форматирование результатов для отображения
export function formatDiceResult(result: ReturnType<typeof executeAdvancedDiceFormula>): string {
    const parts: string[] = []

    result.results.forEach(diceResult => {
        const { notation, rolls, kept, subtotal } = diceResult

        if (notation.keepHighest || notation.keepLowest) {
            parts.push(`[${rolls.join(',')}→${kept.join(',')}]`)
        } else {
            parts.push(`[${kept.join(',')}]`)
        }

        if (notation.modifier !== 0) {
            parts.push(`${notation.modifier >= 0 ? '+' : ''}${notation.modifier}`)
        }
    })

    if (result.staticModifier !== 0) {
        parts.push(`${result.staticModifier >= 0 ? '+' : ''}${result.staticModifier}`)
    }

    if (result.globalModifier !== 0) {
        parts.push(`${result.globalModifier >= 0 ? '+' : ''}${result.globalModifier}`)
    }

    return `${parts.join(' ')} = ${result.total}`
}

// Создание предустановленных групп бросков
export function createDiceGroups() {
    return {
        abilityScores: {
            name: 'Генерация характеристик',
            description: 'Стандартный метод 4d6kh3 для всех 6 характеристик',
            rolls: Array(6).fill(null).map((_, i) => ({
                id: `ability_${i}`,
                name: ['Сила', 'Ловкость', 'Телосложение', 'Интеллект', 'Мудрость', 'Харизма'][i],
                formula: '4d6kh3',
                category: 'ability' as const,
                description: 'Бросок 4d6, оставить 3 лучших'
            }))
        },

        healingPotions: {
            name: 'Зелья лечения',
            description: 'Все виды зелий лечения',
            rolls: [
                { id: 'healing_potion', name: 'Зелье лечения', formula: '2d4+2', category: 'healing' as const },
                { id: 'greater_healing', name: 'Большое зелье', formula: '4d4+4', category: 'healing' as const },
                { id: 'superior_healing', name: 'Высшее зелье', formula: '8d4+8', category: 'healing' as const },
                { id: 'supreme_healing', name: 'Наивысшее зелье', formula: '10d4+20', category: 'healing' as const }
            ]
        },

        wildMagicSurge: {
            name: 'Всплеск дикой магии',
            description: 'Броски для таблицы всплеска дикой магии',
            rolls: [
                { id: 'wild_magic_trigger', name: 'Проверка всплеска', formula: '1d20', category: 'magic' as const },
                { id: 'wild_magic_effect', name: 'Эффект всплеска', formula: '1d100', category: 'magic' as const }
            ]
        }
    }
}