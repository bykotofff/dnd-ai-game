'use client'

// frontend/src/components/character/inventory-panel.tsx
import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
    Backpack,
    Sword,
    Shield,
    Plus,
    Minus,
    Edit,
    Trash2,
    Package,
    Coins,
    Weight,
    Star,
    MoreHorizontal
} from 'lucide-react'
import { Character, Equipment } from '@/types'
import { cn } from '@/lib/utils'
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd'

interface InventoryPanelProps {
    character: Character
    isEditing: boolean
    onUpdate: (updates: Partial<Character>) => void
}

interface Currency {
    copper: number
    silver: number
    electrum: number
    gold: number
    platinum: number
}

interface EquipmentItemProps {
    item: Equipment
    index: number
    isEditing: boolean
    onToggleEquipped: () => void
    onEdit: () => void
    onDelete: () => void
}

const EQUIPMENT_TYPES = {
    weapon: { label: 'Оружие', color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300', icon: Sword },
    armor: { label: 'Доспех', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300', icon: Shield },
    shield: { label: 'Щит', color: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-300', icon: Shield },
    tool: { label: 'Инструмент', color: 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300', icon: Package },
    consumable: { label: 'Расходник', color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300', icon: Package },
    treasure: { label: 'Сокровище', color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300', icon: Star },
    other: { label: 'Прочее', color: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300', icon: Package }
}

function EquipmentItem({ item, index, isEditing, onToggleEquipped, onEdit, onDelete }: EquipmentItemProps) {
    const equipmentType = EQUIPMENT_TYPES[item.type] || EQUIPMENT_TYPES.other
    const Icon = equipmentType.icon

    return (
        <Draggable draggableId={item.id} index={index} isDragDisabled={!isEditing}>
            {(provided, snapshot) => (
                <div
                    ref={provided.innerRef}
                    {...provided.draggableProps}
                    {...provided.dragHandleProps}
                    className={cn(
                        "p-3 rounded-lg border transition-all duration-200",
                        item.equipped
                            ? "border-green-500 bg-green-50 dark:bg-green-950/30"
                            : "border-muted bg-background hover:bg-muted/50",
                        snapshot.isDragging && "shadow-lg ring-2 ring-purple-500/20",
                        isEditing && "cursor-grab active:cursor-grabbing"
                    )}
                >
                    <div className="flex items-start space-x-3">
                        <div className={cn(
                            "w-10 h-10 rounded-lg flex items-center justify-center",
                            item.equipped ? "bg-green-500 text-white" : "bg-muted"
                        )}>
                            <Icon className="h-5 w-5" />
                        </div>

                        <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-1">
                                <h4 className="font-semibold truncate">{item.name}</h4>
                                <div className="flex items-center space-x-1">
                                    <Badge className={equipmentType.color}>
                                        {equipmentType.label}
                                    </Badge>
                                    {item.equipped && (
                                        <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">
                                            Экипировано
                                        </Badge>
                                    )}
                                </div>
                            </div>

                            <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                                {item.description}
                            </p>

                            <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                                    {item.quantity > 1 && (
                                        <span>Кол-во: {item.quantity}</span>
                                    )}
                                    {item.weight > 0 && (
                                        <span className="flex items-center">
                      <Weight className="h-3 w-3 mr-1" />
                                            {item.weight} фунт.
                    </span>
                                    )}
                                    {item.value > 0 && (
                                        <span className="flex items-center">
                      <Coins className="h-3 w-3 mr-1" />
                                            {item.value} зм
                    </span>
                                    )}
                                </div>

                                {isEditing && (
                                    <div className="flex items-center space-x-1">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={onToggleEquipped}
                                            className="h-6 w-6 p-0"
                                        >
                                            {item.equipped ? (
                                                <Minus className="h-3 w-3 text-red-500" />
                                            ) : (
                                                <Plus className="h-3 w-3 text-green-500" />
                                            )}
                                        </Button>

                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={onEdit}
                                            className="h-6 w-6 p-0"
                                        >
                                            <Edit className="h-3 w-3" />
                                        </Button>

                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={onDelete}
                                            className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
                                        >
                                            <Trash2 className="h-3 w-3" />
                                        </Button>
                                    </div>
                                )}
                            </div>

                            {/* Особые свойства */}
                            {(item.damage || item.armorClass || item.properties) && (
                                <div className="mt-2 pt-2 border-t border-muted">
                                    <div className="flex flex-wrap gap-2 text-xs">
                                        {item.damage && (
                                            <Badge variant="outline">
                                                Урон: {item.damage.dice} {item.damage.type}
                                            </Badge>
                                        )}
                                        {item.armorClass && (
                                            <Badge variant="outline">
                                                КБ: {item.armorClass}
                                            </Badge>
                                        )}
                                        {item.properties && item.properties.map((prop, index) => (
                                            <Badge key={index} variant="outline">
                                                {prop}
                                            </Badge>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </Draggable>
    )
}

function CurrencyManager({ character, isEditing, onUpdate }: {
    character: Character
    isEditing: boolean
    onUpdate: (updates: Partial<Character>) => void
}) {
    // Упрощенное управление валютой - будет расширено при подключении к backend
    const currency: Currency = {
        copper: 0,
        silver: 0,
        electrum: 0,
        gold: 100, // Заглушка
        platinum: 0
    }

    const currencyTypes = [
        { key: 'platinum', label: 'Платина', color: 'text-slate-400', abbr: 'пл' },
        { key: 'gold', label: 'Золото', color: 'text-yellow-500', abbr: 'зм' },
        { key: 'electrum', label: 'Электрум', color: 'text-green-500', abbr: 'эм' },
        { key: 'silver', label: 'Серебро', color: 'text-gray-400', abbr: 'см' },
        { key: 'copper', label: 'Медь', color: 'text-orange-600', abbr: 'мм' }
    ]

    return (
        <Card>
            <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center space-x-2">
                    <Coins className="h-4 w-4 text-amber-500" />
                    <span>Валюта</span>
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
                {currencyTypes.map(({ key, label, color, abbr }) => (
                    <div key={key} className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                            <div className={cn("w-4 h-4 rounded-full", color.replace('text-', 'bg-'))} />
                            <span className="text-sm">{label}</span>
                        </div>

                        {isEditing ? (
                            <Input
                                type="number"
                                min="0"
                                value={currency[key as keyof Currency]}
                                className="w-20 h-7 text-xs text-right"
                                // onChange для обновления валюты
                            />
                        ) : (
                            <span className={cn("font-mono text-sm", color)}>
                {currency[key as keyof Currency]} {abbr}
              </span>
                        )}
                    </div>
                ))}

                {/* Общий вес */}
                <div className="pt-2 border-t border-muted">
                    <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Общий вес:</span>
                        <span className="font-mono">
              {character.equipment?.reduce((total, item) => total + (item.weight * item.quantity), 0) || 0} фунт.
            </span>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}

export function InventoryPanel({ character, isEditing, onUpdate }: InventoryPanelProps) {
    const [searchQuery, setSearchQuery] = useState('')
    const [filterType, setFilterType] = useState<Equipment['type'] | 'all'>('all')
    const [showEquippedOnly, setShowEquippedOnly] = useState(false)

    const equipment = character.equipment || []

    // Фильтрация экипировки
    const filteredEquipment = equipment.filter(item => {
        if (filterType !== 'all' && item.type !== filterType) return false
        if (showEquippedOnly && !item.equipped) return false
        if (searchQuery && !item.name.toLowerCase().includes(searchQuery.toLowerCase())) return false
        return true
    })

    const handleDragEnd = (result: any) => {
        if (!result.destination || !isEditing) return

        const items = Array.from(filteredEquipment)
        const [reorderedItem] = items.splice(result.source.index, 1)
        items.splice(result.destination.index, 0, reorderedItem)

        // Обновляем порядок в полном списке экипировки
        const newEquipment = [...equipment]
        const oldIndex = equipment.findIndex(item => item.id === reorderedItem.id)
        if (oldIndex !== -1) {
            newEquipment.splice(oldIndex, 1)
            newEquipment.splice(result.destination.index, 0, reorderedItem)
        }

        onUpdate({ equipment: newEquipment })
    }

    const handleToggleEquipped = (itemId: string) => {
        const newEquipment = equipment.map(item =>
            item.id === itemId ? { ...item, equipped: !item.equipped } : item
        )
        onUpdate({ equipment: newEquipment })
    }

    const handleDeleteItem = (itemId: string) => {
        const newEquipment = equipment.filter(item => item.id !== itemId)
        onUpdate({ equipment: newEquipment })
    }

    const addNewItem = () => {
        const newItem: Equipment = {
            id: `item_${Date.now()}`,
            name: 'Новый предмет',
            type: 'other',
            quantity: 1,
            weight: 0,
            value: 0,
            description: 'Описание предмета',
            equipped: false
        }

        onUpdate({ equipment: [...equipment, newItem] })
    }

    const equippedItems = equipment.filter(item => item.equipped)
    const backpackItems = equipment.filter(item => !item.equipped)

    return (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Основной инвентарь */}
            <div className="lg:col-span-3 space-y-6">
                {/* Экипированные предметы */}
                <Card>
                    <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                            <CardTitle className="text-base flex items-center space-x-2">
                                <Shield className="h-4 w-4 text-green-500" />
                                <span>Экипировано ({equippedItems.length})</span>
                            </CardTitle>
                        </div>
                    </CardHeader>
                    <CardContent>
                        {equippedItems.length > 0 ? (
                            <DragDropContext onDragEnd={handleDragEnd}>
                                <Droppable droppableId="equipped">
                                    {(provided) => (
                                        <div
                                            {...provided.droppableProps}
                                            ref={provided.innerRef}
                                            className="space-y-3"
                                        >
                                            {equippedItems.map((item, index) => (
                                                <EquipmentItem
                                                    key={item.id}
                                                    item={item}
                                                    index={index}
                                                    isEditing={isEditing}
                                                    onToggleEquipped={() => handleToggleEquipped(item.id)}
                                                    onEdit={() => {/* TODO: Редактирование предмета */}}
                                                    onDelete={() => handleDeleteItem(item.id)}
                                                />
                                            ))}
                                            {provided.placeholder}
                                        </div>
                                    )}
                                </Droppable>
                            </DragDropContext>
                        ) : (
                            <div className="text-center py-8 text-muted-foreground">
                                <Shield className="h-8 w-8 mx-auto mb-2 opacity-50" />
                                <p className="text-sm">Нет экипированных предметов</p>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Инвентарь */}
                <Card>
                    <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                            <CardTitle className="text-base flex items-center space-x-2">
                                <Backpack className="h-4 w-4 text-blue-500" />
                                <span>Инвентарь ({backpackItems.length})</span>
                            </CardTitle>

                            {isEditing && (
                                <Button
                                    onClick={addNewItem}
                                    size="sm"
                                    className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                                >
                                    <Plus className="h-4 w-4 mr-2" />
                                    Добавить
                                </Button>
                            )}
                        </div>

                        {/* Фильтры */}
                        <div className="flex flex-wrap gap-2 mt-3">
                            <Input
                                placeholder="Поиск предметов..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="flex-1 h-8"
                            />

                            <select
                                value={filterType}
                                onChange={(e) => setFilterType(e.target.value as any)}
                                className="h-8 px-2 text-xs border border-input rounded bg-background"
                            >
                                <option value="all">Все типы</option>
                                {Object.entries(EQUIPMENT_TYPES).map(([key, type]) => (
                                    <option key={key} value={key}>{type.label}</option>
                                ))}
                            </select>
                        </div>
                    </CardHeader>

                    <CardContent>
                        {backpackItems.length > 0 ? (
                            <DragDropContext onDragEnd={handleDragEnd}>
                                <Droppable droppableId="inventory">
                                    {(provided) => (
                                        <div
                                            {...provided.droppableProps}
                                            ref={provided.innerRef}
                                            className="space-y-3 max-h-96 overflow-y-auto"
                                        >
                                            {filteredEquipment.filter(item => !item.equipped).map((item, index) => (
                                                <EquipmentItem
                                                    key={item.id}
                                                    item={item}
                                                    index={index}
                                                    isEditing={isEditing}
                                                    onToggleEquipped={() => handleToggleEquipped(item.id)}
                                                    onEdit={() => {/* TODO: Редактирование предмета */}}
                                                    onDelete={() => handleDeleteItem(item.id)}
                                                />
                                            ))}
                                            {provided.placeholder}
                                        </div>
                                    )}
                                </Droppable>
                            </DragDropContext>
                        ) : (
                            <div className="text-center py-8 text-muted-foreground">
                                <Backpack className="h-8 w-8 mx-auto mb-2 opacity-50" />
                                <p className="text-sm">Инвентарь пуст</p>
                                {isEditing && (
                                    <Button
                                        onClick={addNewItem}
                                        variant="outline"
                                        size="sm"
                                        className="mt-2"
                                    >
                                        <Plus className="h-4 w-4 mr-2" />
                                        Добавить первый предмет
                                    </Button>
                                )}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Боковая панель */}
            <div className="space-y-6">
                {/* Валюта */}
                <CurrencyManager
                    character={character}
                    isEditing={isEditing}
                    onUpdate={onUpdate}
                />

                {/* Статистика инвентаря */}
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-base">Статистика</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3 text-sm">
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Всего предметов:</span>
                            <span className="font-mono">{equipment.length}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Экипировано:</span>
                            <span className="font-mono">{equippedItems.length}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">В рюкзаке:</span>
                            <span className="font-mono">{backpackItems.length}</span>
                        </div>
                        <div className="flex justify-between border-t pt-2">
                            <span className="text-muted-foreground">Общая стоимость:</span>
                            <span className="font-mono text-amber-600">
                {equipment.reduce((total, item) => total + (item.value * item.quantity), 0)} зм
              </span>
                        </div>
                    </CardContent>
                </Card>

                {/* Быстрые фильтры */}
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-base">Фильтры</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                        {Object.entries(EQUIPMENT_TYPES).map(([key, type]) => {
                            const count = equipment.filter(item => item.type === key).length
                            return (
                                <Button
                                    key={key}
                                    variant={filterType === key ? "default" : "ghost"}
                                    size="sm"
                                    onClick={() => setFilterType(filterType === key ? 'all' : key as any)}
                                    className="w-full justify-between text-xs"
                                >
                                    <span>{type.label}</span>
                                    <Badge variant="secondary">{count}</Badge>
                                </Button>
                            )
                        })}
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}