import Market from "../models/Market.js"
import Consumer from "../models/Consumer.js"
import { savePending, getPending, deletePending, refreshPendingCode } from "../utils/pendingStore.js"
import { sendVerificationCode } from "../utils/emailService.js"

export const marketRegister = async (req, res) => {
    try {
        const { email, name, password, city, district } = req.body;
        if (!email || !name || !password || !city || !district) {
            return res.status(400).json({ message: "All fields are required" });
        }

        const exists = await Market.emailExists(email);
        if (exists) {
            return res.status(409).json({ message: "Email already registered" });
        }

        const code = savePending(email, { email, name, password, city, district, role: "market" });
        await sendVerificationCode(email, code);

        res.status(200).json({ message: "Verification code sent to your email" });
    } catch (error) {
        res.status(500).json({ message: `Server error: ${error.message}` });
    }
}

export const marketLogin = async (req, res) => {
    try {
        const { email, password } = req.body;

        const user = await Market.checkUser(email, password)

        if (!user) {
            return res.status(401).json({ message: "Password or email incorrect" })
        }

        req.session.user = { id: user.id, role: "market" }

        res.status(200).json({
            message: "successfull",
            user: {
                id: user.id,
                mail: user.email,
                name: user.name,
                city: user.city,
                district: user.district
            }
        })

    } catch (error) {
        res.status(500).json({ message: `Server error ${error.message}` })
    }
}

export const consumerLogin = async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await Consumer.checkUser(email, password)

        if (!user) {
            return res.status(401).json({ message: "Password or email is wrong" })
        }

        req.session.user = { id: user.id, role: "consumer" }

        res.status(200).json({
            message: "Successfull login",
            user: {
                id: user.id,
                email: user.email,
                full_name: user.full_name,
                city: user.city,
                district: user.district
            }
        })
    } catch (error) {
        res.status(500).json({ message: `Server error ${error.message}` })
    }
}

export const logout = (req, res) => {
    if (!req.session?.user) {
        return res.status(401).json({ message: "Not logged in" })
    }
    req.session.destroy((err) => {
        if (err) {
            return res.status(500).json({ message: `Server error ${err.message}` })
        }
        res.clearCookie("connect.sid")
        res.status(200).json({ message: "Logged out" })
    })
}

export const consumerRegister = async (req, res) => {
    try {
        const { email, name, password, city, district } = req.body;
        if (!email || !name || !password || !city || !district) {
            return res.status(400).json({ message: "All fields are required" });
        }

        const exists = await Consumer.emailExists(email);
        if (exists) {
            return res.status(409).json({ message: "Email already registered" });
        }

        const code = savePending(email, { email, name, password, city, district, role: "consumer" });
        await sendVerificationCode(email, code);

        res.status(200).json({ message: "Verification code sent to your email" });
    } catch (error) {
        res.status(500).json({ message: `Server error: ${error.message}` });
    }
}

export const verifyEmail = async (req, res) => {
    try {
        const { email, code, role } = req.body;
        if (!email || !code || !role) {
            return res.status(400).json({ message: "email, code and role are required" });
        }

        const pending = getPending(email);
        if (!pending) {
            return res.status(400).json({ message: "Code expired or not found. Please register again." });
        }
        if (pending.role !== role) {
            return res.status(400).json({ message: "Invalid request" });
        }
        if (pending.code !== String(code).trim()) {
            return res.status(400).json({ message: "Incorrect verification code" });
        }

        if (role === "market") {
            await Market.create(pending.email, pending.name, pending.password, pending.city, pending.district);
        } else {
            await Consumer.create(pending.email, pending.name, pending.password, pending.city, pending.district);
        }

        deletePending(email);
        res.status(201).json({ message: "Email verified. Your account is ready." });
    } catch (error) {
        res.status(500).json({ message: `Server error: ${error.message}` });
    }
}

export const resendCode = async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) {
            return res.status(400).json({ message: "email is required" });
        }

        const newCode = refreshPendingCode(email);
        if (!newCode) {
            return res.status(400).json({ message: "No pending registration found. Please register again." });
        }

        await sendVerificationCode(email, newCode);
        res.status(200).json({ message: "Code resent successfully" });
    } catch (error) {
        res.status(500).json({ message: `Server error: ${error.message}` });
    }
}

export const me = async (req, res) => {
    const sess = req.session?.user
    if (!sess) {
        return res.status(401).json({ message: "Not logged in" })
    }
    try {
        const user = sess.role === "market"
            ? await Market.fetchById(sess.id)
            : await Consumer.fetchById(sess.id)
        if (!user) {
            return res.status(404).json({ message: "User not found" })
        }
        res.status(200).json({ role: sess.role, user })
    } catch (error) {
        res.status(500).json({ message: `Server error ${error.message}` })
    }
}

export const updateMarketProfile = async (req, res) => {
    try {
        const { name, city, district } = req.body
        if (!name || !city || !district) {
            return res.status(400).json({ message: "name, city and district are required" })
        }
        const updated = await Market.updateProfile(req.marketId, name, city, district)
        if (!updated) {
            return res.status(404).json({ message: "Market not found" })
        }
        const user = await Market.fetchById(req.marketId)
        res.status(200).json({ message: "Profile updated", user })
    } catch (error) {
        res.status(500).json({ message: `Server error ${error.message}` })
    }
}

export const updateConsumerProfile = async (req, res) => {
    try {
        const { full_name, city, district } = req.body
        if (!full_name || !city || !district) {
            return res.status(400).json({ message: "full_name, city and district are required" })
        }
        const updated = await Consumer.updateProfile(req.consumerId, full_name, city, district)
        if (!updated) {
            return res.status(404).json({ message: "Consumer not found" })
        }
        const user = await Consumer.fetchById(req.consumerId)
        res.status(200).json({ message: "Profile updated", user })
    } catch (error) {
        res.status(500).json({ message: `Server error ${error.message}` })
    }
}
