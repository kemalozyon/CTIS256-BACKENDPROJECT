import express from "express"
import {
    add_products, delete_product,
    get_market_products, get_products,
    updateProduct, get_my_products, search_products
} from "../controllers/MarketController.js"
import { requireMarket } from "../middleware/requireMarket.js"
import { upload } from "../middleware/upload.js"

const router = express.Router()

router.get("/products", get_products)
router.get("/search", search_products)
router.get("/my/products", requireMarket, get_my_products)
router.get("/:id/products", get_market_products)
router.post("/products", requireMarket, upload.single("image"), add_products)
router.put("/products/:id", requireMarket, upload.single("image"), updateProduct)
router.delete("/products/:id", requireMarket, delete_product)


export default router;
