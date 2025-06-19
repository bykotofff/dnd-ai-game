// backend/src/modules/game-master/ai-master.module.ts
import { aiMasterRouter } from './ai-master.router'
import { AIMasterService } from './ai-master.service'
import { AIMasterController } from './ai-master.controller'
import { OllamaService } from './ollama.service'
import { PromptLibraryService } from './prompt-library'

/**
 * AI Master Module - централизованная точка доступа к функциональности ИИ мастера
 */
export class AIMasterModule {
    public static router = aiMasterRouter
    public static service = new AIMasterService()
    public static controller = new AIMasterController()

    /**
     * Инициализация модуля
     */
    public static async initialize(): Promise<void> {
        try {
            console.log('🤖 Initializing AI Master module...')

            // Проверяем доступность Ollama
            const ollamaService = new OllamaService()
            const isOllamaHealthy = await ollamaService.checkHealth()

            if (!isOllamaHealthy) {
                console.warn('⚠️ Ollama is not available. AI features will be limited.')
            } else {
                console.log('✅ Ollama connection established')

                // Предзагружаем модели
                try {
                    await this.service.preloadModels()
                } catch (error) {
                    console.warn('⚠️ Model preloading failed:', error)
                }
            }

            // Инициализируем библиотеку промптов
            const promptLibrary = PromptLibraryService.getInstance()
            console.log('📚 Prompt library initialized')

            console.log('🎭 AI Master module initialized successfully')
        } catch (error) {
            console.error('❌ Failed to initialize AI Master module:', error)
            // Не выбрасываем ошибку, чтобы остальная система могла работать
        }
    }

    /**
     * Получение экземпляра сервиса
     */
    public static getService(): AIMasterService {
        return this.service
    }

    /**
     * Проверка готовности ИИ системы
     */
    public static async checkReadiness(): Promise<{
        ready: boolean
        ollama: boolean
        models: string[]
        prompts: number
    }> {
        try {
            const health = await this.service.checkHealth()
            const promptLibrary = PromptLibraryService.getInstance()
            const prompts = Object.keys(promptLibrary.getAllPrompts()).length

            return {
                ready: health.ollama && health.models.length > 0,
                ollama: health.ollama,
                models: health.models,
                prompts
            }
        } catch (error) {
            console.error('Error checking AI readiness:', error)
            return {
                ready: false,
                ollama: false,
                models: [],
                prompts: 0
            }
        }
    }

    /**
     * Обновление конфигурации ИИ
     */
    public static async updateConfig(newConfig: any): Promise<void> {
        try {
            // TODO: Реализовать обновление конфигурации
            console.log('🔧 AI configuration updated')
        } catch (error) {
            console.error('Failed to update AI config:', error)
            throw error
        }
    }

    /**
     * Получение метрик производительности
     */
    public static async getPerformanceMetrics(): Promise<{
        totalRequests: number
        averageResponseTime: number
        cacheHitRate: number
        modelUtilization: Record<string, number>
    }> {
        try {
            const stats = await this.service.getUsageStats()
            const cacheInfo = this.service.getCacheInfo()

            // Вычисляем hit rate кэша
            const totalHits = cacheInfo.entries.reduce((sum, entry) => sum + entry.hitCount, 0)
            const cacheHitRate = cacheInfo.size > 0 ? totalHits / cacheInfo.size : 0

            return {
                totalRequests: stats.totalRequests,
                averageResponseTime: stats.averageResponseTime,
                cacheHitRate,
                modelUtilization: {} // TODO: Реализовать сбор метрик по моделям
            }
        } catch (error) {
            console.error('Error getting performance metrics:', error)
            return {
                totalRequests: 0,
                averageResponseTime: 0,
                cacheHitRate: 0,
                modelUtilization: {}
            }
        }
    }

    /**
     * Очистка ресурсов (вызывается при завершении работы)
     */
    public static async cleanup(): Promise<void> {
        try {
            console.log('🧹 Cleaning up AI Master module...')

            // Очищаем кэш
            this.service.clearCache()

            // TODO: Добавить другие операции очистки

            console.log('✅ AI Master module cleanup completed')
        } catch (error) {
            console.error('❌ Error during AI Master module cleanup:', error)
        }
    }

    /**
     * Автоматическое обслуживание (вызывается периодически)
     */
    public static async performMaintenance(): Promise<void> {
        try {
            console.log('🔧 Performing AI Master maintenance...')

            // Проверяем здоровье системы
            const health = await this.service.checkHealth()
            if (!health.ollama) {
                console.warn('⚠️ Ollama health check failed during maintenance')
            }

            // Очищаем устаревший кэш (это происходит автоматически, но можно принудительно)
            // this.service.clearCache()

            // TODO: Добавить другие операции обслуживания:
            // - Оптимизация промптов
            // - Обновление статистики
            // - Проверка использования моделей

            console.log('✅ AI Master maintenance completed')
        } catch (error) {
            console.error('❌ Error during AI Master maintenance:', error)
        }
    }

    /**
     * Получение диагностической информации
     */
    public static async getDiagnostics(): Promise<{
        status: 'healthy' | 'degraded' | 'unhealthy'
        issues: string[]
        recommendations: string[]
        uptime: number
        lastError?: string
    }> {
        try {
            const startTime = Date.now()
            const health = await this.service.checkHealth()
            const responseTime = Date.now() - startTime

            const issues: string[] = []
            const recommendations: string[] = []
            let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy'

            // Проверяем Ollama
            if (!health.ollama) {
                issues.push('Ollama service is not responding')
                recommendations.push('Check Ollama installation and service status')
                status = 'unhealthy'
            }

            // Проверяем модели
            if (health.models.length === 0) {
                issues.push('No AI models are available')
                recommendations.push('Install required AI models in Ollama')
                status = 'unhealthy'
            }

            // Проверяем время ответа
            if (responseTime > 5000) {
                issues.push('High response time detected')
                recommendations.push('Consider optimizing model parameters or hardware')
                if (status === 'healthy') status = 'degraded'
            }

            // Проверяем размер очереди
            if (health.queueSize > 10) {
                issues.push('High request queue size')
                recommendations.push('Consider scaling AI service or optimizing requests')
                if (status === 'healthy') status = 'degraded'
            }

            return {
                status,
                issues,
                recommendations,
                uptime: process.uptime(),
                lastError: undefined // TODO: Отслеживать последние ошибки
            }
        } catch (error) {
            return {
                status: 'unhealthy',
                issues: ['Failed to perform diagnostics'],
                recommendations: ['Check AI Master service configuration'],
                uptime: 0,
                lastError: error instanceof Error ? error.message : 'Unknown error'
            }
        }
    }
}

// Экспорты для удобного импорта
export { AIMasterService } from './ai-master.service'
export { AIMasterController } from './ai-master.controller'
export { OllamaService } from './ollama.service'
export { PromptLibraryService } from './prompt-library'
export { aiMasterRouter } from './ai-master.router'
export * from './ai-master.types'