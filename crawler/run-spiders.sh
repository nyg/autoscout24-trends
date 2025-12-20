#!/usr/bin/env sh

log() {
    echo "[$(date -uIseconds)] $*"
}

cd "$(dirname "$0")" || { log "ERROR: Failed to cd into crawler directory"; exit 1; }

mkdir -p output

if [ ! -d .venv ]; then
    log "Creating virtual environment"
    python -m venv .venv
fi

log "Activating virtual environment"
. .venv/bin/activate
pip install -r requirements.txt

log "Running all autoscout24-trends spiders"
for f in searches/*.env ; do
    [ -e "$f" ] || { log "WARNING: No .env files found in searches/"; break; }
    log "Found search file: $(basename "$f")"
    scrapy crawl search -a search_file="$(basename "$f")"
done

log "Finished running all spiders"
deactivate
