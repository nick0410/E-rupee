# e-Rupee ? Digital Rupee (CBDC) Platform

A full-stack Central Bank Digital Currency (CBDC) simulation built on Ethereum (Hardhat), with a REST API backend, a React dashboard, and a Next.js web frontend.

---

## Architecture

| Component | Tech | Port |
|---|---|---|
| `cbdc-hardhat` | Solidity + Hardhat local blockchain | 8545 |
| `cbdc-hardhat/backend` | Node.js + Express (CBDC API) | 3001 |
| `erupee-backend` | Node.js + Express + Prisma (user API) | 8000 |
| `erupee-dashboard` | React + Vite (admin dashboard) | 5173 |
| `erupee-web` | Next.js (user-facing web app) | 3000 |

---

## Prerequisites

Make sure these are installed on your machine before proceeding:

- [Node.js](https://nodejs.org/) v18 or higher
- [npm](https://www.npmjs.com/) v9 or higher
- [Git](https://git-scm.com/)
- [GNU Make](https://gnuwin32.sourceforge.net/packages/make.htm) (Windows: install via GnuWin32 or `winget install GnuWin32.Make`)

---

## Quick Start

### 1. Clone the repository

```bash
git clone https://github.com/nick0410/E-rupee.git
cd E-rupee
```

### 2. Add your Database URL

Open `erupee-backend/.env` (auto-created in step 3) and fill in your Neon DB connection string:

```
DATABASE_URL=postgresql://USER:PASSWORD@HOST:5432/DATABASE?sslmode=require
```

Get this from your [Neon console](https://console.neon.tech) under Connection String.

All other `.env` files are pre-filled with local defaults and need no changes.

### 3. Run everything

```bash
make
```

This single command will:

1. Copy all `.env.example` files to `.env` automatically
2. Install all npm dependencies across every component
3. Run `prisma generate` and `prisma migrate deploy`
4. Compile Solidity smart contracts
5. Start the local Hardhat blockchain node
6. Deploy the eRupee token contract (address auto-saved to `.env`)
7. Start all 4 servers in separate terminal windows

---

## Ports at a Glance

| Service | URL |
|---|---|
| Hardhat node | http://127.0.0.1:8545 |
| CBDC backend | http://127.0.0.1:3001 |
| eRupee backend | http://127.0.0.1:8000 |
| Dashboard | http://localhost:5173 |
| Web frontend | http://localhost:3000 |

---

## Useful Make Commands

```bash
make                   # Install + compile + launch everything (default)
make stop              # Kill all running services
make install-all       # Install dependencies only
make compile-contracts # Recompile Solidity contracts
make deploy-contracts  # Redeploy contracts to local node
make prisma-setup      # Regenerate Prisma client + run migrations
make test-all          # Run all tests
make help              # Show all available commands
```

---

## Environment Variables Reference

### cbdc-hardhat/.env

| Variable | Description | Default |
|---|---|---|
| `RPC_URL` | Hardhat node RPC URL | http://127.0.0.1:8545 |
| `PRIVATE_KEY` | Deployer wallet private key | Hardhat account #0 |
| `CONTRACT_ADDRESS` | Auto-filled after deploy | (auto) |

### erupee-backend/.env

| Variable | Description |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string (Neon DB) ? **required** |
| `JWT_SECRET` | Secret key for JWT auth tokens |
| `PORT` | Server port (default: 8000) |

### erupee-web/.env.local

| Variable | Description | Default |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | eRupee backend URL | http://127.0.0.1:8000 |

### erupee-dashboard/.env

| Variable | Description | Default |
|---|---|---|
| `VITE_API_URL` | eRupee backend URL | http://127.0.0.1:8000 |
| `VITE_RPC_URL` | Hardhat RPC URL | http://127.0.0.1:8545 |

---

## Project Structure

```
E-rupee/
+-- Makefile                  # One-command setup & launch
+-- cbdc-hardhat/             # Smart contracts + Hardhat + CBDC API
|   +-- contracts/            # Solidity source files
|   +-- scripts/              # Deploy scripts
|   +-- backend/              # Express API for contract interaction
|   +-- test/                 # Contract tests
+-- erupee-backend/           # User auth & data API (Express + Prisma)
|   +-- prisma/               # DB schema and migrations
+-- erupee-dashboard/         # Admin dashboard (React + Vite)
+-- erupee-web/               # User web app (Next.js)
+-- app_android/              # Android app (Kotlin)
```

---

## Notes

- `artifacts/`, `cache/`, and `node_modules/` are not committed to git. They are generated locally by `make`.
- Never commit your `.env` files. They are gitignored. Only `.env.example` files are tracked.
- The smart contract address is automatically written to `cbdc-hardhat/.env` after each deploy.



Contributors:-
1. Nikhilesh Dubey
2. Aanchal Yadav
3. Aryan barnwal
4. Shubham Agarwal
5. siddhi Varma
6. Kshitij Vats


Deployment Link:- https://erupee-web.vercel.app/
github Link :- https://github.com/nick0410/E-rupee
