# AGENTS.md

Инструкции для AI-агентов (Codex, OpenCode, Cursor, Claude Code и др.) по разработке DB Sync Service.

## 1. Описание проекта и стек

DB Sync Service — сервис двусторонней инкрементальной синхронизации данных между СУБД Oracle и PostgreSQL с веб-панелью администратора. Проект реализуется в парадигме модульного монолита с фокусом на надёжность синхронизации, идемпотентность операций и предсказуемое разрешение конфликтов.

**Технологический стек:**
- Язык: Java 21 LTS (Liberica; если `./mvnw` не находит Java — задать `JAVA_HOME`)
- Фреймворки: Spring Boot 4.1.2, Vaadin Flow 25.3.4, Spring JDBC (версии зафиксированы в `pom.xml`, менять только по согласованию)
- Базы данных: Oracle Database, PostgreSQL
- Сборка: Apache Maven (Maven Wrapper)
- Тестирование: JUnit 5, Mockito, Spring Boot Test
- Качество кода: Checkstyle
- Контейнеризация: Docker, Docker Compose

## 2. Команды проекта

Используйте Maven Wrapper (`./mvnw` на Linux/macOS или `mvnw.cmd` на Windows):

- **Установка зависимостей и сборка:**
  ```bash
  ./mvnw clean install -DskipTests
  ```
- **Запуск приложения:**
  ```bash
  ./mvnw spring-boot:run
  ```
- **Запуск всех тестов:**
  ```bash
  ./mvnw test
  ```
- **Запуск одного конкретного тестового класса:**
  ```bash
  ./mvnw test -Dtest=SyncTaskServiceTest
  ```
- **Запуск одного конкретного тестового метода:**
  ```bash
  ./mvnw test -Dtest=SyncTaskServiceTest#shouldProcessIncrementalChanges
  ```
- **Полная верификация (тесты + интеграционные проверки):**
  ```bash
  ./mvnw verify
  ```
- **Проверка стиля кода (линтер):**
  ```bash
  ./mvnw checkstyle:check
  ```
- **E2E/unit-проверки UI-прототипа (`docs/calculator.html`):**
  ```bash
  npm --prefix e2e test
  ```
- **Обновить карту кода Trail после крупных изменений:**
  ```bash
  trail build
  ```

Текущий статус и следующие шаги — в `docs/plan.md` и `docs/memory.md`; читать их в начале сессии. Каталог `src/main/frontend/generated/` генерируется Vaadin и не редактируется вручную.

## 3. Конвенции

### Структура пакетов (Spring Boot)
Код организуется по стандартным слоям Spring Boot в рамках базового пакета `com.dbsync`:
- `config` — конфигурационные классы Spring (`@Configuration`, `@ConfigurationProperties`, бины DataSource для Oracle и PostgreSQL, Scheduler).
- `ui` — интерфейс администратора на Vaadin Flow (`@Route`, Views, диалоги и компоненты).
- `service` — сервисный слой с бизнес-логикой и координацией задач (`@Service`, транзакции `@Transactional`).
- `sync` — движок инкрементальной синхронизации: чтение/запись, обнаружение изменений (CDC/timestamps), батчинг, стратегии разрешения конфликтов.
- `repository` (или `dao`) — доступ к метаданным и пользовательским таблицам через Spring JDBC (`@Repository`, `JdbcTemplate`, `RowMapper`).
- `model` (или `domain`) — доменные сущности, DTO, Java `record`, конфигурации сопоставления схем (mapping) и enum-ы.
- `scheduler` — фоновые периодические задачи запуска синхронизации (`@Scheduled`).
- `exception` — кастомные исключения и обработка ошибок доступа к БД и синхронизации.

### Именование
- **Классы и интерфейсы:** `UpperCamelCase` с постфиксами по роли в Spring:
  - Сервисы: `*Service` (`SyncTaskService`, `ConnectionValidationService`)
  - Репозитории/DAO: `*Repository` или `*Dao` (`SyncMetadataRepository`)
  - Конфигурации: `*Config`, `*Properties` (`DataSourceConfig`, `SyncProperties`)
  - UI-компоненты: `*View`, `*Form`, `*Dialog` (`TaskListView`, `ConnectionForm`)
  - Компоненты синхронизации: `*Reader`, `*Writer`, `*Resolver` (`ConflictResolver`)
- **Методы и переменные:** `lowerCamelCase` (`fetchPendingChanges`, `batchSize`).
- **Константы:** `UPPER_SNAKE_CASE` (`DEFAULT_BATCH_SIZE`, `MAX_RETRY_ATTEMPTS`).
- **Пакеты:** строчные буквы без спецсимволов (`com.dbsync.repository`, `com.dbsync.sync`).
- **Тестовые классы:** `*Test` (unit-тесты) и `*IT` (интеграционные тесты).

### Стиль кода
- Следовать стандарту Checkstyle, настроенному в проекте.
- Отделять бизнес-логику (`service`, `sync`) от механизмов доступа к БД (`repository`) и UI (`ui`).
- Писать лаконичный код без избыточных внешних библиотек.
- Сохранять существующие комментарии и структуру кода.

## 4. Правила работы

### Ветки
- Основная стабильная ветка: `main`.
- Новая функциональность и исправления разрабатываются в отдельных ветках: `feature/<name>`, `bugfix/<name>`, `task/<name>`.

### Коммиты
- Формат сообщений: Conventional Commits на английском или русском языке (например: `feat: add postgres connection check`, `test: add conflict resolution tests`).
- Коммиты должны быть атомарными и логически завершёнными.

### Противоречия
- Если документация репозитория противоречит существующему коду, следуй соглашениям, принятым в самом коде, а в финальном ответе укажи каждое найденное несоответствие между документацией и кодом.

### Что агенту строго запрещено
- **Секреты:** Никогда не добавлять пароли, токены, ключи и секретные строки подключения в код, тесты, конфигурации или Git. Использовать переменные окружения.
- **Производственные данные:** Не использовать реальные продуктовые данные в тестах.
- **Деструктивные операции:** Запрещено выполнять `DROP TABLE`, `ALTER TABLE` и другие разрушительные операции со схемами пользовательских БД без явного подтверждения.
- **Самовольное изменение стека:** Не подключать новые библиотеки и фреймворки без предварительного согласования.
- **Галлюцинации и фальсификации:** Не выдумывать параметры сетевого окружения, доступность внешних БД и результаты прогона тестов/сборки.
- **Скрытие ошибок:** Не игнорировать и не маскировать ошибки компиляции, непрошедшие тесты или предупреждения линтера.
- **Нарушение итеративности:** Не делать масштабные неконтролируемые изменения; двигаться небольшими, проверяемыми шагами, покрывая новую бизнес-логику тестами.

<!-- trail:start -->
## Trail — repo context graph

This repo is indexed in `.trail/cache/`: small linked markdown nodes that explain each
system and carry exact file:line spans, kept in sync with the code through git.

For ANY task here — understanding how something works, finding where code lives,
or scoping a change — get context from the graph before grepping or opening
source files. Re-ask freely (it's cheap) and reuse literal identifiers you
already have (symbol, error string, file name) as the query. New to this repo?
Run `trail map` first — a token-budgeted orientation (dir clusters, hubs,
hotspots), no LLM, no key.

- Run `trail ask "<your question>" --source` → ranked nodes with the relevant
  code spans inlined (each hit's ≤8-line crux by default; `--full` for whole
  definitions when the crux isn't enough). Match the tool to the task shape:
  for understanding or editing, the top node IS the answer — cite its
  `covers:` file:line spans and edit straight from `--source`. For
  exhaustive tasks ("every occurrence / every caller of this pattern"), ranked
  results are top-N, not complete — run `trail grep "<literal>"` instead
  (exhaustive over indexed files, grouped by enclosing symbol), falling back
  to raw `grep -rn` only for unindexed files.
- `trail skeleton <file>` → every definition's signature + span, ~10× cheaper
  than reading the file; use it to skim an API surface.
- `trail callers <symbol>` gives precomputed, exact edges — who calls this.
  Add `--direction out` for what it calls, or `--depth N` to walk
  transitively for the full blast radius. For structural questions, skip
  ranking and use this directly.
- Or browse: `.trail/cache/INDEX.md` lists every node; follow the links.
- Monorepos and folders of multiple repos rank fairly across sub-projects —
  hits carry `[scope/]` labels naming which one they're from. Narrow with
  `trail ask "<task>" --in <scope>/` once you know where you're working.

If a returned span is truncated ("+N more lines"), open the file at that exact
range before finalizing. Only open source files when a node genuinely lacks a
needed detail, and then at the exact file:line the node points to — never
re-read whole files.

After big code changes, refresh the graph with `trail build` (deterministic,
no API key, $0).
<!-- trail:end -->
