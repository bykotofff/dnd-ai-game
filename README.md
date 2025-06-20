# 🏰 D&D AI Game

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-18-blue.svg)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue.svg)](https://www.typescriptlang.org/)
[![Docker](https://img.shields.io/badge/Docker-Ready-blue.svg)](https://www.docker.com/)

**Полноценная система для игры в Dungeons & Dragons 5e с ИИ мастером игры на основе локального Ollama.**

## 🎯 О проекте

D&D AI Game - это современная веб-платформа для настольных ролевых игр, которая объединяет классическую механику D&D 5e с возможностями искусственного интеллекта. Система позволяет играть как с живым мастером игры, так и с ИИ-помощником, обеспечивая захватывающий игровой опыт для одиночной игры или групп до 8 игроков.

### ✨ Ключевые особенности

- 🤖 **ИИ Мастер игры** на основе Ollama с русскоязычными промптами
- ⚔️ **Полная система D&D 5e** с автоматизированными механиками
- 🌐 **Real-time мультиплеер** через Socket.IO
- 🎲 **Продвинутая система костей** с групповыми и составными бросками
- ⚡ **Автоматизированный бой** с расчетом попаданий и областными эффектами
- 📊 **Управление персонажами** с полными листами характеристик
- 🎮 **Система сессий** с приглашениями по ссылкам
- 🖼️ **Генерация изображений** через Stable Diffusion (опционально)

---

## 🚀 Быстрый старт

### Предварительные требования

- **Node.js** 18+ и npm
- **Docker** и Docker Compose
- **Git**
- Минимум **8GB RAM** (для ИИ модели)
- **Windows 10/11**, **macOS**, или **Linux**

### Установка через Docker (Рекомендуется)

```bash
# Клонирование репозитория
git clone https://github.com/bykotofff/dnd-ai-game.git
cd dnd-ai-game

# Запуск инфраструктуры
docker-compose up -d

# Ожидание загрузки модели ИИ (5-10 минут)
docker exec -it dnd-ai-game-ollama-1 ollama pull qwen2.5:14b

# Установка зависимостей и запуск
cd backend && npm install && npm run dev &
cd frontend && npm install && npm run dev
```

**Приложение будет доступно по адресу:** http://localhost:3000

### Ручная установка

<details>
<summary>Показать инструкции по ручной установке</summary>

#### 1. Настройка базы данных

```bash
# PostgreSQL
createdb dnd_ai_game

# Redis
redis-server
```

#### 2. Настройка Ollama

```bash
# Установка Ollama
curl -fsSL https://ollama.ai/install.sh | sh

# Загрузка модели
ollama pull qwen2.5:14b
```

#### 3. Настройка Backend

```bash
cd backend

# Установка зависимостей
npm install

# Настройка переменных окружения
cp .env.example .env
# Отредактируйте .env файл

# Инициализация базы данных
npx prisma db push
npx prisma generate

# Запуск сервера
npm run dev
```

#### 4. Настройка Frontend

```bash
cd frontend

# Установка зависимостей
npm install

# Настройка переменных окружения
cp .env.example .env.local
# Отредактируйте .env.local файл

# Запуск приложения
npm run dev
```

</details>

---

## 🏗️ Архитектура проекта

```
dnd-ai-game/
├── 📁 backend/              # Node.js API сервер
│   ├── 📁 src/
│   │   ├── 📁 modules/      # Модули приложения
│   │   │   ├── auth/        # Аутентификация
│   │   │   ├── characters/  # Управление персонажами
│   │   │   ├── sessions/    # Игровые сессии
│   │   │   └── ai-master/   # ИИ мастер игры
│   │   ├── 📁 shared/       # Общие утилиты
│   │   └── 📁 database/     # Конфигурация БД
│   ├── 📁 prisma/           # Схема базы данных
│   └── package.json
├── 📁 frontend/             # Next.js веб-приложение
│   ├── 📁 src/
│   │   ├── 📁 app/          # Next.js App Router
│   │   ├── 📁 components/   # React компоненты
│   │   │   ├── auth/        # Аутентификация
│   │   │   ├── character/   # Персонажи
│   │   │   ├── dice/        # Система костей
│   │   │   ├── combat/      # Боевая система
│   │   │   ├── sessions/    # Управление сессиями
│   │   │   └── ui/          # UI компоненты
│   │   ├── 📁 stores/       # Zustand состояние
│   │   ├── 📁 hooks/        # React хуки
│   │   ├── 📁 lib/          # Утилиты
│   │   └── 📁 types/        # TypeScript типы
│   └── package.json
├── 📁 docs/                 # Документация
├── docker-compose.yml       # Docker конфигурация
└── README.md
```

### Технологический стек

#### Backend
- **Runtime**: Node.js 18+ с TypeScript
- **Framework**: Express.js
- **Database**: PostgreSQL с Prisma ORM
- **Cache**: Redis
- **WebSocket**: Socket.IO
- **Authentication**: JWT
- **AI**: Ollama (локальный ИИ)

#### Frontend
- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **UI**: React 18 + Tailwind CSS
- **State**: Zustand
- **Forms**: React Hook Form + Zod
- **Icons**: Lucide React
- **Animations**: Framer Motion

#### DevOps
- **Containerization**: Docker + Docker Compose
- **Database**: PostgreSQL 15
- **Cache**: Redis 7
- **AI Model**: Ollama with qwen2.5:14b

---

## 🎮 Функциональность

### 🔐 Система аутентификации
- Регистрация и вход пользователей
- JWT токены с refresh механизмом
- Защищенные маршруты и API endpoints

### 👤 Управление персонажами
- **Создание персонажей** по правилам D&D 5e
- **9 рас**: Человек, Эльф, Дварф, Полурослик, Драконорожденный, Гном, Полуэльф, Полуорк, Тифлинг
- **12 классов**: Варвар, Бард, Жрец, Друид, Воин, Монах, Паладин, Следопыт, Плут, Чародей, Колдун, Волшебник
- **Система характеристик** с тремя методами распределения очков
- **Навыки и владения** с поддержкой экспертизы
- **Инвентарь и экипировка** с автоматическим расчетом AC

### 🎲 Продвинутая система костей
- **Групповые броски**: выполнение нескольких связанных бросков одной кнопкой
- **Составные атаки**: автоматический бросок атаки с последующим уроном
- **Поддержка сложных формул**: `4d6kh3`, `2d8+1d6+5`, взрывающиеся кубики
- **Преимущество/помеха** для d20 бросков
- **История и статистика** всех бросков

### ⚔️ Боевая система
- **Автоматические атаки** с расчетом попадания по AC
- **Область поражения**: сфера, куб, конус, цилиндр, линия
- **Концентрация на заклинаниях** с автоматическими проверками
- **Временные эффекты** с таймерами и модификаторами
- **Инициатива и раунды** с автоматическим переключением ходов

### 🎯 Управление сессиями
- **Создание сессий** с полной настройкой правил D&D 5e
- **Приглашения игроков** через ссылки и QR-коды
- **Real-time синхронизация** состояния между участниками
- **Публичные и приватные сессии**
- **Аналитика и статистика** для мастеров игры

### 🤖 ИИ Мастер игры
- **Локальный ИИ** на основе Ollama (приватность данных)
- **Русскоязычные промпты** для естественного общения
- **Генерация квестов и NPC** в реальном времени
- **Адаптивное повествование** под действия игроков
- **Управление боевыми столкновениями**

---

## 📡 API Документация

### Аутентификация

```http
POST /api/auth/register
Content-Type: application/json

{
  "email": "player@example.com",
  "username": "player1",
  "password": "securepassword"
}
```

```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "player@example.com",
  "password": "securepassword"
}
```

### Персонажи

```http
GET /api/characters
Authorization: Bearer <jwt_token>
```

```http
POST /api/characters
Content-Type: application/json
Authorization: Bearer <jwt_token>

{
  "name": "Эльдра Звездопад",
  "race": "ELF",
  "class": "WIZARD",
  "abilityScores": {
    "strength": 8,
    "dexterity": 14,
    "constitution": 13,
    "intelligence": 18,
    "wisdom": 12,
    "charisma": 10
  },
  "backstory": "Молодая эльфийская волшебница...",
  "motivation": "Поиск древних знаний"
}
```

### Игровые сессии

```http
GET /api/sessions/my
Authorization: Bearer <jwt_token>
```

```http
POST /api/sessions
Content-Type: application/json
Authorization: Bearer <jwt_token>

{
  "name": "Проклятие Страда",
  "description": "Готическое приключение в Равенлофте",
  "maxPlayers": 4,
  "gameSettings": {
    "experienceMode": "milestone",
    "difficultyLevel": "hard"
  }
}
```

### Socket.IO События

```javascript
// Подключение к сессии
socket.emit('join_session', { sessionId: 'session-id' })

// Бросок костей
socket.emit('dice_roll', {
  type: 'd20',
  result: 15,
  modifier: 5,
  total: 20,
  purpose: 'attack'
})

// Игровое действие
socket.emit('game_action', {
  type: 'player_action',
  content: 'Ищу скрытые двери',
  characterId: 'char-id'
})
```

---

## ⚙️ Конфигурация

### Backend (.env)

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

# Stable Diffusion (опционально)
STABLE_DIFFUSION_URL="http://localhost:7860"

# Сервер
PORT=3001
NODE_ENV="development"
FRONTEND_URL="http://localhost:3000"
```

### Frontend (.env.local)

```bash
NEXT_PUBLIC_API_URL="http://localhost:3001/api"
NEXT_PUBLIC_SOCKET_URL="http://localhost:3001"
```

### Docker Compose

Проект включает полную Docker конфигурацию:

```yaml
services:
  postgres:     # База данных PostgreSQL
  redis:        # Кэш Redis
  ollama:       # ИИ Ollama
  stable-diffusion: # Генерация изображений (опционально)
```

---

## 🧪 Тестирование

### Backend тесты

```bash
cd backend

# Юнит-тесты
npm run test

# Интеграционные тесты
npm run test:integration

# E2E тесты
npm run test:e2e

# Покрытие кода
npm run test:coverage
```

### Frontend тесты

```bash
cd frontend

# React компоненты
npm run test

# E2E тесты
npm run test:e2e

# Storybook
npm run storybook
```

---

## 📚 Руководства

### Для игроков

1. **Регистрация**: Создайте аккаунт на платформе
2. **Создание персонажа**: Выберите расу, класс и распределите характеристики
3. **Присоединение к игре**: Используйте ссылку-приглашение от мастера
4. **Игровой процесс**: Взаимодействуйте с ИИ мастером и другими игроками

### Для мастеров игры

1. **Создание сессии**: Настройте правила и параметры игры
2. **Приглашение игроков**: Сгенерируйте ссылки-приглашения
3. **Управление игрой**: Используйте инструменты мастера для контроля сессии
4. **ИИ помощник**: Делегируйте рутинные задачи ИИ мастеру

### Для разработчиков

#### Добавление новой расы

```typescript
// backend/src/shared/constants/dnd.constants.ts
export const RACES = {
  // ... существующие расы
  NEW_RACE: {
    name: 'Новая раса',
    abilityScoreIncrease: { strength: 2, dexterity: 1 },
    size: 'Medium',
    speed: 30,
    languages: ['Общий', 'Специальный'],
    traits: ['Особенность 1', 'Особенность 2']
  }
}
```

#### Создание нового компонента

```typescript
// frontend/src/components/custom/new-component.tsx
'use client'

import React from 'react'
import { Card } from '@/components/ui/card'

interface NewComponentProps {
  title: string
  className?: string
}

export const NewComponent: React.FC<NewComponentProps> = ({
  title,
  className
}) => {
  return (
    <Card className={className}>
      <h3>{title}</h3>
    </Card>
  )
}
```

---

## 🚀 Развертывание

### Production сборка

```bash
# Backend
cd backend
npm run build
npm start

# Frontend
cd frontend
npm run build
npm start
```

### Docker Production

```bash
# Сборка production образов
docker-compose -f docker-compose.yml -f docker-compose.prod.yml build

# Запуск в production режиме
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

### Nginx конфигурация

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    location /api {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    location /socket.io {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

---

## 🔧 Решение проблем

### Частые проблемы

**Ollama не загружает модель**
```bash
# Проверьте доступное место на диске (нужно ~8GB)
df -h

# Перезапустите Ollama
docker restart dnd-ai-game-ollama-1

# Загрузите модель заново
docker exec -it dnd-ai-game-ollama-1 ollama pull qwen2.5:14b
```

**Ошибки подключения к базе данных**
```bash
# Проверьте статус PostgreSQL
docker-compose ps postgres

# Перезапустите базу данных
docker-compose restart postgres

# Проверьте логи
docker-compose logs postgres
```

**Frontend не подключается к API**
```bash
# Проверьте переменные окружения
cat frontend/.env.local

# Убедитесь что backend запущен
curl http://localhost:3001/health

# Проверьте CORS настройки
```

### Логирование и мониторинг

```bash
# Логи всех сервисов
docker-compose logs -f

# Логи конкретного сервиса
docker-compose logs -f postgres
docker-compose logs -f ollama

# Мониторинг ресурсов
docker stats
```

### Резервное копирование

```bash
# Backup PostgreSQL
docker exec -t dnd-ai-game-postgres-1 pg_dump -U postgres dnd_ai_game > backup.sql

# Restore PostgreSQL
docker exec -i dnd-ai-game-postgres-1 psql -U postgres dnd_ai_game < backup.sql

# Backup volumes
docker run --rm -v dnd-ai-game_postgres_data:/data -v $(pwd):/backup alpine tar czf /backup/postgres_backup.tar.gz -C /data .
```

---

## 🤝 Участие в разработке

### Настройка среды разработки

1. Форкните репозиторий
2. Клонируйте ваш форк
3. Установите зависимости
4. Создайте ветку для фичи
5. Внесите изменения
6. Создайте Pull Request

### Стандарты кода

- **TypeScript** для всего кода
- **ESLint + Prettier** для форматирования
- **Conventional Commits** для сообщений коммитов
- **Jest** для тестирования
- **Storybook** для документирования компонентов

### Архитектурные принципы

- **Модульность**: Каждая функция в отдельном модуле
- **Типизация**: Строгая типизация TypeScript
- **Тестируемость**: Высокое покрытие тестами
- **Производительность**: Оптимизация для больших сессий
- **Масштабируемость**: Готовность к горизонтальному масштабированию

---

## 📄 Лицензия

Проект распространяется под лицензией **MIT**. См. файл [LICENSE](LICENSE) для подробностей.

```
MIT License

Copyright (c) 2024 D&D AI Game

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.
```

---

## 🙏 Благодарности

- **OpenAI** за вдохновение в области ИИ
- **Wizards of the Coast** за создание D&D 5e
- **Ollama Team** за локальный ИИ
- **Сообществу D&D** за обратную связь и идеи
- **Open Source** проектам, используемым в разработке

---

## 📞 Поддержка

- **GitHub Issues**: [Создать issue](https://github.com/bykotofff/dnd-ai-game/issues)
- **Discussions**: [GitHub Discussions](https://github.com/bykotofff/dnd-ai-game/discussions)
- **Email**: support@dnd-ai-game.com (если настроен)
- **Discord**: [D&D AI Game Server](https://discord.gg/dnd-ai-game) (если настроен)

---

## 🗺️ Дорожная карта

### v1.1 (Планируется)
- [ ] Голосовое воспроизведение ответов ИИ
- [ ] Мобильное приложение (React Native)
- [ ] Улучшенная генерация изображений
- [ ] Система достижений

### v1.2 (Будущее)
- [ ] Marketplace кастомных приключений
- [ ] Интеграция с D&D Beyond
- [ ] Видеочат для игроков
- [ ] Расширенная аналитика

### v2.0 (Дальняя перспектива)
- [ ] VR/AR поддержка
- [ ] Процедурная генерация подземелий
- [ ] Многоязычная поддержка
- [ ] ИИ для создания музыки и звуков

---

**Погрузитесь в мир приключений с D&D AI Game!** 🏰⚔️✨

*Создавайте эпические истории, сражайтесь с могущественными врагами и исследуйте бесконечные миры вместе с друзьями и умным ИИ мастером игры.*