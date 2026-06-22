function asyncHandler(fn) {
    return (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
}

class HttpError extends Error {
    constructor(status, message, details) {
        super(message);
        this.status = status;
        this.details = details;
    }
}

function notFound(req, res, next) {
    next(new HttpError(404, 'Not found'));
}

function errorHandler(err, req, res, next) {
    const status = err.status || 500;
    if (status >= 500) {
        console.error(err);
    }
    res.status(status).json({
        error: err.message || 'Server error',
        ...(err.details ? { details: err.details } : {}),
    });
}

module.exports = { asyncHandler, HttpError, notFound, errorHandler };
