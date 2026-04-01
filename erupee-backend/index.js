require("dotenv").config()

const express = require("express")
const cors = require("cors")
const { PrismaClient, Prisma } = require("@prisma/client")

const app = express()
const prisma = new PrismaClient()
const MAX_USER_LEDGER_VOLUME = 100000000
const MAX_USER_LEDGER_VOLUME_LABEL = MAX_USER_LEDGER_VOLUME.toLocaleString("en-IN")
const GLOBAL_LEDGER_CAP = parseFloat(process.env.GLOBAL_LEDGER_CAP || "100000000")
const GLOBAL_LEDGER_CAP_LABEL = GLOBAL_LEDGER_CAP.toLocaleString("en-IN")
const BLOCKCHAIN_MODE = (process.env.BLOCKCHAIN_MODE || "simulated").toLowerCase() === "onchain" ? "onchain" : "simulated"
const ONCHAIN_BACKEND_URL = process.env.ONCHAIN_BACKEND_URL || "http://127.0.0.1:3001"
const ONCHAIN_REQUEST_TIMEOUT_MS = parseInt(process.env.ONCHAIN_REQUEST_TIMEOUT_MS || "10000", 10)
const ALLOW_EXTERNAL_TRANSFER = String(process.env.ALLOW_EXTERNAL_TRANSFER || "false").toLowerCase() === "true"
const WALLET_ADDRESS_REGEX = /^0x[a-fA-F0-9]{40}$/
const FLOAT_EPSILON = 1e-9

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

class ApiError extends Error {
  constructor(status, message) {
    super(message)
    this.status = status
  }
}

function routeError(res, label, err) {
  console.error(`${label}:`, err)
  if (err instanceof ApiError) {
    return res.status(err.status).json({ error: err.message })
  }

  return res.status(500).json({
    error: "Server error",
    details: process.env.NODE_ENV === "development" ? err.message : undefined
  })
}

function toUserId(value, fieldName) {
  const parsed = Number(value)
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new ApiError(400, `${fieldName} must be a valid positive integer`)
  }
  return parsed
}

function toAmount(value, fieldName = "amount") {
  const parsed = Number(value)
  if (!Number.isFinite(parsed) || parsed <= 0) {
    throw new ApiError(400, `${fieldName} must be a valid positive number`)
  }
  return parsed
}

function normalizeWalletAddress(address) {
  const normalized = String(address || "").trim().toLowerCase()
  if (!WALLET_ADDRESS_REGEX.test(normalized)) {
    throw new ApiError(400, "toAddress must be a valid wallet address")
  }
  return normalized
}

function assertAmountWithinPerTxLimit(amount) {
  if (amount > MAX_USER_LEDGER_VOLUME) {
    throw new ApiError(400, `Amount cannot exceed e₹ ${MAX_USER_LEDGER_VOLUME_LABEL}`)
  }
}

function assertGlobalLedgerCap(currentIssued, additionalIssued) {
  if (additionalIssued <= 0) return
  const projected = currentIssued + additionalIssued
  if (projected > GLOBAL_LEDGER_CAP + FLOAT_EPSILON) {
    throw new ApiError(400, `Global issuance cap exceeded. Max allowed is e₹ ${GLOBAL_LEDGER_CAP_LABEL}`)
  }
}

async function getGlobalIssuedVolume(db = prisma) {
  const [walletAgg, lockedAgg] = await Promise.all([
    db.wallet.aggregate({ _sum: { balance: true } }),
    db.transaction.aggregate({
      where: { type: "LOCK", status: "locked" },
      _sum: { amount: true }
    })
  ])

  const walletTotal = walletAgg._sum.balance || 0
  const lockedTotal = lockedAgg._sum.amount || 0
  return walletTotal + lockedTotal
}

async function callOnchainApi(path, payload) {
  if (BLOCKCHAIN_MODE !== "onchain") return null
  if (typeof fetch !== "function") {
    throw new ApiError(500, "On-chain mode requires Node.js runtime with fetch support")
  }

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), ONCHAIN_REQUEST_TIMEOUT_MS)

  try {
    const response = await fetch(`${ONCHAIN_BACKEND_URL}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: controller.signal
    })

    let body = {}
    try {
      body = await response.json()
    } catch {
      body = {}
    }

    if (!response.ok) {
      const backendMessage = typeof body.error === "string" ? body.error : `On-chain request failed (${response.status})`
      throw new ApiError(502, backendMessage)
    }

    return body
  } catch (err) {
    if (err?.name === "AbortError") {
      throw new ApiError(504, "On-chain backend request timed out")
    }
    if (err instanceof ApiError) {
      throw err
    }
    throw new ApiError(502, `On-chain backend unavailable: ${err.message}`)
  } finally {
    clearTimeout(timeoutId)
  }
}

// Helper: generate a fake tx hash (simulated blockchain)
function fakeTxHash() {
  const chars = '0123456789abcdef'
  let hash = '0x'
  for (let i = 0; i < 64; i++) hash += chars[Math.floor(Math.random() * 16)]
  return hash
}

// Helper: get or create wallet address for user
async function ensureWalletAddress(userId, db = prisma) {
  const user = await db.user.findUnique({ where: { id: userId } })
  if (!user) {
    throw new ApiError(404, "User not found")
  }

  if (user.walletAddress) return user.walletAddress

  // Generate a deterministic-ish address
  const addr = '0x' + Buffer.from(`user-${userId}-erupee`).toString('hex').padStart(40, '0').slice(0, 40)
  await db.user.update({ where: { id: userId }, data: { walletAddress: addr } })
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
    const { userId, amount, source } = req.body
    const normalizedUserId = toUserId(userId, "userId")
    const parsedAmount = toAmount(amount)
    const isDisburse = typeof source === "string" && source.toUpperCase() === "DISBURSE"
    const isMerchantPos = typeof source === "string" && source.toUpperCase() === "MERCHANT_POS"

    assertAmountWithinPerTxLimit(parsedAmount)

    const address = await ensureWalletAddress(normalizedUserId)
    const onchainResp = await callOnchainApi("/mint", {
      to: address,
      amount: parsedAmount
    })

    const txHash = onchainResp?.tx || fakeTxHash()

    await prisma.$transaction(async (tx) => {
      await tx.wallet.upsert({
        where: { userId: normalizedUserId },
        update: {},
        create: { userId: normalizedUserId, balance: 0 }
      })

      const currentIssued = await getGlobalIssuedVolume(tx)
      assertGlobalLedgerCap(currentIssued, parsedAmount)

      await tx.wallet.update({
        where: { userId: normalizedUserId },
        data: { balance: { increment: parsedAmount } }
      })

      await tx.transaction.create({
        data: {
          userId: normalizedUserId,
          amount: parsedAmount,
          type: isDisburse ? "DISBURSE" : isMerchantPos ? "MERCHANT_POS" : "MINT",
          status: "completed",
          fromAddress: "0x0000000000000000000000000000000000000000",
          toAddress: address,
          txHash,
          note: isDisburse
            ? `Disbursed e₹ ${parsedAmount}`
            : isMerchantPos
              ? `Merchant POS charge e₹ ${parsedAmount}`
              : `Minted e₹ ${parsedAmount}`
        }
      })
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable })

    res.json({
      tx: txHash,
      from: "0x000...000",
      to: address,
      amount: parsedAmount.toString(),
      status: "success",
      mode: BLOCKCHAIN_MODE
    })
  } catch (err) {
    routeError(res, "Mint error", err)
  }
})

// POST /blockchain/transfer  (P2P Send)
app.post("/blockchain/transfer", async (req, res) => {
  try {
    const { fromUserId, toAddress, amount, note } = req.body
    const normalizedFromUserId = toUserId(fromUserId, "fromUserId")
    const normalizedToAddress = normalizeWalletAddress(toAddress)
    const parsedAmount = toAmount(amount)

    assertAmountWithinPerTxLimit(parsedAmount)

    const timestamp = new Date().toISOString()

    const transferResult = await prisma.$transaction(async (tx) => {
      const senderWallet = await tx.wallet.findUnique({ where: { userId: normalizedFromUserId } })
      if (!senderWallet) {
        throw new ApiError(404, "Sender wallet not found")
      }

      const senderAddress = await ensureWalletAddress(normalizedFromUserId, tx)
      if (senderAddress.toLowerCase() === normalizedToAddress) {
        throw new ApiError(400, "Sender and receiver address cannot be the same")
      }

      const receiverUser = await tx.user.findFirst({
        where: { walletAddress: normalizedToAddress }
      })

      if (!receiverUser && !ALLOW_EXTERNAL_TRANSFER) {
        throw new ApiError(400, "Receiver wallet not found in system")
      }

      if (receiverUser && receiverUser.id === normalizedFromUserId) {
        throw new ApiError(400, "Self transfer is not allowed")
      }

      if (receiverUser) {
        await tx.wallet.upsert({
          where: { userId: receiverUser.id },
          update: {},
          create: { userId: receiverUser.id, balance: 0 }
        })
      }

      const debited = await tx.wallet.updateMany({
        where: {
          userId: normalizedFromUserId,
          balance: { gte: parsedAmount }
        },
        data: { balance: { decrement: parsedAmount } }
      })

      if (debited.count !== 1) {
        throw new ApiError(400, "Insufficient balance")
      }

      if (receiverUser) {
        await tx.wallet.update({
          where: { userId: receiverUser.id },
          data: { balance: { increment: parsedAmount } }
        })
      }

      const txHash = fakeTxHash()

      await tx.transaction.create({
        data: {
          userId: normalizedFromUserId,
          amount: parsedAmount,
          type: "TRANSFER_OUT",
          status: "completed",
          fromAddress: senderAddress,
          toAddress: normalizedToAddress,
          txHash,
          note: note || ""
        }
      })

      if (receiverUser) {
        await tx.transaction.create({
          data: {
            userId: receiverUser.id,
            amount: parsedAmount,
            type: "TRANSFER_IN",
            status: "completed",
            fromAddress: senderAddress,
            toAddress: normalizedToAddress,
            txHash,
            note: note || ""
          }
        })
      }

      return {
        txHash,
        senderAddress,
        receiverInSystem: Boolean(receiverUser)
      }
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable })

    console.log(`Transfer: ${parsedAmount} from user ${normalizedFromUserId} to ${normalizedToAddress}, tx: ${transferResult.txHash}`)

    res.json({
      tx: transferResult.txHash,
      from: transferResult.senderAddress,
      to: normalizedToAddress,
      amount: parsedAmount.toString(),
      status: "success",
      timestamp,
      internalSettlement: transferResult.receiverInSystem
    })
  } catch (err) {
    routeError(res, "Transfer error", err)
  }
})

// POST /blockchain/lock
app.post("/blockchain/lock", async (req, res) => {
  try {
    const { userId, amount, unlockTime, documentCID, interestRate } = req.body
    const normalizedUserId = toUserId(userId, "userId")
    const parsedAmount = toAmount(amount)
    const parsedUnlockTime = Number(unlockTime)

    if (!Number.isInteger(parsedUnlockTime) || parsedUnlockTime <= Math.floor(Date.now() / 1000)) {
      return res.status(400).json({ error: "unlockTime must be a future unix timestamp" })
    }

    assertAmountWithinPerTxLimit(parsedAmount)

    const address = await ensureWalletAddress(normalizedUserId)
    const onchainResp = await callOnchainApi("/lock", {
      user: address,
      amount: parsedAmount,
      unlockTime: parsedUnlockTime,
      documentCID
    })
    const txHash = onchainResp?.tx || fakeTxHash()

    // Build note: encode rate and unlockTime so release can use them
    const parsedRate = interestRate != null ? Number(interestRate) : 0
    const rate = Number.isFinite(parsedRate) ? parsedRate : 0
    let note = `rate:${rate};until:${parsedUnlockTime}`
    if (documentCID) note += `;cid:${documentCID}`

    await prisma.$transaction(async (tx) => {
      const debited = await tx.wallet.updateMany({
        where: {
          userId: normalizedUserId,
          balance: { gte: parsedAmount }
        },
        data: { balance: { decrement: parsedAmount } }
      })

      if (debited.count !== 1) {
        throw new ApiError(400, "Insufficient balance")
      }

      await tx.transaction.create({
        data: {
          userId: normalizedUserId,
          amount: parsedAmount,
          type: "LOCK",
          status: "locked",
          fromAddress: address,
          toAddress: address,
          txHash,
          note
        }
      })
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable })

    res.json({ tx: txHash, status: "locked", unlockTime: parsedUnlockTime, mode: BLOCKCHAIN_MODE })
  } catch (err) {
    routeError(res, "Lock error", err)
  }
})

// POST /blockchain/release
app.post("/blockchain/release", async (req, res) => {
  try {
    const { userId } = req.body
    const normalizedUserId = toUserId(userId, "userId")
    const nowSecs = Math.floor(Date.now() / 1000)
    const address = await ensureWalletAddress(normalizedUserId)
    const onchainResp = await callOnchainApi("/release", { user: address })
    const releaseTxHash = onchainResp?.tx || fakeTxHash()

    const releaseSummary = await prisma.$transaction(async (tx) => {
      const lockedTxs = await tx.transaction.findMany({
        where: { userId: normalizedUserId, type: "LOCK", status: "locked" }
      })

      let totalPrincipalReleased = 0
      let totalInterestCredited = 0
      const releasableLockIds = []
      const interestTransactions = []

      for (const lockTx of lockedTxs) {
        const noteParams = {}
        String(lockTx.note || "").split(";").forEach(part => {
          const [k, v] = part.split(":")
          if (k && v !== undefined) noteParams[k.trim()] = v.trim()
        })

        const unlockTime = noteParams.until ? parseInt(noteParams.until, 10) : 0
        const rate = noteParams.rate ? parseFloat(noteParams.rate) : 0

        if (unlockTime > 0 && nowSecs < unlockTime) {
          continue
        }

        releasableLockIds.push(lockTx.id)
        totalPrincipalReleased += lockTx.amount

        if (Number.isFinite(rate) && rate > 0) {
          const interest = parseFloat((lockTx.amount * rate / 100).toFixed(6))
          totalInterestCredited += interest

          interestTransactions.push({
            userId: normalizedUserId,
            amount: interest,
            type: "INTEREST_CREDIT",
            status: "completed",
            fromAddress: "0x0000000000000000000000000000000000000000",
            toAddress: address,
            txHash: fakeTxHash(),
            note: `Interest ${rate}% on e₹ ${lockTx.amount} lock #${lockTx.id}`
          })
        }
      }

      if (releasableLockIds.length === 0) {
        return {
          totalPrincipalReleased: 0,
          totalInterestCredited: 0,
          totalCredit: 0,
          txHash: releaseTxHash
        }
      }

      const currentIssued = await getGlobalIssuedVolume(tx)
      assertGlobalLedgerCap(currentIssued, totalInterestCredited)

      const released = await tx.transaction.updateMany({
        where: {
          id: { in: releasableLockIds },
          userId: normalizedUserId,
          type: "LOCK",
          status: "locked"
        },
        data: { status: "released" }
      })

      if (released.count !== releasableLockIds.length) {
        throw new ApiError(409, "Lock release conflict. Please retry")
      }

      if (interestTransactions.length > 0) {
        await tx.transaction.createMany({
          data: interestTransactions
        })
      }

      const totalCredit = totalPrincipalReleased + totalInterestCredited
      await tx.wallet.upsert({
        where: { userId: normalizedUserId },
        update: { balance: { increment: totalCredit } },
        create: { userId: normalizedUserId, balance: totalCredit }
      })

      return {
        totalPrincipalReleased,
        totalInterestCredited,
        totalCredit,
        txHash: releaseTxHash
      }
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable })

    console.log(`Release: principal=${releaseSummary.totalPrincipalReleased}, interest=${releaseSummary.totalInterestCredited}, total=${releaseSummary.totalCredit}`)
    res.json({
      tx: releaseSummary.txHash,
      status: "released",
      principal: releaseSummary.totalPrincipalReleased.toString(),
      interest: releaseSummary.totalInterestCredited.toString(),
      total: releaseSummary.totalCredit.toString()
    })
  } catch (err) {
    routeError(res, "Release error", err)
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
    contractAddress: "0x5FbDB2315678afecb367f032d93F642f64180aa3",
    mode: BLOCKCHAIN_MODE,
    globalCap: GLOBAL_LEDGER_CAP.toString(),
    allowExternalTransfer: ALLOW_EXTERNAL_TRANSFER,
    onchainBackendUrl: BLOCKCHAIN_MODE === "onchain" ? ONCHAIN_BACKEND_URL : null
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