// Проверка аутентификации пользователя
export function isAuthenticated() {
  // Пример проверки: проверить наличие токена в localStorage
  return !!localStorage.getItem("token");
}
