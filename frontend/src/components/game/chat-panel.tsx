// frontend/src/components/game/chat-panel.tsx
import { useState, useRef, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
    Send,
    MessageCircle,
    Users,
    Volume2,
    VolumeX,
    Hash,
    Lock,
    Eye
} from 'lucide-react'
import { useGameStore } from '@/stores/game-store'
import { useAuthStore } from '@/stores/auth-store'
import { cn } from '@/lib/utils'
import { formatDistanceToNow } from 'date-fns'
import { ru } from 'date-fns/locale'
import toast from 'react-hot-toast'

interface ChatMessage {
    id: string
    playerId: string
    playerName: string
    message: string
    type: 'ic' | 'ooc' | 'whisper' | 'system'
    timestamp: Date
    targetPlayerId?: string
}

type ChatMode = 'ic' | 'ooc' | 'whisper'

export function ChatPanel() {
    const [message, setMessage] = useState('')
    const [chatMode, setChatMode] = useState<ChatMode>('ic')
    const [isTyping, setIsTyping] = useState(false)
    const [showSystemMessages, setShowSystemMessages] = useState(true)

    const inputRef = useRef<HTMLInputElement>(null)
    const messagesEndRef = useRef<HTMLDivElement>(null)

    const { user } = useAuthStore()
    const {
        currentSession,
        chatMessages,
        connectedPlayers,
        sendChatMessage,
        isLoading
    } = useGameStore()

    // Автоскролл к последним сообщениям
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [chatMessages])

    // Фокус на поле ввода при смене режима
    useEffect(() => {
        if (inputRef.current) {
            inputRef.current.focus()
        }
    }, [chatMode])

    const handleSendMessage = async () => {
        if (!message.trim() || !currentSession || !user || isLoading) return

        try {
            await sendChatMessage({
                sessionId: currentSession.id,
                message: message.trim(),
                type: chatMode
            })

            setMessage('')
            toast.success('Сообщение отправлено')
        } catch (error) {
            console.error('Ошибка отправки сообщения:', error)
            toast.error('Ошибка отправки сообщения')
        }
    }

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            handleSendMessage()
        }
    }

    const getChatModeIcon = (mode: ChatMode) => {
        switch (mode) {
            case 'ic':
                return <MessageCircle className="h-4 w-4" />
            case 'ooc':
                return <Hash className="h-4 w-4" />
            case 'whisper':
                return <Lock className="h-4 w-4" />
        }
    }

    const getChatModeLabel = (mode: ChatMode) => {
        switch (mode) {
            case 'ic':
                return 'В персонаже'
            case 'ooc':
                return 'Вне персонажа'
            case 'whisper':
                return 'Шепот'
        }
    }

    const getChatModeColor = (mode: ChatMode) => {
        switch (mode) {
            case 'ic':
                return 'text-blue-400 border-blue-500'
            case 'ooc':
                return 'text-green-400 border-green-500'
            case 'whisper':
                return 'text-purple-400 border-purple-500'
        }
    }

    const getMessageStyle = (msg: ChatMessage) => {
        const isOwn = msg.playerId === user?.id

        switch (msg.type) {
            case 'ic':
                return cn(
                    "border-l-4 border-l-blue-500 bg-blue-50/5 p-3",
                    isOwn && "bg-blue-100/10"
                )
            case 'ooc':
                return cn(
                    "border-l-4 border-l-green-500 bg-green-50/5 p-3",
                    isOwn && "bg-green-100/10"
                )
            case 'whisper':
                return cn(
                    "border-l-4 border-l-purple-500 bg-purple-50/5 p-3",
                    isOwn && "bg-purple-100/10"
                )
            case 'system':
                return "bg-amber-50/5 border border-amber-500/20 p-3 rounded"
            default:
                return "p-3"
        }
    }

    const formatMessageTime = (timestamp: Date) => {
        return formatDistanceToNow(timestamp, { addSuffix: true, locale: ru })
    }

    const filteredMessages = showSystemMessages
        ? chatMessages
        : chatMessages.filter(msg => msg.type !== 'system')

    return (
        <div className="h-full flex flex-col">
            {/* Заголовок чата */}
            <CardHeader className="pb-3 border-b border-slate-700 space-y-3">
                <div className="flex items-center justify-between">
                    <CardTitle className="text-sm flex items-center space-x-2">
                        <MessageCircle className="h-4 w-4 text-blue-500" />
                        <span>Чат</span>
                    </CardTitle>

                    <div className="flex items-center space-x-2">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setShowSystemMessages(!showSystemMessages)}
                            className={cn(
                                "p-1",
                                showSystemMessages ? "text-amber-400" : "text-muted-foreground"
                            )}
                        >
                            <Eye className="h-4 w-4" />
                        </Button>

                        <Badge variant="outline" className="text-xs">
                            {connectedPlayers.length} онлайн
                        </Badge>
                    </div>
                </div>

                {/* Переключатель режимов чата */}
                <div className="flex space-x-1">
                    {(['ic', 'ooc', 'whisper'] as ChatMode[]).map((mode) => (
                        <Button
                            key={mode}
                            variant={chatMode === mode ? 'default' : 'ghost'}
                            size="sm"
                            onClick={() => setChatMode(mode)}
                            className={cn(
                                "flex-1 h-8 text-xs",
                                chatMode === mode && getChatModeColor(mode)
                            )}
                        >
                            {getChatModeIcon(mode)}
                            <span className="ml-1 hidden sm:inline">
                {getChatModeLabel(mode)}
              </span>
                        </Button>
                    ))}
                </div>
            </CardHeader>

            {/* Список сообщений */}
            <CardContent className="flex-1 p-0 overflow-hidden">
                <ScrollArea className="h-full">
                    <div className="p-3 space-y-3">
                        {filteredMessages.length === 0 ? (
                            <div className="text-center py-8">
                                <MessageCircle className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
                                <p className="text-sm text-muted-foreground">
                                    Пока нет сообщений
                                </p>
                                <p className="text-xs text-muted-foreground mt-1">
                                    Начните общение с другими игроками
                                </p>
                            </div>
                        ) : (
                            filteredMessages.map((msg) => (
                                <div key={msg.id} className={getMessageStyle(msg)}>
                                    <div className="flex items-start justify-between mb-1">
                                        <div className="flex items-center space-x-2">
                      <span className="text-sm font-medium">
                        {msg.playerName}
                      </span>

                                            {msg.type === 'whisper' && (
                                                <Badge variant="outline" className="text-xs text-purple-400 border-purple-500">
                                                    шепчет
                                                </Badge>
                                            )}

                                            {msg.type === 'system' && (
                                                <Badge variant="outline" className="text-xs text-amber-400 border-amber-500">
                                                    система
                                                </Badge>
                                            )}
                                        </div>

                                        <span className="text-xs text-muted-foreground">
                      {formatMessageTime(msg.timestamp)}
                    </span>
                                    </div>

                                    <p className="text-sm leading-relaxed break-words">
                                        {msg.message}
                                    </p>
                                </div>
                            ))
                        )}

                        <div ref={messagesEndRef} />
                    </div>
                </ScrollArea>
            </CardContent>

            {/* Поле ввода сообщения */}
            <div className="p-3 border-t border-slate-700 space-y-2">
                {/* Подсказка о режиме */}
                <div className="text-xs text-muted-foreground">
                    {chatMode === 'ic' && "💬 Сообщение от лица персонажа"}
                    {chatMode === 'ooc' && "🗣️ Сообщение вне персонажа"}
                    {chatMode === 'whisper' && "🤫 Приватное сообщение"}
                </div>

                {/* Поле ввода */}
                <div className="flex space-x-2">
                    <Input
                        ref={inputRef}
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder={
                            chatMode === 'ic'
                                ? "Скажите что-то в персонаже..."
                                : chatMode === 'ooc'
                                    ? "Напишите сообщение..."
                                    : "Шепните кому-то..."
                        }
                        className="flex-1 bg-slate-700/50 border-slate-600 text-white placeholder-slate-400"
                        disabled={isLoading}
                    />

                    <Button
                        onClick={handleSendMessage}
                        disabled={!message.trim() || isLoading}
                        size="sm"
                        className={cn(
                            "px-3",
                            chatMode === 'ic' && "bg-blue-600 hover:bg-blue-700",
                            chatMode === 'ooc' && "bg-green-600 hover:bg-green-700",
                            chatMode === 'whisper' && "bg-purple-600 hover:bg-purple-700"
                        )}
                    >
                        <Send className="h-4 w-4" />
                    </Button>
                </div>

                {/* Индикатор набора текста */}
                {isTyping && (
                    <div className="text-xs text-muted-foreground italic">
                        Кто-то печатает...
                    </div>
                )}
            </div>
        </div>
    )
}