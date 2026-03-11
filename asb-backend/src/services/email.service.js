const nodemailer = require("nodemailer");
const { env } = require("../config/env");

class EmailService {
    constructor() {
        this.transporter = nodemailer.createTransport({
            service: "gmail",
            auth: {
                user: env.EMAIL_USER,
                pass: env.EMAIL_PASS,
            },
        });
    }

    /**
     * Sends an email notification to the admin when a new order is paid.
     * @param {Object} order - The order object.
     */
    async sendOrderNotification(order) {
        if (!env.EMAIL_USER || !env.EMAIL_PASS) {
            console.warn("⚠️ Email Service: EMAIL_USER or EMAIL_PASS missing. Order notification email skipped.");
            console.log("📝 Order details for notification:", JSON.stringify(order, null, 2));
            return;
        }

        const adminEmail = env.ADMIN_EMAIL;
        const itemsList = order.items
            .map(item => `<li>${item.title} x ${item.qty} - ₹${item.price}</li>`)
            .join("");

        const mailOptions = {
            from: `"ASB Store" <${env.EMAIL_USER}>`,
            to: adminEmail,
            subject: `🔔 New Order Received: #${order._id.toString().slice(-6).toUpperCase()}`,
            html: `
                <div style="font-family: sans-serif; max-width: 600px; margin: auto; border: 1px solid #eee; padding: 20px; border-radius: 10px;">
                    <h2 style="color: #d97706; text-align: center;">New Order Placed!</h2>
                    <p>A new order has been paid and confirmed via ASB Store.</p>
                    <hr />
                    <h3>Order Details:</h3>
                    <ul>
                        <li><strong>Order ID:</strong> #${order._id}</li>
                        <li><strong>Customer Name:</strong> ${order.shippingAddress?.fullName || 'N/A'}</li>
                        <li><strong>Customer Phone:</strong> ${order.shippingAddress?.phone || 'N/A'}</li>
                        <li><strong>Total Amount:</strong> ₹${order.totalAmount}</li>
                    </ul>
                    <h3>Items:</h3>
                    <ul>
                        ${itemsList}
                    </ul>
                    <hr />
                    <p style="font-size: 12px; color: #666; text-align: center;">
                        View more details in the <a href="${process.env.ADMIN_BASE_URL || '#'}">Admin Dashboard</a>.
                    </p>
                </div>
            `,
        };

        try {
            const info = await this.transporter.sendMail(mailOptions);
            console.log("✅ Email Service: Order notification sent to admin.", info.messageId);
        } catch (error) {
            console.error("❌ Email Service Error:", error.message);
        }
    }
}

module.exports = new EmailService();
