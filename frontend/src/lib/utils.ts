// frontend/src/lib/utils.ts
import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs))
}

export function formatDate(date: Date | string): string {
    const d = new Date(date)
    return d.toLocaleDateString('ru-RU', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    })
}

export function formatRelativeTime(date: Date | string): string {
    const d = new Date(date)
    const now = new Date()
    const diffInSeconds = Math.floor((now.getTime() - d.getTime()) / 1000)

    if (diffInSeconds < 60) {
        return 'только что'
    } else if (diffInSeconds < 3600) {
        const minutes = Math.floor(diffInSeconds / 60)
        return `${minutes} мин. назад`
    } else if (diffInSeconds < 86400) {
        const hours = Math.floor(diffInSeconds / 3600)
        return `${hours} ч. назад`
    } else {
        const days = Math.floor(diffInSeconds / 86400)
        return `${days} дн. назад`
    }
}

export function getAbilityModifier(score: number): number {
    return Math.floor((score - 10) / 2)
}

export function formatModifier(modifier: number): string {
    return modifier >= 0 ? `+${modifier}` : `${modifier}`
}

export function getHealthColor(current: number, max: number): string {
    const percentage = (current / max) * 100

    if (percentage <= 0) return 'text-red-600'
    if (percentage <= 25) return 'text-red-500'
    if (percentage <= 50) return 'text-yellow-500'
    if (percentage <= 75) return 'text-green-400'
    return 'text-green-500'
}

export function getHealthBarColor(current: number, max: number): string {
    const percentage = (current / max) * 100

    if (percentage <= 0) return 'bg-red-600'
    if (percentage <= 25) return 'bg-red-500'
    if (percentage <= 50) return 'bg-yellow-500'
    if (percentage <= 75) return 'bg-green-400'
    return 'bg-green-500'
}

export function generateId(): string {
    return Math.random().toString(36).substr(2, 9)
}

export function debounce<T extends (...args: any[]) => any>(
    func: T,
    wait: number
): (...args: Parameters<T>) => void {
    let timeout: NodeJS.Timeout
    return (...args: Parameters<T>) => {
        clearTimeout(timeout)
        timeout = setTimeout(() => func(...args), wait)
    }
}

export function throttle<T extends (...args: any[]) => any>(
    func: T,
    limit: number
): (...args: Parameters<T>) => void {
    let inThrottle: boolean
    return (...args: Parameters<T>) => {
        if (!inThrottle) {
            func(...args)
            inThrottle = true
            setTimeout(() => (inThrottle = false), limit)
        }
    }
}

export function copyToClipboard(text: string): Promise<void> {
    if (navigator.clipboard) {
        return navigator.clipboard.writeText(text)
    } else {
        // Fallback для старых браузеров
        const textArea = document.createElement('textarea')
        textArea.value = text
        document.body.appendChild(textArea)
        textArea.select()
        document.execCommand('copy')
        document.body.removeChild(textArea)
        return Promise.resolve()
    }
}

export function validateEmail(email: string): boolean {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return re.test(email)
}

export function validatePassword(password: string): {
    isValid: boolean
    errors: string[]
} {
    const errors: string[] = []

    if (password.length < 6) {
        errors.push('Пароль должен содержать минимум 6 символов')
    }

    if (password.length > 100) {
        errors.push('Пароль не должен превышать 100 символов')
    }

    return {
        isValid: errors.length === 0,
        errors
    }
}

export function formatBytes(bytes: number, decimals = 2): string {
    if (bytes === 0) return '0 Bytes'

    const k = 1024
    const dm = decimals < 0 ? 0 : decimals
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB']

    const i = Math.floor(Math.log(bytes) / Math.log(k))

    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i]
}

export function sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
}

export function randomBetween(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min
}

export function rollDice(sides: number): number {
    return randomBetween(1, sides)
}

export function rollMultipleDice(count: number, sides: number): number[] {
    return Array.from({ length: count }, () => rollDice(sides))
}

export function parseDiceString(diceString: string): {
    count: number
    sides: number
    modifier: number
} {
    const match = diceString.match(/(\d+)d(\d+)(?:([+-])(\d+))?/)

    if (!match) {
        throw new Error('Неверный формат кубика')
    }

    const [, count, sides, sign, mod] = match
    const modifier = sign && mod ? (sign === '+' ? +mod : -mod) : 0

    return {
        count: parseInt(count),
        sides: parseInt(sides),
        modifier
    }
}

export function getDiceColor(diceType: string): string {
    const colors: Record<string, string> = {
        'd4': 'text-red-500',
        'd6': 'text-blue-500',
        'd8': 'text-green-500',
        'd10': 'text-yellow-500',
        'd12': 'text-purple-500',
        'd20': 'text-pink-500',
        'd100': 'text-indigo-500'
    }

    return colors[diceType] || 'text-gray-500'
}

export function getClassDisplayName(className: string): string {
    const classNames: Record<string, string> = {
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

    return classNames[className] || className
}

export function getRaceDisplayName(raceName: string): string {
    const raceNames: Record<string, string> = {
        'HUMAN': 'Человек',
        'ELF': 'Эльф',
        'DWARF': 'Дварф',
        'HALFLING': 'Полурослик',
        'DRAGONBORN': 'Драконорождённый',
        'GNOME': 'Гном',
        'HALF_ELF': 'Полуэльф',
        'HALF_ORC': 'Полуорк',
        'TIEFLING': 'Тифлинг'
    }

    return raceNames[raceName] || raceName
}

export function getAbilityDisplayName(ability: string): string {
    const abilityNames: Record<string, string> = {
        'strength': 'Сила',
        'dexterity': 'Ловкость',
        'constitution': 'Телосложение',
        'intelligence': 'Интеллект',
        'wisdom': 'Мудрость',
        'charisma': 'Харизма'
    }

    return abilityNames[ability] || ability
}