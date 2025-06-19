// frontend/src/stores/game-store.ts
import { create } from 'zustand'
import { devtools, subscribeWithSelector } from 'zustand/middleware'
import {
    GameSession,
    Character,
    ActionLog,
    SessionPlayer,
    CombatState,
    WorldState,
    DiceRoll,
    AIResponse
} from '@/types'

interface GameState {
    // Сессия
    currentSession: GameSession | null
    sessionPlayers: SessionPlayer[]
    isConnected: boolean
    connectionStatus: 'disconnected' | 'connecting' | 'connected' | 'error'

    // Персонажи
    characters: Character[]
    selectedCharacter: Character | null

    // Игровой процесс
    actionLog: ActionLog[]
    combatState: CombatState | null
    worldState: WorldState | null

    // ИИ и коммуникация
    lastAIResponse: AIResponse | null
    pendingAIRequest: boolean

    // Кубики
    recentDiceRolls: DiceRoll[]

    // UI состояние
    activeTab: 'chat' | 'character' | 'inventory' | 'spells' | 'combat'
    sidebarCollapsed: boolean
    showDicePanel: boolean
}

interface GameActions {
    // Сессия
    setCurrentSession: (session: GameSession | null) => void
    setSessionPlayers: (players: SessionPlayer[]) => void
    updateSessionPlayer: (player: SessionPlayer) => void
    setConnectionStatus: (status: GameState['connectionStatus']) => void

    // Персонажи
    setCharacters: (characters: Character[]) => void
    setSelectedCharacter: (character: Character | null) => void
    updateCharacter: (character: Character) => void
    updateCharacterHP: (characterId: string, currentHP: number, temporaryHP?: number) => void

    // Игровой процесс
    addActionLog: (action: ActionLog) => void
    clearActionLog: () => void
    setCombatState: (state: CombatState | null) => void
    setWorldState: (state: WorldState) => void

    // ИИ
    setLastAIResponse: (response: AIResponse | null) => void
    setPendingAIRequest: (pending: boolean) => void

    // Кубики
    addDiceRoll: (roll: DiceRoll) => void
    clearDiceRolls: () => void

    // UI
    setActiveTab: (tab: GameState['activeTab']) => void
    toggleSidebar: () => void
    toggleDicePanel: () => void

    // Утилиты
    reset: () => void
    getCharacterById: (id: string) => Character | undefined
    getCurrentPlayerCharacter: () => Character | null
}

type GameStore = GameState & GameActions

const initialState: GameState = {
    currentSession: null,
    sessionPlayers: [],
    isConnected: false,
    connectionStatus: 'disconnected',
    characters: [],
    selectedCharacter: null,
    actionLog: [],
    combatState: null,
    worldState: null,
    lastAIResponse: null,
    pendingAIRequest: false,
    recentDiceRolls: [],
    activeTab: 'chat',
    sidebarCollapsed: false,
    showDicePanel: true
}

export const useGameStore = create<GameStore>()(
    devtools(
        subscribeWithSelector((set, get) => ({
            ...initialState,

            // Сессия
            setCurrentSession: (session) => {
                set({ currentSession: session })
                if (session) {
                    set({ worldState: session.worldState })
                }
            },

            setSessionPlayers: (players) => {
                set({ sessionPlayers: players })
            },

            updateSessionPlayer: (player) => {
                set((state) => ({
                    sessionPlayers: state.sessionPlayers.map((p) =>
                        p.id === player.id ? player : p
                    )
                }))
            },

            setConnectionStatus: (status) => {
                set({
                    connectionStatus: status,
                    isConnected: status === 'connected'
                })
            },

            // Персонажи
            setCharacters: (characters) => {
                set({ characters })
            },

            setSelectedCharacter: (character) => {
                set({ selectedCharacter: character })
            },

            updateCharacter: (character) => {
                set((state) => ({
                    characters: state.characters.map((c) =>
                        c.id === character.id ? character : c
                    ),
                    selectedCharacter: state.selectedCharacter?.id === character.id
                        ? character
                        : state.selectedCharacter
                }))
            },

            updateCharacterHP: (characterId, currentHP, temporaryHP = 0) => {
                set((state) => ({
                    characters: state.characters.map((c) =>
                        c.id === characterId
                            ? { ...c, currentHP, temporaryHP }
                            : c
                    ),
                    selectedCharacter: state.selectedCharacter?.id === characterId
                        ? { ...state.selectedCharacter, currentHP, temporaryHP }
                        : state.selectedCharacter
                }))
            },

            // Игровой процесс
            addActionLog: (action) => {
                set((state) => ({
                    actionLog: [action, ...state.actionLog].slice(0, 100) // Ограничиваем до 100 записей
                }))
            },

            clearActionLog: () => {
                set({ actionLog: [] })
            },

            setCombatState: (combatState) => {
                set({ combatState })
            },

            setWorldState: (worldState) => {
                set({ worldState })
            },

            // ИИ
            setLastAIResponse: (response) => {
                set({ lastAIResponse: response })
            },

            setPendingAIRequest: (pending) => {
                set({ pendingAIRequest: pending })
            },

            // Кубики
            addDiceRoll: (roll) => {
                set((state) => ({
                    recentDiceRolls: [roll, ...state.recentDiceRolls].slice(0, 20) // Последние 20 бросков
                }))
            },

            clearDiceRolls: () => {
                set({ recentDiceRolls: [] })
            },

            // UI
            setActiveTab: (tab) => {
                set({ activeTab: tab })
            },

            toggleSidebar: () => {
                set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed }))
            },

            toggleDicePanel: () => {
                set((state) => ({ showDicePanel: !state.showDicePanel }))
            },

            // Утилиты
            reset: () => {
                set(initialState)
            },

            getCharacterById: (id) => {
                return get().characters.find((c) => c.id === id)
            },

            getCurrentPlayerCharacter: () => {
                const { selectedCharacter, sessionPlayers, currentSession } = get()

                if (selectedCharacter) {
                    return selectedCharacter
                }

                // Пытаемся найти персонажа текущего игрока в сессии
                if (currentSession) {
                    const playerCharacter = sessionPlayers.find((p) => !p.isGameMaster)?.character
                    if (playerCharacter) {
                        const fullCharacter = get().characters.find((c) => c.id === playerCharacter.id)
                        return fullCharacter || null
                    }
                }

                return null
            }
        })),
        {
            name: 'game-store'
        }
    )
)

// Селекторы для оптимизации рендеринга
export const useCurrentSession = () => useGameStore((state) => state.currentSession)
export const useSelectedCharacter = () => useGameStore((state) => state.selectedCharacter)
export const useActionLog = () => useGameStore((state) => state.actionLog)
export const useCombatState = () => useGameStore((state) => state.combatState)
export const useConnectionStatus = () => useGameStore((state) => state.connectionStatus)
export const useRecentDiceRolls = () => useGameStore((state) => state.recentDiceRolls)
export const useActiveTab = () => useGameStore((state) => state.activeTab)