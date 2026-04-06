#!/usr/bin/env sh
# Run all autoscout24-trends spiders.
#
# Creates .venv if it does not exist yet, installs/updates the project from
# pyproject.toml, then delegates to run-spiders.py.  Designed to be called
# directly by a cron job so that a plain `git pull` is enough to pick up
# new package versions on the next scheduled run.
#
# Logs are written to $XDG_STATE_HOME/autoscout24-trends/ (default
# ~/.local/state/autoscout24-trends/) with daily rotation managed by
# Python's TimedRotatingFileHandler.  Shell-level output redirection
# (>> ... 2>&1) is no longer needed for normal operation.

set -eu

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

if [ ! -d "$SCRIPT_DIR/.venv" ]; then
    echo "Creating virtual environment"
    python3 -m venv "$SCRIPT_DIR/.venv"
fi

echo "Installing/updating dependencies"
"$SCRIPT_DIR/.venv/bin/pip" install -e "$SCRIPT_DIR"

echo "Starting spiders"
"$SCRIPT_DIR/.venv/bin/python" "$SCRIPT_DIR/run-spiders.py" "$@"
