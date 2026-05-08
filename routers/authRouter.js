import express from "express"
import {
    marketRegister, marketLogin,
    consumerLogin, consumerRegister,
    logout, me,
    updateMarketProfile, updateConsumerProfile,
    verifyEmail, resendCode
} from "../controllers/authController.js"
import { requireMarket } from "../middleware/requireMarket.js"
import { requireConsumer } from "../middleware/requireConsumer.js"

const router = express.Router()

router.post("/register/market", marketRegister)
router.post("/login/market", marketLogin)
router.post("/register/consumer", consumerRegister)
router.post("/login/consumer", consumerLogin)
router.post("/logout", logout)
router.post("/verify-email", verifyEmail)
router.post("/resend-code", resendCode)

router.get("/me", me)
router.put("/market/profile", requireMarket, updateMarketProfile)
router.put("/consumer/profile", requireConsumer, updateConsumerProfile)

export default router;
