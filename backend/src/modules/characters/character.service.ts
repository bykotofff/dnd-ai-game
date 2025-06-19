// backend/src/modules/characters/character.service.ts
import { db } from '@shared/database/database.service'
import {
    CreateCharacterDto,
    UpdateCharacterDto,
    AddExperienceDto,
    HealthUpdateDto,
    EquipmentDto,
    CharacterSheet,
    AbilityScores,
    SkillProficiencies,
    SavingThrows,
    LevelUpResult,
    Equipment,
    Feature,
    CharacterError
} from './character.types'
import {
    RACES,
    CLASSES,
    SKILLS,
    ABILITY_SCORES,
    EXPERIENCE_TABLE,
    PROFICIENCY_BONUS
} from '@shared/constants/dnd.constants'

export class CharacterService {

    /**
     * Создание нового персонажа
     */
    async createCharacter(userId: string, data: CreateCharacterDto): Promise<CharacterSheet> {
        try {
            // Получаем данные расы и класса
            const raceData = RACES[data.race]
            const classData = CLASSES[data.class]

            // Применяем расовые бонусы к характеристикам
            const finalAbilityScores = this.applyRacialBonuses(data.abilityScores, raceData.abilityScoreIncrease)

            // Рассчитываем начальные HP
            const maxHP = this.calculateMaxHP(finalAbilityScores, classData, 1)

            // Создаем начальные навыки
            const skills = this.initializeSkills(data.class, data.selectedSkills || [])

            // Создаем спасительные броски
            const savingThrows = this.initializeSavingThrows(classData.savingThrowProficiencies)

            // Создаем начальную экипировку
            const startingEquipment = this.generateStartingEquipment(data.class)

            // Создаем способности расы и класса
            const features = this.generateStartingFeatures(data.race, data.class)

            // Создаем персонажа в базе данных
            const character = await db.character.create({
                data: {
                    userId,
                    name: data.name,
                    race: data.race,
                    class: data.class,
                    level: 1,
                    experience: 0,

                    // Характеристики
                    strength: finalAbilityScores.strength,
                    dexterity: finalAbilityScores.dexterity,
                    constitution: finalAbilityScores.constitution,
                    intelligence: finalAbilityScores.intelligence,
                    wisdom: finalAbilityScores.wisdom,
                    charisma: finalAbilityScores.charisma,

                    // Здоровье и защита
                    currentHP: maxHP,
                    maxHP: maxHP,
                    temporaryHP: 0,
                    armorClass: this.calculateArmorClass(finalAbilityScores, startingEquipment),
                    initiative: this.getAbilityModifier(finalAbilityScores.dexterity),
                    speed: raceData.speed,

                    // JSON поля
                    skills: skills,
                    equipment: startingEquipment,
                    features: features,
                    personalityTraits: data.personalityTraits || {
                        traits: [],
                        ideals: [],
                        bonds: [],
                        flaws: []
                    },

                    // Текстовые поля
                    backstory: data.backstory,
                    motivation: data.motivation,
                    alignment: data.alignment
                }
            })

            return this.mapToCharacterSheet(character)
        } catch (error) {
            console.error('Create character error:', error)
            throw new CharacterError('Ошибка при создании персонажа')
        }
    }

    /**
     * Получение персонажа по ID
     */
    async getCharacter(characterId: string, userId: string): Promise<CharacterSheet> {
        try {
            const character = await db.character.findFirst({
                where: {
                    id: characterId,
                    userId: userId
                }
            })

            if (!character) {
                throw new CharacterError('Персонаж не найден', 404)
            }

            return this.mapToCharacterSheet(character)
        } catch (error) {
            if (error instanceof CharacterError) {
                throw error
            }
            console.error('Get character error:', error)
            throw new CharacterError('Ошибка при получении персонажа')
        }
    }

    /**
     * Получение всех персонажей пользователя
     */
    async getUserCharacters(userId: string): Promise<CharacterSheet[]> {
        try {
            const characters = await db.character.findMany({
                where: { userId },
                orderBy: { createdAt: 'desc' }
            })

            return characters.map(character => this.mapToCharacterSheet(character))
        } catch (error) {
            console.error('Get user characters error:', error)
            throw new CharacterError('Ошибка при получении персонажей')
        }
    }

    /**
     * Обновление персонажа
     */
    async updateCharacter(characterId: string, userId: string, data: UpdateCharacterDto): Promise<CharacterSheet> {
        try {
            const character = await db.character.findFirst({
                where: { id: characterId, userId }
            })

            if (!character) {
                throw new CharacterError('Персонаж не найден', 404)
            }

            const updatedCharacter = await db.character.update({
                where: { id: characterId },
                data: {
                    ...data,
                    personalityTraits: data.personalityTraits || character.personalityTraits,
                    updatedAt: new Date()
                }
            })

            return this.mapToCharacterSheet(updatedCharacter)
        } catch (error) {
            if (error instanceof CharacterError) {
                throw error
            }
            console.error('Update character error:', error)
            throw new CharacterError('Ошибка при обновлении персонажа')
        }
    }

    /**
     * Добавление опыта и проверка повышения уровня
     */
    async addExperience(characterId: string, userId: string, data: AddExperienceDto): Promise<LevelUpResult | null> {
        try {
            const character = await db.character.findFirst({
                where: { id: characterId, userId }
            })

            if (!character) {
                throw new CharacterError('Персонаж не найден', 404)
            }

            const newExperience = character.experience + data.amount
            const newLevel = this.calculateLevel(newExperience)

            let levelUpResult: LevelUpResult | null = null

            // Проверяем повышение уровня
            if (newLevel > character.level) {
                levelUpResult = await this.levelUp(character, newLevel)
            }

            // Обновляем опыт
            await db.character.update({
                where: { id: characterId },
                data: {
                    experience: newExperience,
                    level: newLevel,
                    maxHP: levelUpResult?.hitPointsGained ? character.maxHP + levelUpResult.hitPointsGained : character.maxHP,
                    features: levelUpResult?.newFeatures ? [...(character.features as Feature[]), ...levelUpResult.newFeatures] : character.features
                }
            })

            return levelUpResult
        } catch (error) {
            if (error instanceof CharacterError) {
                throw error
            }
            console.error('Add experience error:', error)
            throw new CharacterError('Ошибка при добавлении опыта')
        }
    }

    /**
     * Обновление здоровья персонажа
     */
    async updateHealth(characterId: string, userId: string, data: HealthUpdateDto): Promise<CharacterSheet> {
        try {
            const character = await db.character.findFirst({
                where: { id: characterId, userId }
            })

            if (!character) {
                throw new CharacterError('Персонаж не найден', 404)
            }

            let newCurrentHP = character.currentHP
            let newTemporaryHP = character.temporaryHP

            // Применяем изменения
            if (data.currentHP !== undefined) {
                newCurrentHP = Math.max(0, Math.min(data.currentHP, character.maxHP))
            }

            if (data.temporaryHP !== undefined) {
                newTemporaryHP = Math.max(0, data.temporaryHP)
            }

            if (data.damage !== undefined) {
                // Сначала снимаем с временных HP
                if (newTemporaryHP > 0) {
                    const damageToTemp = Math.min(data.damage, newTemporaryHP)
                    newTemporaryHP -= damageToTemp
                    const remainingDamage = data.damage - damageToTemp
                    newCurrentHP = Math.max(0, newCurrentHP - remainingDamage)
                } else {
                    newCurrentHP = Math.max(0, newCurrentHP - data.damage)
                }
            }

            if (data.healing !== undefined) {
                newCurrentHP = Math.min(character.maxHP, newCurrentHP + data.healing)
            }

            const updatedCharacter = await db.character.update({
                where: { id: characterId },
                data: {
                    currentHP: newCurrentHP,
                    temporaryHP: newTemporaryHP
                }
            })

            return this.mapToCharacterSheet(updatedCharacter)
        } catch (error) {
            if (error instanceof CharacterError) {
                throw error
            }
            console.error('Update health error:', error)
            throw new CharacterError('Ошибка при обновлении здоровья')
        }
    }

    /**
     * Добавление предмета в инвентарь
     */
    async addEquipment(characterId: string, userId: string, equipment: EquipmentDto): Promise<CharacterSheet> {
        try {
            const character = await db.character.findFirst({
                where: { id: characterId, userId }
            })

            if (!character) {
                throw new CharacterError('Персонаж не найден', 404)
            }

            const currentEquipment = character.equipment as Equipment[]
            const newEquipment: Equipment = {
                id: `eq_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                ...equipment,
                equipped: equipment.equipped || false
            }

            const updatedEquipment = [...currentEquipment, newEquipment]

            const updatedCharacter = await db.character.update({
                where: { id: characterId },
                data: {
                    equipment: updatedEquipment,
                    armorClass: this.calculateArmorClass(
                        {
                            strength: character.strength,
                            dexterity: character.dexterity,
                            constitution: character.constitution,
                            intelligence: character.intelligence,
                            wisdom: character.wisdom,
                            charisma: character.charisma
                        },
                        updatedEquipment
                    )
                }
            })

            return this.mapToCharacterSheet(updatedCharacter)
        } catch (error) {
            if (error instanceof CharacterError) {
                throw error
            }
            console.error('Add equipment error:', error)
            throw new CharacterError('Ошибка при добавлении экипировки')
        }
    }

    /**
     * Удаление персонажа
     */
    async deleteCharacter(characterId: string, userId: string): Promise<void> {
        try {
            const character = await db.character.findFirst({
                where: { id: characterId, userId }
            })

            if (!character) {
                throw new CharacterError('Персонаж не найден', 404)
            }

            await db.character.delete({
                where: { id: characterId }
            })
        } catch (error) {
            if (error instanceof CharacterError) {
                throw error
            }
            console.error('Delete character error:', error)
            throw new CharacterError('Ошибка при удалении персонажа')
        }
    }

    // === Вспомогательные методы ===

    /**
     * Применение расовых бонусов к характеристикам
     */
    private applyRacialBonuses(scores: AbilityScores, bonuses: Partial<AbilityScores>): AbilityScores {
        return {
            strength: scores.strength + (bonuses.strength || 0),
            dexterity: scores.dexterity + (bonuses.dexterity || 0),
            constitution: scores.constitution + (bonuses.constitution || 0),
            intelligence: scores.intelligence + (bonuses.intelligence || 0),
            wisdom: scores.wisdom + (bonuses.wisdom || 0),
            charisma: scores.charisma + (bonuses.charisma || 0)
        }
    }

    /**
     * Расчет модификатора характеристики
     */
    private getAbilityModifier(score: number): number {
        return Math.floor((score - 10) / 2)
    }

    /**
     * Расчет максимального HP
     */
    private calculateMaxHP(abilityScores: AbilityScores, classData: any, level: number): number {
        const constitutionModifier = this.getAbilityModifier(abilityScores.constitution)
        const baseHP = classData.hitDie + constitutionModifier

        // На 1 уровне получаем максимум
        if (level === 1) {
            return Math.max(1, baseHP)
        }

        // На последующих уровнях средний рол + модификатор телосложения
        const additionalHP = (level - 1) * (Math.floor(classData.hitDie / 2) + 1 + constitutionModifier)
        return Math.max(level, baseHP + additionalHP)
    }

    /**
     * Расчет класса доспеха
     */
    private calculateArmorClass(abilityScores: AbilityScores, equipment: Equipment[]): number {
        const dexModifier = this.getAbilityModifier(abilityScores.dexterity)

        // Ищем надетую броню
        const armor = equipment.find(item => item.type === 'armor' && item.equipped)
        const shield = equipment.find(item => item.type === 'shield' && item.equipped)

        let baseAC = 10 + dexModifier // Базовый AC без брони

        if (armor && armor.armorClass) {
            baseAC = armor.armorClass + Math.min(dexModifier, 2) // Ограничение Dex для большинства доспехов
        }

        if (shield && shield.armorClass) {
            baseAC += shield.armorClass
        }

        return baseAC
    }

    /**
     * Инициализация навыков
     */
    private initializeSkills(characterClass: string, selectedSkills: string[]): SkillProficiencies {
        const skills = {} as SkillProficiencies

        // Инициализируем все навыки как непрофильные
        Object.keys(SKILLS).forEach(skill => {
            skills[skill as keyof typeof SKILLS] = {
                proficient: selectedSkills.includes(skill),
                expertise: false
            }
        })

        return skills
    }

    /**
     * Инициализация спасительных бросков
     */
    private initializeSavingThrows(classProfs: string[]): SavingThrows {
        const saves = {} as SavingThrows

        Object.values(ABILITY_SCORES).forEach(ability => {
            saves[ability] = {
                proficient: classProfs.includes(ability)
            }
        })

        return saves
    }

    /**
     * Генерация стартовой экипировки
     */
    private generateStartingEquipment(characterClass: string): Equipment[] {
        // Базовая экипировка - можно расширить
        const equipment: Equipment[] = [
            {
                id: 'starting_clothes',
                name: 'Обычная одежда',
                type: 'other',
                quantity: 1,
                weight: 3,
                value: 50,
                description: 'Простая повседневная одежда',
                equipped: true
            },
            {
                id: 'starting_pack',
                name: 'Рюкзак',
                type: 'other',
                quantity: 1,
                weight: 5,
                value: 200,
                description: 'Вместительный рюкзак для снаряжения'
            }
        ]

        // Добавляем классовое снаряжение
        if (characterClass === 'FIGHTER') {
            equipment.push({
                id: 'starting_sword',
                name: 'Длинный меч',
                type: 'weapon',
                quantity: 1,
                weight: 3,
                value: 1500,
                description: 'Качественный длинный меч',
                damage: { dice: '1d8', type: 'slashing' },
                properties: ['Универсальное (1d10)']
            })
        }

        return equipment
    }

    /**
     * Генерация стартовых способностей
     */
    private generateStartingFeatures(race: string, characterClass: string): Feature[] {
        const features: Feature[] = []

        // Расовые способности
        const raceData = RACES[race as keyof typeof RACES]
        raceData.traits.forEach((trait, index) => {
            features.push({
                id: `race_${race.toLowerCase()}_${index}`,
                name: trait,
                description: `Расовая способность: ${trait}`,
                source: 'race'
            })
        })

        // Классовые способности 1 уровня
        const classData = CLASSES[characterClass as keyof typeof CLASSES]
        classData.features.forEach((feature, index) => {
            features.push({
                id: `class_${characterClass.toLowerCase()}_${index}`,
                name: feature,
                description: `Способность класса: ${feature}`,
                source: 'class',
                level: 1
            })
        })

        return features
    }

    /**
     * Расчет уровня по опыту
     */
    private calculateLevel(experience: number): number {
        const levels = Object.entries(EXPERIENCE_TABLE)
            .sort(([a], [b]) => parseInt(b) - parseInt(a))

        for (const [level, requiredExp] of levels) {
            if (experience >= requiredExp) {
                return parseInt(level)
            }
        }

        return 1
    }

    /**
     * Повышение уровня
     */
    private async levelUp(character: any, newLevel: number): Promise<LevelUpResult> {
        const classData = CLASSES[character.class as keyof typeof CLASSES]
        const levelsGained = newLevel - character.level

        // Расчет дополнительных HP
        const constitutionModifier = this.getAbilityModifier(character.constitution)
        const hitPointsGained = levelsGained * (Math.floor(classData.hitDie / 2) + 1 + constitutionModifier)

        // Новые способности (упрощенная версия)
        const newFeatures: Feature[] = []

        return {
            newLevel,
            hitPointsGained,
            newFeatures,
            abilityScoreIncrease: newLevel % 4 === 0 // Каждый 4-й уровень
        }
    }

    /**
     * Преобразование модели БД в CharacterSheet
     */
    private mapToCharacterSheet(character: any): CharacterSheet {
        return {
            id: character.id,
            userId: character.userId,
            name: character.name,
            race: character.race,
            class: character.class,
            level: character.level,
            experience: character.experience,

            abilityScores: {
                strength: character.strength,
                dexterity: character.dexterity,
                constitution: character.constitution,
                intelligence: character.intelligence,
                wisdom: character.wisdom,
                charisma: character.charisma
            },

            currentHP: character.currentHP,
            maxHP: character.maxHP,
            temporaryHP: character.temporaryHP,
            armorClass: character.armorClass,
            initiative: character.initiative,
            speed: character.speed,

            skills: character.skills as SkillProficiencies,
            savingThrows: {} as SavingThrows, // Будет вычислено

            equipment: character.equipment as Equipment[],
            currency: { copper: 0, silver: 0, electrum: 0, gold: 0, platinum: 0 },

            features: character.features as Feature[],
            personalityTraits: character.personalityTraits as any,

            backstory: character.backstory,
            motivation: character.motivation,
            alignment: character.alignment,

            statusEffects: [],

            profileImage: character.profileImage,
            createdAt: character.createdAt,
            updatedAt: character.updatedAt
        }
    }
}