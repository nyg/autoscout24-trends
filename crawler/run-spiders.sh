#!/usr/bin/env sh

AU24T_LOG_FILE="${AU24T_LOG_FILE:-$HOME/.local/state/autoscout24-trends/cron.log}"
mkdir -p "$(dirname "$AU24T_LOG_FILE")"

log() {
    echo "[$(date -uIseconds)] $*" >> "$AU24T_LOG_FILE"
}

log "Running all autoscout24-trends spiders"

cd "$(dirname "$0")/crawler" || { log "ERROR: Failed to cd into crawler directory"; exit 1; }
. venv/bin/activate

for f in searches/*.env ; do
    [ -e "$f" ] || { log "WARNING: No .env files found in searches/"; break; }
    log "Found search file: $(basename "$f")"
    scrapy crawl search -a search_file="$(basename "$f")"
done

log "Finished running all spiders"
