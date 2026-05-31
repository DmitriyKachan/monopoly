FROM python:3.10-slim

WORKDIR /app

# Устанавливаем системные зависимости
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Копируем список зависимостей и устанавливаем их
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Копируем все файлы проекта в контейнер
COPY . .

# Hugging Face Spaces по умолчанию проксирует порт 7860
ENV PORT=7860
EXPOSE 7860

# Запуск единого скрипта (сервер + бот)
CMD ["python", "run_all.py"]
