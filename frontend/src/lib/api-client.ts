// frontend/src/lib/api-client.ts
import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios'
import { ApiResponse } from '@/types'

class ApiClient {
    private client: AxiosInstance
    private token: string | null = null

    constructor() {
        this.client = axios.create({
            baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api',
            timeout: 10000,
            headers: {
                'Content-Type': 'application/json',
            },
        })

        this.setupInterceptors()
        this.loadTokenFromStorage()
    }

    private setupInterceptors(): void {
        // Request interceptor для добавления токена
        this.client.interceptors.request.use(
            (config) => {
                if (this.token) {
                    config.headers.Authorization = `Bearer ${this.token}`
                }
                return config
            },
            (error) => Promise.reject(error)
        )

        // Response interceptor для обработки ошибок
        this.client.interceptors.response.use(
            (response: AxiosResponse<ApiResponse>) => {
                return response
            },
            (error) => {
                if (error.response?.status === 401) {
                    this.removeToken()
                    // Перенаправляем на страницу входа
                    if (typeof window !== 'undefined') {
                        window.location.href = '/auth/login'
                    }
                }
                return Promise.reject(error)
            }
        )
    }

    private loadTokenFromStorage(): void {
        if (typeof window !== 'undefined') {
            this.token = localStorage.getItem('auth_token')
        }
    }

    public setToken(token: string): void {
        this.token = token
        if (typeof window !== 'undefined') {
            localStorage.setItem('auth_token', token)
        }
    }

    public removeToken(): void {
        this.token = null
        if (typeof window !== 'undefined') {
            localStorage.removeItem('auth_token')
        }
    }

    public getToken(): string | null {
        return this.token
    }

    // Базовые HTTP методы
    async get<T = any>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
        const response = await this.client.get<ApiResponse<T>>(url, config)
        return response.data
    }

    async post<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
        const response = await this.client.post<ApiResponse<T>>(url, data, config)
        return response.data
    }

    async put<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
        const response = await this.client.put<ApiResponse<T>>(url, data, config)
        return response.data
    }

    async delete<T = any>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
        const response = await this.client.delete<ApiResponse<T>>(url, config)
        return response.data
    }

    async patch<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
        const response = await this.client.patch<ApiResponse<T>>(url, data, config)
        return response.data
    }

    // Специализированные методы для загрузки файлов
    async uploadFile<T = any>(url: string, file: File, onProgress?: (progress: number) => void): Promise<ApiResponse<T>> {
        const formData = new FormData()
        formData.append('file', file)

        const config: AxiosRequestConfig = {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
            onUploadProgress: (progressEvent) => {
                if (onProgress && progressEvent.total) {
                    const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total)
                    onProgress(progress)
                }
            },
        }

        return this.post<T>(url, formData, config)
    }

    // Метод для загрузки данных с прогрессом
    async downloadFile(url: string, onProgress?: (progress: number) => void): Promise<Blob> {
        const response = await this.client.get(url, {
            responseType: 'blob',
            onDownloadProgress: (progressEvent) => {
                if (onProgress && progressEvent.total) {
                    const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total)
                    onProgress(progress)
                }
            },
        })
        return response.data
    }

    // Метод для отмены запросов
    createCancelToken() {
        return axios.CancelToken.source()
    }

    // Проверка статуса соединения
    async checkHealth(): Promise<boolean> {
        try {
            await this.get('/health')
            return true
        } catch {
            return false
        }
    }
}

// Создаем единственный экземпляр
export const apiClient = new ApiClient()

// Экспортируем также класс для тестирования
export default ApiClient