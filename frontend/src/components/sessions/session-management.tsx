// frontend/src/components/sessions/session-management.tsx - завершение файла

onClick={() => {
    // Поделиться через Web Share API
    if (navigator.share) {
        navigator.share({
            title: `D&D сессия: ${selectedSession?.name}`,
            text: 'Присоединяйтесь к нашей игровой сессии D&D!',
            url: inviteLink
        }).catch(console.error)
    } else {
        // Fallback - копирование в буфер обмена
        copyToClipboard(inviteLink).then(() => {
            toast.success('Ссылка скопирована!')
        }).catch(() => {
            toast.error('Ошибка копирования')
        })
    }
}}
>
<Share className="h-4 w-4 mr-1" />
    Поделиться
    </Button>
</div>

{/* Дополнительные настройки приглашения */}
<div className="space-y-3 pt-3 border-t">
    <h4 className="text-sm font-medium">Настройки приглашения</h4>

    <div className="grid grid-cols-2 gap-3">
        <div>
            <label className="block text-xs text-muted-foreground mb-1">
                Срок действия
            </label>
            <select
                className="w-full text-sm border rounded px-2 py-1"
                value={inviteExpiry}
                onChange={(e) => setInviteExpiry(e.target.value)}
            >
                <option value="1h">1 час</option>
                <option value="24h">24 часа</option>
                <option value="7d">7 дней</option>
                <option value="30d">30 дней</option>
                <option value="never">Без ограничений</option>
            </select>
        </div>

        <div>
            <label className="block text-xs text-muted-foreground mb-1">
                Макс. использований
            </label>
            <select
                className="w-full text-sm border rounded px-2 py-1"
                value={inviteMaxUses}
                onChange={(e) => setInviteMaxUses(e.target.value)}
            >
                <option value="1">1 раз</option>
                <option value="5">5 раз</option>
                <option value="10">10 раз</option>
                <option value="unlimited">Без ограничений</option>
            </select>
        </div>
    </div>

    <Button
        variant="outline"
        size="sm"
        className="w-full"
        onClick={updateInviteSettings}
        disabled={updatingInvite}
    >
        {updatingInvite ? (
            <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Обновление...
            </>
        ) : (
            'Обновить настройки'
        )}
    </Button>
</div>
</div>
)}

{/* Список активных приглашений */}
{activeInvites.length > 0 && (
    <div className="space-y-3">
        <h4 className="text-sm font-medium">Активные приглашения</h4>

        <div className="space-y-2">
            {activeInvites.map((invite) => (
                <div key={invite.id} className="flex items-center justify-between p-2 border rounded">
                    <div className="flex-1 min-w-0">
                        <p className="text-xs font-mono truncate">
                            {invite.code}
                        </p>
                        <p className="text-xs text-muted-foreground">
                            Использовано: {invite.usedCount}/{invite.maxUses || '∞'}
                            {invite.expiresAt && (
                                <> • Истекает: {formatDistanceToNow(invite.expiresAt, {
                                    addSuffix: true,
                                    locale: ru
                                })}</>
                            )}
                        </p>
                    </div>

                    <div className="flex items-center gap-1">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => copyInviteLink(invite.code)}
                        >
                            <Copy className="h-3 w-3" />
                        </Button>

                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => revokeInvite(invite.id)}
                            className="text-red-600 hover:text-red-700"
                        >
                            <Trash2 className="h-3 w-3" />
                        </Button>
                    </div>
                </div>
            ))}
        </div>
    </div>
)}
</div>
</DialogContent>
</Dialog>
)
}

// Утилитарные функции
async function copyToClipboard(text: string): Promise<void> {
    if (navigator.clipboard) {
        return navigator.clipboard.writeText(text)
    } else {
        // Fallback для старых браузеров
        const textArea = document.createElement('textarea')
        textArea.value = text
        document.body.appendChild(textArea)
        textArea.select()
        document.execCommand('copy')
        document.body.removeChild(textArea)
        return Promise.resolve()
    }
}

export default SessionInviteDialog