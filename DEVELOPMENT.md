# Руководство по разработке

## 🎯 Текущее состояние проекта

### Последний завершенный этап: Система аутентификации
- Формы входа и регистрации
- Защита маршрутов через middleware
- Базовые UI компоненты

### Следующий этап: Dashboard и основные страницы

## 📋 План разработки (приоритеты)

### 1. Dashboard (Высокий приоритет)
```typescript
// Компоненты для создания:
- /src/app/dashboard/page.tsx
- /src/components/dashboard/stats-cards.tsx
- /src/components/dashboard/recent-sessions.tsx
- /src/components/dashboard/character-list.tsx
```

### 2. Создание персонажей (Высокий приоритет)
```typescript
// Компоненты для создания:
- /src/app/characters/create/page.tsx
- /src/components/character/character-creation-form.tsx
- /src/components/character/race-selector.tsx
- /src/components/character/class-selector.tsx
- /src/components/character/ability-scores.tsx
```

### 3. Игровой интерфейс (Средний приоритет)
```typescript
// Компоненты для создания:
- /src/app/game/[sessionId]/page.tsx
- /src/components/game/game-interface.tsx
- /src/components/game/chat-panel.tsx
- /src/components/game/dice-roller.tsx
```

## 🏗️ Архитектурные принципы

### Именования (ВАЖНО сохранить):
- **Stores**: `useAuthStore`, `useGameStore`
- **Services**: `apiClient`, `socketClient`
- **Hooks**: `useAuth`, `useSocket`
- **Components**: PascalCase с описательными именами

### Структура файлов:
```
src/
├── app/              # Next.js 14 App Router
├── components/       # Переиспользуемые компоненты
├── stores/          # Zustand stores
├── lib/             # Утилиты и сервисы
├── hooks/           # Кастомные хуки
├── types/           # TypeScript типы
└── styles/          # Стили
```

### API endpoints (сохранить):
- Auth: `/api/auth/*`
- Characters: `/api/characters/*`
- Sessions: `/api/sessions/*`
- Game Master: `/api/game-master/*`

## 🎨 UI/UX Стандарты

### Дизайн система:
- **Primary color**: Purple/Blue gradient
- **Accent**: Amber/Gold (fantasy theme)
- **Typography**: Inter (body), Cinzel (headings)
- **Icons**: Lucide React
- **Animations**: Framer Motion

### Компоненты:
- Используем созданные UI компоненты: `Button`, `Input`, `Card`
- Все формы с react-hook-form + zod валидацией
- Loading states обязательны
- Error handling через toast уведомления

## 📡 Backend интеграция

### Уже настроенные сервисы:
1. **AuthService**: JWT аутентификация
2. **CharacterService**: CRUD персонажей + D&D логика
3. **SessionService**: Игровые сессии + боевая система
4. **AIMasterService**: Ollama интеграция

### Socket.IO события (настроены):
- `game_action` - действия игроков
- `ai_response` - ответы ИИ мастера
- `dice_roll` - броски костей
- `chat_message` - сообщения чата

## 🔧 Настройки проекта

### Backend (.env):
```bash
# База данных
DATABASE_URL="postgresql://postgres:password@localhost:5432/dnd_ai_game"
REDIS_URL="redis://localhost:6379"

# Аутентификация
JWT_SECRET="your-super-secret-jwt-key"
JWT_EXPIRES_IN="7d"

# ИИ
OLLAMA_URL="http://localhost:11434"
OLLAMA_MODEL="qwen2.5:14b"

# Сервер
PORT=3001
NODE_ENV="development"
```

### Frontend (.env.local):
```bash
NEXT_PUBLIC_API_URL="http://localhost:3001/api"
NEXT_PUBLIC_SOCKET_URL="http://localhost:3001"
```

## 🚀 Команды запуска

### Разработка:
```bash
# Backend
cd backend && npm run dev

# Frontend
cd frontend && npm run dev

# Docker (все сервисы)
docker-compose up -d
```

### Установка зависимостей:
```bash
# Backend
cd backend && npm install

# Frontend  
cd frontend && npm install
```

## 📊 Текущие модули

### Backend модули:
1. **AuthModule** - полностью готов
2. **CharacterModule** - полностью готов
3. **SessionModule** - полностью готов
4. **AIMasterModule** - полностью готов

### Frontend stores:
1. **useAuthStore** - готов (login, register, logout)
2. **useGameStore** - готов (sessions, characters, real-time)

### Frontend компоненты:
1. **UI components** - готовы (Button, Input, Card)
2. **Auth forms** - готовы (LoginForm, RegisterForm)
3. **Layouts** - готовы (AuthLayout, RootLayout)

## 🎯 Следующие задачи

### 1. Dashboard страница:
- Статистика пользователя
- Список персонажей
- Активные сессии
- Быстрые действия

### 2. Character creation:
- Пошаговая форма создания
- Выбор расы и класса
- Распределение характеристик
- Предыстория и мотивация

### 3. Game interface:
- Основной игровой экран
- Чат с ИИ мастером
- Панель персонажа
- Система бросков костей

## ⚠️ Важные моменты

### Сохранить обязательно:
1. Все именования API endpoints
2. Структуру stores (AuthStore, GameStore)
3. Socket.IO события
4. TypeScript типы в `/types/index.ts`
5. Prisma схему базы данных

### НЕ изменять:
- Backend API структуру
- Socket.IO event names
- Store interface
- Existing component APIs

## 🔍 Debugging

### Полезные команды:
```bash
# Проверка API
curl http://localhost:3001/health

# Проверка Ollama
curl http://localhost:11434/api/tags

# Логи контейнеров
docker-compose logs -f
```

### Chrome DevTools:
- React DevTools для состояния
- Network tab для API запросов
- Console для Socket.IO событий

---

**Текущий checkpoint**: Завершена система аутентификации, готовы к разработке Dashboard