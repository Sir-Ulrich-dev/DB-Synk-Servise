# Память между сессиями — журнал агента

> Обновляй этот файл в конце каждой сессии, чтобы следующая сессия продолжила с того же места.

---

## 📅 Последнее обновление: 2026-10-29

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

- [x] Каркас Spring Boot 4.1.2 + Vaadin 25.3.4 + Spring JDBC (Java 21, Liberica JDK), `mvnw`, Checkstyle (`config/checkstyle.xml`).
- [x] `./mvnw clean install` → BUILD SUCCESS (1 тест), `./mvnw checkstyle:check` → 0 нарушений.
- [x] Hooks переведены в формат Claude Code (`.claude/settings.json` + `.claude/hooks/`), проверены вручную и в сессии (блок `.env`).

## 🧠 Ключевые решения
| Проблема | Решение |
|---|---|
| Git commit без user.name/email | `git config user.name/email` применён локально в репозитории |
| Удаление ветки на GitHub без сети | `git branch -d -r` удалил отслеживаемую ветку локально; для GitHub — `git push origin --delete` |
| Версии стека | start.spring.io отдаёт только Boot 4.x → Vaadin 25 (не Boot 3 + Vaadin 24, как планировалось) |
| Версия Boot в pom | В Maven Central `4.1.2`, а не `4.1.2.RELEASE` (так её называет start.spring.io) |
| DataSource на Этапе 1 | Автоконфигурация `DataSourceAutoConfiguration` отключена в `application.properties`; подключения — Этап 2 через env |
| Структура пакетов | Стандарт Spring Boot: `config`, `ui`, `service`, `sync`, `repository`, `model`, `scheduler`, `exception` |

## ⏭ Дальше (следующие шаги)
- [ ] Создать `MainView.java` на Vaadin Flow — стартовая страница админ-панели.
- [ ] Проверить `./mvnw spring-boot:run` (запуск приложения).
- [ ] Этап 2: `DataSourceConfig`, `ConnectionValidationService` + тесты (Oracle недоступен — только через профили/моки).

## ⚠️ Ловушки
- На текущей машине нет прямого сетевого доступа к github.com из sandbox — `git push` требует bypass.
- Реальных DataSource нет — подключения к Oracle и PostgreSQL должны быть отделены от бизнес-логики через профили Spring.
- Версии в `pom.xml` зафиксированы: Spring Boot 4.1.2 + Vaadin 25.3.4 + Java 21. Не менять без согласования.
- JDK — Liberica 21 в `/usr/lib/jvm/bellsoft-java21-amd64`; если `./mvnw` не находит Java, задать `JAVA_HOME` на этот путь.
- Hooks читаются при старте сессии: после правки `.claude/settings.json` нужен перезапуск. Запись в `.env` блокируется намеренно.
- `.env` не создан; переменные `ORACLE_URL`, `POSTGRES_*` лежат в `.claude/settings.local.json` (пустые, не коммитятся).
- Не закоммичено на конец сессии: каркас (`pom.xml`, `src/`, `mvnw`, `.mvn/`, `config/`) и правки docs — перед работой проверить `git status`.
- Нужные скрины для `docs/about.md` (раздел 6): hook-lint, path-rule (repository и соседняя папка), memory-continue.
- Метрики качества (`ub-mode`): `crapper`, `dryer`, `mutator` лежат в `~/Projects/` (нужен `python3.14-venv`, первый запуск сам создаёт `.venv`). `mvn` в системе нет — только `./mvnw`, поэтому команды такие (из корня проекта, всегда `-s src/main/java`, иначе сканируется сгенерированный Vaadin-код):
  - `~/Projects/crapper/crapper -s src/main/java --coverage-command "./mvnw -q org.jacoco:jacoco-maven-plugin:0.8.12:prepare-agent test org.jacoco:jacoco-maven-plugin:0.8.12:report"`
  - `~/Projects/dryer/dryer src/main/java`
  - `~/Projects/mutator/mutator -s src/main/java --reuse-coverage --test-command "./mvnw -q test"` (запускать после `crapper`: берёт покрытие и имена функций из `.metrics/crap.edn`)
  - Результаты пишутся в `.metrics/` (в `.gitignore`). Пробный прогон на каркасе: одна функция `main`, CRAP 2.0, мутаций нет.
