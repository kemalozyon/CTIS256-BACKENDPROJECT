import { db } from "../config/db.js";
import crypto from "crypto"
import { function_decrypt, comparePassword } from "../utils/passwordCrypt.js";

class Consumer{
    static async create(email, full_name, password, city, district){
        const id = crypto.randomUUID()
        const hashed_password = await function_decrypt(password)
        await db.execute(
            "insert into consumer values (?, ?, ?, ?, ?, ?)", [id, email, full_name, hashed_password, city, district]
        )
    }

    static async emailExists(email){
        const [rows] = await db.execute(
            "select 1 from consumer where email = ? limit 1", [email]
        )
        return rows.length > 0
    }


    static async checkUser(email, password){
        try{
            const [user] = await db.execute(
                "select * from consumer where email = ?", [email]
            )

            if(user.length === 0){
                return null;
            }

            const match = await comparePassword(password, user[0].password_hash)
            if(!match){
                return null
            }

            return user[0]
        }catch(error){

        }
    }

    static async findCart(consumer_id){
        const [rows] = await db.execute(
            "select id from carts where consumer_id = ? limit 1", [consumer_id]
        )
        return rows.length > 0 ? rows[0].id : null
    }

    static async getOrCreateCart(consumer_id){
        const existing = await Consumer.findCart(consumer_id)
        if(existing) return existing

        const id = crypto.randomUUID()
        await db.execute(
            "insert into carts (id, consumer_id) values (?, ?)", [id, consumer_id]
        )
        return id
    }

    static async addCartItem(cart_id, product_id, quantity){
        const [prod] = await db.execute(
            "select stock from products where id = ? limit 1", [product_id]
        )
        if(prod.length === 0){
            return { ok: false, reason: "not_found" }
        }
        if(quantity > prod[0].stock){
            return { ok: false, reason: "insufficient_stock", available: prod[0].stock }
        }

        const [updated] = await db.execute(
            "update cart_items set quantity = ? where cart_id = ? and product_id = ?",
            [quantity, cart_id, product_id]
        )

        if(updated.affectedRows > 0) return { ok: true }

        const id = crypto.randomUUID()
        await db.execute(
            "insert into cart_items (id, cart_id, product_id, quantity) values (?, ?, ?, ?)",
            [id, cart_id, product_id, quantity]
        )
        return { ok: true }
    }

    static async removeCartItem(cart_id, product_id){
        const [result] = await db.execute(
            "delete from cart_items where cart_id = ? and product_id = ?",
            [cart_id, product_id]
        )
        return result.affectedRows > 0
    }

    static async fetchCartItems(cart_id){
        const [rows] = await db.execute(
            `select
                ci.id as item_id,
                ci.quantity,
                p.id as product_id,
                p.market_id,
                p.title,
                p.stock,
                p.normal_price,
                p.discount_price,
                p.exp_date,
                p.image_url,
                m.name as market_name
             from cart_items ci
             join products p on p.id = ci.product_id
             join markets m on m.id = p.market_id
             where ci.cart_id = ?`,
            [cart_id]
        )
        return rows
    }

    static async fetchById(id){
        const [rows] = await db.execute(
            "select id, email, full_name, city, district from consumer where id = ? limit 1", [id]
        )
        return rows.length > 0 ? rows[0] : null
    }

    static async updateProfile(id, full_name, city, district){
        const [result] = await db.execute(
            "update consumer set full_name = ?, city = ?, district = ? where id = ?",
            [full_name, city, district, id]
        )
        return result.affectedRows > 0
    }

    static async purchaseCart(cart_id){
        const conn = await db.getConnection()
        try{
            await conn.beginTransaction()

            const [items] = await conn.execute(
                `select ci.product_id, ci.quantity, p.stock, p.title
                 from cart_items ci
                 join products p on p.id = ci.product_id
                 where ci.cart_id = ?
                 for update`, [cart_id]
            )

            if(items.length === 0){
                await conn.rollback()
                return { ok: false, reason: "empty" }
            }

            for(const item of items){
                if(item.quantity > item.stock){
                    await conn.rollback()
                    return {
                        ok: false,
                        reason: "insufficient_stock",
                        title: item.title,
                        requested: item.quantity,
                        available: item.stock
                    }
                }
            }

            for(const item of items){
                await conn.execute(
                    "update products set stock = stock - ? where id = ?",
                    [item.quantity, item.product_id]
                )
            }

            await conn.execute(
                "delete from cart_items where cart_id = ?", [cart_id]
            )

            await conn.commit()
            return { ok: true, count: items.length }
        }catch(error){
            await conn.rollback()
            throw error
        }finally{
            conn.release()
        }
    }
}

export default Consumer