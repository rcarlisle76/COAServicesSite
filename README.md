# COA Services Website

A modern, professional website for a small business IT support company offering website development, Salesforce consulting, IT support, and custom business solutions.

## Features

- **Modern Design**: Clean, responsive design that works on all devices
- **Multiple Pages**:
  - Home page with service overview
  - Services page with detailed service descriptions
  - About page with company information
  - Contact page with working contact form
- **Contact Form**: Functional contact form that sends emails to your company inbox
- **Mobile Responsive**: Fully responsive design that works on desktop, tablet, and mobile
- **Professional Styling**: Modern color scheme and typography

## Project Structure

```
COAServicesSite/
├── index.html              # Home page
├── services.html           # Services page
├── about.html             # About page
├── contact.html           # Contact page
├── css/
│   └── styles.css         # Main stylesheet
├── js/
│   ├── main.js           # Navigation and general functionality
│   └── contact.js        # Contact form handler
├── server/
│   ├── server.js         # Express server for contact form
│   ├── package.json      # Node.js dependencies
│   └── .env.example      # Environment variables template
├── .gitignore            # Git ignore file
└── README.md             # This file
```

## Getting Started

### Option 1: Static Website Only (No Contact Form Functionality)

If you just want to view the website without the contact form working:

1. Open `index.html` in your web browser
2. Navigate through the pages using the navigation menu

### Option 2: Full Website with Working Contact Form

To enable the contact form email functionality, you'll need to set up the Node.js backend server.

#### Prerequisites

- [Node.js](https://nodejs.org/) (version 14 or higher)
- A Gmail account (or other email service) for sending emails

#### Installation Steps

1. **Navigate to the server directory:**
   ```bash
   cd server
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure email settings:**

   Copy the example environment file:
   ```bash
   cp .env.example .env
   ```

   Edit the `.env` file with your email credentials:
   ```
   PORT=3000
   EMAIL_SERVICE=gmail
   EMAIL_USER=your-email@gmail.com
   EMAIL_PASSWORD=your-app-password
   COMPANY_EMAIL=your-company-email@example.com
   ```

   **Important for Gmail users:**
   - You need to use an "App Password" instead of your regular Gmail password
   - Go to [Google Account Settings](https://myaccount.google.com/security)
   - Enable 2-Step Verification if not already enabled
   - Generate an App Password: [https://support.google.com/accounts/answer/185833](https://support.google.com/accounts/answer/185833)
   - Use this App Password in your `.env` file

4. **Start the server:**
   ```bash
   npm start
   ```

   For development with auto-restart:
   ```bash
   npm run dev
   ```

5. **Access the website:**
   Open your browser and go to:
   ```
   http://localhost:3000
   ```

## Customization Guide

### Updating Content

#### 1. Company Name and Branding
- Edit the `<h1>` and `<title>` tags in all HTML files
- Update the logo text in the navigation section

#### 2. Services
- Modify `services.html` to add/remove/edit services
- Update the services preview section on `index.html`

#### 3. About Us
- Edit `about.html` to add your company story and team information

#### 4. Colors and Styling
- Open `css/styles.css`
- Modify the CSS variables at the top of the file:
  ```css
  :root {
      --primary-color: #2563eb;     /* Main brand color */
      --secondary-color: #0891b2;   /* Secondary color */
      --accent-color: #06b6d4;      /* Accent color */
      /* ... other colors ... */
  }
  ```

#### 5. Contact Information
- Update `contact.html` with your business hours and contact details
- Modify the email templates in `server/server.js` to customize auto-reply messages

### Adding Images

1. Create an `images/` or `assets/` folder
2. Add your images to this folder
3. Update the HTML to reference your images:
   ```html
   <img src="images/your-image.jpg" alt="Description">
   ```

## Email Service Configuration

### Using Gmail
See installation steps above for Gmail setup with App Passwords.

### Using Other Email Services

Update the `.env` file with your email service settings:

**Outlook:**
```
EMAIL_SERVICE=outlook
EMAIL_USER=your-email@outlook.com
EMAIL_PASSWORD=your-password
```

**Yahoo:**
```
EMAIL_SERVICE=yahoo
EMAIL_USER=your-email@yahoo.com
EMAIL_PASSWORD=your-password
```

**Custom SMTP:**
Modify `server/server.js` to use custom SMTP settings:
```javascript
const transporter = nodemailer.createTransporter({
    host: 'smtp.yourprovider.com',
    port: 587,
    secure: false,
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
    }
});
```

## Deployment

### Option 1: Static Hosting (GitHub Pages, Netlify, Vercel)

For static hosting without backend functionality:
1. Deploy the HTML, CSS, and JS files
2. Note: Contact form will not work without backend

### Option 2: Full Stack Hosting

**Heroku:**
1. Create a `Procfile`:
   ```
   web: node server/server.js
   ```
2. Deploy using Heroku CLI or GitHub integration
3. Set environment variables in Heroku dashboard

**Railway, Render, or similar:**
1. Connect your GitHub repository
2. Set the start command: `node server/server.js`
3. Configure environment variables in the platform's dashboard

**VPS (DigitalOcean, Linode, AWS, etc.):**
1. Set up Node.js on your server
2. Clone the repository
3. Configure `.env` file
4. Use PM2 or similar to keep the server running:
   ```bash
   npm install -g pm2
   pm2 start server/server.js
   pm2 startup
   pm2 save
   ```

## Security Considerations

1. **Never commit `.env` file** - It's already in `.gitignore`
2. **Use App Passwords** - Don't use your main email password
3. **Rate Limiting** - The server includes rate limiting (5 requests per 15 minutes)
4. **Input Validation** - Basic validation is implemented, consider adding more for production
5. **HTTPS** - Always use HTTPS in production
6. **Environment Variables** - Keep all sensitive data in environment variables

## Troubleshooting

### Contact form not working
1. Check that the server is running (`npm start` in the server directory)
2. Verify `.env` file is configured correctly
3. Check browser console for errors (F12 → Console tab)
4. Verify email credentials are correct

### Gmail authentication errors
1. Ensure 2-Step Verification is enabled
2. Use an App Password, not your regular password
3. Check that "Less secure app access" is not required (use App Password instead)

### Port already in use
1. Change the PORT in `.env` file
2. Or kill the process using that port:
   ```bash
   # Find the process
   lsof -i :3000
   # Kill it
   kill -9 <PID>
   ```

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)
- Mobile browsers (iOS Safari, Chrome Mobile)

## Technologies Used

- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **Backend**: Node.js, Express
- **Email**: Nodemailer
- **Security**: CORS, Express Rate Limit

## License

MIT License - Feel free to use this for your business!

## Support

For issues or questions about the website setup, please refer to the documentation or contact your developer.

---

**Built with ❤️ for COA Services**
