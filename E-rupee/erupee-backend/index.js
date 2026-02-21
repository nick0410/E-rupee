require("dotenv").config()

const express = require("express")
const cors = require("cors")
const { PrismaClient } = require("@prisma/client")
const { ethers } = require("ethers")
const fs = require("fs")
const path = require("path")

const app = express()
const prisma = new PrismaClient()

// ─── Blockchain Setup ───
const RPC_URL = process.env.RPC_URL || "http://127.0.0.1:8545"
const PRIVATE_KEY = process.env.PRIVATE_KEY || "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80"
const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS || ""

const provider = new ethers.JsonRpcProvider(RPC_URL)
const adminWallet = new ethers.Wallet(PRIVATE_KEY, provider)

let contract = null
try {
  const artifactPath = path.resolve(__dirname, "../../cbdc-hardhat/artifacts/contracts/eRupeeToken.sol/eRupeeToken.json")
  if (fs.existsSync(artifactPath)) {
    const artifact = JSON.parse(fs.readFileSync(artifactPath, "utf8"))
    if (CONTRACT_ADDRESS) {
      contract = new ethers.Contract(CONTRACT_ADDRESS, artifact.abi, adminWallet)
      console.log("🔗 Blockchain contract loaded at", CONTRACT_ADDRESS)
    } else {
      console.warn("⚠️  CONTRACT_ADDRESS not set – blockchain routes will return errors")
    }
  }
} catch (e) {
  console.error("Blockchain init error:", e.message)
}

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

    // Create user with auto-generated wallet address
    const newWallet = ethers.Wallet.createRandom()
    const user = await prisma.user.create({
      data: { name, email, phone, password, state, pan, walletAddress: newWallet.address }
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
        state: user.state,
        walletAddress: user.walletAddress || ""
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
        state: user.state,
        walletAddress: user.walletAddress || ""
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

// ─── Blockchain Routes ───

// Get on-chain eINR balance for a user
app.get("/blockchain/balance/:userId", async (req, res) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: parseInt(req.params.userId) }, include: { Wallet: true } })
    if (!user || !user.walletAddress) return res.status(404).json({ error: "User has no on-chain wallet" })
    if (!contract) return res.status(500).json({ error: "Contract not configured" })
    const bal = await contract.balanceOf(user.walletAddress)
    const locked = await contract.lockedBalanceOf(user.walletAddress)
    const available = await contract.availableBalanceOf(user.walletAddress)
    res.json({
      address: user.walletAddress,
      balance: ethers.formatUnits(bal, 18),
      locked: ethers.formatUnits(locked, 18),
      available: ethers.formatUnits(available, 18)
    })
  } catch (e) { res.status(500).json({ error: e.message }) }
})

// Mint eINR to a user (admin-only in real app)
app.post("/blockchain/mint", async (req, res) => {
  if (!contract) return res.status(500).json({ error: "Contract not configured" })
  const { userId, amount } = req.body
  if (!userId || !amount) return res.status(400).json({ error: "missing userId or amount" })
  try {
    const user = await prisma.user.findUnique({ where: { id: parseInt(userId) } })
    if (!user || !user.walletAddress) return res.status(404).json({ error: "User has no on-chain wallet" })
    const tx = await contract.mint(user.walletAddress, ethers.parseUnits(amount.toString(), 18))
    await tx.wait()
    // Record in DB
    await prisma.transaction.create({
      data: {
        fromAddress: 'RBI_CENTRAL_MINT',
        toAddress: user.walletAddress,
        amount: parseFloat(amount),
        type: 'MINT',
        status: 'completed',
        txHash: tx.hash,
        note: 'RBI authorized minting',
        userId: user.id,
      }
    })
    res.json({ tx: tx.hash, to: user.walletAddress, amount })
  } catch (e) { res.status(500).json({ error: e.message }) }
})

// Lock eINR tokens for a user
app.post("/blockchain/lock", async (req, res) => {
  if (!contract) return res.status(500).json({ error: "Contract not configured" })
  const { userId, amount, unlockTime, documentCID } = req.body
  if (!userId || !amount || !unlockTime) return res.status(400).json({ error: "missing userId, amount, or unlockTime" })
  try {
    const user = await prisma.user.findUnique({ where: { id: parseInt(userId) } })
    if (!user || !user.walletAddress) return res.status(404).json({ error: "User has no on-chain wallet" })
    const parsedAmount = ethers.parseUnits(amount.toString(), 18)
    const tx = documentCID
      ? await contract.lockWithDocument(user.walletAddress, parsedAmount, parseInt(unlockTime), documentCID)
      : await contract.lockTokens(user.walletAddress, parsedAmount, parseInt(unlockTime))
    await tx.wait()
    // Record in DB
    await prisma.transaction.create({
      data: {
        fromAddress: user.walletAddress,
        toAddress: 'TIME_LOCK_VAULT',
        amount: parseFloat(amount),
        type: 'LOCK',
        status: 'completed',
        txHash: tx.hash,
        note: documentCID ? `Locked with document: ${documentCID}` : 'Time-locked tokens',
        userId: user.id,
      }
    })
    res.json({ tx: tx.hash })
  } catch (e) { res.status(500).json({ error: e.message }) }
})

// Release expired locks
app.post("/blockchain/release", async (req, res) => {
  if (!contract) return res.status(500).json({ error: "Contract not configured" })
  const { userId } = req.body
  try {
    const user = await prisma.user.findUnique({ where: { id: parseInt(userId) } })
    if (!user || !user.walletAddress) return res.status(404).json({ error: "User has no on-chain wallet" })
    const tx = await contract.releaseExpiredLocks(user.walletAddress)
    await tx.wait()
    res.json({ tx: tx.hash })
  } catch (e) { res.status(500).json({ error: e.message }) }
})

// Get lock entries for a user
app.get("/blockchain/locks/:userId", async (req, res) => {
  try {
    if (!contract) return res.status(500).json({ error: "Contract not configured" })
    const user = await prisma.user.findUnique({ where: { id: parseInt(req.params.userId) } })
    if (!user || !user.walletAddress) return res.status(404).json({ error: "User has no on-chain wallet" })
    const locks = await contract.locksOf(user.walletAddress)
    const result = locks.map(l => ({
      amount: ethers.formatUnits(l.amount, 18),
      unlockTime: Number(l.unlockTime),
      documentCID: l.documentCID
    }))
    res.json({ locks: result })
  } catch (e) { res.status(500).json({ error: e.message }) }
})

// Transfer eINR between users (P2P)
app.post("/blockchain/transfer", async (req, res) => {
  if (!contract) return res.status(500).json({ error: "Contract not configured" })
  const { fromUserId, toAddress, amount, note } = req.body
  if (!fromUserId || !toAddress || !amount) return res.status(400).json({ error: "missing fromUserId, toAddress, or amount" })
  try {
    const user = await prisma.user.findUnique({ where: { id: parseInt(fromUserId) } })
    if (!user || !user.walletAddress) return res.status(404).json({ error: "Sender has no on-chain wallet" })
    const parsedAmount = ethers.parseUnits(amount.toString(), 18)
    // Check sender balance
    const senderBal = await contract.availableBalanceOf(user.walletAddress)
    if (senderBal < parsedAmount) return res.status(400).json({ error: "Insufficient available balance" })
    // CBDC Transfer: Admin mints to receiver (central bank mediated)
    const mintTx = await contract.mint(toAddress, parsedAmount)
    await mintTx.wait()
    
    // Record the transaction in DB
    await prisma.transaction.create({
      data: {
        fromAddress: user.walletAddress,
        toAddress: toAddress,
        amount: parseFloat(amount),
        type: 'P2P',
        status: 'completed',
        txHash: mintTx.hash,
        note: note || '',
        userId: user.id,
      }
    })
    
    res.json({ 
      tx: mintTx.hash, 
      from: user.walletAddress, 
      to: toAddress, 
      amount,
      status: 'completed',
      timestamp: new Date().toISOString()
    })
  } catch (e) { res.status(500).json({ error: e.message }) }
})

// Get transaction history for a user
app.get("/blockchain/transactions/:userId", async (req, res) => {
  try {
    const userId = parseInt(req.params.userId)
    const user = await prisma.user.findUnique({ where: { id: userId } })
    if (!user) return res.status(404).json({ error: "User not found" })
    
    const txns = await prisma.transaction.findMany({
      where: { userId: userId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    })
    
    res.json({ transactions: txns })
  } catch (e) { res.status(500).json({ error: e.message }) }
})

// Get all users (for address lookup)
app.get("/users", async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      select: { id: true, name: true, email: true, phone: true, walletAddress: true, state: true }
    })
    res.json({ users })
  } catch (e) { res.status(500).json({ error: e.message }) }
})

// Update user profile
app.put("/users/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id)
    const { name, email, phone, state, pan } = req.body
    const updateData = {}
    if (name !== undefined) updateData.name = name
    if (email !== undefined) updateData.email = email
    if (phone !== undefined) updateData.phone = phone
    if (state !== undefined) updateData.state = state
    if (pan !== undefined) updateData.pan = pan

    const user = await prisma.user.update({
      where: { id },
      data: updateData,
      select: { id: true, name: true, email: true, phone: true, state: true, pan: true, walletAddress: true }
    })
    res.json({ message: "Profile updated", user })
  } catch (e) {
    if (e.code === 'P2025') return res.status(404).json({ error: "User not found" })
    if (e.code === 'P2002') return res.status(409).json({ error: `${e.meta?.target?.[0] || 'Field'} already taken` })
    res.status(500).json({ error: e.message })
  }
})

// Get user by wallet address
app.get("/user/by-address/:address", async (req, res) => {
  try {
    const user = await prisma.user.findFirst({
      where: { walletAddress: req.params.address },
      select: { id: true, name: true, email: true, phone: true, walletAddress: true, state: true }
    })
    if (!user) return res.status(404).json({ error: "User not found" })
    res.json({ user })
  } catch (e) { res.status(500).json({ error: e.message }) }
})

// Blockchain network info
app.get("/blockchain/info", async (req, res) => {
  try {
    const blockNumber = await provider.getBlockNumber()
    const block = await provider.getBlock(blockNumber)
    const network = await provider.getNetwork()
    
    res.json({
      blockNumber,
      chainId: Number(network.chainId),
      networkName: network.name,
      timestamp: block ? block.timestamp : 0,
      gasPrice: ethers.formatUnits(await provider.getFeeData().then(f => f.gasPrice || 0n), 'gwei'),
      contractAddress: CONTRACT_ADDRESS,
    })
  } catch (e) { res.status(500).json({ error: e.message }) }
})

// ─── End Blockchain Routes ───

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