.PHONY: dev test lint format clean install

# ─── Setup ─────────────────────────────────────────────────────────────────────
install:
	pip install -r requirements.txt

# ─── Development ──────────────────────────────────────────────────────────────
dev:
	uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# ─── Testing ──────────────────────────────────────────────────────────────────
test:
	pytest tests/ -v --tb=short

# ─── Code Quality ─────────────────────────────────────────────────────────────
lint:
	ruff check app/ tests/
	mypy app/ --ignore-missing-imports

format:
	black app/ tests/
	isort app/ tests/

# ─── Cleanup ──────────────────────────────────────────────────────────────────
clean:
	find . -type d -name __pycache__ -exec rm -rf {} + 2>/dev/null; true
	find . -type d -name .pytest_cache -exec rm -rf {} + 2>/dev/null; true
	find . -name "*.pyc" -delete 2>/dev/null; true
