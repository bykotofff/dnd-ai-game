// frontend/src/lib/utils.ts - дополнение функции validateEmail и других утилит

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

    if (!/[a-zA-Z]/.test(password)) {
        errors.push('Пароль должен содержать хотя бы одну букву')
    }

    if (!/[0-9]/.test(password)) {
        errors.push('Пароль должен содержать хотя бы одну цифру')
    }

    return {
        isValid: errors.length === 0,
        errors
    }
}

export function validateUsername(username: string): {
    isValid: boolean
    errors: string[]
} {
    const errors: string[] = []

    if (username.length < 3) {
        errors.push('Имя пользователя должно содержать минимум 3 символа')
    }

    if (username.length > 20) {
        errors.push('Имя пользователя не должно превышать 20 символов')
    }

    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
        errors.push('Имя пользователя может содержать только буквы, цифры и подчеркивания')
    }

    return {
        isValid: errors.length === 0,
        errors
    }
}

export function sanitizeFilename(filename: string): string {
    // Удаляем опасные символы из имени файла
    return filename
        .replace(/[^a-zA-Z0-9._-]/g, '_')
        .replace(/_{2,}/g, '_')
        .substring(0, 100) // Ограничиваем длину
}

export function formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 B'

    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))

    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

export function parseQueryParams(search: string): Record<string, string> {
    const params = new URLSearchParams(search)
    const result: Record<string, string> = {}

    for (const [key, value] of params.entries()) {
        result[key] = value
    }

    return result
}

export function buildQueryString(params: Record<string, any>): string {
    const searchParams = new URLSearchParams()

    Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
            searchParams.append(key, String(value))
        }
    })

    const queryString = searchParams.toString()
    return queryString ? `?${queryString}` : ''
}

export function isValidUrl(url: string): boolean {
    try {
        new URL(url)
        return true
    } catch {
        return false
    }
}

export function truncateText(text: string, maxLength: number, suffix: string = '...'): string {
    if (text.length <= maxLength) return text
    return text.substring(0, maxLength - suffix.length) + suffix
}

export function capitalizeFirstLetter(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1)
}

export function camelToKebab(str: string): string {
    return str.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase()
}

export function kebabToCamel(str: string): string {
    return str.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase())
}

export function deepClone<T>(obj: T): T {
    if (obj === null || typeof obj !== 'object') return obj
    if (obj instanceof Date) return new Date(obj.getTime()) as T
    if (obj instanceof Array) return obj.map(item => deepClone(item)) as T
    if (typeof obj === 'object') {
        const cloned = {} as T
        Object.keys(obj).forEach(key => {
            cloned[key as keyof T] = deepClone((obj as any)[key])
        })
        return cloned
    }
    return obj
}

export function isEqual(a: any, b: any): boolean {
    if (a === b) return true
    if (a == null || b == null) return false
    if (Array.isArray(a) && Array.isArray(b)) {
        if (a.length !== b.length) return false
        return a.every((item, index) => isEqual(item, b[index]))
    }
    if (typeof a === 'object' && typeof b === 'object') {
        const keysA = Object.keys(a)
        const keysB = Object.keys(b)
        if (keysA.length !== keysB.length) return false
        return keysA.every(key => isEqual(a[key], b[key]))
    }
    return false
}

export function sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
}

export function randomInt(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min
}

export function randomChoice<T>(array: T[]): T {
    return array[Math.floor(Math.random() * array.length)]
}

export function shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array]
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
    }
    return shuffled
}