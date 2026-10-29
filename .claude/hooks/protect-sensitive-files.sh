#!/usr/bin/env bash
# PreToolUse: блокирует запись в .env, .git/*, lock-файлы (exit 2 = блокировка, stderr уходит агенту).
path=$(jq -r '.tool_input.file_path // empty')
case "$path" in
  */.env|*/.env.*|.env|.env.*|*/.git/*|.git/*|*/package-lock.json|*/yarn.lock|*/pom.xml.bak)
    case "$path" in *.env.example) exit 0 ;; esac
    echo "HOOK BLOCKED: редактирование защищённого файла запрещено ($path). Файлы .env, .git/* и lock-файлы не должны изменяться агентом без явного разрешения пользователя." >&2
    exit 2 ;;
esac
exit 0
