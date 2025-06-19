'use client'

// frontend/src/components/character/character-creation-form.tsx
import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { RaceSelector } from './race-selector'
import { ClassSelector } from './class-selector'
import { AbilityScores } from './ability-scores'
import { SkillSelector } from './skill-selector'
import { BackgroundCreator } from './background-creator'
import { CharacterPreview } from './character-preview'
import { useGameStore } from '@/stores/game-store'
import { apiClient } from '@/lib/api-client'
import { AbilityScores as AbilityScoresType, Character } from '@/types'
import { ArrowLeft, ArrowRight, Wand2, Save } from 'lucide-react'
import toast from 'react-hot-toast'

// Схема валидации для создания персонажа
const characterCreationSchema = z.object({
    name: z
        .string()
        .min(1, 'Имя персонажа обязательно')
        .min(2, 'Имя должно содержать минимум 2 символа')
        .max(50, 'Имя не может быть длиннее 50 символов')
        .regex(/^[a-zA-Zа-яА-Я\s'-]+$/, 'Имя может содержать только буквы, пробелы, апострофы и дефисы'),

    race: z
        .string()
        .min(1, 'Выберите расу персонажа'),

    class: z
        .string()
        .min(1, 'Выберите класс персонажа'),

    abilityScores: z.object({
        strength: z.number().min(8).max(18),
        dexterity: z.number().min(8).max(18),
        constitution: z.number().min(8).max(18),
        intelligence: z.number().min(8).max(18),
        wisdom: z.number().min(8).max(18),
        charisma: z.number().min(8).max(18)
    }),

    selectedSkills: z
        .array(z.string())
        .min(2, 'Выберите минимум 2 навыка'),

    alignment: z
        .string()
        .min(1, 'Выберите мировоззрение'),

    backstory: z
        .string()
        .min(10, 'Предыстория должна содержать минимум 10 символов')
        .max(1000, 'Предыстория не может быть длиннее 1000 символов'),

    motivation: z
        .string()
        .min(10, 'Мотивация должна содержать минимум 10 символов')
        .max(500, 'Мотивация не может быть длиннее 500 символов'),

    personalityTraits: z.object({
        traits: z.array(z.string()).optional(),
        ideals: z.array(z.string()).optional(),
        bonds: z.array(z.string()).optional(),
        flaws: z.array(z.string()).optional()
    }).optional()
})

type CharacterCreationData = z.infer<typeof characterCreationSchema>

interface CharacterCreationFormProps {
    currentStep: number
    onStepChange: (step: number) => void
    onCharacterCreated: (characterId: string) => void
    isCreating: boolean
    setIsCreating: (creating: boolean) => void
}

// Начальные значения формы
const defaultValues: Partial<CharacterCreationData> = {
    name: '',
    race: '',
    class: '',
    abilityScores: {
        strength: 10,
        dexterity: 10,
        constitution: 10,
        intelligence: 10,
        wisdom: 10,
        charisma: 10
    },
    selectedSkills: [],
    alignment: '',
    backstory: '',
    motivation: '',
    personalityTraits: {
        traits: [],
        ideals: [],
        bonds: [],
        flaws: []
    }
}

export function CharacterCreationForm({
                                          currentStep,
                                          onStepChange,
                                          onCharacterCreated,
                                          isCreating,
                                          setIsCreating
                                      }: CharacterCreationFormProps) {
    const { addCharacter } = useGameStore()
    const [availableRaces, setAvailableRaces] = useState<any[]>([])
    const [availableClasses, setAvailableClasses] = useState<any[]>([])
    const [isGeneratingAbilities, setIsGeneratingAbilities] = useState(false)

    const {
        register,
        handleSubmit,
        watch,
        setValue,
        getValues,
        formState: { errors, isValid },
        trigger
    } = useForm<CharacterCreationData>({
        resolver: zodResolver(characterCreationSchema),
        defaultValues,
        mode: 'onChange'
    })

    // Отслеживаем изменения формы
    const watchedValues = watch()

    // Загружаем доступные расы и классы
    useEffect(() => {
        const loadCharacterOptions = async () => {
            try {
                const [racesResponse, classesResponse] = await Promise.all([
                    apiClient.get('/characters/races'),
                    apiClient.get('/characters/classes')
                ])

                if (racesResponse.success) {
                    setAvailableRaces(racesResponse.data)
                }
                if (classesResponse.success) {
                    setAvailableClasses(classesResponse.data)
                }
            } catch (error) {
                console.error('Ошибка загрузки опций персонажа:', error)
                toast.error('Ошибка загрузки данных')
            }
        }

        loadCharacterOptions()
    }, [])

    // Генерация случайных характеристик
    const generateRandomAbilities = async () => {
        try {
            setIsGeneratingAbilities(true)
            const response = await apiClient.get('/characters/generate-stats')

            if (response.success && response.data) {
                setValue('abilityScores', response.data)
                toast.success('Характеристики сгенерированы!')
            }
        } catch (error) {
            console.error('Ошибка генерации характеристик:', error)
            toast.error('Ошибка генерации характеристик')
        } finally {
            setIsGeneratingAbilities(false)
        }
    }

    // Переход к следующему шагу
    const handleNextStep = async () => {
        const stepFields = getStepFields(currentStep)
        const isStepValid = await trigger(stepFields as any)

        if (isStepValid && currentStep < 5) {
            onStepChange(currentStep + 1)
        }
    }

    // Переход к предыдущему шагу
    const handlePrevStep = () => {
        if (currentStep > 0) {
            onStepChange(currentStep - 1)
        }
    }

    // Создание персонажа
    const onSubmit = async (data: CharacterCreationData) => {
        try {
            setIsCreating(true)

            const response = await apiClient.post<Character>('/characters', data)

            if (response.success && response.data) {
                addCharacter(response.data)
                toast.success('Персонаж успешно создан!')
                onCharacterCreated(response.data.id)
            } else {
                throw new Error(response.error || 'Ошибка создания персонажа')
            }
        } catch (error: any) {
            console.error('Ошибка создания персонажа:', error)
            toast.error(error.message || 'Ошибка создания персонажа')
        } finally {
            setIsCreating(false)
        }
    }

    // Получение полей для валидации на каждом шаге
    const getStepFields = (step: number): (keyof CharacterCreationData)[] => {
        switch (step) {
            case 0: return ['name', 'race']
            case 1: return ['class']
            case 2: return ['abilityScores']
            case 3: return ['selectedSkills']
            case 4: return ['alignment', 'backstory', 'motivation']
            case 5: return [] // Финальный шаг - только просмотр
            default: return []
        }
    }

    // Проверка, можно ли перейти к следующему шагу
    const canProceedToNext = () => {
        const stepFields = getStepFields(currentStep)
        return stepFields.every(field => {
            const value = getValues(field)
            return value !== undefined && value !== '' && value !== null
        })
    }

    return (
        <div className="space-y-6">
            <form onSubmit={handleSubmit(onSubmit)}>
                {/* Шаг 0: Основная информация */}
                {currentStep === 0 && (
                    <div className="space-y-6">
                        <div>
                            <label className="block text-sm font-medium mb-2">
                                Имя персонажа
                            </label>
                            <Input
                                {...register('name')}
                                placeholder="Введите имя вашего героя"
                                error={errors.name?.message}
                                autoFocus
                            />
                        </div>

                        <RaceSelector
                            races={availableRaces}
                            selectedRace={watchedValues.race}
                            onRaceChange={(race) => setValue('race', race)}
                            error={errors.race?.message}
                        />
                    </div>
                )}

                {/* Шаг 1: Выбор класса */}
                {currentStep === 1 && (
                    <ClassSelector
                        classes={availableClasses}
                        selectedClass={watchedValues.class}
                        selectedRace={watchedValues.race}
                        onClassChange={(classType) => setValue('class', classType)}
                        error={errors.class?.message}
                    />
                )}

                {/* Шаг 2: Характеристики */}
                {currentStep === 2 && (
                    <div className="space-y-6">
                        <div className="flex justify-between items-center">
                            <h3 className="text-lg font-semibold">Распределите характеристики</h3>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={generateRandomAbilities}
                                disabled={isGeneratingAbilities}
                                className="ml-auto"
                            >
                                <Wand2 className="h-4 w-4 mr-2" />
                                {isGeneratingAbilities ? 'Генерация...' : 'Случайно'}
                            </Button>
                        </div>

                        <AbilityScores
                            scores={watchedValues.abilityScores || defaultValues.abilityScores!}
                            onScoresChange={(scores) => setValue('abilityScores', scores)}
                            selectedRace={watchedValues.race}
                            selectedClass={watchedValues.class}
                            error={errors.abilityScores?.message}
                        />
                    </div>
                )}

                {/* Шаг 3: Навыки */}
                {currentStep === 3 && (
                    <SkillSelector
                        selectedClass={watchedValues.class}
                        selectedSkills={watchedValues.selectedSkills || []}
                        onSkillsChange={(skills) => setValue('selectedSkills', skills)}
                        error={errors.selectedSkills?.message}
                    />
                )}

                {/* Шаг 4: Предыстория */}
                {currentStep === 4 && (
                    <BackgroundCreator
                        race={watchedValues.race}
                        characterClass={watchedValues.class}
                        alignment={watchedValues.alignment}
                        backstory={watchedValues.backstory}
                        motivation={watchedValues.motivation}
                        personalityTraits={watchedValues.personalityTraits}
                        onAlignmentChange={(alignment) => setValue('alignment', alignment)}
                        onBackstoryChange={(backstory) => setValue('backstory', backstory)}
                        onMotivationChange={(motivation) => setValue('motivation', motivation)}
                        onPersonalityChange={(traits) => setValue('personalityTraits', traits)}
                        errors={{
                            alignment: errors.alignment?.message,
                            backstory: errors.backstory?.message,
                            motivation: errors.motivation?.message
                        }}
                        register={register}
                    />
                )}

                {/* Шаг 5: Предпросмотр и создание */}
                {currentStep === 5 && (
                    <CharacterPreview
                        characterData={watchedValues}
                        onEdit={(step) => onStepChange(step)}
                    />
                )}

                {/* Кнопки навигации */}
                <div className="flex justify-between pt-6 border-t">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={handlePrevStep}
                        disabled={currentStep === 0}
                    >
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Назад
                    </Button>

                    <div className="flex space-x-3">
                        {currentStep < 5 ? (
                            <Button
                                type="button"
                                onClick={handleNextStep}
                                disabled={!canProceedToNext()}
                                className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                            >
                                Далее
                                <ArrowRight className="h-4 w-4 ml-2" />
                            </Button>
                        ) : (
                            <Button
                                type="submit"
                                disabled={isCreating || !isValid}
                                className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
                            >
                                <Save className="h-4 w-4 mr-2" />
                                {isCreating ? 'Создание...' : 'Создать персонажа'}
                            </Button>
                        )}
                    </div>
                </div>
            </form>
        </div>
    )
}