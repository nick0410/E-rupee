require("dotenv").config()

const express = require("express")
const cors = require("cors")
const { PrismaClient } = require("@prisma/client")
const { ethers } = require("ethers")
const fs = require("fs")
const path = require("path")

// ── Blockchain Setup ──────────────────────────────────────────────────────────
const RPC_URL = process.env.RPC_URL || "http://127.0.0.1:8545"
const PRIVATE_KEY = process.env.PRIVATE_KEY || "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80"
const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS || ""

const provider = new ethers.JsonRpcProvider(RPC_URL)
const adminWallet = new ethers.Wallet(PRIVATE_KEY, provider)

const artifactPath = path.resolve(__dirname, "../cbdc-hardhat/artifacts/contracts/eRupeeToken.sol/eRupeeToken.json")
let contractAbi = null
try {
  const artifact = JSON.parse(fs.readFileSync(artifactPath, "utf8"))
  contractAbi = artifact.abi
} catch (e) {
  console.warn("⚠️  Could not load contract ABI:", e.message)
}

const contract = CONTRACT_ADDRESS && contractAbi
  ? new ethers.Contract(CONTRACT_ADDRESS, contractAbi, adminWallet)
  : null

// Derive a deterministic wallet for each user from admin key + userId
function getUserWallet(userId) {
  const derivedKey = ethers.keccak256(
    ethers.solidityPacked(["bytes32", "uint256"], [PRIVATE_KEY.padEnd(66, "0"), userId])
  )
  return new ethers.Wallet(derivedKey, provider)
}

const app = express()
const prisma = new PrismaClient()

// Enhanced CORS configuration
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}))

app.use(express.json())

// Add request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`)
  console.log('Body:', req.body)
  next()
})

app.get("/", (req, res) => {
  res.json({ 
    status: "success",
    message: "e₹ Backend Running 🚀",
    timestamp: new Date().toISOString()
  })
})

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({ 
    status: "healthy",
    database: "connected",
    timestamp: new Date().toISOString()
  })
})

app.post("/register", async (req, res) => {
  try {
    console.log("Registration request received:", req.body)
    
    const { name, email, phone, password, state, pan } = req.body

    // Validate required fields
    if (!name || !email || !phone || !password || !state || !pan) {
      return res.status(400).json({ 
        error: "All fields are required",
        missing: {
          name: !name,
          email: !email,
          phone: !phone,
          password: !password,
          state: !state,
          pan: !pan
        }
      })
    }

    // Check if user already exists
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email: email },
          { phone: phone },
          { pan: pan }
        ]
      }
    })

    if (existingUser) {
      return res.status(409).json({ 
        error: "User already exists",
        field: existingUser.email === email ? "email" : 
               existingUser.phone === phone ? "phone" : "pan"
      })
    }

    // Create user
    const user = await prisma.user.create({
      data: { name, email, phone, password, state, pan }
    })

    console.log("User created successfully:", user.id)

    // Create wallet
    await prisma.wallet.create({
      data: { userId: user.id, balance: 0 }
    })

    console.log("Wallet created successfully for user:", user.id)

    res.status(201).json({ 
      message: "User registered successfully", 
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        state: user.state
      }
    })

  } catch (error) {
    console.error("Registration error:", error)
    res.status(500).json({ 
      error: "Something went wrong",
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    })
  }
})

app.post("/login", async (req, res) => {
  const { identifier, password } = req.body

  try {
    console.log("Login request received for:", identifier)

    if (!identifier || !password) {
      return res.status(400).json({ 
        error: "Email/Phone and password are required" 
      })
    }

    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { email: identifier },
          { phone: identifier }
        ]
      }
    })

    if (!user) {
      return res.status(404).json({ 
        error: "User not found" 
      })
    }

    if (user.password !== password) {
      return res.status(401).json({ 
        error: "Invalid password" 
      })
    }

    console.log("Login successful for user:", user.id)

    res.json({ 
      message: "Login successful", 
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        state: user.state
      }
    })

  } catch (err) {
    console.error("Login error:", err)
    res.status(500).json({ 
      error: "Server error",
      details: process.env.NODE_ENV === 'development' ? err.message : undefined
    })
  }
})

// ── Blockchain helpers ────────────────────────────────────────────────────────

// Ensure user has a wallet address; derive one if missing
async function ensureWalletAddress(userId) {
  let user = await prisma.user.findUnique({ where: { id: userId } })
  if (!user) throw new Error("User not found")
  if (!user.walletAddress) {
    const w = getUserWallet(userId)
    user = await prisma.user.update({
      where: { id: userId },
      data: { walletAddress: w.address }
    })
  }
  return user
}

// ── Blockchain Routes ─────────────────────────────────────────────────────────

app.get("/blockchain/balance/:userId", async (req, res) => {
  try {
    const userId = parseInt(req.params.userId)
    const user = await ensureWalletAddress(userId)
    const addr = user.walletAddress

    if (!contract) {
      // Fallback: return DB wallet balance
      const wallet = await prisma.wallet.findUnique({ where: { userId } })
      const bal = wallet ? wallet.balance : 0
      return res.json({ address: addr || "", balance: bal.toString(), locked: "0", available: bal.toString() })
    }

    const [rawBal, rawLocked] = await Promise.all([
      contract.balanceOf(addr),
      contract.lockedBalanceOf(addr)
    ])
    const balance = ethers.formatUnits(rawBal, 18)
    const locked = ethers.formatUnits(rawLocked, 18)
    const available = parseFloat(balance) > parseFloat(locked)
      ? (parseFloat(balance) - parseFloat(locked)).toString()
      : "0"

    res.json({ address: addr, balance, locked, available })
  } catch (e) {
    console.error("Balance error:", e)
    res.status(500).json({ error: e.message })
  }
})

app.post("/blockchain/mint", async (req, res) => {
  try {
    const { userId, amount } = req.body
    if (!userId || !amount) return res.status(400).json({ error: "userId and amount are required" })

    const user = await ensureWalletAddress(parseInt(userId))
    const addr = user.walletAddress

    let txHash = ""
    if (contract) {
      const parsed = ethers.parseUnits(amount.toString(), 18)
      const tx = await contract.mint(addr, parsed)
      await tx.wait()
      txHash = tx.hash
    }

    // Update DB wallet balance
    const parsedFloat = parseFloat(amount)
    await prisma.wallet.upsert({
      where: { userId: user.id },
      update: { balance: { increment: parsedFloat } },
      create: { userId: user.id, balance: parsedFloat }
    })

    // Record transaction
    await prisma.transaction.create({
      data: {
        amount: parsedFloat,
        status: "completed",
        fromAddress: adminWallet.address,
        toAddress: addr,
        type: "MINT",
        txHash,
        note: "Mint eINR",
        userId: user.id
      }
    })

    res.json({ txHash, status: "completed", to: addr, amount })
  } catch (e) {
    console.error("Mint error:", e)
    res.status(500).json({ error: e.message })
  }
})

app.post("/blockchain/transfer", async (req, res) => {
  try {
    const { fromUserId, toAddress, amount, note } = req.body
    if (!fromUserId || !toAddress || !amount) {
      return res.status(400).json({ error: "fromUserId, toAddress, and amount are required" })
    }

    const fromUser = await ensureWalletAddress(parseInt(fromUserId))
    const parsedFloat = parseFloat(amount)

    // Check DB balance
    const fromWallet = await prisma.wallet.findUnique({ where: { userId: fromUser.id } })
    if (!fromWallet || fromWallet.balance < parsedFloat) {
      return res.status(400).json({ error: "Insufficient balance" })
    }

    let txHash = ""
    if (contract) {
      // Use the user's derived wallet to sign the transfer
      const userWallet = getUserWallet(fromUser.id).connect(provider)
      const userContract = contract.connect(userWallet)
      const parsed = ethers.parseUnits(amount.toString(), 18)
      const tx = await userContract.transfer(toAddress, parsed)
      await tx.wait()
      txHash = tx.hash
    }

    // Update sender DB wallet
    await prisma.wallet.update({
      where: { userId: fromUser.id },
      data: { balance: { decrement: parsedFloat } }
    })

    // Try to update receiver DB wallet if they exist
    const toUser = await prisma.user.findFirst({ where: { walletAddress: toAddress } })
    if (toUser) {
      await prisma.wallet.upsert({
        where: { userId: toUser.id },
        update: { balance: { increment: parsedFloat } },
        create: { userId: toUser.id, balance: parsedFloat }
      })
      // Record incoming transaction for recipient
      await prisma.transaction.create({
        data: {
          amount: parsedFloat,
          status: "completed",
          fromAddress: fromUser.walletAddress,
          toAddress,
          type: "P2P",
          txHash,
          note: note || "",
          userId: toUser.id
        }
      })
    }

    // Record outgoing transaction for sender
    await prisma.transaction.create({
      data: {
        amount: parsedFloat,
        status: "completed",
        fromAddress: fromUser.walletAddress,
        toAddress,
        type: "P2P",
        txHash,
        note: note || "",
        userId: fromUser.id
      }
    })

    res.json({ txHash, status: "completed", from: fromUser.walletAddress, to: toAddress, amount })
  } catch (e) {
    console.error("Transfer error:", e)
    res.status(500).json({ error: e.message })
  }
})

app.post("/blockchain/lock", async (req, res) => {
  try {
    const { userId, amount, unlockTime, documentCID } = req.body
    if (!userId || !amount || !unlockTime) {
      return res.status(400).json({ error: "userId, amount, and unlockTime are required" })
    }

    const user = await ensureWalletAddress(parseInt(userId))
    const addr = user.walletAddress

    let txHash = ""
    if (contract) {
      const parsed = ethers.parseUnits(amount.toString(), 18)
      const tx = documentCID
        ? await contract.lockWithDocument(addr, parsed, parseInt(unlockTime), documentCID)
        : await contract.lockTokens(addr, parsed, parseInt(unlockTime))
      await tx.wait()
      txHash = tx.hash
    }

    await prisma.transaction.create({
      data: {
        amount: parseFloat(amount),
        status: "completed",
        fromAddress: addr,
        toAddress: addr,
        type: "LOCK",
        txHash,
        note: documentCID ? `Lock with doc: ${documentCID}` : "Lock tokens",
        userId: user.id
      }
    })

    res.json({ txHash, status: "completed" })
  } catch (e) {
    console.error("Lock error:", e)
    res.status(500).json({ error: e.message })
  }
})

app.post("/blockchain/release", async (req, res) => {
  try {
    const { userId } = req.body
    if (!userId) return res.status(400).json({ error: "userId is required" })

    const user = await ensureWalletAddress(parseInt(userId))
    const addr = user.walletAddress

    let txHash = ""
    if (contract) {
      const tx = await contract.releaseExpiredLocks(addr)
      await tx.wait()
      txHash = tx.hash
    }

    await prisma.transaction.create({
      data: {
        amount: 0,
        status: "completed",
        fromAddress: addr,
        toAddress: addr,
        type: "RELEASE",
        txHash,
        note: "Release locked tokens",
        userId: user.id
      }
    })

    res.json({ txHash, status: "completed" })
  } catch (e) {
    console.error("Release error:", e)
    res.status(500).json({ error: e.message })
  }
})

app.get("/blockchain/locks/:userId", async (req, res) => {
  try {
    const userId = parseInt(req.params.userId)
    const user = await ensureWalletAddress(userId)
    const addr = user.walletAddress

    if (!contract) return res.json({ locks: [] })

    const rawLocks = await contract.locksOf(addr)
    const locks = rawLocks.map(l => ({
      amount: ethers.formatUnits(l.amount, 18),
      unlockTime: Number(l.unlockTime),
      documentCID: l.documentCID
    }))

    res.json({ locks })
  } catch (e) {
    console.error("Locks error:", e)
    res.status(500).json({ error: e.message })
  }
})

app.get("/blockchain/transactions/:userId", async (req, res) => {
  try {
    const userId = parseInt(req.params.userId)
    const transactions = await prisma.transaction.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 50
    })
    res.json({ transactions })
  } catch (e) {
    console.error("Transactions error:", e)
    res.status(500).json({ error: e.message })
  }
})

app.get("/blockchain/info", async (req, res) => {
  try {
    if (!contract) {
      return res.json({
        blockNumber: 0, chainId: 0, networkName: "disconnected",
        timestamp: Date.now(), gasPrice: "0", contractAddress: CONTRACT_ADDRESS
      })
    }
    const [network, block] = await Promise.all([
      provider.getNetwork(),
      provider.getBlock("latest")
    ])
    const feeData = await provider.getFeeData()
    res.json({
      blockNumber: block.number,
      chainId: Number(network.chainId),
      networkName: network.name,
      timestamp: block.timestamp,
      gasPrice: feeData.gasPrice ? ethers.formatUnits(feeData.gasPrice, "gwei") : "0",
      contractAddress: CONTRACT_ADDRESS
    })
  } catch (e) {
    console.error("Info error:", e)
    res.status(500).json({ error: e.message })
  }
})

// ── User Routes ───────────────────────────────────────────────────────────────

app.get("/users", async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      select: { id: true, name: true, email: true, phone: true, state: true, walletAddress: true }
    })
    res.json({ users })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

app.put("/users/:userId", async (req, res) => {
  try {
    const userId = parseInt(req.params.userId)
    const { name, email, phone, state, pan } = req.body
    const updated = await prisma.user.update({
      where: { id: userId },
      data: { ...(name && { name }), ...(email && { email }), ...(phone && { phone }), ...(state && { state }), ...(pan && { pan }) }
    })
    res.json({
      message: "Profile updated",
      user: { id: updated.id, name: updated.name, email: updated.email, phone: updated.phone, state: updated.state, pan: updated.pan, walletAddress: updated.walletAddress }
    })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

// 404 handler
app.use((req, res) => {
  res.status(404).json({ 
    error: "Route not found",
    path: req.path 
  })
})

// Error handler
app.use((err, req, res, next) => {
  console.error("Unhandled error:", err)
  res.status(500).json({ 
    error: "Internal server error",
    details: process.env.NODE_ENV === 'development' ? err.message : undefined
  })
})

const PORT = process.env.PORT || 8000
const HOST = process.env.HOST || "0.0.0.0"

app.listen(PORT, HOST, () => {
  console.log(`🚀 Server running on http://${HOST}:${PORT}`)
  console.log(`📱 Android Emulator: Use http://10.0.2.2:${PORT}`)
  console.log(`💻 Local Network: Use http://<your-ip>:${PORT}`)
  console.log(`🌐 Environment: ${process.env.NODE_ENV || 'development'}`)
})

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM signal received: closing HTTP server')
  await prisma.$disconnect()
  process.exit(0)
})

process.on('SIGINT', async () => {
  console.log('SIGINT signal received: closing HTTP server')
  await prisma.$disconnect()
  process.exit(0)
})