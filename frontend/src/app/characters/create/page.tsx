'use client'

// frontend/src/app/characters/create/page.tsx
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { CharacterCreationForm } from '@/components/character/character-creation-form'
import {
    ArrowLeft,
    Crown,
    Sparkles,
    Users,
    Sword,
    BookOpen,
    Heart
} from 'lucide-react'
import { cn } from '@/lib/utils'

// Этапы создания персонажа
const CREATION_STEPS = [
    {
        id: 'basic',
        title: 'Основное',
        description: 'Имя и раса',
        icon: Users,
        color: 'text-blue-500'
    },
    {
        id: 'class',
        title: 'Класс',
        description: 'Профессия и роль',
        icon: Crown,
        color: 'text-purple-500'
    },
    {
        id: 'abilities',
        title: 'Характеристики',
        description: 'Сила, ловкость и др.',
        icon: Sparkles,
        color: 'text-amber-500'
    },
    {
        id: 'skills',
        title: 'Навыки',
        description: 'Умения и знания',
        icon: BookOpen,
        color: 'text-green-500'
    },
    {
        id: 'background',
        title: 'Предыстория',
        description: 'История и мотивация',
        icon: Sword,
        color: 'text-red-500'
    },
    {
        id: 'finalize',
        title: 'Завершение',
        description: 'Проверка и создание',
        icon: Heart,
        color: 'text-pink-500'
    }
]

export default function CharacterCreatePage() {
    const router = useRouter()
    const [currentStep, setCurrentStep] = useState(0)
    const [isCreating, setIsCreating] = useState(false)

    const currentStepData = CREATION_STEPS[currentStep]
    const progress = ((currentStep + 1) / CREATION_STEPS.length) * 100

    const handleStepChange = (stepIndex: number) => {
        if (stepIndex >= 0 && stepIndex < CREATION_STEPS.length) {
            setCurrentStep(stepIndex)
        }
    }

    const handleCharacterCreated = (characterId: string) => {
        // Переход к просмотру созданного персонажа
        router.push(`/characters/${characterId}`)
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-blue-50 dark:from-slate-950 dark:via-purple-950 dark:to-blue-950">
            <div className="container mx-auto px-4 py-8 max-w-6xl">
                {/* Заголовок */}
                <div className="mb-8">
                    <div className="flex items-center space-x-4 mb-6">
                        <Button
                            variant="ghost"
                            onClick={() => router.back()}
                            className="hover:bg-purple-100 dark:hover:bg-purple-900"
                        >
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            Назад
                        </Button>
                        <div>
                            <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                                Создание персонажа
                            </h1>
                            <p className="text-muted-foreground text-lg mt-2">
                                Создайте уникального героя для ваших приключений в D&D
                            </p>
                        </div>
                    </div>

                    {/* Прогресс */}
                    <div className="space-y-4">
                        <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-muted-foreground">
                Шаг {currentStep + 1} из {CREATION_STEPS.length}: {currentStepData.title}
              </span>
                            <span className="text-sm font-medium text-muted-foreground">
                {Math.round(progress)}% завершено
              </span>
                        </div>
                        <Progress value={progress} className="h-2" />
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                    {/* Боковая панель со этапами */}
                    <div className="lg:col-span-1">
                        <Card className="sticky top-8 bg-gradient-to-br from-white/80 to-white/60 dark:from-slate-800/80 dark:to-slate-900/60 backdrop-blur-sm border-0">
                            <CardHeader>
                                <CardTitle className="text-lg">Этапы создания</CardTitle>
                                <CardDescription>
                                    Следуйте пошагово для создания персонажа
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                {CREATION_STEPS.map((step, index) => {
                                    const Icon = step.icon
                                    const isActive = index === currentStep
                                    const isCompleted = index < currentStep
                                    const isAccessible = index <= currentStep

                                    return (
                                        <div
                                            key={step.id}
                                            className={cn(
                                                "flex items-center space-x-3 p-3 rounded-lg transition-all duration-200 cursor-pointer",
                                                isActive && "bg-purple-100 dark:bg-purple-900 border border-purple-200 dark:border-purple-800",
                                                isCompleted && !isActive && "bg-green-50 dark:bg-green-950",
                                                !isAccessible && "opacity-50 cursor-not-allowed",
                                                isAccessible && !isActive && "hover:bg-muted"
                                            )}
                                            onClick={() => isAccessible && handleStepChange(index)}
                                        >
                                            <div className={cn(
                                                "flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center",
                                                isActive && "bg-purple-600 text-white",
                                                isCompleted && !isActive && "bg-green-600 text-white",
                                                !isActive && !isCompleted && "bg-muted text-muted-foreground"
                                            )}>
                                                {isCompleted && !isActive ? (
                                                    <div className="w-4 h-4 bg-white rounded-full" />
                                                ) : (
                                                    <Icon className="h-4 w-4" />
                                                )}
                                            </div>

                                            <div className="flex-1 min-w-0">
                                                <p className={cn(
                                                    "text-sm font-medium",
                                                    isActive && "text-purple-900 dark:text-purple-100",
                                                    isCompleted && !isActive && "text-green-800 dark:text-green-200"
                                                )}>
                                                    {step.title}
                                                </p>
                                                <p className={cn(
                                                    "text-xs",
                                                    isActive && "text-purple-700 dark:text-purple-300",
                                                    isCompleted && !isActive && "text-green-600 dark:text-green-400",
                                                    !isActive && !isCompleted && "text-muted-foreground"
                                                )}>
                                                    {step.description}
                                                </p>
                                            </div>
                                        </div>
                                    )
                                })}
                            </CardContent>
                        </Card>
                    </div>

                    {/* Основная форма */}
                    <div className="lg:col-span-3">
                        <Card className="bg-gradient-to-br from-white/90 to-white/70 dark:from-slate-800/90 dark:to-slate-900/70 backdrop-blur-sm border-0 shadow-xl">
                            <CardHeader>
                                <div className="flex items-center space-x-3">
                                    <div className={cn(
                                        "w-10 h-10 rounded-lg flex items-center justify-center",
                                        "bg-gradient-to-br from-purple-500 to-blue-500 text-white"
                                    )}>
                                        <currentStepData.icon className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <CardTitle className="text-2xl">{currentStepData.title}</CardTitle>
                                        <CardDescription className="text-base">
                                            {currentStepData.description}
                                        </CardDescription>
                                    </div>
                                </div>
                            </CardHeader>

                            <CardContent>
                                <CharacterCreationForm
                                    currentStep={currentStep}
                                    onStepChange={handleStepChange}
                                    onCharacterCreated={handleCharacterCreated}
                                    isCreating={isCreating}
                                    setIsCreating={setIsCreating}
                                />
                            </CardContent>
                        </Card>
                    </div>
                </div>

                {/* Подсказки */}
                <Card className="mt-8 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30 border-amber-200 dark:border-amber-800">
                    <CardContent className="flex items-start space-x-4 p-6">
                        <div className="w-8 h-8 rounded-full bg-amber-500 flex items-center justify-center flex-shrink-0">
                            <Sparkles className="h-4 w-4 text-white" />
                        </div>
                        <div>
                            <h3 className="font-semibold text-amber-900 dark:text-amber-100 mb-2">
                                Советы по созданию персонажа
                            </h3>
                            <div className="text-sm text-amber-800 dark:text-amber-200 space-y-1">
                                <p>• <strong>Имя:</strong> Выберите имя, которое отражает характер и происхождение вашего героя</p>
                                <p>• <strong>Раса и класс:</strong> Подумайте о синергии между расовыми бонусами и требованиями класса</p>
                                <p>• <strong>Характеристики:</strong> Уделите внимание ключевым характеристикам для вашего класса</p>
                                <p>• <strong>Предыстория:</strong> Создайте интересную историю, которая мотивирует вашего персонажа</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}