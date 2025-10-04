// server.js — Express endpoint to receive booking POSTs and email them via Nodemailer
require('dotenv').config();
const express = require('express');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const nodemailer = require('nodemailer');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(helmet());
app.use(express.urlencoded({ extended: true })); // form posts
app.use(express.json());

// Simple rate limiter for the submit endpoint
app.use('/submit-form', rateLimit({
  windowMs: 60 * 1000,
  max: 12,
  message: 'Too many requests, try again later'
}));

// Basic env validation
const required = ['SMTP_HOST','SMTP_PORT','SMTP_USER','SMTP_PASS','FROM_EMAIL','TO_EMAIL'];
required.forEach(k => {
  if (!process.env[k]) console.warn(`Env ${k} not set — emailing may fail`);
});

// Create transporter
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT || 587),
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

// Health
app.get('/health', (req, res) => res.json({ ok: true, time: Date.now() }));

// POST /submit-form — receives form submissions (application/x-www-form-urlencoded)
app.post('/submit-form', async (req, res) => {
  try {
    const name = (req.body.name || '').trim();
    const phone = (req.body.phone || '').trim();
    const service = (req.body.service || '').trim();
    const date = (req.body.date || '').trim();
    const time = (req.body.time || '').trim();
    const email = (req.body.email || '').trim();

    const errors = [];
    if (!name || name.length < 2) errors.push('Invalid name');
    if (!phone || phone.length < 6) errors.push('Invalid phone');
    if (!service) errors.push('Missing service');
    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) errors.push('Invalid date');
    if (!time || !/^\d{2}:\d{2}$/.test(time)) errors.push('Invalid time');
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.push('Invalid email');

    if (errors.length) {
      res.status(400).send(`<h3>Booking error</h3><p>${errors.join(', ')}</p>`);
      return;
    }

    // Compose email
    const subject = `New Booking — ${escapeHtml(service)} — ${escapeHtml(name)}`;
    const text = `New booking:
Name: ${name}
Email: ${email || '(not provided)'}
Phone: ${phone}
Service: ${service}
Date: ${date}
Time: ${time}
Submitted: ${new Date().toLocaleString()}
`;
    const html = `
      <div style="font-family:Arial,Helvetica,sans-serif;color:#111">
        <h2>New Booking — ${escapeHtml(service)}</h2>
        <table style="border-collapse:collapse;">
          <tr><td style="padding:6px 12px;font-weight:600">Name</td><td style="padding:6px 12px">${escapeHtml(name)}</td></tr>
          <tr><td style="padding:6px 12px;font-weight:600">Email</td><td style="padding:6px 12px">${escapeHtml(email || '(not provided)')}</td></tr>
          <tr><td style="padding:6px 12px;font-weight:600">Phone</td><td style="padding:6px 12px">${escapeHtml(phone)}</td></tr>
          <tr><td style="padding:6px 12px;font-weight:600">Service</td><td style="padding:6px 12px">${escapeHtml(service)}</td></tr>
          <tr><td style="padding:6px 12px;font-weight:600">Date</td><td style="padding:6px 12px">${escapeHtml(date)}</td></tr>
          <tr><td style="padding:6px 12px;font-weight:600">Time</td><td style="padding:6px 12px">${escapeHtml(time)}</td></tr>
        </table>
      </div>
    `;

    const mail = {
      from: process.env.FROM_EMAIL,
      to: process.env.TO_EMAIL,
      subject,
      text,
      html
    };

    // optionally CC customer
    if (email && process.env.SEND_COPY_TO_CUSTOMER === 'true') {
      mail.cc = email;
    }

    await transporter.sendMail(mail);

    // respond with a simple thank-you HTML page
    res.send(`
      <!doctype html>
      <html>
        <head><meta charset="utf-8"><title>Booking Received</title></head>
        <body style="font-family:system-ui,Arial,Helvetica,sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;background:#f7f7f7">
          <div style="background:#fff;padding:28px;border-radius:10px;box-shadow:0 8px 30px rgba(0,0,0,.08);max-width:560px;text-align:center">
            <h2 style="margin-top:0"> Booking received</h2>
            <p>Thanks <strong>${escapeHtml(name)}</strong>. We've received your booking for <strong>${escapeHtml(service)}</strong> on ${escapeHtml(date)} at ${escapeHtml(time)}. We'll contact you at <strong>${escapeHtml(email || phone)}</strong> to confirm.</p>
            <p style="margin-top:18px"><a href="/" style="color:#007bff;text-decoration:none">Return to site</a></p>
          </div>
        </body>
      </html>
    `);

  } catch (err) {
    console.error('Error handling /submit-form:', err);
    res.status(500).send('<h3>Server error</h3><p>Please try again later.</p>');
  }
});

// helper escape
function escapeHtml(string = '') {
  return String(string).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;');
}

app.listen(PORT, () => console.log(`Booking server running on port ${PORT}`));