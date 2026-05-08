import express from "express"
import dotenv from "dotenv"
import session from "express-session"
import path from "path"
import { fileURLToPath } from "url"
import authRouter from "./routers/authRouter.js"
import marketRouter from "./routers/marketRouter.js"
import consumerRouter from "./routers/consumerRouter.js"
dotenv.config()

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const app = express()

app.use(express.json())
app.use(express.urlencoded({extended: true}))

app.use(session({
    secret: process.env.SESSION_SECRET || "dev-secret",
    resave: false,
    saveUninitialized: false,
    cookie: {
        httpOnly: true,
        maxAge: 1000 * 60 * 60 * 24
    }
}))

app.use("/api/auth", authRouter)
app.use("/api/market", marketRouter)
app.use("/api/cart", consumerRouter)

app.use(express.static(path.join(__dirname, "views")))
app.use("/uploads", express.static(path.join(__dirname, "uploads")))
app.use(express.static("public"))

app.get("/", (_req, res) => {
    res.sendFile(path.join(__dirname, "views", "index.html"))
})

// multer error handler
app.use((err, _req, res, _next) => {
    if (err.name === "MulterError" || err.message === "Only image files are allowed") {
        return res.status(400).json({ message: err.message })
    }
    res.status(500).json({ message: "Internal server error" })
})

const PORT = process.env.PORT || 3000

app.listen(PORT, () => {
    console.log(`Server started at http://localhost:${PORT}`)
})
