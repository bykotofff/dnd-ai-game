# Руководство по компонентам D&D AI Game

## 📚 Готовые UI компоненты

### Base UI (`/components/ui/`):
- `Button` - кнопки с вариантами стилей
- `Input` - поля ввода с ошибками
- `Card` - карточки контента
- `Badge` - значки и метки
- `Progress` - прогресс-бары
- `Slider` - ползунки
- `Checkbox` - чекбоксы
- `Textarea` - многострочный текст
- `Tabs` - вкладки навигации
- `ScrollArea` - прокручиваемые области
- `LoadingSpinner` - спиннер загрузки

### Character System (`/components/character/`):
✅ **Готовые:**
- `CharacterCreationForm` - создание персонажа
- `RaceSelector` - выбор расы с бонусами
- `ClassSelector` - выбор класса с синергией
- `AbilityScores` - распределение характеристик
- `SkillSelector` - выбор навыков
- `BackgroundCreator` - предыстория и мотивация
- `CharacterPreview` - предпросмотр
- `CharacterSheet` - основной лист
- `InventoryPanel` - инвентарь с drag&drop
- `CharacterPanel` - панель в игре

🔄 **В разработке:**
- `AbilityScoresPanel` - СЛЕДУЮЩИЙ
- `SkillsPanel` - СЛЕДУЮЩИЙ
- `SpellsPanel` - запланирован
- `FeaturesPanel` - запланирован
- `BackgroundPanel` - запланирован
- `LevelUpDialog` - запланирован

### Game System (`/components/game/`):
✅ **Готовые:**
- `GameInterface` - основной игровой экран
- `SceneDisplay` - отображение сцены и лога
- `ChatPanel` - чат с режимами IC/OOC/Whisper
- `DiceRoller` - система бросков костей
- `ActionLog` - журнал действий с фильтрами
- `CombatTracker` - трекер боя с инициативой

## 🎯 Паттерны именования

### Компоненты:
```typescript
// ✅ Правильно
export function CharacterSheet({ character, isEditing, onSave }: Props) {}
export function InventoryPanel({ character, onUpdate }: Props) {}

// ❌ Неправильно  
export function characterSheet() {}
export function inventory_panel() {}

Stores:

// ✅ Правильно
const { user, login } = useAuthStore()
const { characters, updateCharacter } = useGameStore()

// ❌ Неправильно
const { user, login } = useAuth()
const { characters, updateCharacter } = useGame()

API calls:

// ✅ Правильно
await apiClient.get('/characters')
await apiClient.post('/characters', data)

// ❌ Неправильно
await fetch('/api/characters')
await axios.post('/api/characters', data)