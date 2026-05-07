import Market from "../models/Market.js";
import Consumer from "../models/Consumer.js";


export const get_my_products = async (req, res) => {
    try{
        const rows = await Market.fetchMarketProduct(req.marketId)
        res.status(200).json({ message: "ok", products: rows ?? [] })
    }catch(error){
        res.status(500).json({ message: `Server error ${error.message}` })
    }
}

export const search_products = async (req, res) => {
    try{
        const sess = req.session?.user
        if(!sess || sess.role !== "consumer"){
            return res.status(401).json({ message: "Consumer login required" })
        }
        const consumer = await Consumer.fetchById(sess.id)
        if(!consumer){
            return res.status(404).json({ message: "Consumer not found" })
        }

        const keyword = (req.query.q || "").trim()
        const page = Math.max(1, parseInt(req.query.page) || 1)
        const pageSize = 4
        const offset = (page - 1) * pageSize

        const { rows, total } = await Market.searchForConsumer(
            consumer.city, consumer.district, keyword, pageSize, offset
        )

        res.status(200).json({
            message: "ok",
            products: rows,
            page,
            pageSize,
            total,
            totalPages: Math.max(1, Math.ceil(total / pageSize))
        })
    }catch(error){
        res.status(500).json({ message: `Server error ${error.message}` })
    }
}


export const get_market_products = async(req, res) => {
    try{
        const result = await Market.fetchMarketProduct(req.params.id)

        if(result === null){
            return res.status(404).json({ message: "Market not found" })
        }

        res.status(200).json({
            message: "Products found",
            result
        })
    }catch(error){
        res.status(500).json({ message: `Server error ${error.message}` })
    }
}


export const get_products = async (req, res) => {
    try{
        const myProduct = await Market.fetchAllProductsFromAllMarket()
        return res.status(200).json({
            message: "Successfully fetching products",
            myProduct
        })
    }catch(error){
        res.status(500).json({ message: `Server error ${error.message}` })
    }
}

export const add_products = async (req, res) => {
    try {
        const { title, stock, normal_price, discount_price, exp_date, image_url } = req.body
        const resolvedImageUrl = req.file ? `/uploads/${req.file.filename}` : (image_url ?? null)

        const id = await Market.createProduct(
            req.marketId,
            title,
            stock,
            normal_price,
            discount_price,
            exp_date,
            resolvedImageUrl
        )

        res.status(201).json({
            message: "Product added",
            product: {
                id,
                market_id: req.marketId,
                title,
                stock,
                normal_price,
                discount_price,
                exp_date,
                image_url: resolvedImageUrl
            }
        })
    } catch (error) {
        res.status(500).json({ message: `Server error ${error.message}` })
    }
}

export const delete_product = async(req, res) => {
    try{
        const id = req.params.id
        const check = await Market.deleteProduct(id, req.marketId)
        if(!check){
            return res.status(404).json({
                message: "The product with this id couldn't found"
            })
        }
        res.status(200).json({
            message: "The product deleted successfully"
        })
    }catch(error){
        res.status(500).json({ message: `Server error ${error.message}` })
    }
}

export const updateProduct = async (req, res) => {
    try{
        const id = req.params.id
        const market_id = req.marketId
        const { title, stock, normal_price, discount_price, exp_date, image_url } = req.body
        const resolvedImageUrl = req.file ? `/uploads/${req.file.filename}` : (image_url ?? null)

        const updated = await Market.updateProduct(
            id,
            market_id,
            title,
            stock,
            normal_price,
            discount_price,
            exp_date,
            resolvedImageUrl
        )

        if(!updated){
            return res.status(404).json({
                message: "The product with this id couldn't found"
            })
        }

        res.status(200).json({
            message: "Product updated",
            product: {
                id,
                market_id,
                title,
                stock,
                normal_price,
                discount_price,
                exp_date,
                image_url: resolvedImageUrl
            }
        })
    }catch(error){
        res.status(500).json({ message: `Server error ${error.message}` })
    }
}