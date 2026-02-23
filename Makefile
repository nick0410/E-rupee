# ──────────────────────────────────────────────────────────
# E-Rupee Project — Makefile
# Just run:  make
# Everything installs, compiles, and launches automatically.
# Long-running servers open in their own terminal windows.
# ──────────────────────────────────────────────────────────

SHELL = cmd.exe

# ─── Default target — does EVERYTHING ────────────────────

all: setup-env install-all prisma-setup compile-contracts launch-all
	@echo.
	@echo ========================================
	@echo   E-Rupee is fully up and running!
	@echo ========================================
	@echo.

# ─── 0. Copy .env.example → .env if not present ────────

setup-env:
	@if not exist cbdc-hardhat\.env        (copy cbdc-hardhat\.env.example        cbdc-hardhat\.env        >nul && echo Created cbdc-hardhat\.env from .env.example)
	@if not exist erupee-backend\.env      (copy erupee-backend\.env.example      erupee-backend\.env      >nul && echo Created erupee-backend\.env from .env.example)
	@if not exist erupee-dashboard\.env    (copy erupee-dashboard\.env.example    erupee-dashboard\.env    >nul && echo Created erupee-dashboard\.env from .env.example)
	@if not exist erupee-web\.env.local    (copy erupee-web\.env.example          erupee-web\.env.local    >nul && echo Created erupee-web\.env.local from .env.example)
	@echo ✅  Environment files ready.

# ─── 1. Install all dependencies ────────────────────────

install-hardhat:
	cd cbdc-hardhat && npm install

install-backend:
	cd erupee-backend && npm install

install-dashboard:
	cd erupee-dashboard && npm install

install-web:
	cd erupee-web && npm install

install-all: install-hardhat install-backend install-dashboard install-web
	@echo ✅  All dependencies installed.

# ─── 2. Prisma (erupee-backend database) ────────────────

prisma-generate:
	@echo Stopping any Node processes that may lock Prisma engine files...
	-taskkill /F /IM node.exe /T 2>nul
	-cmd /c "ping 127.0.0.1 -n 3 >nul"
	-cmd /c "del /F /Q erupee-backend\node_modules\.prisma\client\query_engine-windows.dll.node 2>nul"
	-cmd /c "rmdir /s /q erupee-backend\node_modules\.prisma 2>nul"
	cd erupee-backend && npx prisma generate

prisma-migrate:
	@echo 🔄  Waking up Neon DB (free tier may be suspended)...
	-cd erupee-backend && npx prisma db execute --stdin < nul 2>nul
	cd erupee-backend && npx prisma migrate deploy

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
	cmd /c start "" /d "erupee-backend" cmd /k "npm run dev"
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
	cd erupee-backend && npm run dev

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

.PHONY: all setup-env install-hardhat install-backend install-dashboard install-web install-all \
        prisma-generate prisma-migrate prisma-setup \
        compile-contracts launch-all \
        start-node deploy-contracts \
        start-cbdc-backend start-erupee-backend start-dashboard start-web \
        test-contracts test-backend test-all help

