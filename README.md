# D&D AI Game

Настольная ролевая игра Dungeons & Dragons с ИИ мастером игры на основе локального Ollama.

## 🎯 Описание проекта

Полноценная система для игры в D&D 5e с:
- ИИ мастером игры на основе Ollama
- Real-time мультиплеер через Socket.IO
- Полной системой персонажей D&D 5e
- Веб-интерфейсом на Next.js

## 🏗️ Архитектура

- **Backend**: Node.js + TypeScript + Express + Socket.IO + Prisma + PostgreSQL
- **Frontend**: Next.js 14 + TypeScript + Tailwind CSS + Zustand + React Query
- **ИИ**: Ollama (локальный) + русскоязычные промпты
- **База данных**: PostgreSQL + Redis (кэш)

## 📁 Структура проекта

```
dnd-ai-game/
├── backend/          # Node.js API сервер
├── frontend/         # Next.js веб-приложение
├── docs/            # Документация
└── docker-compose.yml
```

## 🚀 Текущий статус разработки

### ✅ Завершено:

#### Backend:
- [x] Модуль аутентификации (JWT, bcrypt)
- [x] Модуль персонажей (полная система D&D 5e)
- [x] Модуль игровых сессий (боевая система, инициатива)
- [x] Модуль ИИ мастера (Ollama интеграция)
- [x] Socket.IO для real-time коммуникации
- [x] Prisma схема базы данных
- [x] Система промптов для ИИ

#### Frontend:
- [x] Базовая настройка Next.js + TypeScript
- [x] Zustand stores для состояния
- [x] Socket.IO клиент
- [x] API клиент (Axios)
- [x] Система аутентификации (формы входа/регистрации)
- [x] Базовые UI компоненты
- [x] Middleware для защиты маршрутов

### 🔄 В разработке:
- [ ] Dashboard (главная страница)
- [ ] Создание персонажей
- [ ] Игровой интерфейс
- [ ] Система костей

## 🛠️ Установка и запуск

### Требования:
- Node.js 18+
- PostgreSQL 15+
- Redis 7+
- Ollama с моделью qwen2.5:14b

### Backend:
```bash
cd backend
npm install
cp .env.example .env
# Настройте переменные окружения
npm run db:migrate
npm run dev
```

### Frontend:
```bash
cd frontend
npm install
npm run dev
```

### Docker (рекомендуется):
```bash
docker-compose up -d
```

## 📚 API Endpoints

### Аутентификация:
- `POST /api/auth/login` - Вход
- `POST /api/auth/register` - Регистрация
- `GET /api/auth/profile` - Профиль пользователя

### Персонажи:
- `GET /api/characters` - Список персонажей
- `POST /api/characters` - Создание персонажа
- `GET /api/characters/:id` - Детали персонажа
- `PUT /api/characters/:id` - Обновление персонажа

### Игровые сессии:
- `GET /api/sessions` - Список сессий
- `POST /api/sessions` - Создание сессии
- `POST /api/sessions/:id/join` - Присоединение к сессии
- `POST /api/sessions/:id/combat/next-turn` - Следующий ход

### ИИ Мастер:
- `POST /api/game-master/process` - Обработка действия игрока
- `POST /api/game-master/scene` - Генерация сцены
- `POST /api/game-master/npc-dialogue` - Диалог NPC

## 🎮 Особенности игры

### D&D 5e Система:
- Полные правила 5-й редакции
- 9 рас персонажей
- 12 классов персонажей
- Система навыков и способностей
- Боевая система с инициативой

### ИИ Мастер:
- Ollama для локального ИИ
- Специализированные промпты на русском
- Генерация квестов и NPC
- Адаптивное повествование

### Мультиплеер:
- Real-time через Socket.IO
- Синхронизация действий
- Общий чат
- Система ходов в бою

## 🔧 Переменные окружения

### Backend (.env):
```
DATABASE_URL="postgresql://username:password@localhost:5432/dnd_ai_game"
REDIS_URL="redis://localhost:6379"
JWT_SECRET="your-secret-key"
OLLAMA_URL="http://localhost:11434"
OLLAMA_MODEL="qwen2.5:14b"
```

### Frontend (.env.local):
```
NEXT_PUBLIC_API_URL="http://localhost:3001/api"
NEXT_PUBLIC_SOCKET_URL="http://localhost:3001"
```

## 🧪 Тестирование

```bash
# Backend тесты
cd backend
npm run test

# Frontend тесты
cd frontend
npm run test
```

## 📖 Дополнительная документация

- [API Documentation](./docs/API.md)
- [Architecture Guide](./docs/ARCHITECTURE.md)
- [Development Guide](./docs/DEVELOPMENT.md)
- [Deployment Guide](./docs/DEPLOYMENT.md)

## 🤝 Вклад в проект

1. Форкните репозиторий
2. Создайте ветку для фичи
3. Внесите изменения
4. Создайте Pull Request

## 📝 Лицензия

MIT License - см. [LICENSE](LICENSE) файл

## 🔮 Планы развития

- [ ] Голосовое воспроизведение ответов ИИ
- [ ] Генерация изображений (Stable Diffusion)
- [ ] Мобильное приложение
- [ ] Marketplace для кастомных приключений
- [ ] Интеграция с D&D Beyond

---

**Текущий этап**: Завершена аутентификация, следующий шаг - Dashboard и создание персонажей