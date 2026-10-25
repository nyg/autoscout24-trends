#!/usr/bin/env bash
# Run all autoscout24-trends spiders.
#
# Installs/updates the project via uv (https://github.com/astral-sh/uv) from
# pyproject.toml and uv.lock, then delegates to run-spiders.py.  Designed to
# be called directly by a cron job so that a plain `git pull` is enough to
# pick up new package versions on the next scheduled run.  Requires uv to be
# installed on the host (https://docs.astral.sh/uv/getting-started/installation/),
# and Python from pyenv (https://github.com/pyenv/pyenv): uv never downloads its own.
#
# Logs are written to $XDG_STATE_HOME/autoscout24-trends/ (default
# ~/.local/state/autoscout24-trends/) with daily rotation managed by
# Python's TimedRotatingFileHandler.  Shell-level output redirection
# (>> ... 2>&1) is no longer needed for normal operation.

set -eu

# Cron runs with a minimal PATH. Prepend pyenv's shims, so uv finds pyenv's Python
# rather than the system one, and ~/.local/bin (uv standalone/pip --user), and
# load nvm so node/npm are available (required by pminit/pythonmonkey).
export PATH="${PYENV_ROOT:-$HOME/.local/share/pyenv}/shims:$HOME/.local/bin:$PATH"
export NVM_DIR="${NVM_DIR:-$HOME/.local/share/nvm}"
[ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

echo "Installing/updating dependencies"
uv sync --project "$SCRIPT_DIR" --no-managed-python

echo "Starting spiders"
"$SCRIPT_DIR/.venv/bin/python" "$SCRIPT_DIR/run-spiders.py" "$@"
