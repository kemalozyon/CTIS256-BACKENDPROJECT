import { db } from "../config/db.js";
import crypto from "crypto"
import { comparePassword, function_decrypt } from "../utils/passwordCrypt.js";

class Market{

    static async create(email, name, password, city, district){
        const id = crypto.randomUUID()
        const hashed_password = await function_decrypt(password)
        await db.execute(
            "insert into markets values (?, ?, ?, ?, ?, ?)", [id, email, name, hashed_password, city, district]
        )
    }

    static async emailExists(email){
        const [rows] = await db.execute(
            "select 1 from markets where email = ? limit 1", [email]
        )
        return rows.length > 0
    }

    static async checkUser(email, password){
        const [rows] = await db.execute(
            "select * from markets where email = ?", [email]
        )

        if(rows.length === 0) return null;

        const user = rows[0];
        const match = await comparePassword(password, user.password_hash)

        if(!match) return null;
        return user;
    }

    static async createProduct(market_id, title, stock, normal_price, discounted_price, exp_date, image_url){
        const id = crypto.randomUUID()
        await db.execute(
            "insert into products values (?, ?, ?, ?, ?, ?, ?, ?)",
            [id, market_id, title, stock, normal_price, discounted_price, exp_date, image_url]
        )
        return id
    }

    static async fetchAllProductsFromAllMarket(){
        const [result] = await db.execute(
            "select * from products"
        )
        return result;
    }

    static async marketExists(market_id) {
        const [rows] = await db.execute(
            "select 1 from markets where id = ? limit 1", [market_id]
        )
        return rows.length > 0
    }

    static async fetchMarketProduct(market_id){
        if (!(await Market.marketExists(market_id))) return null;

        const [rows] = await db.execute(
            "select * from products where market_id = ?", [market_id]
        )
        return rows
    }

    static async updateProduct(id, market_id, title, stock, normal_price, discount_price, exp_date, image_url){
        const [result] = await db.execute(
            `update products
             set title = ?, stock = ?, normal_price = ?, discount_price = ?, exp_date = ?, image_url = ?
             where id = ? and market_id = ?`,
            [title, stock, normal_price, discount_price, exp_date, image_url, id, market_id]
        )

        return result.affectedRows > 0
    }

    static async deleteProduct(id, market_id){
        const [result] = await db.execute(
            "delete from products where id = ? and market_id = ?", [id, market_id]
        )

        return result.affectedRows > 0
    }

    static async fetchById(id){
        const [rows] = await db.execute(
            "select id, email, name, city, district from markets where id = ? limit 1", [id]
        )
        return rows.length > 0 ? rows[0] : null
    }

    static async updateProfile(id, name, city, district){
        const [result] = await db.execute(
            "update markets set name = ?, city = ?, district = ? where id = ?",
            [name, city, district, id]
        )
        return result.affectedRows > 0
    }

    static async searchForConsumer(city, district, keyword, limit, offset){
        const like = `%${keyword}%`
        const [rows] = await db.execute(
            `select p.id, p.market_id, p.title, p.stock, p.normal_price, p.discount_price,
                    p.exp_date, p.image_url,
                    m.name as market_name, m.city as market_city, m.district as market_district,
                    datediff(p.exp_date, curdate()) as days_left,
                    case
                        when m.city = ? and m.district = ? then 1
                        when m.city = ? then 2
                        else 3
                    end as locality_rank
             from products p
             join markets m on m.id = p.market_id
             where p.exp_date >= curdate()
               and p.stock > 0
               and p.title like ?
             order by locality_rank asc, p.exp_date asc, p.title asc
             limit ${Number(limit)} offset ${Number(offset)}`,
            [city, district, city, like]
        )

        const [countRows] = await db.execute(
            `select count(*) as total
             from products p
             join markets m on m.id = p.market_id
             where p.exp_date >= curdate()
               and p.stock > 0
               and p.title like ?`,
            [like]
        )

        return { rows, total: countRows[0].total }
    }
}


export default Market;