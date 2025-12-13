# API Documentation

## Аутентификация

### POST /auth/register

Регистрация нового пользователя.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response (201):**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "user@example.com"
  }
}
```

**Cookie:** `refreshToken` (httpOnly, 7 days)

---

### POST /auth/login

Вход в систему.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response (200):**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "user@example.com"
  }
}
```

**Cookie:** `refreshToken` (httpOnly, 7 days)

---

### POST /auth/refresh

Обновление access токена.

**Cookie Required:** `refreshToken`

**Response (200):**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "user@example.com"
  }
}
```

**Cookie:** `refreshToken` (обновленный, httpOnly, 7 days)

---

## Использование токенов

Access токен нужно передавать в заголовке Authorization для защищенных эндпоинтов:

```
Authorization: Bearer <accessToken>
```

Refresh токен автоматически сохраняется в httpOnly cookie и отправляется браузером при запросе `/auth/refresh`.

## Обработка ошибок

Все ошибки возвращаются в формате:

```json
{
  "message": "Error message",
  "code": "ERROR_CODE"
}
```

### Коды ошибок:

- `400 BAD_REQUEST` - Неверный запрос (например, email уже существует)
- `401 UNAUTHORIZED` - Неверные credentials или токен
- `500 INTERNAL_ERROR` - Внутренняя ошибка сервера

