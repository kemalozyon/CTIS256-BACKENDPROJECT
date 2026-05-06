import mysql from "mysql2/promise"

export const db = mysql.createPool({
    host: "localhost",
    port: 3307,
    user: "hey",
    password: "hey",
    database: "marketProject",

    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
})
