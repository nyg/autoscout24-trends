#!/usr/bin/env sh
# Run all autoscout24-trends spiders.
#
# Creates .venv if it does not exist yet, installs/updates dependencies from
# requirements.txt, then delegates to run-spiders.py.  Designed to be called
# directly by a cron job so that a plain `git pull` is enough to pick up
# new package versions on the next scheduled run.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

if [ ! -d "$SCRIPT_DIR/.venv" ]; then
    echo "Creating virtual environment"
    python3 -m venv "$SCRIPT_DIR/.venv"
fi

echo "Installing/updating dependencies"
"$SCRIPT_DIR/.venv/bin/pip" install --quiet -r "$SCRIPT_DIR/requirements.txt"

echo "Starting spiders"
"$SCRIPT_DIR/.venv/bin/python" "$SCRIPT_DIR/run-spiders.py"
