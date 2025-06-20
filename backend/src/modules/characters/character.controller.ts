// backend/src/modules/characters/character.controller.ts - дополнение метода toggleEquipment
// @ts-ignore

/**
 * Надевание/снятие экипировки
 * POST /api/characters/:id/equipment/:equipmentId/toggle
 */
toggleEquipment = async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = req.user!.userId
        const {id, equipmentId} = req.params

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

        // Переключаем состояние экипировки
        equipment.equipped = !equipment.equipped

        // Если надеваем предмет, проверяем ограничения
        if (equipment.equipped) {
            const validationResult = this.validateEquipmentSlot(character, equipment)
            if (!validationResult.valid) {
                res.status(400).json({
                    success: false,
                    error: validationResult.error
                })
                return
            }

            // Снимаем другие предметы того же слота, если необходимо
            if (validationResult.shouldUnequipOthers) {
                validationResult.itemsToUnequip.forEach(itemId => {
                    const itemToUnequip = character.equipment.find(item => item.id === itemId)
                    if (itemToUnequip) {
                        itemToUnequip.equipped = false
                    }
                })
            }
        }

        // Обновляем персонажа в базе данных
        const updatedCharacter = await this.characterService.updateCharacterEquipment(
            id,
            userId,
            character.equipment
        )

        res.status(200).json({
            success: true,
            message: equipment.equipped ? 'Предмет надет' : 'Предмет снят',
            data: {
                character: updatedCharacter,
                equipmentChanged: {
                    itemId: equipmentId,
                    equipped: equipment.equipped,
                    unequippedItems: equipment.equipped && validationResult?.itemsToUnequip
                        ? validationResult.itemsToUnequip
                        : []
                }
            }
        })
    } catch (error) {
        this.handleError(error, res)
    }
}

/**
 * Валидация экипировки предмета
 */
private
validateEquipmentSlot(character
:
Character, equipment
:
Equipment
):
{
    valid: boolean
    error ? : string
    shouldUnequipOthers ? : boolean
    itemsToUnequip ? : string[]
}
{
    const equippedItems = character.equipment.filter(item => item.equipped)

    switch (equipment.type) {
        case 'weapon':
            // Проверяем количество рук
            const equippedWeapons = equippedItems.filter(item => item.type === 'weapon')
            if (equippedWeapons.length >= 2) {
                return {
                    valid: true,
                    shouldUnequipOthers: true,
                    itemsToUnequip: [equippedWeapons[0].id]
                }
            }
            break

        case 'armor':
            // Только один доспех
            const equippedArmor = equippedItems.filter(item => item.type === 'armor')
            if (equippedArmor.length > 0) {
                return {
                    valid: true,
                    shouldUnequipOthers: true,
                    itemsToUnequip: equippedArmor.map(item => item.id)
                }
            }
            break

        case 'shield':
            // Только один щит
            const equippedShields = equippedItems.filter(item => item.type === 'shield')
            if (equippedShields.length > 0) {
                return {
                    valid: true,
                    shouldUnequipOthers: true,
                    itemsToUnequip: equippedShields.map(item => item.id)
                }
            }

            // Проверяем, есть ли двуручное оружие
            const twoHandedWeapons = equippedItems.filter(item =>
                item.type === 'weapon' && item.properties?.includes('two-handed')
            )
            if (twoHandedWeapons.length > 0) {
                return {
                    valid: false,
                    error: 'Нельзя использовать щит с двуручным оружием'
                }
            }
            break

        default:
            // Для других типов предметов ограничений нет
            break
    }

    return {valid: true}
}

/**
 * Получение статистик персонажа
 * GET /api/characters/:id/stats
 */
getCharacterStats = async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = req.user!.userId
        const {id} = req.params

        const character = await this.characterService.getCharacter(id, userId)
        const stats = await this.characterService.calculateCharacterStats(character)

        res.status(200).json({
            success: true,
            data: stats
        })
    } catch (error) {
        this.handleError(error, res)
    }
}

/**
 * Восстановление всех ресурсов персонажа (длительный отдых)
 * POST /api/characters/:id/long-rest
 */
longRest = async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = req.user!.userId
        const {id} = req.params

        const character = await this.characterService.longRest(id, userId)

        res.status(200).json({
            success: true,
            message: 'Персонаж восстановился после длительного отдыха',
            data: character
        })
    } catch (error) {
        this.handleError(error, res)
    }
}

/**
 * Частичное восстановление ресурсов (короткий отдых)
 * POST /api/characters/:id/short-rest
 */
shortRest = async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = req.user!.userId
        const {id} = req.params

        const character = await this.characterService.shortRest(id, userId)

        res.status(200).json({
            success: true,
            message: 'Персонаж восстановился после короткого отдыха',
            data: character
        })
    } catch (error) {
        this.handleError(error, res)
    }
}

/**
 * Обработка ошибок
 */
private
handleError(error
:
any, res
:
Response
):
void {
    console.error('Character Controller Error:', error)

    if(error instanceof CharacterError
)
{
    res.status(error.statusCode).json({
        success: false,
        error: error.message
    })
}
else
if (error.code === 'P2002') {
    res.status(400).json({
        success: false,
        error: 'Персонаж с таким именем уже существует'
    })
} else if (error.code === 'P2025') {
    res.status(404).json({
        success: false,
        error: 'Персонаж не найден'
    })
} else {
    res.status(500).json({
        success: false,
        error: 'Внутренняя ошибка сервера'
    })
}
}