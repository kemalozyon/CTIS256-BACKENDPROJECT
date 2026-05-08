import express from "express"
import { addToCart, removeFromCart, getCart, purchase } from "../controllers/consumerController.js"
import { requireConsumer } from "../middleware/requireConsumer.js"

const router = express.Router()

router.get("/", requireConsumer, getCart)
router.post("/items", requireConsumer, addToCart)
router.delete("/items/:product_id", requireConsumer, removeFromCart)
router.post("/purchase", requireConsumer, purchase)

export default router;
