#!/usr/bin/env bash
# PostToolUse: после правки src/**/*.java запускает Checkstyle; нарушения возвращаются агенту (exit 2).
path=$(jq -r '.tool_input.file_path // empty')
case "$path" in
  */src/*.java) ;;
  *) exit 0 ;;
esac
cd "$CLAUDE_PROJECT_DIR" || exit 0
if [ ! -x ./mvnw ]; then
  echo "lint-after-edit: ./mvnw отсутствует (каркас Maven ещё не создан), Checkstyle пропущен" >&2
  exit 0
fi
out=$(./mvnw checkstyle:check --batch-mode -q 2>&1 | tail -20)
if [ $? -ne 0 ] || echo "$out" | grep -q "ERROR"; then
  echo "Checkstyle выявил нарушения, устраните их до коммита:" >&2
  echo "$out" >&2
  exit 2
fi
exit 0
