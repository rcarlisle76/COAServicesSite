const express = require('express');
const nodemailer = require('nodemailer');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const crypto = require('crypto');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// CSRF token store (in production, use Redis or similar)
const csrfTokens = new Map();

// HTML sanitization function to prevent XSS
function sanitizeHtml(str) {
    if (!str) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#x27;')
        .replace(/\//g, '&#x2F;');
}

// Security middleware
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            scriptSrc: ["'self'"],
            imgSrc: ["'self'", "data:"],
        },
    },
}));

// CORS configuration - restrict to same origin in production
const corsOptions = {
    origin: process.env.NODE_ENV === 'production'
        ? process.env.ALLOWED_ORIGIN || false
        : true,
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type', 'X-CSRF-Token'],
    credentials: true
};
app.use(cors(corsOptions));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from parent directory
app.use(express.static(path.join(__dirname, '..')));

// Rate limiting for contact form
const contactLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // limit each IP to 5 requests per windowMs
    message: { success: false, message: 'Too many contact requests from this IP, please try again later.' }
});

// CSRF token endpoint
app.get('/api/csrf-token', (req, res) => {
    const token = crypto.randomBytes(32).toString('hex');
    const clientId = req.ip + '-' + Date.now();
    csrfTokens.set(token, { clientId, expires: Date.now() + 3600000 }); // 1 hour expiry

    // Clean up expired tokens
    for (const [key, value] of csrfTokens.entries()) {
        if (value.expires < Date.now()) {
            csrfTokens.delete(key);
        }
    }

    res.json({ csrfToken: token });
});

// CSRF validation middleware
function validateCsrf(req, res, next) {
    const token = req.headers['x-csrf-token'];

    if (!token || !csrfTokens.has(token)) {
        return res.status(403).json({ success: false, message: 'Invalid or missing CSRF token' });
    }

    const tokenData = csrfTokens.get(token);
    if (tokenData.expires < Date.now()) {
        csrfTokens.delete(token);
        return res.status(403).json({ success: false, message: 'CSRF token expired' });
    }

    // Delete token after use (one-time use)
    csrfTokens.delete(token);
    next();
}

// Validate required environment variables
const validateEmailConfig = () => {
    const required = ['EMAIL_USER', 'EMAIL_PASSWORD', 'COMPANY_EMAIL'];
    const missing = required.filter(key => !process.env[key]);
    if (missing.length > 0) {
        console.error(`Missing required environment variables: ${missing.join(', ')}`);
        return false;
    }
    return true;
};

// Email transporter configuration
const createTransporter = () => {
    return nodemailer.createTransport({
        service: process.env.EMAIL_SERVICE || 'gmail',
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASSWORD
        }
    });
};

// Verify transporter on startup
let emailConfigValid = false;
if (validateEmailConfig()) {
    const transporter = createTransporter();
    transporter.verify((error, success) => {
        if (error) {
            console.error('Email configuration error:', error.message);
            emailConfigValid = false;
        } else {
            console.log('Email server is ready to send messages');
            emailConfigValid = true;
        }
    });
} else {
    console.warn('Email functionality disabled due to missing configuration');
}

// Contact form endpoint
app.post('/api/contact', contactLimiter, validateCsrf, async (req, res) => {
    try {
        // Check if email is configured
        if (!emailConfigValid) {
            console.error('Email not configured - cannot process contact form');
            return res.status(503).json({
                success: false,
                message: 'Email service is temporarily unavailable. Please try again later.'
            });
        }

        const { name, email, phone, company, service, message } = req.body;

        // Validation
        if (!name || !email || !message) {
            return res.status(400).json({
                success: false,
                message: 'Please provide name, email, and message.'
            });
        }

        // Email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({
                success: false,
                message: 'Please provide a valid email address.'
            });
        }

        // Sanitize all inputs to prevent XSS
        const sanitizedData = {
            name: sanitizeHtml(name),
            email: sanitizeHtml(email),
            phone: sanitizeHtml(phone),
            company: sanitizeHtml(company),
            service: sanitizeHtml(service),
            message: sanitizeHtml(message)
        };

        // Create email transporter
        const transporter = createTransporter();

        // Email to company
        const companyMailOptions = {
            from: process.env.EMAIL_USER,
            to: process.env.COMPANY_EMAIL,
            subject: `New Contact Form Submission from ${sanitizedData.name}`,
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #2563eb;">New Contact Form Submission</h2>
                    <div style="background-color: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0;">
                        <p><strong>Name:</strong> ${sanitizedData.name}</p>
                        <p><strong>Email:</strong> ${sanitizedData.email}</p>
                        ${sanitizedData.phone ? `<p><strong>Phone:</strong> ${sanitizedData.phone}</p>` : ''}
                        ${sanitizedData.company ? `<p><strong>Company:</strong> ${sanitizedData.company}</p>` : ''}
                        ${sanitizedData.service ? `<p><strong>Service Interested In:</strong> ${sanitizedData.service}</p>` : ''}
                    </div>
                    <div style="margin: 20px 0;">
                        <h3 style="color: #2563eb;">Message:</h3>
                        <p style="background-color: #f9fafb; padding: 15px; border-radius: 8px; white-space: pre-wrap;">${sanitizedData.message}</p>
                    </div>
                    <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">
                    <p style="color: #6b7280; font-size: 12px;">
                        This email was sent from the COA Services contact form.
                    </p>
                </div>
            `
        };

        // Auto-reply to customer
        const customerMailOptions = {
            from: process.env.EMAIL_USER,
            to: email, // Use original email for sending
            subject: 'Thank you for contacting COA Services',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #2563eb;">Thank You for Contacting Us!</h2>
                    <p>Dear ${sanitizedData.name},</p>
                    <p>Thank you for reaching out to COA Services. We have received your message and will get back to you as soon as possible, typically within 1 business day.</p>

                    <div style="background-color: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0;">
                        <h3 style="color: #2563eb; margin-top: 0;">Your Message:</h3>
                        <p style="white-space: pre-wrap;">${sanitizedData.message}</p>
                    </div>

                    <p>If you have any urgent concerns, please don't hesitate to call us during business hours.</p>

                    <p>Best regards,<br>
                    <strong>COA Services Team</strong></p>

                    <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">
                    <p style="color: #6b7280; font-size: 12px;">
                        This is an automated response. Please do not reply to this email.
                    </p>
                </div>
            `
        };

        // Send both emails
        await transporter.sendMail(companyMailOptions);
        await transporter.sendMail(customerMailOptions);

        res.status(200).json({
            success: true,
            message: 'Message sent successfully!'
        });

    } catch (error) {
        console.error('Error sending email:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to send message. Please try again later.'
        });
    }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.status(200).json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Serve HTML pages
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'index.html'));
});

app.get('/services', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'services.html'));
});

app.get('/about', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'about.html'));
});

app.get('/contact', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'contact.html'));
});

// 404 handler - must be after all other routes
app.use((req, res) => {
    res.status(404).sendFile(path.join(__dirname, '..', '404.html'));
});

// Start server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
    console.log(`Make sure to configure your .env file with email credentials.`);
});

module.exports = app;
