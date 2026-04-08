.PHONY: install_frontend install_backend kill_port_5173 start run stop

FRONTEND_DIR=frontend
BACKEND_DIR=backend

FRONTEND_PID_FILE=.frontend.pid
BACKEND_PID_FILE=.backend.pid

install_frontend:
	@if [ ! -d $(FRONTEND_DIR)/node_modules ]; then \
		echo "Installing frontend dependencies..."; \
		cd $(FRONTEND_DIR) && npm install; \
	else \
		echo "Frontend dependencies already installed."; \
	fi

install_backend:
	@if [ ! -d $(BACKEND_DIR)/node_modules ]; then \
		echo "Installing backend dependencies..."; \
		cd $(BACKEND_DIR) && npm install; \
	else \
		echo "Backend dependencies already installed."; \
	fi

kill_port_5173:
	@echo "Checking if port 5173 is in use..."
	-@lsof -ti:5173 | xargs -r kill -9 && echo "Killed process on port 5173" || echo "Port 5173 is free"

start:
	@$(MAKE) kill_port_5173
	@echo "Starting frontend and backend (press CTRL+C to stop)..."
	@cd $(FRONTEND_DIR) && npm run dev & echo $$! > ../$(FRONTEND_PID_FILE)
	@sleep 1
	@cd $(BACKEND_DIR) && npm run dev & echo $$! > ../$(BACKEND_PID_FILE)
	@trap 'make stop; exit 0' INT TERM
	@while [ -f $(FRONTEND_PID_FILE) ] && kill -0 $$(cat $(FRONTEND_PID_FILE)) 2>/dev/null && \
		  [ -f $(BACKEND_PID_FILE) ] && kill -0 $$(cat $(BACKEND_PID_FILE)) 2>/dev/null; do sleep 1; done

stop:
	@echo "Stopping frontend and backend..."
	-@kill $$(cat $(FRONTEND_PID_FILE)) 2>/dev/null || true
	-@kill $$(cat $(BACKEND_PID_FILE)) 2>/dev/null || true
	-@rm -f $(FRONTEND_PID_FILE) $(BACKEND_PID_FILE)

run: install_frontend install_backend start
