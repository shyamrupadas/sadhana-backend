# Реализация бэкенда для Sadhana Tracker

## Обзор

Необходимо реализовать REST API для работы с привычками и записями сна. Все эндпоинты требуют JWT аутентификации через Bearer token (кроме `/sleep-records/yesterday/check`, если нужен публичный доступ).

## Структура данных

### HabitDefinition
```typescript
{
  key: string;        // Уникальный ключ привычки (генерируется из label)
  label: string;      // Название привычки
  createdAt: string;  // ISO дата создания
}
```

### DailyEntry
```typescript
{
  id: string;         // Дата в формате YYYY-MM-DD (используется как первичный ключ)
  date: string;       // Дата в формате YYYY-MM-DD
  sleep: SleepData;
  habits: HabitCheck[];
}
```

### SleepData
```typescript
{
  bedtime: string | null;      // Время отбоя в формате "YYYY-MM-DD HH:mm" (например "2024-01-15 23:30")
  wakeTime: string | null;     // Время подъема в формате "YYYY-MM-DD HH:mm" (например "2024-01-16 08:00")
  napDurationMin: number;     // Длительность дневного сна в минутах
  durationMin: number;         // Общая длительность сна в минутах (вычисляется автоматически)
}
```

### HabitCheck
```typescript
{
  key: string;   // Ключ привычки
  value: boolean; // true = выполнено, false = не выполнено
}
```

## Эндпоинты

### Привычки

#### GET /habits
Возвращает список всех привычек пользователя.

**Ответ:** `HabitDefinition[]`

#### POST /habits
Создает новую привычку.

**Тело запроса:**
```json
{
  "label": "Медитация"
}
```

**Логика:**
1. Генерировать ключ из label используя функцию `generateHabitKey` (см. ниже)
2. Проверить, что привычка с таким ключом не существует
3. Если существует - вернуть существующую (или ошибку 400)
4. Создать запись с текущей датой в `createdAt`

**Ответ:** `HabitDefinition`

#### PATCH /habits/{key}
Переименовывает привычку.

**Тело запроса:**
```json
{
  "label": "Новое название"
}
```

**Ответ:** `HabitDefinition`

#### DELETE /habits/{key}
Удаляет привычку.

**Ответ:** 204 No Content

### Записи сна

#### GET /sleep-records
Возвращает все записи пользователя.

**Ответ:** `DailyEntry[]`

#### GET /sleep-records/{date}
Возвращает запись для конкретной даты.

**Параметры:**
- `date`: дата в формате `YYYY-MM-DD`

**Ответ:** `DailyEntry` или 404

#### PUT /sleep-records/{date}
Создает или обновляет запись сна для указанной даты.

**Параметры:**
- `date`: дата в формате `YYYY-MM-DD`

**Тело запроса:** `SleepDataInput`
```json
{
  "bedtime": "2024-01-15 23:30",
  "wakeTime": "2024-01-16 08:00",
  "napDurationMin": 30
}
```

**Логика вычисления durationMin:**
```typescript
// Если есть и bedtime и wakeTime
if (bedtime && wakeTime) {
  const bed = parseDateTime(bedtime); // "YYYY-MM-DD HH:mm"
  const wake = parseDateTime(wakeTime);
  
  // Вычисляем разницу в минутах
  let diff = wake.diff(bed, 'minute');
  
  // Если разница отрицательная, значит сон перешел через полночь
  // Добавляем 24 часа
  const nightMinutes = diff >= 0 ? diff : diff + 24 * 60;
  
  // Общая длительность = ночной сон + дневной сон
  durationMin = napDurationMin + nightMinutes;
} else {
  // Если нет времени отбоя или подъема, только дневной сон
  durationMin = napDurationMin;
}
```

**Важно:** 
- Формат времени: `YYYY-MM-DD HH:mm` (не ISO формат!)
- Если `bedtime` или `wakeTime` равны `null`, то `durationMin = napDurationMin`
- Если запись для этой даты уже существует, обновить только поле `sleep`, сохранив существующие `habits`

**Ответ:** `DailyEntry`

#### PATCH /sleep-records/{date}/habits/{habitKey}
Обновляет значение привычки для конкретного дня.

**Параметры:**
- `date`: дата в формате `YYYY-MM-DD`
- `habitKey`: ключ привычки

**Тело запроса:**
```json
{
  "value": true
}
```

**Логика:**
1. Найти запись для указанной даты (или создать новую, если не существует)
2. Найти привычку в массиве `habits` по `habitKey`
3. Если привычка найдена - обновить `value`
4. Если не найдена - добавить новую запись `{ key: habitKey, value: value }`

**Ответ:** `DailyEntry`

#### DELETE /sleep-records/{date}/habits/{habitKey}
Удаляет привычку из записи дня.

**Параметры:**
- `date`: дата в формате `YYYY-MM-DD`
- `habitKey`: ключ привычки

**Логика:**
1. Найти запись для указанной даты
2. Удалить из массива `habits` запись с указанным `habitKey`

**Ответ:** `DailyEntry` или 404

#### GET /sleep-records/yesterday/check
Проверяет, есть ли данные о сне за вчерашний день.

**Логика:**
- Вычислить вчерашнюю дату в московском времени (UTC+3)
- Проверить наличие записи для этой даты
- Проверить, что в записи есть и `bedtime` и `wakeTime` (не null)

**Ответ:**
```json
{
  "hasData": true
}
```

### Статистика

#### GET /sleep-stats
Возвращает статистику сна за разные периоды.

**Ответ:** `SleepStatsResponse`
```json
{
  "week": {
    "bedtime": "23:15",
    "wakeTime": "08:00",
    "duration": "8:30"
  },
  "month": {
    "bedtime": "23:30",
    "wakeTime": "08:15",
    "duration": "8:45"
  },
  "year": {
    "bedtime": "23:45",
    "wakeTime": "08:30",
    "duration": "8:15"
  }
}
```

**Логика вычисления статистики:**

1. **Неделя (week):** Последние 7 дней от текущей даты
2. **Месяц (month):** Последние 30 дней от текущей даты
3. **Год (year):** С начала текущего месяца минус 12 месяцев до начала текущего месяца минус 1 день

Для каждого периода:
- Фильтровать записи, где есть и `bedtime`, и `wakeTime`, и `durationMin`
- Извлечь время из `bedtime` и `wakeTime` (формат `HH:mm`)
- Вычислить среднее время отбоя и подъема
- Вычислить среднюю длительность сна

**Функция вычисления среднего времени отбоя:**
```typescript
function calculateAverageTime(times: string[]): string | null {
  if (times.length === 0) return null;
  
  let totalMinutes = 0;
  times.forEach((time) => {
    const [hours, minutes] = time.split(':').map(Number);
    // Время отбоя может быть после полуночи - нужна корректировка
    // Если часы < 12, значит это время после полуночи, добавляем 24 часа
    const adjustedMinutes = hours < 12 
      ? (hours + 24) * 60 + minutes 
      : hours * 60 + minutes;
    totalMinutes += adjustedMinutes;
  });
  
  const avgMinutes = Math.round(totalMinutes / times.length);
  const hours = Math.floor(avgMinutes / 60) % 24;
  const mins = avgMinutes % 60;
  
  return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
}
```

**Функция вычисления средней длительности:**
```typescript
function calculateAverageDuration(durations: number[]): string | null {
  if (durations.length === 0) return null;
  
  const avgMinutes = Math.round(
    durations.reduce((sum, dur) => sum + dur, 0) / durations.length
  );
  const hours = Math.floor(avgMinutes / 60);
  const mins = avgMinutes % 60;
  
  return `${hours}:${String(mins).padStart(2, '0')}`;
}
```

**Важно:**
- Если для периода нет данных, вернуть `null` для всех полей
- Формат времени: `HH:mm` (например "23:30")
- Формат длительности: `H:mm` (например "8:30" для 8 часов 30 минут)

## Генерация ключа привычки

Функция `generateHabitKey` преобразует label в уникальный ключ:

```typescript
function generateHabitKey(label: string): string {
  return label
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')           // Заменить пробелы на дефисы
    .replace(/[^a-zа-яё0-9-]/gi, '') // Удалить все кроме букв, цифр и дефисов
    .normalize('NFKD')              // Нормализовать Unicode
    .replace(/[\u0300-\u036f]/g, '') // Удалить диакритические знаки
}
```

**Примеры:**
- "Медитация" → "meditatsiya"
- "Утренняя зарядка" → "utrennyaya-zaryadka"
- "Reading Books" → "reading-books"

## Требования к аутентификации

Все эндпоинты (кроме `/sleep-records/yesterday/check`, если нужен публичный доступ) требуют:
- Заголовок `Authorization: Bearer <token>`
- JWT токен должен быть валидным
- Пользователь должен быть аутентифицирован

При отсутствии или невалидности токена возвращать:
- Статус: `401 Unauthorized`
- Тело: `{ "code": "NOT_AUTHORIZED", "message": "You are not authorized to access the resource" }`

## Обработка ошибок

### 400 Bad Request
Использовать при:
- Невалидных данных в теле запроса
- Нарушении формата даты/времени
- Попытке создать привычку с существующим ключом (опционально)

### 401 Unauthorized
Использовать при:
- Отсутствии токена
- Невалидном токене
- Истекшем токене

### 404 Not Found
Использовать при:
- Запросе несуществующей привычки
- Запросе несуществующей записи сна

## Форматы данных

### Дата
- Формат: `YYYY-MM-DD`
- Пример: `2024-01-15`

### Время (в записях сна)
- Формат: `YYYY-MM-DD HH:mm`
- Пример: `2024-01-15 23:30`

### Время (в статистике)
- Формат: `HH:mm`
- Пример: `23:30`

### Длительность (в статистике)
- Формат: `H:mm` или `HH:mm`
- Пример: `8:30` (8 часов 30 минут)

## Часовой пояс

Все вычисления дат должны учитывать московское время (UTC+3):
- "Вчера" = текущая дата в MSK минус 1 день
- Статистика вычисляется относительно текущей даты в MSK


