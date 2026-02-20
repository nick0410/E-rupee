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