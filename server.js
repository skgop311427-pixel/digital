require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();

app.use(cors());
app.use(express.json());

// For Vercel Serverless environment, we reuse the connection
const MONGO_URI = process.env.MONGO_URI;

if (!mongoose.connections[0].readyState) {
    mongoose.connect(MONGO_URI)
        .then(() => console.log('MongoDB Connected successfully!'))
        .catch((err) => console.log('MongoDB Connection Failed:', err));
}

// Database Schema
const applicationSchema = new mongoose.Schema({
    applicantName: { type: String, required: true },
    phone: { type: String, required: true },
    serviceType: { type: String, required: true },
    details: { type: String },
    status: { type: String, default: 'Pending' },
    appliedAt: { type: Date, default: Date.now }
});

// Prevent OverwriteModelError in Serverless
const Application = mongoose.models.Application || mongoose.model('Application', applicationSchema);

// API Route 1: Submit Form
app.post('/api/apply', async (req, res) => {
    try {
        const { applicantName, phone, serviceType, details } = req.body;
        
        const newApplication = new Application({ applicantName, phone, serviceType, details });
        await newApplication.save();

        res.status(201).json({ success: true, message: 'Application submitted!' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server Error', error });
    }
});

// API Route 2: View Applications (Admin Dashboard)
app.get('/api/admin/applications', async (req, res) => {
    try {
        const applications = await Application.find().sort({ appliedAt: -1 });
        
        // Simple HTML response for Admin View so you can see it in browser
        let htmlResponse = `
        <html><head><title>Admin Panel</title><script src="https://cdn.tailwindcss.com"></script></head>
        <body class="bg-gray-100 p-8">
            <h1 class="text-3xl font-bold mb-6">Admin Dashboard - Applications</h1>
            <div class="bg-white p-6 rounded-lg shadow-md">
                <table class="w-full text-left border-collapse">
                    <thead><tr class="bg-gray-200"><th class="p-3">Name</th><th class="p-3">Phone</th><th class="p-3">Service</th><th class="p-3">Details</th><th class="p-3">Date</th></tr></thead>
                    <tbody>
        `;
        
        applications.forEach(app => {
            htmlResponse += `<tr class="border-b"><td class="p-3">${app.applicantName}</td><td class="p-3">${app.phone}</td><td class="p-3 font-semibold text-green-600">${app.serviceType}</td><td class="p-3">${app.details}</td><td class="p-3 text-sm text-gray-500">${new Date(app.appliedAt).toLocaleString()}</td></tr>`;
        });
        
        htmlResponse += `</tbody></table></div></body></html>`;
        
        res.status(200).send(htmlResponse);
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to fetch' });
    }
});

module.exports = app;
