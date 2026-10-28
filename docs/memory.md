# Память между сессиями — журнал агента

> Обновляй этот файл в конце каждой сессии, чтобы следующая сессия продолжила с того же места.

---

## 📅 Последнее обновление: 2026-10-28

## ✅ Сделано
- [x] Создан README.md с описанием цели проекта и технического стека.
- [x] Создан AGENTS.md (инструкции для AI-агентов) со структурой пакетов Spring Boot, командами Maven, конвенциями именования и правилами работы.
- [x] Созданы навыки в `.agents/skills/`:
  - `write-tests/SKILL.md` — автономная процедура агента для написания тестов.
  - `review-pr/SKILL.md` — ручная команда для код-ревью ветки перед слиянием.
- [x] Создано правило в `.agents/rules/repository-rules.md` — ограничения для слоя `com.dbsync.repository`.
- [x] Настроены права доступа в `.claude/settings.json` (allow/ask/deny).
- [x] Настроены hooks в `.agents/hooks.json`:
  - `lint-after-edit` — запуск Checkstyle после редактирования Java-файлов.
  - `protect-sensitive-files` — блокировка записи в .env, .git/*, lock-файлы.
- [x] Создан `docs/plan.md` (план с чекбоксами) и `docs/memory.md` (журнал).
- [x] Создан `docs/plan.md` с планом разработки по этапам.
- [x] Добавлен `.gitignore` (.claude/settings.local.json, .env).
- [x] Отключен Playwright MCP, подключен Chrome DevTools MCP (`.mcp.json`, `.agents/mcp_config.json`).
- [x] Выполнена проверка UI `docs/calculator.html` через Chrome DevTools Protocol (`e2e/tests/calculator.e2e.test.js`):
  - Пользовательский сценарий вычислений (12+8=20, 20*3=60, AC, 7/0=Ошибка).
  - Реальный снимок экрана (`e2e/test-results/calculator-e2e-screenshot.png`).
  - Проверка консоли браузера (0 ошибок/исключений).
  - 10/10 зелёных E2E-тестов.

## 🧠 Ключевые решения
| Проблема | Решение |
|---|---|
| Git commit без user.name/email | `git config user.name/email` применён локально в репозитории |
| Удаление ветки на GitHub без сети | `git branch -d -r` удалил отслеживаемую ветку локально; для GitHub — `git push origin --delete` |
| Структура пакетов | Стандарт Spring Boot: `config`, `ui`, `service`, `sync`, `repository`, `model`, `scheduler`, `exception` |

## ⏭ Дальше (следующие шаги)
- [ ] Шаг 5 (Этап 0→1): Создать каркас Spring Boot + Vaadin Flow проекта.
- [ ] Настроить `pom.xml` с зависимостями Java 21, Spring Boot, Vaadin Flow, Spring JDBC, JUnit 5, Checkstyle.
- [ ] Настроить `application.yml` (без секретов, через переменные окружения).
- [ ] Создать `MainView.java` на Vaadin Flow — стартовая страница административной панели.
- [ ] Проверить: `./mvnw clean install` → зелёный.

## ⚠️ Ловушки
- На текущей машине нет прямого сетевого доступа к github.com из sandbox — `git push` требует bypass.
- Реальных DataSource нет — подключения к Oracle и PostgreSQL должны быть отделены от бизнес-логики через профили Spring.
- `pom.xml` должен фиксировать совместимые версии Vaadin + Spring Boot + Java 21 (Vaadin 24.x + Spring Boot 3.x).
