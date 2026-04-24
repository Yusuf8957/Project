class ExpressError extends Error {
    constructor(statusCode, message) {
        super(message); // better
        this.statusCode = statusCode;
    }
}
module.exports = ExpressError;