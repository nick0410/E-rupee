# ──────────────────────────────────────────────────────────
# E-Rupee Project — Makefile
# Just run:  make
# Everything installs, compiles, and launches automatically.
# Long-running servers open in their own terminal windows.
# ──────────────────────────────────────────────────────────

SHELL = cmd.exe

# ─── Default target — does EVERYTHING ────────────────────

all: install-all prisma-setup compile-contracts launch-all
	@echo.
	@echo ========================================
	@echo   E-Rupee is fully up and running!
	@echo ========================================
	@echo.

# ─── 1. Install all dependencies ────────────────────────

install-hardhat:
	cd cbdc-hardhat && npm install

install-backend:
	cd E-rupee\erupee-backend && npm install

install-dashboard:
	cd erupee-dashboard && npm install

install-web:
	cd erupee-web && npm install

install-all: install-hardhat install-backend install-dashboard install-web
	@echo ✅  All dependencies installed.

# ─── 2. Prisma (erupee-backend database) ────────────────

prisma-generate:
	-cmd /c "rmdir /s /q E-rupee\erupee-backend\node_modules\.prisma 2>nul"
	cd E-rupee\erupee-backend && npx prisma generate

prisma-migrate:
	cd E-rupee\erupee-backend && npx prisma migrate dev

prisma-setup: prisma-generate prisma-migrate
	@echo ✅  Prisma ready.

# ─── 3. Compile Solidity contracts ──────────────────────

compile-contracts:
	cd cbdc-hardhat && npx hardhat compile

# ─── 4. Launch all servers (each in its own window) ─────
#    Hardhat node starts first, waits 5s, then deploy,
#    then the rest of the services spin up.

launch-all:
	@echo 🚀  Starting Hardhat node...
	cmd /c start "" /d "cbdc-hardhat" cmd /k "npx hardhat node"
	@echo     Waiting 5 seconds for node to boot...
	@timeout /t 5 /nobreak >nul
	@echo 📦  Deploying contracts...
	cd cbdc-hardhat && npx hardhat run scripts/deploy-erupee.mjs --network localhost
	@echo 🚀  Starting CBDC backend...
	cmd /c start "" /d "cbdc-hardhat" cmd /k "node backend/server.js"
	@echo 🚀  Starting eRupee backend (Express + Prisma)...
	cmd /c start "" /d "E-rupee\erupee-backend" cmd /k "npm run dev"
	@echo 🚀  Starting Dashboard (Vite)...
	cmd /c start "" /d "erupee-dashboard" cmd /k "npm run dev"
	@echo 🚀  Starting Web frontend (Next.js)...
	cmd /c start "" /d "erupee-web" cmd /k "npm run dev"
	@echo ✅  All services launched.

# ─── Individual start targets (if needed separately) ────

start-node:
	cd cbdc-hardhat && npx hardhat node

deploy-contracts:
	cd cbdc-hardhat && npx hardhat run scripts/deploy-erupee.mjs --network localhost

start-cbdc-backend:
	cd cbdc-hardhat && node backend/server.js

start-erupee-backend:
	cd E-rupee\erupee-backend && npm run dev

start-dashboard:
	cd erupee-dashboard && npm run dev

start-web:
	cd erupee-web && npm run dev

# ─── Tests ──────────────────────────────────────────────

test-contracts:
	cd cbdc-hardhat && npx hardhat test

test-backend:
	cd cbdc-hardhat && npm run test:backend

test-all: test-contracts test-backend

# ─── Stop everything ────────────────────────────────────

stop:
	@echo Killing node processes...
	-taskkill /F /FI "WINDOWTITLE eq Hardhat Node" >nul 2>&1
	-taskkill /F /FI "WINDOWTITLE eq CBDC Backend" >nul 2>&1
	-taskkill /F /FI "WINDOWTITLE eq eRupee Backend" >nul 2>&1
	-taskkill /F /FI "WINDOWTITLE eq Dashboard" >nul 2>&1
	-taskkill /F /FI "WINDOWTITLE eq Web Frontend" >nul 2>&1
	@echo ✅  All services stopped.

# ─── Help ───────────────────────────────────────────────

help:
	@echo.
	@echo ===  E-Rupee Makefile  ===
	@echo.
	@echo   make               Install + compile + launch everything
	@echo   make stop          Kill all running services
	@echo   make install-all   Install deps only
	@echo   make test-all      Run all tests
	@echo   make help          Show this message
	@echo.

.PHONY: all install-hardhat install-backend install-dashboard install-web install-all \
        prisma-generate prisma-migrate prisma-setup \
        compile-contracts launch-all \
        start-node deploy-contracts \
        start-cbdc-backend start-erupee-backend start-dashboard start-web \
        test-contracts test-backend test-all help
