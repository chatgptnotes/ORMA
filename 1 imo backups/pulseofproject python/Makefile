.PHONY: help install backend-install frontend-install dev backend-dev frontend-dev migrate test clean

help:
	@echo "Django + React Full Stack Application"
	@echo ""
	@echo "Available commands:"
	@echo "  make install          - Install both backend and frontend dependencies"
	@echo "  make backend-install  - Install backend dependencies"
	@echo "  make frontend-install - Install frontend dependencies"
	@echo "  make dev             - Run both backend and frontend dev servers"
	@echo "  make backend-dev     - Run backend development server"
	@echo "  make frontend-dev    - Run frontend development server"
	@echo "  make migrate         - Run Django migrations"
	@echo "  make test            - Run all tests"
	@echo "  make clean           - Clean build artifacts"

install: backend-install frontend-install
	@echo " All dependencies installed"

backend-install:
	@echo "Installing backend dependencies..."
	cd backend && python3 -m venv venv
	cd backend && . venv/bin/activate && pip install -r requirements.txt
	@echo " Backend dependencies installed"

frontend-install:
	@echo "Installing frontend dependencies..."
	cd frontend && npm install
	@echo " Frontend dependencies installed"

dev:
	@echo "Starting development servers..."
	@echo "Backend: http://localhost:8000"
	@echo "Frontend: http://localhost:5173"
	@make -j2 backend-dev frontend-dev

backend-dev:
	cd backend && . venv/bin/activate && python manage.py runserver

frontend-dev:
	cd frontend && npm run dev

migrate:
	cd backend && . venv/bin/activate && python manage.py makemigrations
	cd backend && . venv/bin/activate && python manage.py migrate
	@echo " Migrations completed"

test:
	cd backend && . venv/bin/activate && python manage.py test
	cd frontend && npm run test

clean:
	@echo "Cleaning build artifacts..."
	find . -type d -name "__pycache__" -exec rm -rf {} + 2>/dev/null || true
	find . -type f -name "*.pyc" -delete
	rm -rf backend/media/* 2>/dev/null || true
	rm -rf frontend/dist 2>/dev/null || true
	rm -rf frontend/node_modules/.vite 2>/dev/null || true
	@echo " Cleaned"
