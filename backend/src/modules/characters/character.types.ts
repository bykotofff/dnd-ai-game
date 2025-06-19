// backend/src/modules/characters/character.types.ts
import { z } from 'zod'
import {
    AbilityScore,
    Skill,
    Race,
    CharacterClass,
    Alignment,
    CreatureSize,
    DamageType,
    Condition,
    SpellLevel,
    MagicSchool
} from '@shared/constants/dnd.constants'

// Базовые характеристики
export interface AbilityScores {
    strength: number
    dexterity: number
    constitution: number
    intelligence: number
    wisdom: number
    charisma: number
}

// Навыки и владения
export interface SkillProficiencies {
    [K in Skill]: {
        proficient: boolean
        expertise: boolean // Удваивает бонус мастерства
    }
}

// Спасительные броски
export interface SavingThrows {
    [K in AbilityScore]: {
        proficient: boolean
    }
}

// Экипировка
export interface Equipment {
    id: string
    name: string
    type: 'weapon' | 'armor' | 'shield' | 'tool' | 'consumable' | 'treasure' | 'other'
    quantity: number
    weight: number
    value: number // в медных монетах
    description: string
    properties?: string[]
    equipped?: boolean

    // Для оружия
    damage?: {
        dice: string // например "1d8"
        type: DamageType
    }

    // Для доспехов
    armorClass?: number

    // Магические предметы
    magical?: boolean
    rarity?: 'common' | 'uncommon' | 'rare' | 'very rare' | 'legendary' | 'artifact'
    requiresAttunement?: boolean
    attuned?: boolean
}

// Заклинания
export interface Spell {
    id: string
    name: string
    level: SpellLevel
    school: MagicSchool
    castingTime: string
    range: string
    components: {
        verbal: boolean
        somatic: boolean
        material: boolean
        materialComponent?: string
    }
    duration: string
    description: string
    higherLevels?: string

    // Для подготовленных заклинаний
    prepared?: boolean
    known?: boolean
}

// Слоты заклинаний
export interface SpellSlots {
    level1: { max: number; used: number }
    level2: { max: number; used: number }
    level3: { max: number; used: number }
    level4: { max: number; used: number }
    level5: { max: number; used: number }
    level6: { max: number; used: number }
    level7: { max: number; used: number }
    level8: { max: number; used: number }
    level9: { max: number; used: number }
}

// Способности класса/расы
export interface Feature {
    id: string
    name: string
    description: string
    source: 'race' | 'class' | 'background' | 'feat'
    level?: number
    uses?: {
        max: number
        used: number
        resetOn: 'short rest' | 'long rest' | 'dawn' | 'manual'
    }
}

// Черты характера
export interface PersonalityTraits {
    traits: string[]
    ideals: string[]
    bonds: string[]
    flaws: string[]
}

// Валюта
export interface Currency {
    copper: number
    silver: number
    electrum: number
    gold: number
    platinum: number
}

// Статусы и эффекты
export interface StatusEffect {
    id: string
    name: string
    description: string
    duration: number // в раундах, -1 для постоянных
    source: string
    conditions: Condition[]
}

// Полный лист персонажа
export interface CharacterSheet {
    // Базовая информация
    id: string
    userId: string
    name: string
    race: Race
    class: CharacterClass
    level: number
    experience: number

    // Характеристики
    abilityScores: AbilityScores

    // Здоровье и защита
    currentHP: number
    maxHP: number
    temporaryHP: number
    armorClass: number
    initiative: number
    speed: number

    // Навыки и владения
    skills: SkillProficiencies
    savingThrows: SavingThrows

    // Экипировка и богатство
    equipment: Equipment[]
    currency: Currency

    // Магия (если применимо)
    spells?: Spell[]
    spellSlots?: SpellSlots
    spellcastingAbility?: AbilityScore
    spellAttackBonus?: number
    spellSaveDC?: number

    // Способности и черты
    features: Feature[]
    personalityTraits: PersonalityTraits

    // Предыстория и мотивация
    backstory: string
    motivation: string
    alignment: Alignment

    // Активные эффекты
    statusEffects: StatusEffect[]

    // Метаданные
    profileImage?: string
    createdAt: Date
    updatedAt: Date
}

// DTO для создания персонажа
export const CreateCharacterSchema = z.object({
    name: z.string()
        .min(1, 'Имя персонажа обязательно')
        .max(50, 'Имя не должно превышать 50 символов'),
    race: z.enum(['HUMAN', 'ELF', 'DWARF', 'HALFLING', 'DRAGONBORN', 'GNOME', 'HALF_ELF', 'HALF_ORC', 'TIEFLING']),
    class: z.enum(['BARBARIAN', 'BARD', 'CLERIC', 'DRUID', 'FIGHTER', 'MONK', 'PALADIN', 'RANGER', 'ROGUE', 'SORCERER', 'WARLOCK', 'WIZARD']),
    abilityScores: z.object({
        strength: z.number().min(3).max(18),
        dexterity: z.number().min(3).max(18),
        constitution: z.number().min(3).max(18),
        intelligence: z.number().min(3).max(18),
        wisdom: z.number().min(3).max(18),
        charisma: z.number().min(3).max(18)
    }),
    backstory: z.string().min(1, 'Предыстория обязательна'),
    motivation: z.string().min(1, 'Мотивация обязательна'),
    alignment: z.enum(['Законно-добрый', 'Нейтрально-добрый', 'Хаотично-добрый', 'Законно-нейтральный', 'Истинно нейтральный', 'Хаотично-нейтральный', 'Законно-злой', 'Нейтрально-злой', 'Хаотично-злой']),
    selectedSkills: z.array(z.string()).optional(),
    personalityTraits: z.object({
        traits: z.array(z.string()),
        ideals: z.array(z.string()),
        bonds: z.array(z.string()),
        flaws: z.array(z.string())
    }).optional()
})

export type CreateCharacterDto = z.infer<typeof CreateCharacterSchema>

// DTO для обновления персонажа
export const UpdateCharacterSchema = z.object({
    name: z.string().min(1).max(50).optional(),
    backstory: z.string().optional(),
    motivation: z.string().optional(),
    alignment: z.enum(['Законно-добрый', 'Нейтрально-добрый', 'Хаотично-добрый', 'Законно-нейтральный', 'Истинно нейтральный', 'Хаотично-нейтральный', 'Законно-злой', 'Нейтрально-злой', 'Хаотично-злой']).optional(),
    personalityTraits: z.object({
        traits: z.array(z.string()),
        ideals: z.array(z.string()),
        bonds: z.array(z.string()),
        flaws: z.array(z.string())
    }).optional(),
    profileImage: z.string().optional()
})

export type UpdateCharacterDto = z.infer<typeof UpdateCharacterSchema>

// DTO для добавления опыта
export const AddExperienceSchema = z.object({
    amount: z.number().min(0).max(10000)
})

export type AddExperienceDto = z.infer<typeof AddExperienceSchema>

// DTO для управления здоровьем
export const HealthUpdateSchema = z.object({
    currentHP: z.number().min(0).optional(),
    temporaryHP: z.number().min(0).optional(),
    damage: z.number().min(0).optional(),
    healing: z.number().min(0).optional()
})

export type HealthUpdateDto = z.infer<typeof HealthUpdateSchema>

// DTO для экипировки
export const EquipmentSchema = z.object({
    name: z.string().min(1),
    type: z.enum(['weapon', 'armor', 'shield', 'tool', 'consumable', 'treasure', 'other']),
    quantity: z.number().min(1),
    weight: z.number().min(0),
    value: z.number().min(0),
    description: z.string(),
    equipped: z.boolean().optional()
})

export type EquipmentDto = z.infer<typeof EquipmentSchema>

// Результат повышения уровня
export interface LevelUpResult {
    newLevel: number
    hitPointsGained: number
    newFeatures: Feature[]
    newSpellSlots?: Partial<SpellSlots>
    abilityScoreIncrease?: boolean
}

// Ошибки модуля персонажей
export class CharacterError extends Error {
    constructor(
        message: string,
        public statusCode: number = 400
    ) {
        super(message)
        this.name = 'CharacterError'
    }
}