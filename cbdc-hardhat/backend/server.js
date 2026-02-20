import express from "express";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import multer from "multer";
import { ethers } from "ethers";
import { uploadFileToIPFS } from "./ipfs.js";

dotenv.config({ path: path.resolve(process.cwd(), ".env") });

const app = express();
app.use(express.json());
const upload = multer({ storage: multer.memoryStorage() });

const RPC_URL = process.env.RPC_URL || "http://127.0.0.1:8545";
const PRIVATE_KEY = process.env.PRIVATE_KEY || "";
const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS || "";
const DEFAULT_LOCAL_PK = "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";

if (!CONTRACT_ADDRESS) console.warn("Warning: CONTRACT_ADDRESS not set in .env");

const provider = new ethers.JsonRpcProvider(RPC_URL);
const wallet = new ethers.Wallet(PRIVATE_KEY || DEFAULT_LOCAL_PK, provider);

// Load ABI from artifacts
const artifactPath = path.resolve(process.cwd(), "artifacts/contracts/eRupeeToken.sol/eRupeeToken.json");
let abi;
try {
  const artifact = JSON.parse(fs.readFileSync(artifactPath, "utf8"));
  abi = artifact.abi;
} catch (e) {
  console.error("Failed to load contract artifact:", e.message);
}

const contract = CONTRACT_ADDRESS && abi ? new ethers.Contract(CONTRACT_ADDRESS, abi, wallet) : null;

app.post("/mint", async (req, res) => {
  if (!contract) return res.status(500).json({ error: "Contract not configured" });
  const { to, amount } = req.body;
  if (!to || !amount) return res.status(400).json({ error: "missing to or amount" });
  try {
    const tx = await contract.mint(to, ethers.parseUnits(amount.toString(), 18));
    await tx.wait();
    res.json({ tx: tx.hash });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post("/lock", async (req, res) => {
  if (!contract) return res.status(500).json({ error: "Contract not configured" });
  const { user, amount, unlockTime, documentCID } = req.body;
  if (!user || !amount || !unlockTime) return res.status(400).json({ error: "missing user, amount or unlockTime" });
  try {
    const parsedAmount = ethers.parseUnits(amount.toString(), 18);
    const parsedUnlockTime = parseInt(unlockTime, 10);
    const tx = documentCID
      ? await contract.lockWithDocument(user, parsedAmount, parsedUnlockTime, documentCID)
      : await contract.lockTokens(user, parsedAmount, parsedUnlockTime);
    await tx.wait();
    res.json({ tx: tx.hash });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post("/upload", upload.single("file"), async (req, res) => {
  try {
    if (!req.file || !req.file.buffer) {
      return res.status(400).json({ error: "missing file" });
    }
    const cid = await uploadFileToIPFS(req.file.buffer);
    return res.json({ cid });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
});

const PORT = process.env.PORT || 3001;

export function startServer(port = PORT) {
  return app.listen(port, () => console.log(`Backend listening on http://localhost:${port}`));
}

if (process.env.NODE_ENV !== "test") {
  startServer();
}

export default app;
