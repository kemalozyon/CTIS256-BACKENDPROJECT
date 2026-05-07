import Consumer from "../models/Consumer.js"

export const removeFromCart = async (req, res) => {
    try {
        const { product_id } = req.params

        const cart_id = await Consumer.findCart(req.consumerId)
        if(!cart_id){
            return res.status(404).json({ message: "Cart is empty" })
        }

        const removed = await Consumer.removeCartItem(cart_id, product_id)
        if(!removed){
            return res.status(404).json({ message: "Item not in cart" })
        }

        const items = await Consumer.fetchCartItems(cart_id)
        req.session.cart = { id: cart_id, items }

        res.status(200).json({
            message: "Item removed",
            cart: req.session.cart
        })
    } catch (error) {
        res.status(500).json({ message: `Server error ${error.message}` })
    }
}

export const addToCart = async (req, res) => {
    try {
        const { product_id, quantity = 1 } = req.body

        if(!product_id){
            return res.status(400).json({ message: "product_id is required" })
        }
        if(quantity < 1){
            return res.status(400).json({ message: "quantity must be a positive integer" })
        }

        const cart_id = await Consumer.getOrCreateCart(req.consumerId)
        const result = await Consumer.addCartItem(cart_id, product_id, quantity)

        if(!result.ok){
            if(result.reason === "not_found"){
                return res.status(404).json({ message: "Product not found" })
            }
            if(result.reason === "insufficient_stock"){
                return res.status(400).json({
                    message: `Only ${result.available} in stock`,
                    available: result.available
                })
            }
            return res.status(400).json({ message: "Could not add to cart" })
        }

        const items = await Consumer.fetchCartItems(cart_id)
        req.session.cart = { id: cart_id, items }

        res.status(200).json({
            message: "Cart updated",
            cart: req.session.cart
        })
    } catch (error) {
        res.status(500).json({ message: `Server error ${error.message}` })
    }
}

export const getCart = async (req, res) => {
    try{
        const cart_id = await Consumer.findCart(req.consumerId)
        if(!cart_id){
            return res.status(200).json({ cart: { id: null, items: [] } })
        }
        const items = await Consumer.fetchCartItems(cart_id)
        res.status(200).json({ cart: { id: cart_id, items } })
    }catch(error){
        res.status(500).json({ message: `Server error ${error.message}` })
    }
}

export const purchase = async (req, res) => {
    try{
        const cart_id = await Consumer.findCart(req.consumerId)
        if(!cart_id){
            return res.status(400).json({ message: "Cart is empty" })
        }

        const result = await Consumer.purchaseCart(cart_id)

        if(!result.ok){
            if(result.reason === "empty"){
                return res.status(400).json({ message: "Cart is empty" })
            }
            if(result.reason === "insufficient_stock"){
                return res.status(400).json({
                    message: `Insufficient stock for "${result.title}": only ${result.available} available, you requested ${result.requested}`,
                    title: result.title,
                    requested: result.requested,
                    available: result.available
                })
            }
            return res.status(400).json({ message: "Purchase failed" })
        }

        req.session.cart = { id: cart_id, items: [] }
        res.status(200).json({ message: "Purchase successful", count: result.count })
    }catch(error){
        res.status(500).json({ message: `Server error ${error.message}` })
    }
}
