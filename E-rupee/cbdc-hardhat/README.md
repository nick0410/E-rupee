# CBDC Hardhat Project

This is a minimal Hardhat project scaffold for a CBDC simulation.

Quick start:

1. Change to the project folder:

```powershell
cd cbdc-hardhat
```

2. Install dependencies (if not already):

```powershell
npm install
```

3. Run tests:

```powershell
npx hardhat test
```

4. Deploy locally (example):

```powershell
npx hardhat run scripts/deploy.js --network hardhat
```

Files:
- `contracts/CBDC.sol` — sample ERC20-based CBDC contract
- `scripts/deploy.js` — simple deploy script
- `test/cbdc-test.js` — basic test

Environment variables go in `.env`.
