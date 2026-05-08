export const requireConsumer = (req, res, next) => {
    const user = req.session?.user

    if (!user || user.role !== "consumer") {
        return res.status(401).json({ message: "Consumer login required" })
    }

    req.consumerId = user.id
    next()
}
