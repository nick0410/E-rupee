require("dotenv").config()

const express = require("express")
const cors = require("cors")
const { PrismaClient } = require("@prisma/client")

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
        state: user.state,
        walletAddress: user.walletAddress
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

// ── Users list ──
app.get("/users", async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        state: true,
        walletAddress: true
      }
    })
    res.json({ users })
  } catch (err) {
    console.error("Get users error:", err)
    res.status(500).json({ error: "Server error" })
  }
})

// ── Update user profile ──
app.put("/users/:userId", async (req, res) => {
  try {
    const userId = parseInt(req.params.userId)
    const { name, email, phone, state, pan } = req.body

    const updated = await prisma.user.update({
      where: { id: userId },
      data: {
        ...(name && { name }),
        ...(email && { email }),
        ...(phone && { phone }),
        ...(state && { state }),
        ...(pan && { pan })
      }
    })

    res.json({
      message: "Profile updated successfully",
      user: {
        id: updated.id,
        name: updated.name,
        email: updated.email,
        phone: updated.phone,
        state: updated.state,
        walletAddress: updated.walletAddress
      }
    })
  } catch (err) {
    console.error("Update profile error:", err)
    res.status(500).json({ error: "Server error" })
  }
})

// ────────────────────────────────────────────
// Blockchain endpoints
// ────────────────────────────────────────────

// Helper: generate a fake tx hash (simulated blockchain)
function fakeTxHash() {
  const chars = '0123456789abcdef'
  let hash = '0x'
  for (let i = 0; i < 64; i++) hash += chars[Math.floor(Math.random() * 16)]
  return hash
}

// Helper: get or create wallet address for user
async function ensureWalletAddress(userId) {
  const user = await prisma.user.findUnique({ where: { id: userId } })
  if (user.walletAddress) return user.walletAddress

  // Generate a deterministic-ish address
  const addr = '0x' + Buffer.from(`user-${userId}-erupee`).toString('hex').padStart(40, '0').slice(0, 40)
  await prisma.user.update({ where: { id: userId }, data: { walletAddress: addr } })
  return addr
}

// GET /blockchain/balance/:userId
app.get("/blockchain/balance/:userId", async (req, res) => {
  try {
    const userId = parseInt(req.params.userId)

    const [wallet, user] = await Promise.all([
      prisma.wallet.findUnique({ where: { userId } }),
      prisma.user.findUnique({ where: { id: userId } })
    ])

    if (!wallet || !user) {
      return res.status(404).json({ error: "User or wallet not found" })
    }

    const address = user.walletAddress || await ensureWalletAddress(userId)

    // Calculate locked from locked transactions
    const lockedTxs = await prisma.transaction.findMany({
      where: { userId, type: "LOCK", status: "locked" }
    })
    const lockedBalance = lockedTxs.reduce((sum, tx) => sum + tx.amount, 0)
    const available = Math.max(0, wallet.balance - lockedBalance)

    res.json({
      address,
      balance: wallet.balance.toString(),
      locked: lockedBalance.toString(),
      available: available.toString()
    })
  } catch (err) {
    console.error("Balance error:", err)
    res.status(500).json({ error: "Server error" })
  }
})

// POST /blockchain/mint
app.post("/blockchain/mint", async (req, res) => {
  try {
    const { userId, amount } = req.body
    const parsedAmount = parseFloat(amount)

    if (!userId || isNaN(parsedAmount) || parsedAmount <= 0) {
      return res.status(400).json({ error: "Invalid userId or amount" })
    }

    const address = await ensureWalletAddress(userId)

    await prisma.wallet.update({
      where: { userId },
      data: { balance: { increment: parsedAmount } }
    })

    const txHash = fakeTxHash()

    await prisma.transaction.create({
      data: {
        userId,
        amount: parsedAmount,
        type: "MINT",
        status: "completed",
        fromAddress: "0x0000000000000000000000000000000000000000",
        toAddress: address,
        txHash,
        note: `Minted e₹ ${parsedAmount}`
      }
    })

    res.json({ tx: txHash, from: "0x000...000", to: address, amount, status: "success" })
  } catch (err) {
    console.error("Mint error:", err)
    res.status(500).json({ error: "Server error" })
  }
})

// POST /blockchain/transfer  (P2P Send)
app.post("/blockchain/transfer", async (req, res) => {
  try {
    const { fromUserId, toAddress, amount, note } = req.body
    const parsedAmount = parseFloat(amount)

    if (!fromUserId || !toAddress || isNaN(parsedAmount) || parsedAmount <= 0) {
      return res.status(400).json({ error: "fromUserId, toAddress, and a valid amount are required" })
    }

    // Get sender wallet
    const senderWallet = await prisma.wallet.findUnique({ where: { userId: fromUserId } })
    if (!senderWallet) return res.status(404).json({ error: "Sender wallet not found" })
    if (senderWallet.balance < parsedAmount) return res.status(400).json({ error: "Insufficient balance" })

    const senderAddress = await ensureWalletAddress(fromUserId)

    // Find receiver by wallet address (if they exist in the system)
    const receiverUser = await prisma.user.findFirst({ where: { walletAddress: toAddress } })

    // Deduct from sender
    await prisma.wallet.update({
      where: { userId: fromUserId },
      data: { balance: { decrement: parsedAmount } }
    })

    // Credit receiver if they're in our system
    if (receiverUser) {
      await prisma.wallet.update({
        where: { userId: receiverUser.id },
        data: { balance: { increment: parsedAmount } }
      })
    }

    const txHash = fakeTxHash()
    const timestamp = new Date().toISOString()

    // Record transaction for sender
    await prisma.transaction.create({
      data: {
        userId: fromUserId,
        amount: parsedAmount,
        type: "TRANSFER_OUT",
        status: "completed",
        fromAddress: senderAddress,
        toAddress,
        txHash,
        note: note || ""
      }
    })

    // Record transaction for receiver if in our system
    if (receiverUser) {
      await prisma.transaction.create({
        data: {
          userId: receiverUser.id,
          amount: parsedAmount,
          type: "TRANSFER_IN",
          status: "completed",
          fromAddress: senderAddress,
          toAddress,
          txHash,
          note: note || ""
        }
      })
    }

    console.log(`Transfer: ${parsedAmount} from user ${fromUserId} to ${toAddress}, tx: ${txHash}`)

    res.json({
      tx: txHash,
      from: senderAddress,
      to: toAddress,
      amount,
      status: "success",
      timestamp
    })
  } catch (err) {
    console.error("Transfer error:", err)
    res.status(500).json({ error: "Server error", details: err.message })
  }
})

// POST /blockchain/lock
app.post("/blockchain/lock", async (req, res) => {
  try {
    const { userId, amount, unlockTime, documentCID, interestRate } = req.body
    const parsedAmount = parseFloat(amount)

    if (!userId || isNaN(parsedAmount) || !unlockTime) {
      return res.status(400).json({ error: "userId, amount, and unlockTime are required" })
    }

    const wallet = await prisma.wallet.findUnique({ where: { userId } })
    if (!wallet || wallet.balance < parsedAmount) {
      return res.status(400).json({ error: "Insufficient balance" })
    }

    const address = await ensureWalletAddress(userId)

    // Deduct locked amount from wallet
    await prisma.wallet.update({
      where: { userId },
      data: { balance: { decrement: parsedAmount } }
    })

    const txHash = fakeTxHash()

    // Build note: encode rate and unlockTime so release can use them
    const rate = interestRate != null ? parseFloat(interestRate) : 0
    let note = `rate:${rate};until:${unlockTime}`
    if (documentCID) note += `;cid:${documentCID}`

    await prisma.transaction.create({
      data: {
        userId,
        amount: parsedAmount,
        type: "LOCK",
        status: "locked",
        fromAddress: address,
        toAddress: address,
        txHash,
        note
      }
    })

    res.json({ tx: txHash, status: "locked", unlockTime })
  } catch (err) {
    console.error("Lock error:", err)
    res.status(500).json({ error: "Server error" })
  }
})

// POST /blockchain/release
app.post("/blockchain/release", async (req, res) => {
  try {
    const { userId } = req.body
    if (!userId) return res.status(400).json({ error: "userId is required" })

    const nowSecs = Math.floor(Date.now() / 1000)

    // Find all locked transactions
    const lockedTxs = await prisma.transaction.findMany({
      where: { userId, type: "LOCK", status: "locked" }
    })

    let totalPrincipalReleased = 0
    let totalInterestCredited = 0
    const address = await ensureWalletAddress(userId)

    for (const tx of lockedTxs) {
      // Parse metadata from note  (format: "rate:15;until:1234567890;cid:...")
      const noteParams = {}
      tx.note.split(";").forEach(part => {
        const [k, v] = part.split(":")
        if (k && v !== undefined) noteParams[k.trim()] = v.trim()
      })

      const unlockTime = noteParams.until ? parseInt(noteParams.until) : 0
      const rate = noteParams.rate ? parseFloat(noteParams.rate) : 0

      // Only release if expired
      if (unlockTime > 0 && nowSecs < unlockTime) {
        console.log(`Lock ${tx.id} not yet expired (unlocks at ${unlockTime}, now ${nowSecs})`)
        continue  // skip — not ready yet
      }

      // Mark as released
      await prisma.transaction.update({
        where: { id: tx.id },
        data: { status: "released" }
      })

      // Credit principal back
      totalPrincipalReleased += tx.amount

      // Calculate and credit interest if rate > 0
      if (rate > 0) {
        const interest = parseFloat((tx.amount * rate / 100).toFixed(6))
        totalInterestCredited += interest
        console.log(`Interest: e₹ ${interest} (${rate}% on ${tx.amount}) for lock ${tx.id}`)

        // Log an INTEREST_CREDIT transaction for transparency
        await prisma.transaction.create({
          data: {
            userId,
            amount: interest,
            type: "INTEREST_CREDIT",
            status: "completed",
            fromAddress: "0x0000000000000000000000000000000000000000",
            toAddress: address,
            txHash: fakeTxHash(),
            note: `Interest ${rate}% on e₹ ${tx.amount} lock #${tx.id}`
          }
        })
      }
    }

    const totalCredit = totalPrincipalReleased + totalInterestCredited

    if (totalCredit > 0) {
      await prisma.wallet.update({
        where: { userId },
        data: { balance: { increment: totalCredit } }
      })
    }

    const txHash = fakeTxHash()
    console.log(`Release: principal=${totalPrincipalReleased}, interest=${totalInterestCredited}, total=${totalCredit}`)
    res.json({
      tx: txHash,
      status: "released",
      principal: totalPrincipalReleased.toString(),
      interest: totalInterestCredited.toString(),
      total: totalCredit.toString()
    })
  } catch (err) {
    console.error("Release error:", err)
    res.status(500).json({ error: "Server error" })
  }
})

// GET /blockchain/locks/:userId
app.get("/blockchain/locks/:userId", async (req, res) => {
  try {
    const userId = parseInt(req.params.userId)

    const lockedTxs = await prisma.transaction.findMany({
      where: { userId, type: "LOCK", status: "locked" },
      orderBy: { createdAt: "desc" }
    })

    const locks = lockedTxs.map(tx => {
      // Parse new key-value format: "rate:15;until:1234567890;cid:..."
      const noteParams = {}
      tx.note.split(";").forEach(part => {
        const [k, v] = part.split(":")
        if (k && v !== undefined) noteParams[k.trim()] = v.trim()
      })

      // Support both new format (noteParams.until) and old format ("Locked until 123")
      let unlockTime
      if (noteParams.until) {
        unlockTime = parseInt(noteParams.until)
      } else {
        const oldMatch = tx.note.match(/until (\d+)/)
        unlockTime = oldMatch ? parseInt(oldMatch[1]) : Math.floor(new Date(tx.createdAt).getTime() / 1000) + 3600
      }

      const documentCID = noteParams.cid || (tx.note.includes("CID:") ? tx.note.split("CID:")[1].trim() : "")

      return {
        amount: tx.amount.toString(),
        unlockTime,
        documentCID
      }
    })

    res.json({ locks })
  } catch (err) {
    console.error("Locks error:", err)
    res.status(500).json({ error: "Server error" })
  }
})

// GET /blockchain/transactions/:userId
app.get("/blockchain/transactions/:userId", async (req, res) => {
  try {
    const userId = parseInt(req.params.userId)

    const transactions = await prisma.transaction.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 50
    })

    res.json({
      transactions: transactions.map(tx => ({
        id: tx.id,
        amount: tx.amount,
        status: tx.status,
        createdAt: tx.createdAt.toISOString(),
        fromAddress: tx.fromAddress,
        toAddress: tx.toAddress,
        type: tx.type,
        txHash: tx.txHash,
        note: tx.note,
        userId: tx.userId
      }))
    })
  } catch (err) {
    console.error("Transactions error:", err)
    res.status(500).json({ error: "Server error" })
  }
})

// GET /blockchain/info
app.get("/blockchain/info", async (req, res) => {
  res.json({
    blockNumber: Math.floor(Date.now() / 1000),
    chainId: 1337,
    networkName: "eRupee CBDC Network",
    timestamp: Math.floor(Date.now() / 1000),
    gasPrice: "0",
    contractAddress: "0x5FbDB2315678afecb367f032d93F642f64180aa3"
  })
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