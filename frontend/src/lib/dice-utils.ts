// frontend/src/lib/dice-utils.ts - завершение файла

// Валидация формул костей
export function validateDiceFormula(formula: string): { valid: boolean, error?: string } {
    try {
        const cleaned = formula.replace(/\s+/g, '').toLowerCase()

        // Базовая проверка на допустимые символы
        if (!/^[0-9d+\-khlr!><x=]+$/.test(cleaned)) {
            return {
                valid: false,
                error: 'Формула содержит недопустимые символы'
            }
        }

        // Проверка базового формата XdY
        if (!/\d*d\d+/.test(cleaned)) {
            return {
                valid: false,
                error: 'Формула должна содержать конструкцию вида XdY'
            }
        }

        // Проверка на корректное количество костей
        const diceMatch = cleaned.match(/(\d*)d(\d+)/g)
        if (diceMatch) {
            for (const dice of diceMatch) {
                const [count, sides] = dice.split('d').map(Number)

                if (count && count > 100) {
                    return {
                        valid: false,
                        error: 'Слишком много костей (максимум 100)'
                    }
                }

                if (sides < 2) {
                    return {
                        valid: false,
                        error: 'Кость должна иметь минимум 2 грани'
                    }
                }

                if (sides > 10000) {
                    return {
                        valid: false,
                        error: 'Слишком много граней у кости (максимум 10000)'
                    }
                }
            }
        }

        // Проверка модификаторов
        const modifierMatch = cleaned.match(/[+\-]\d+/g)
        if (modifierMatch) {
            for (const modifier of modifierMatch) {
                const value = parseInt(modifier)
                if (Math.abs(value) > 1000) {
                    return {
                        valid: false,
                        error: 'Слишком большой модификатор (максимум ±1000)'
                    }
                }
            }
        }

        return { valid: true }
    } catch (error) {
        return {
            valid: false,
            error: 'Ошибка при разборе формулы'
        }
    }
}

// Парсинг формулы кости
export function parseDiceFormula(formula: string): DiceParseResult {
    const cleaned = formula.replace(/\s+/g, '').toLowerCase()

    const result: DiceParseResult = {
        valid: false,
        dice: [],
        modifiers: [],
        total: 0
    }

    try {
        // Проверяем валидность формулы
        const validation = validateDiceFormula(formula)
        if (!validation.valid) {
            result.error = validation.error
            return result
        }

        // Парсим кости (XdY)
        const diceMatches = cleaned.matchAll(/(\d*)d(\d+)(?:([khl])(\d+))?/g)
        for (const match of diceMatches) {
            const count = parseInt(match[1]) || 1
            const sides = parseInt(match[2])
            const modifier = match[3] // k, h, l для keep highest/lowest
            const modValue = match[4] ? parseInt(match[4]) : undefined

            result.dice.push({
                count,
                sides,
                modifier,
                modifierValue: modValue
            })
        }

        // Парсим числовые модификаторы
        const modifierMatches = cleaned.matchAll(/([+\-])(\d+)/g)
        for (const match of modifierMatches) {
            const sign = match[1]
            const value = parseInt(match[2])
            result.modifiers.push(sign === '+' ? value : -value)
        }

        result.valid = true
        return result
    } catch (error) {
        result.error = 'Ошибка при разборе формулы'
        return result
    }
}

// Результат парсинга формулы
export interface DiceParseResult {
    valid: boolean
    dice: Array<{
        count: number
        sides: number
        modifier?: string
        modifierValue?: number
    }>
    modifiers: number[]
    total: number
    error?: string
}

// Симуляция броска кости
export function rollDice(sides: number): number {
    return Math.floor(Math.random() * sides) + 1
}

// Выполнение полной формулы костей
export function executeRoll(formula: string): DiceRollResult {
    const parsed = parseDiceFormula(formula)

    if (!parsed.valid) {
        return {
            formula,
            valid: false,
            error: parsed.error,
            total: 0,
            rolls: []
        }
    }

    const result: DiceRollResult = {
        formula,
        valid: true,
        total: 0,
        rolls: [],
        breakdown: []
    }

    // Выполняем броски костей
    for (const dice of parsed.dice) {
        const rolls: number[] = []

        for (let i = 0; i < dice.count; i++) {
            rolls.push(rollDice(dice.sides))
        }

        let finalRolls = rolls
        let operation = ''

        // Применяем модификаторы (keep highest/lowest)
        if (dice.modifier && dice.modifierValue) {
            const keepCount = Math.min(dice.modifierValue, rolls.length)

            if (dice.modifier === 'h') {
                finalRolls = rolls.sort((a, b) => b - a).slice(0, keepCount)
                operation = `(лучшие ${keepCount})`
            } else if (dice.modifier === 'l') {
                finalRolls = rolls.sort((a, b) => a - b).slice(0, keepCount)
                operation = `(худшие ${keepCount})`
            } else if (dice.modifier === 'k') {
                finalRolls = rolls.sort((a, b) => b - a).slice(0, keepCount)
                operation = `(сохранить ${keepCount})`
            }
        }

        const subtotal = finalRolls.reduce((sum, roll) => sum + roll, 0)
        result.total += subtotal

        result.rolls.push(...finalRolls)
        result.breakdown.push({
            type: 'dice',
            formula: `${dice.count}d${dice.sides}${operation}`,
            rolls: finalRolls,
            allRolls: rolls,
            subtotal
        })
    }

    // Добавляем числовые модификаторы
    for (const modifier of parsed.modifiers) {
        result.total += modifier
        result.breakdown.push({
            type: 'modifier',
            value: modifier,
            subtotal: modifier
        })
    }

    return result
}

// Результат выполнения броска
export interface DiceRollResult {
    formula: string
    valid: boolean
    total: number
    rolls: number[]
    breakdown: Array<{
        type: 'dice' | 'modifier'
        formula?: string
        rolls?: number[]
        allRolls?: number[]
        value?: number
        subtotal: number
    }>
    error?: string
}

// Статистики для формулы костей
export function calculateRollStatistics(formula: string): RollStatistics {
    const parsed = parseDiceFormula(formula)

    if (!parsed.valid) {
        return {
            valid: false,
            error: parsed.error
        }
    }

    let minTotal = 0
    let maxTotal = 0
    let averageTotal = 0

    // Рассчитываем для каждой группы костей
    for (const dice of parsed.dice) {
        const minRoll = dice.count * 1
        const maxRoll = dice.count * dice.sides
        const averageRoll = dice.count * (dice.sides + 1) / 2

        minTotal += minRoll
        maxTotal += maxRoll
        averageTotal += averageRoll
    }

    // Добавляем модификаторы
    const modifierSum = parsed.modifiers.reduce((sum, mod) => sum + mod, 0)
    minTotal += modifierSum
    maxTotal += modifierSum
    averageTotal += modifierSum

    return {
        valid: true,
        min: minTotal,
        max: maxTotal,
        average: Math.round(averageTotal * 100) / 100,
        range: maxTotal - minTotal + 1
    }
}

// Статистики броска
export interface RollStatistics {
    valid: boolean
    min?: number
    max?: number
    average?: number
    range?: number
    error?: string
}

// Преустановленные формулы D&D 5e
export const DND_PRESETS = {
    advantage: '2d20kh1',
    disadvantage: '2d20kl1',
    criticalHit: (baseDamage: string) => `${baseDamage}+${baseDamage}`,
    deathSave: 'd20',
    initiative: 'd20'
}

// Экспорт всех функций
export {
    rollDice,
    executeRoll,
    validateDiceFormula,
    parseDiceFormula,
    calculateRollStatistics,
    DND_PRESETS
}