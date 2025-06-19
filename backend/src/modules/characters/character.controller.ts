// backend/src/modules/characters/character.controller.ts
import { Request, Response } from 'express'
import { CharacterService } from './character.service'
import {
    CreateCharacterSchema,
    UpdateCharacterSchema,
    AddExperienceSchema,
    HealthUpdateSchema,
    EquipmentSchema,
    CharacterError
} from './character.types'

export class CharacterController {
    private characterService: CharacterService

    constructor() {
        this.characterService = new CharacterService()
    }

    /**
     * Создание нового персонажа
     * POST /api/characters
     */
    createCharacter = async (req: Request, res: Response): Promise<void> => {
        try {
            const userId = req.user!.userId
            const validatedData = CreateCharacterSchema.parse(req.body)

            const character = await this.characterService.createCharacter(userId, validatedData)

            res.status(201).json({
                success: true,
                message: 'Персонаж успешно создан',
                data: character
            })
        } catch (error) {
            this.handleError(error, res)
        }
    }

    /**
     * Получение всех персонажей пользователя
     * GET /api/characters
     */
    getUserCharacters = async (req: Request, res: Response): Promise<void> => {
        try {
            const userId = req.user!.userId

            const characters = await this.characterService.getUserCharacters(userId)

            res.status(200).json({
                success: true,
                data: characters
            })
        } catch (error) {
            this.handleError(error, res)
        }
    }

    /**
     * Получение конкретного персонажа
     * GET /api/characters/:id
     */
    getCharacter = async (req: Request, res: Response): Promise<void> => {
        try {
            const userId = req.user!.userId
            const { id } = req.params

            const character = await this.characterService.getCharacter(id, userId)

            res.status(200).json({
                success: true,
                data: character
            })
        } catch (error) {
            this.handleError(error, res)
        }
    }

    /**
     * Обновление персонажа
     * PUT /api/characters/:id
     */
    updateCharacter = async (req: Request, res: Response): Promise<void> => {
        try {
            const userId = req.user!.userId
            const { id } = req.params
            const validatedData = UpdateCharacterSchema.parse(req.body)

            const character = await this.characterService.updateCharacter(id, userId, validatedData)

            res.status(200).json({
                success: true,
                message: 'Персонаж успешно обновлен',
                data: character
            })
        } catch (error) {
            this.handleError(error, res)
        }
    }

    /**
     * Добавление опыта
     * POST /api/characters/:id/experience
     */
    addExperience = async (req: Request, res: Response): Promise<void> => {
        try {
            const userId = req.user!.userId
            const { id } = req.params
            const validatedData = AddExperienceSchema.parse(req.body)

            const levelUpResult = await this.characterService.addExperience(id, userId, validatedData)

            res.status(200).json({
                success: true,
                message: levelUpResult ? 'Опыт добавлен. Уровень повышен!' : 'Опыт успешно добавлен',
                data: { levelUpResult }
            })
        } catch (error) {
            this.handleError(error, res)
        }
    }

    /**
     * Обновление здоровья
     * POST /api/characters/:id/health
     */
    updateHealth = async (req: Request, res: Response): Promise<void> => {
        try {
            const userId = req.user!.userId
            const { id } = req.params
            const validatedData = HealthUpdateSchema.parse(req.body)

            const character = await this.characterService.updateHealth(id, userId, validatedData)

            res.status(200).json({
                success: true,
                message: 'Здоровье персонажа обновлено',
                data: character
            })
        } catch (error) {
            this.handleError(error, res)
        }
    }

    /**
     * Добавление экипировки
     * POST /api/characters/:id/equipment
     */
    addEquipment = async (req: Request, res: Response): Promise<void> => {
        try {
            const userId = req.user!.userId
            const { id } = req.params
            const validatedData = EquipmentSchema.parse(req.body)

            const character = await this.characterService.addEquipment(id, userId, validatedData)

            res.status(200).json({
                success: true,
                message: 'Экипировка добавлена',
                data: character
            })
        } catch (error) {
            this.handleError(error, res)
        }
    }

    /**
     * Удаление экипировки
     * DELETE /api/characters/:id/equipment/:equipmentId
     */
    removeEquipment = async (req: Request, res: Response): Promise<void> => {
        try {
            const userId = req.user!.userId
            const { id, equipmentId } = req.params

            // Получаем персонажа
            const character = await this.characterService.getCharacter(id, userId)

            // Удаляем предмет из экипировки
            const updatedEquipment = character.equipment.filter(item => item.id !== equipmentId)

            // Обновляем персонажа (упрощенная версия)
            await this.characterService.updateCharacter(id, userId, {})

            res.status(200).json({
                success: true,
                message: 'Экипировка удалена'
            })
        } catch (error) {
            this.handleError(error, res)
        }
    }

    /**
     * Надевание/снятие экипировки
     * POST /api/characters/:id/equipment/:equipmentId/toggle
     */
    toggleEquipment = async (req: Request, res: Response): Promise<void> => {
        try {
            const userId = req.user!.userId
            const { id, equipmentId } = req.params

            // Получаем персонажа
            const character = await this.characterService.getCharacter(id, userId)

            // Находим предмет и переключаем состояние
            const equipment = character.equipment.find(item => item.id === equipmentId)
            if (!equipment) {
                res.status(404).json({
                    success: false,
                    error: 'Предмет не найден'
                })
                return
            }

            equipment.equipped = !equipment.equipped

            // Обновляем персонажа (здесь нужна отдельная функция в сервисе)
            res.status(200).json({
                success: true,
                message: equipment.equipped ? 'Предмет надет' : 'Предмет снят'
            })
        } catch (error) {
            this.handleError(error, res)
        }
    }

    /**
     * Получение статистики персонажа
     * GET /api/characters/:id/stats
     */
    getCharacterStats = async (req: Request, res: Response): Promise<void> => {
        try {
            const userId = req.user!.userId
            const { id } = req.params

            const character = await this.characterService.getCharacter(id, userId)

            // Рассчитываем различные статистики
            const stats = {
                level: character.level,
                experience: character.experience,
                nextLevelExperience: this.getNextLevelExperience(character.level),
                hitPoints: {
                    current: character.currentHP,
                    max: character.maxHP,
                    temporary: character.temporaryHP
                },
                armorClass: character.armorClass,
                initiative: character.initiative,
                speed: character.speed,
                proficiencyBonus: this.getProficiencyBonus(character.level),
                abilityModifiers: {
                    strength: this.getAbilityModifier(character.abilityScores.strength),
                    dexterity: this.getAbilityModifier(character.abilityScores.dexterity),
                    constitution: this.getAbilityModifier(character.abilityScores.constitution),
                    intelligence: this.getAbilityModifier(character.abilityScores.intelligence),
                    wisdom: this.getAbilityModifier(character.abilityScores.wisdom),
                    charisma: this.getAbilityModifier(character.abilityScores.charisma)
                }
            }

            res.status(200).json({
                success: true,
                data: stats
            })
        } catch (error) {
            this.handleError(error, res)
        }
    }

    /**
     * Удаление персонажа
     * DELETE /api/characters/:id
     */
    deleteCharacter = async (req: Request, res: Response): Promise<void> => {
        try {
            const userId = req.user!.userId
            const { id } = req.params

            await this.characterService.deleteCharacter(id, userId)

            res.status(200).json({
                success: true,
                message: 'Персонаж успешно удален'
            })
        } catch (error) {
            this.handleError(error, res)
        }
    }

    /**
     * Получение доступных рас
     * GET /api/characters/races
     */
    getRaces = async (req: Request, res: Response): Promise<void> => {
        try {
            const { RACES } = await import('@shared/constants/dnd.constants')

            res.status(200).json({
                success: true,
                data: RACES
            })
        } catch (error) {
            this.handleError(error, res)
        }
    }

    /**
     * Получение доступных классов
     * GET /api/characters/classes
     */
    getClasses = async (req: Request, res: Response): Promise<void> => {
        try {
            const { CLASSES } = await import('@shared/constants/dnd.constants')

            res.status(200).json({
                success: true,
                data: CLASSES
            })
        } catch (error) {
            this.handleError(error, res)
        }
    }

    /**
     * Генерация случайных характеристик
     * GET /api/characters/generate-stats
     */
    generateRandomStats = async (req: Request, res: Response): Promise<void> => {
        try {
            const stats = {
                strength: this.rollAbilityScore(),
                dexterity: this.rollAbilityScore(),
                constitution: this.rollAbilityScore(),
                intelligence: this.rollAbilityScore(),
                wisdom: this.rollAbilityScore(),
                charisma: this.rollAbilityScore()
            }

            res.status(200).json({
                success: true,
                data: stats
            })
        } catch (error) {
            this.handleError(error, res)
        }
    }

    /**
     * Генерация предыстории персонажа
     * POST /api/characters/generate-backstory
     */
    generateBackstory = async (req: Request, res: Response): Promise<void> => {
        try {
            const { race, characterClass } = req.body

            if (!race || !characterClass) {
                res.status(400).json({
                    success: false,
                    error: 'Раса и класс обязательны для генерации предыстории'
                })
                return
            }

            // Здесь можно интегрировать с ИИ для генерации предыстории
            const backstories = this.getBackstoryTemplates(race, characterClass)
            const randomBackstory = backstories[Math.floor(Math.random() * backstories.length)]

            res.status(200).json({
                success: true,
                data: { backstory: randomBackstory }
            })
        } catch (error) {
            this.handleError(error, res)
        }
    }

    /**
     * Генерация мотивации персонажа
     * POST /api/characters/generate-motivation
     */
    generateMotivation = async (req: Request, res: Response): Promise<void> => {
        try {
            const { alignment, characterClass } = req.body

            const motivations = this.getMotivationTemplates(alignment, characterClass)
            const randomMotivation = motivations[Math.floor(Math.random() * motivations.length)]

            res.status(200).json({
                success: true,
                data: { motivation: randomMotivation }
            })
        } catch (error) {
            this.handleError(error, res)
        }
    }

    // === Вспомогательные методы ===

    /**
     * Броск характеристики (4d6, убираем наименьший)
     */
    private rollAbilityScore(): number {
        const rolls = Array.from({ length: 4 }, () => Math.floor(Math.random() * 6) + 1)
        rolls.sort((a, b) => b - a)
        return rolls.slice(0, 3).reduce((sum, roll) => sum + roll, 0)
    }

    /**
     * Получение модификатора характеристики
     */
    private getAbilityModifier(score: number): number {
        return Math.floor((score - 10) / 2)
    }

    /**
     * Получение бонуса мастерства по уровню
     */
    private getProficiencyBonus(level: number): number {
        const { PROFICIENCY_BONUS } = require('@shared/constants/dnd.constants')
        return PROFICIENCY_BONUS[level as keyof typeof PROFICIENCY_BONUS] || 2
    }

    /**
     * Получение опыта для следующего уровня
     */
    private getNextLevelExperience(currentLevel: number): number {
        const { EXPERIENCE_TABLE } = require('@shared/constants/dnd.constants')
        return EXPERIENCE_TABLE[(currentLevel + 1) as keyof typeof EXPERIENCE_TABLE] || 0
    }

    /**
     * Шаблоны предысторий
     */
    private getBackstoryTemplates(race: string, characterClass: string): string[] {
        const templates = [
            `Родился в небольшой деревне и всегда мечтал о приключениях.`,
            `Потерял семью в юном возрасте и был воспитан наставниками.`,
            `Происходит из знатного рода, но выбрал путь искателя приключений.`,
            `Был простым ремесленником, пока судьба не свела с магией.`,
            `Изгнан из родных земель и ищет способ восстановить честь.`
        ]

        // Можно добавить специфичные для расы/класса шаблоны
        if (characterClass === 'WIZARD') {
            templates.push(`Обучался в магической академии, но был исключен за запрещенные эксперименты.`)
        }

        if (race === 'ELF') {
            templates.push(`Прожил долгую жизнь в лесах, но почувствовал зов человеческого мира.`)
        }

        return templates
    }

    /**
     * Шаблоны мотиваций
     */
    private getMotivationTemplates(alignment: string, characterClass: string): string[] {
        const templates = [
            `Ищет способ стать сильнее и защитить тех, кого любит.`,
            `Стремится разгадать древнюю тайну, связанную с его прошлым.`,
            `Хочет найти легендарный артефакт, способный изменить мир.`,
            `Пытается искупить грехи прошлого, помогая нуждающимся.`,
            `Ищет достойного противника для проверки своих навыков.`
        ]

        if (alignment.includes('добрый')) {
            templates.push(`Мечтает создать мир, где все живут в мире и согласии.`)
        }

        if (alignment.includes('злой')) {
            templates.push(`Стремится к власти любой ценой и готов на все ради неё.`)
        }

        return templates
    }

    /**
     * Обработка ошибок
     */
    private handleError = (error: any, res: Response): void => {
        console.error('Character controller error:', error)

        if (error.name === 'ZodError') {
            res.status(400).json({
                success: false,
                error: 'Ошибка валидации данных',
                details: error.errors.map((err: any) => ({
                    field: err.path.join('.'),
                    message: err.message
                }))
            })
            return
        }

        if (error instanceof CharacterError) {
            res.status(error.statusCode).json({
                success: false,
                error: error.message
            })
            return
        }

        // Общая ошибка сервера
        res.status(500).json({
            success: false,
            error: 'Внутренняя ошибка сервера'
        })
    }
}