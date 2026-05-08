export const requireMarket = (req, res, next) => {
    const user = req.session?.user

    if (!user || user.role !== "market") {
        return res.status(401).json({ message: "Market login required" })
    }

    req.marketId = user.id
    next()
}
