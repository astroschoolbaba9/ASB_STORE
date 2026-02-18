// src/utils/errorMapping.js

const ERROR_MAP = {
    // Auth Errors
    "AUTH_INVALID_CREDENTIALS": "The phone number or password you entered is incorrect.",
    "OTP_EXPIRED": "Your verification code has expired. Please request a new one.",
    "OTP_INVALID": "The code you entered is incorrect. Please check and try again.",
    "OTP_LIMIT": "Too many attempts. For security, please try again after some time.",
    "USER_NOT_FOUND": "We couldn't find an account with this information.",
    "USER_BLOCKED": "Your account has been restricted. Please contact support.",
    "UNAUTHORIZED": "Your session has expired. Please log in again.",
    "FORBIDDEN": "You do not have permission to access this administrative area.",

    // Product / Catalog Errors
    "PRODUCT_NOT_FOUND": "The product you're trying to access was not found.",
    "DUPLICATE_SLUG": "A product with this URL slug already exists. Please use a unique title.",
    "OUT_OF_STOCK": "This product is currently out of stock.",
    "CATEGORY_NOT_FOUND": "The selected category does not exist.",

    // Order / Upload Errors
    "ORDER_NOT_FOUND": "The requested order could not be found.",
    "UPLOAD_FAILED": "File upload failed. Please check the file type and size.",
    "INVALID_FILE": "Unsupported file format. Please use images (JPG, PNG) or PDFs as appropriate.",

    // General Errors
    "VALIDATION_ERROR": "Validation failed. Please review the highlighted fields in the form.",
    "RATE_LIMITED": "Server is receiving too many requests. Please wait a moment.",
    "NETWORK_ERROR": "Network connection error. Please check your internet connectivity.",
    "HTTP_ERROR": "Internal server error. Our engineers are investigating. Please try again shortly.",
    "SERVER_ERROR": "The server encountered an unexpected condition. Please try again.",
};

/**
 * Translates a backend error code or raw error into a user-friendly message.
 */
export function getFriendlyMessage(err) {
    if (!err) return "An unexpected error occurred.";

    const code = err.code || (err.response && err.response.code);

    if (ERROR_MAP[code]) {
        return ERROR_MAP[code];
    }

    // Fallback to error message if it doesn't look like technical jargon
    const msg = err.message || (err.response && err.response.message);
    if (msg && !msg.toLowerCase().includes("database") && !msg.toLowerCase().includes("mongo")) {
        return msg;
    }

    return ERROR_MAP["HTTP_ERROR"];
}
