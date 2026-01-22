const express = require('express');
const nodemailer = require('nodemailer');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from parent directory
app.use(express.static(path.join(__dirname, '..')));

// Rate limiting for contact form
const contactLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // limit each IP to 5 requests per windowMs
    message: 'Too many contact requests from this IP, please try again later.'
});

// Email transporter configuration
const createTransporter = () => {
    return nodemailer.createTransporter({
        service: process.env.EMAIL_SERVICE || 'gmail',
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASSWORD
        }
    });
};

// Contact form endpoint
app.post('/api/contact', contactLimiter, async (req, res) => {
    try {
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

        // Create email transporter
        const transporter = createTransporter();

        // Email to company
        const companyMailOptions = {
            from: process.env.EMAIL_USER,
            to: process.env.COMPANY_EMAIL,
            subject: `New Contact Form Submission from ${name}`,
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #2563eb;">New Contact Form Submission</h2>
                    <div style="background-color: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0;">
                        <p><strong>Name:</strong> ${name}</p>
                        <p><strong>Email:</strong> ${email}</p>
                        ${phone ? `<p><strong>Phone:</strong> ${phone}</p>` : ''}
                        ${company ? `<p><strong>Company:</strong> ${company}</p>` : ''}
                        ${service ? `<p><strong>Service Interested In:</strong> ${service}</p>` : ''}
                    </div>
                    <div style="margin: 20px 0;">
                        <h3 style="color: #2563eb;">Message:</h3>
                        <p style="background-color: #f9fafb; padding: 15px; border-radius: 8px; white-space: pre-wrap;">${message}</p>
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
            to: email,
            subject: 'Thank you for contacting COA Services',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #2563eb;">Thank You for Contacting Us!</h2>
                    <p>Dear ${name},</p>
                    <p>Thank you for reaching out to COA Services. We have received your message and will get back to you as soon as possible, typically within 1 business day.</p>

                    <div style="background-color: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0;">
                        <h3 style="color: #2563eb; margin-top: 0;">Your Message:</h3>
                        <p style="white-space: pre-wrap;">${message}</p>
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

// Start server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
    console.log(`Make sure to configure your .env file with email credentials.`);
});

module.exports = app;
