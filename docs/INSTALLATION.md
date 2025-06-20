# 🚀 Подробное руководство по установке D&D AI Game

Это руководство содержит пошаговые инструкции для установки D&D AI Game на различных операционных системах.

## 📋 Системные требования

### Минимальные требования
- **ОС**: Windows 10/11, macOS 10.15+, Ubuntu 18.04+
- **RAM**: 8 GB (рекомендуется 16 GB)
- **Диск**: 20 GB свободного места
- **CPU**: Intel i5 / AMD Ryzen 5 или эквивалент
- **Интернет**: Стабильное подключение для загрузки модели ИИ

### Рекомендуемые требования
- **RAM**: 16 GB+
- **Диск**: 50 GB+ SSD
- **CPU**: Intel i7 / AMD Ryzen 7 или лучше
- **GPU**: Дискретная видеокарта (для Stable Diffusion)

---

## 🪟 Windows 10/11

### Шаг 1: Установка зависимостей

#### Git
1. Скачайте Git с https://git-scm.com/download/win
2. Запустите установщик с параметрами по умолчанию
3. Проверьте установку:
```powershell
git --version
```

#### Node.js
1. Скачайте Node.js LTS с https://nodejs.org/
2. Запустите установщик (.msi файл)
3. Убедитесь, что выбраны опции:
    - ✅ Add to PATH
    - ✅ npm package manager
4. Проверьте установку:
```powershell
node --version
npm --version
```

#### Docker Desktop
1. Скачайте Docker Desktop с https://www.docker.com/products/docker-desktop/
2. Запустите установщик
3. При первом запуске выберите:
    - ✅ Use WSL 2 instead of Hyper-V
    - ✅ Add shortcut to desktop
4. Перезагрузите компьютер
5. Запустите Docker Desktop и дождитесь зеленого статуса
6. Проверьте установку:
```powershell
docker --version
docker-compose --version
```

#### Visual Studio Code (опционально)
1. Скачайте VS Code с https://code.visualstudio.com/
2. Установите полезные расширения:
    - TypeScript and JavaScript
    - Prettier
    - ESLint
    - Docker
    - Prisma

### Шаг 2: Настройка WSL 2 (для Docker)

```powershell
# Запустите PowerShell как администратор
dism.exe /online /enable-feature /featurename:Microsoft-Windows-Subsystem-Linux /all /norestart
dism.exe /online /enable-feature /featurename:VirtualMachinePlatform /all /norestart

# Перезагрузите компьютер
Restart-Computer

# Установите WSL 2 kernel update
# Скачайте с: https://wslstorestorage.blob.core.windows.net/wslblob/wsl_update_x64.msi

# Установите WSL 2 как версию по умолчанию
wsl --set-default-version 2
```

### Шаг 3: Клонирование и запуск

```powershell
# Создайте папку для проектов
mkdir C:\projects
cd C:\projects

# Клонируйте репозиторий
git clone https://github.com/bykotofff/dnd-ai-game.git
cd dnd-ai-game

# Запустите Docker сервисы
docker-compose up -d postgres redis ollama

# Дождитесь загрузки Ollama и установите модель
timeout /t 180
docker exec -it dnd-ai-game-ollama-1 ollama pull qwen2.5:14b

# Настройте backend
cd backend
copy .env.example .env
# Отредактируйте .env в блокноте
npm install
npx prisma generate
npx prisma db push

# Настройте frontend
cd ..\frontend
copy .env.example .env.local
# Отредактируйте .env.local в блокноте
npm install

# Запустите приложение (в двух разных терминалах)
# Терминал 1:
cd backend && npm run dev

# Терминал 2:
cd frontend && npm run dev
```

### Возможные проблемы Windows

**Docker не запускается:**
```powershell
# Убедитесь что виртуализация включена в BIOS
# Проверьте статус Hyper-V:
dism.exe /Online /Get-FeatureInfo /FeatureName:Microsoft-Hyper-V

# Перезапустите Docker Desktop
```

**Порты заняты:**
```powershell
# Найдите процесс на порту 3000
netstat -ano | findstr :3000
# Завершите процесс
taskkill /PID <PID> /F
```

---

## 🍎 macOS

### Шаг 1: Установка Homebrew

```bash
# Установите Homebrew
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Добавьте в PATH (для Apple Silicon)
echo 'eval "$(/opt/homebrew/bin/brew shellenv)"' >> ~/.zprofile
source ~/.zprofile
```

### Шаг 2: Установка зависимостей

```bash
# Установите все необходимые инструменты
brew install git node docker docker-compose

# Или установите Docker Desktop вручную
# Скачайте с https://www.docker.com/products/docker-desktop/
```

### Шаг 3: Настройка Docker Desktop

1. Запустите Docker Desktop
2. В Preferences → Resources → Advanced:
    - CPUs: 4+
    - Memory: 8GB+
    - Swap: 2GB
    - Disk image size: 100GB+

### Шаг 4: Клонирование и запуск

```bash
# Создайте папку для проектов
mkdir ~/projects
cd ~/projects

# Клонируйте репозиторий
git clone https://github.com/bykotofff/dnd-ai-game.git
cd dnd-ai-game

# Запустите Docker сервисы
docker-compose up -d postgres redis ollama

# Дождитесь загрузки Ollama (3-5 минут)
sleep 300
docker exec -it dnd-ai-game-ollama-1 ollama pull qwen2.5:14b

# Настройте backend
cd backend
cp .env.example .env
# Отредактируйте .env в вашем редакторе
npm install
npx prisma generate
npx prisma db push

# Настройте frontend
cd ../frontend
cp .env.example .env.local
# Отредактируйте .env.local
npm install

# Запустите приложение в двух терминалах
# Терминал 1:
cd backend && npm run dev

# Терминал 2:
cd frontend && npm run dev
```

### Возможные проблемы macOS

**Ошибки прав доступа:**
```bash
# Исправьте права на папку npm
sudo chown -R $(whoami) $(npm config get prefix)/{lib/node_modules,bin,share}
```

**Проблемы с Docker на Apple Silicon:**
```bash
# Убедитесь что используете версию для Apple Silicon
# В Docker Desktop → Settings → General:
# ✅ Use the new Virtualization framework
# ✅ Use Rosetta for x86/amd64 emulation
```

---

## 🐧 Ubuntu/Debian Linux

### Шаг 1: Обновление системы

```bash
# Обновите пакеты
sudo apt update && sudo apt upgrade -y

# Установите основные инструменты
sudo apt install -y curl wget software-properties-common apt-transport-https ca-certificates gnupg lsb-release
```

### Шаг 2: Установка Node.js

```bash
# Установите Node.js 18+ через NodeSource
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Проверьте версии
node --version
npm --version
```

### Шаг 3: Установка Docker

```bash
# Установите Docker
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg

echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin

# Добавьте пользователя в группу docker
sudo usermod -aG docker $USER
newgrp docker

# Проверьте установку
docker --version
docker compose version
```

### Шаг 4: Установка Git

```bash
sudo apt install -y git
git --version
```

### Шаг 5: Клонирование и запуск

```bash
# Создайте папку для проектов
mkdir ~/projects
cd ~/projects

# Клонируйте репозиторий
git clone https://github.com/bykotofff/dnd-ai-game.git
cd dnd-ai-game

# Запустите Docker сервисы
docker compose up -d postgres redis ollama

# Дождитесь инициализации Ollama
sleep 300
docker exec -it dnd-ai-game-ollama-1 ollama pull qwen2.5:14b

# Настройте backend
cd backend
cp .env.example .env
nano .env  # или используйте ваш любимый редактор
npm install
npx prisma generate
npx prisma db push

# Настройте frontend
cd ../frontend
cp .env.example .env.local
nano .env.local
npm install

# Запустите приложение
# Используйте tmux или screen для нескольких сессий
tmux new-session -d -s backend 'cd backend && npm run dev'
tmux new-session -d -s frontend 'cd frontend && npm run dev'

# Или в разных терминалах:
# Терминал 1: cd backend && npm run dev
# Терминал 2: cd frontend && npm run dev
```

### Возможные проблемы Linux

**Недостаточно памяти для Ollama:**
```bash
# Проверьте доступную память
free -h

# Создайте swap файл (если нужно)
sudo fallocate -l 4G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
```

**Проблемы с правами Docker:**
```bash
# Убедитесь что Docker daemon запущен
sudo systemctl start docker
sudo systemctl enable docker

# Если все еще есть проблемы с правами
sudo chmod 666 /var/run/docker.sock
```

---

## 🐳 Установка только через Docker

Если вы хотите запустить всё через Docker без локальной установки Node.js:

### Создайте docker-compose.override.yml

```yaml
version: '3.8'

services:
  backend:
    build: ./backend
    ports:
      - "3001:3001"
    environment:
      - DATABASE_URL=postgresql://postgres:password@postgres:5432/dnd_ai_game
      - REDIS_URL=redis://redis:6379
      - OLLAMA_URL=http://ollama:11434
    depends_on:
      - postgres
      - redis
      - ollama
    volumes:
      - ./backend:/app
      - /app/node_modules

  frontend:
    build: ./frontend
    ports:
      - "3000:3000"
    environment:
      - NEXT_PUBLIC_API_URL=http://localhost:3001/api
      - NEXT_PUBLIC_SOCKET_URL=http://localhost:3001
    depends_on:
      - backend
    volumes:
      - ./frontend:/app
      - /app/node_modules
```

### Dockerfile для backend

```dockerfile
# backend/Dockerfile
FROM node:18-alpine

WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npx prisma generate

EXPOSE 3001
CMD ["npm", "run", "dev"]
```

### Dockerfile для frontend

```dockerfile
# frontend/Dockerfile
FROM node:18-alpine

WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .

EXPOSE 3000
CMD ["npm", "run", "dev"]
```

### Запуск

```bash
# Запустите всё через Docker
docker-compose up -d

# Примените миграции БД
docker-compose exec backend npx prisma db push

# Загрузите модель ИИ
docker-compose exec ollama ollama pull qwen2.5:14b
```

---

## ✅ Проверка установки

После завершения установки проверьте:

1. **Сервисы Docker:**
```bash
docker-compose ps
# Все сервисы должны быть "Up"
```

2. **Backend API:**
```bash
curl http://localhost:3001/health
# Должен вернуть статус 200
```

3. **Frontend приложение:**
    - Откройте http://localhost:3000
    - Должна загрузиться главная страница

4. **Ollama ИИ:**
```bash
curl http://localhost:11434/api/tags
# Должен показать установленные модели
```

5. **База данных:**
```bash
docker exec -it dnd-ai-game-postgres-1 psql -U postgres -d dnd_ai_game -c "SELECT version();"
```

---

## 🚨 Решение проблем

### Общие проблемы

**Недостаточно места на диске:**
```bash
# Очистите Docker
docker system prune -af
docker volume prune

# Проверьте место
df -h
```

**Проблемы с сетью Docker:**
```bash
# Пересоздайте сети
docker-compose down
docker network prune
docker-compose up -d
```

**Ollama не отвечает:**
```bash
# Проверьте логи
docker-compose logs ollama

# Перезапустите контейнер
docker-compose restart ollama

# Подождите 5-10 минут для инициализации
```

### Мониторинг ресурсов

```bash
# Использование ресурсов контейнерами
docker stats

# Логи в реальном времени
docker-compose logs -f

# Проверка дискового пространства
docker system df
```

---

## 🔧 Настройка для разработки

### VS Code расширения

Рекомендуемые расширения для разработки:

```json
{
  "recommendations": [
    "ms-vscode.typescript-language-features",
    "esbenp.prettier-vscode",
    "ms-vscode.eslint",
    "bradlc.vscode-tailwindcss",
    "prisma.prisma",
    "ms-vscode.docker",
    "ms-vscode.vscode-json"
  ]
}
```

### Git hooks (опционально)

```bash
# Установите husky для pre-commit hooks
cd backend
npm install --save-dev husky
npx husky install

# Добавьте pre-commit hook
npx husky add .husky/pre-commit "npm run lint && npm run test"
```

---

## 📊 Мониторинг производительности

### Системные метрики

```bash
# CPU и память
htop

# Дисковое I/O
iotop

# Сетевая активность
nethogs

# Docker контейнеры
docker stats --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.NetIO}}\t{{.BlockIO}}"
```

### Логи приложения

```bash
# Backend логи
docker-compose logs -f backend

# Frontend логи
docker-compose logs -f frontend

# Ollama логи
docker-compose logs -f ollama

# База данных логи
docker-compose logs -f postgres
```

---

Готово! Ваша установка D&D AI Game должна быть полностью функциональной. Если у вас возникли проблемы, обратитесь к разделу "Решение проблем" или создайте issue в GitHub репозитории.