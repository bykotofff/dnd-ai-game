// backend/src/modules/game-master/prompt-library.ts
import { PromptTemplate, PromptLibrary } from './ai-master.types'

export class PromptLibraryService {
    private static instance: PromptLibraryService
    private prompts: PromptLibrary = {}

    constructor() {
        this.initializePrompts()
    }

    public static getInstance(): PromptLibraryService {
        if (!PromptLibraryService.instance) {
            PromptLibraryService.instance = new PromptLibraryService()
        }
        return PromptLibraryService.instance
    }

    /**
     * Инициализация библиотеки промптов
     */
    private initializePrompts(): void {
        // Основные промпты для русскоязычной игры
        this.prompts = {
            // Ответ на действие игрока
            player_action_response_ru: {
                id: 'player_action_response_ru',
                name: 'Ответ на действие игрока (РУ)',
                description: 'Обрабатывает действие игрока и генерирует ответ мастера',
                requestType: 'player_action_response',
                language: 'russian',
                variables: ['playerAction', 'characterName', 'currentScene', 'worldState', 'recentActions'],
                template: `Ты опытный мастер игры в D&D 5e. Ты ведёшь увлекательную игру на русском языке.

ТЕКУЩАЯ СИТУАЦИЯ:
Локация: {{currentLocation}}
Время: {{timeOfDay}}
Погода: {{weather}}
Сцена: {{currentScene}}

ПЕРСОНАЖ:
Имя: {{characterName}}
Класс: {{characterClass}}
Уровень: {{characterLevel}}
Текущее HP: {{currentHP}}/{{maxHP}}

ДЕЙСТВИЕ ИГРОКА:
{{playerAction}}

ПОСЛЕДНИЕ СОБЫТИЯ:
{{recentActions}}

ИНСТРУКЦИИ:
1. Отвечай ТОЛЬКО как мастер игры
2. Описывай результат действия живо и интересно
3. Задавай вопрос "Что ты делаешь?" в конце
4. НЕ предлагай варианты действий игроку
5. Если нужны броски костей - укажи это четко
6. Учитывай последствия действий игрока
7. Поддерживай атмосферу фэнтези
8. Пиши на русском языке

Ответ должен быть 2-4 предложения. Будь креативным и увлекательным!`
            },

            // Описание сцены
            scene_description_ru: {
                id: 'scene_description_ru',
                name: 'Описание сцены (РУ)',
                description: 'Создает атмосферное описание новой сцены или локации',
                requestType: 'scene_description',
                language: 'russian',
                variables: ['locationName', 'timeOfDay', 'weather', 'npcsPresent', 'questContext'],
                template: `Ты мастер игры D&D 5e. Создай живописное описание локации.

ЛОКАЦИЯ: {{locationName}}
ВРЕМЯ: {{timeOfDay}}
ПОГОДА: {{weather}}
NPC В ЛОКАЦИИ: {{npcsPresent}}
КОНТЕКСТ КВЕСТА: {{questContext}}

ИНСТРУКЦИИ:
1. Создай атмосферное описание в 3-5 предложений
2. Используй все пять чувств (зрение, слух, запах, осязание, вкус)
3. Добавь интересные детали, которые могут быть важны для игры
4. Упомяни присутствующих NPC естественным образом
5. Создай ощущение живого мира
6. Пиши на русском языке
7. Заверши вопросом "Что вы делаете?"

Пример хорошего описания:
"Ветхая таверна 'Шумная гарпия' наполнена дымом от камина и гулом разговоров. За стойкой полирует кружки пожилой трактирщик с седой бородой, время от времени поглядывая на незнакомца в темном плаще у дальнего стола. Запах жареного мяса смешивается с ароматом эля, а деревянный пол скрипит под ногами посетителей. Что вы делаете?"

Создай описание:`
            },

            // Диалог NPC
            npc_dialogue_ru: {
                id: 'npc_dialogue_ru',
                name: 'Диалог NPC (РУ)',
                description: 'Генерирует реплики и поведение неигровых персонажей',
                requestType: 'npc_dialogue',
                language: 'russian',
                variables: ['npcName', 'npcPersonality', 'playerMessage', 'relationship', 'questContext'],
                template: `Ты мастер игры D&D 5e. Озвучь реплику NPC в диалоге.

NPC: {{npcName}}
ЛИЧНОСТЬ: {{npcPersonality}}
ОТНОШЕНИЕ К ПАРТИИ: {{relationship}}
СООБЩЕНИЕ ИГРОКА: {{playerMessage}}
КОНТЕКСТ КВЕСТА: {{questContext}}

ИНСТРУКЦИИ:
1. Отвечай ТОЛЬКО словами NPC
2. Соблюдай личность и характер персонажа
3. Учитывай отношение к игрокам
4. Используй живую, естественную речь
5. Добавляй жесты и мимику в скобках
6. Не нарушай характер персонажа
7. Пиши на русском языке
8. Если это торговец - можешь упомянуть товары
9. Если это квестодатель - развивай квест

Примеры хорошего диалога:
"(прищуривается) Так-так, еще одни искатели приключений... (вытирает руки о фартук) Что вам нужно в моей таверне?"

"(нервно озирается) Тише! Стены имеют уши... (наклоняется ближе) То, что вы ищете, находится в старых руинах к северу от города."

Ответ NPC:`
            },

            // Боевое повествование
            combat_narration_ru: {
                id: 'combat_narration_ru',
                name: 'Боевое повествование (РУ)',
                description: 'Описывает события в бою динамично и увлекательно',
                requestType: 'combat_narration',
                language: 'russian',
                variables: ['combatAction', 'attackRoll', 'damage', 'targetName', 'weaponUsed'],
                template: `Ты мастер игры D&D 5e. Опиши результат боевого действия ярко и динамично.

ДЕЙСТВИЕ: {{combatAction}}
БРОСОК АТАКИ: {{attackRoll}}
УРОН: {{damage}}
ЦЕЛЬ: {{targetName}}
ОРУЖИЕ: {{weaponUsed}}

ИНСТРУКЦИИ:
1. Описывай действие кинематографично
2. Если попадание - опиши удар детально
3. Если промах - объясни почему атака не прошла
4. Используй динамичные глаголы
5. Учитывай тип оружия и урона
6. Добавляй звуковые эффекты
7. Пиши на русском языке
8. 1-2 предложения максимум

Примеры:
ПОПАДАНИЕ: "Ваш клинок со свистом рассекает воздух и находит щель в доспехах орка, заставляя его взвыть от боли!"
ПРОМАХ: "Гоблин ловко уворачивается, и ваша стрела вонзается в деревянный щит за его спиной со звонким ТУНК!"

Опиши результат:`
            },

            // Генерация квеста
            quest_generation_ru: {
                id: 'quest_generation_ru',
                name: 'Генерация квеста (РУ)',
                description: 'Создает новые квесты и задания для игроков',
                requestType: 'quest_generation',
                language: 'russian',
                variables: ['questType', 'partyLevel', 'currentLocation', 'questGiver', 'worldEvents'],
                template: `Ты мастер игры D&D 5e. Создай интересный квест для партии.

ТИП КВЕСТА: {{questType}}
УРОВЕНЬ ПАРТИИ: {{partyLevel}}
ЛОКАЦИЯ: {{currentLocation}}
КВЕСТОДАТЕЛЬ: {{questGiver}}
СОБЫТИЯ В МИРЕ: {{worldEvents}}

ИНСТРУКЦИИ:
1. Создай цепляющий заголовок квеста
2. Опиши проблему или ситуацию
3. Укажи ясную цель
4. Добавь 2-3 подзадачи
5. Предложи интересную награду
6. Учитывай уровень сложности
7. Пиши на русском языке
8. Добавь элемент интриги или неожиданности

ФОРМАТ ОТВЕТА:
НАЗВАНИЕ: [название квеста]
ОПИСАНИЕ: [описание проблемы в 2-3 предложениях]
ЦЕЛЬ: [главная цель квеста]
ЗАДАЧИ:
- [подзадача 1]
- [подзадача 2] 
- [подзадача 3]
НАГРАДА: [награда за выполнение]
ОСОБЕННОСТИ: [интересная деталь или поворот]

Создай квест:`
            },

            // Развитие сюжета
            story_progression_ru: {
                id: 'story_progression_ru',
                name: 'Развитие сюжета (РУ)',
                description: 'Развивает основную сюжетную линию',
                requestType: 'story_progression',
                language: 'russian',
                variables: ['mainPlot', 'playerChoices', 'completedQuests', 'worldState', 'sessionGoal'],
                template: `Ты мастер игры D&D 5e. Продвинь основной сюжет кампании.

ОСНОВНОЙ СЮЖЕТ: {{mainPlot}}
ВЫБОРЫ ИГРОКОВ: {{playerChoices}}
ВЫПОЛНЕННЫЕ КВЕСТЫ: {{completedQuests}}
СОСТОЯНИЕ МИРА: {{worldState}}
ЦЕЛЬ СЕССИИ: {{sessionGoal}}

ИНСТРУКЦИИ:
1. Логично развивай сюжет на основе действий игроков
2. Создавай последствия их выборов
3. Вводи новые элементы и персонажей
4. Поддерживай интригу и напряжение
5. Связывай события воедино
6. Пиши на русском языке
7. Предлагай новые повороты сюжета
8. Учитывай глобальные события мира

Опиши развитие сюжета в 3-4 предложениях:`
            },

            // Создание мира
            world_building_ru: {
                id: 'world_building_ru',
                name: 'Создание мира (РУ)',
                description: 'Генерирует элементы игрового мира',
                requestType: 'world_building',
                language: 'russian',
                variables: ['elementType', 'theme', 'existingLore', 'culturalContext'],
                template: `Ты мастер игры D&D 5e. Создай элемент игрового мира.

ЭЛЕМЕНТ: {{elementType}} (город, деревня, подземелье, организация, традиция)
ТЕМА: {{theme}}
СУЩЕСТВУЮЩАЯ ИСТОРИЯ: {{existingLore}}
КУЛЬТУРНЫЙ КОНТЕКСТ: {{culturalContext}}

ИНСТРУКЦИИ:
1. Создавай элемент с богатой историей
2. Добавляй интересные детали и особенности
3. Продумывай связи с другими элементами мира
4. Включай потенциал для приключений
5. Делай элемент запоминающимся
6. Пиши на русском языке
7. Учитывай реализм в рамках фэнтези
8. Добавляй культурную глубину

Опиши элемент мира:`
            },

            // Случайная встреча
            random_encounter_ru: {
                id: 'random_encounter_ru',
                name: 'Случайная встреча (РУ)',
                description: 'Генерирует случайные события и встречи',
                requestType: 'random_encounter',
                language: 'russian',
                variables: ['environment', 'partyLevel', 'timeOfDay', 'weather', 'travelDistance'],
                template: `Ты мастер игры D&D 5e. Создай случайную встречу для путешествующих героев.

ОКРУЖЕНИЕ: {{environment}}
УРОВЕНЬ ПАРТИИ: {{partyLevel}}
ВРЕМЯ: {{timeOfDay}}
ПОГОДА: {{weather}}
РАССТОЯНИЕ ПУТЕШЕСТВИЯ: {{travelDistance}}

ИНСТРУКЦИИ:
1. Создай интересную, но не обязательно боевую встречу
2. Учитывай окружение и условия
3. Добавь возможности для ролевой игры
4. Соблюдай баланс сложности
5. Делай встречу запоминающейся
6. Пиши на русском языке
7. Добавь варианты развития событий
8. Включай местный колорит

ВАРИАНТЫ ВСТРЕЧ:
- Мирные NPC с проблемой
- Интересные локации
- Природные явления
- Торговцы или путешественники
- Следы загадочных событий
- Раненые существа
- Препятствия на пути

Опиши встречу:`
            }
        }
    }

    /**
     * Получение промпта по ID
     */
    getPrompt(id: string): PromptTemplate | null {
        return this.prompts[id] || null
    }

    /**
     * Получение промпта по типу запроса и языку
     */
    getPromptByType(requestType: string, language: 'russian' | 'english' = 'russian'): PromptTemplate | null {
        const promptId = `${requestType}_${language === 'russian' ? 'ru' : 'en'}`
        return this.getPrompt(promptId)
    }

    /**
     * Получение всех промптов
     */
    getAllPrompts(): PromptLibrary {
        return { ...this.prompts }
    }

    /**
     * Добавление нового промпта
     */
    addPrompt(prompt: PromptTemplate): void {
        this.prompts[prompt.id] = prompt
    }

    /**
     * Обновление промпта
     */
    updatePrompt(id: string, updates: Partial<PromptTemplate>): boolean {
        if (this.prompts[id]) {
            this.prompts[id] = { ...this.prompts[id], ...updates }
            return true
        }
        return false
    }

    /**
     * Удаление промпта
     */
    deletePrompt(id: string): boolean {
        if (this.prompts[id]) {
            delete this.prompts[id]
            return true
        }
        return false
    }

    /**
     * Замена переменных в шаблоне
     */
    renderPrompt(templateId: string, variables: Record<string, any>): string {
        const template = this.getPrompt(templateId)
        if (!template) {
            throw new Error(`Template ${templateId} not found`)
        }

        let rendered = template.template

        // Заменяем переменные в формате {{variableName}}
        for (const [key, value] of Object.entries(variables)) {
            const regex = new RegExp(`{{${key}}}`, 'g')
            rendered = rendered.replace(regex, String(value || ''))
        }

        // Удаляем незамененные переменные
        rendered = rendered.replace(/{{[^}]+}}/g, '')

        return rendered
    }

    /**
     * Валидация шаблона
     */
    validateTemplate(template: PromptTemplate): string[] {
        const errors: string[] = []

        if (!template.id) errors.push('ID обязателен')
        if (!template.name) errors.push('Название обязательно')
        if (!template.template) errors.push('Шаблон обязателен')
        if (!template.requestType) errors.push('Тип запроса обязателен')
        if (!template.language) errors.push('Язык обязателен')

        // Проверяем переменные в шаблоне
        const templateVars = template.template.match(/{{([^}]+)}}/g)
        if (templateVars) {
            const extractedVars = templateVars.map(v => v.replace(/[{}]/g, ''))
            const missingVars = extractedVars.filter(v => !template.variables.includes(v))
            if (missingVars.length > 0) {
                errors.push(`Необъявленные переменные: ${missingVars.join(', ')}`)
            }
        }

        return errors
    }

    /**
     * Экспорт промптов в JSON
     */
    exportPrompts(): string {
        return JSON.stringify(this.prompts, null, 2)
    }

    /**
     * Импорт промптов из JSON
     */
    importPrompts(jsonData: string): boolean {
        try {
            const imported = JSON.parse(jsonData)

            // Валидируем каждый промпт
            for (const [id, prompt] of Object.entries(imported)) {
                const errors = this.validateTemplate(prompt as PromptTemplate)
                if (errors.length > 0) {
                    console.error(`Ошибки в промпте ${id}:`, errors)
                    return false
                }
            }

            this.prompts = { ...this.prompts, ...imported }
            return true
        } catch (error) {
            console.error('Ошибка импорта промптов:', error)
            return false
        }
    }
}