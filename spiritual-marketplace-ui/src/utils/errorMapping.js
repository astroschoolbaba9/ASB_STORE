// src/utils/errorMapping.js

const ERROR_MAP = {
    // Auth Errors
    "AUTH_INVALID_CREDENTIALS": "The phone number or password you entered is incorrect.",
    "OTP_EXPIRED": "Your verification code has expired. Please request a new one.",
    "OTP_INVALID": "The code you entered is incorrect. Please check and try again.",
    "OTP_LIMIT": "Too many attempts. For security, please try again after some time.",
    "USER_NOT_FOUND": "We couldn't find an account with this information. Please sign up if you're new!",
    "USER_BLOCKED": "Your account has been restricted. Please contact our support team for assistance.",
    "PHONE_REQUIRED": "Please enter your phone number to continue.",
    "EMAIL_REQUIRED": "An email address is required for this action.",

    // Product / Catalog Errors
    "PRODUCT_NOT_FOUND": "The item you're looking for is no longer available in our collection.",
    "OUT_OF_STOCK": "This item is currently out of stock. Check back soon!",
    "CATEGORY_NOT_FOUND": "We couldn't find the category you're looking for.",
    "DUPLICATE_SLUG": "A product with this name already exists.",

    // Order / Course Errors
    "ORDER_NOT_FOUND": "We couldn't locate this order in your history.",
    "COURSE_NOT_FOUND": "This course is currently unavailable or doesn't exist.",
    "ALREADY_ENROLLED": "You are already enrolled in this course! Check your dashboard.",
    "ALREADY_PAID": "This order has already been paid for. Thank you!",
    "NO_PAYMENT_NEEDED": "This item is free! No payment is required.",
    "ADDRESS_REQUIRED": "Please provide a valid shipping address to complete your order.",

    // Payment / Checkout Errors
    "PAYMENT_FAILED": "Payment could not be processed. Please try another payment method.",
    "HASH_FAILED": "Secure checkout initialization failed. Please refresh and try again.",
    "INVALID_ADDRESS": "Please check your shipping details for any errors.",
    "PAYU_NOT_CONFIGURED": "Payments are currently being updated. Please try again in a few minutes.",

    // General Errors
    "VALIDATION_ERROR": "Please check the form for any errors or missing information.",
    "RATE_LIMITED": "You're moving a bit fast! Please wait a few seconds before trying again.",
    "NETWORK_ERROR": "We're having trouble reaching our servers. Please check your internet connection.",
    "HTTP_ERROR": "Something went wrong on our end. Our team has been notified. Please try again later.",
    "UNAUTHORIZED": "Please sign in to access this feature.",
    "FORBIDDEN": "You don't have permission to perform this action.",
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
