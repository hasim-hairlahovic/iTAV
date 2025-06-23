const express = require('express');
const multer = require('multer');
const nodemailer = require('nodemailer');
const axios = require('axios');
const path = require('path');
const fs = require('fs');
const { authenticateToken } = require('./auth');

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = 'uploads/';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|pdf|doc|docx|xls|xlsx|csv/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Invalid file type'));
    }
  }
});

// Configure email transporter (replace with your SMTP settings)
const emailTransporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: process.env.SMTP_PORT || 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER || 'your-email@example.com',
    pass: process.env.SMTP_PASS || 'your-app-password'
  }
});

// Core integrations object to mimic Base44 structure
const Core = {
  // LLM Integration (using OpenAI API as example)
  InvokeLLM: async (prompt, options = {}) => {
    try {
      const response = await axios.post('https://api.openai.com/v1/chat/completions', {
        model: options.model || 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: options.max_tokens || 150,
        temperature: options.temperature || 0.7
      }, {
        headers: {
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
          'Content-Type': 'application/json'
        }
      });
      
      return {
        success: true,
        response: response.data.choices[0].message.content,
        usage: response.data.usage
      };
    } catch (error) {
      console.error('LLM invocation error:', error.response?.data || error.message);
      return {
        success: false,
        error: 'Failed to invoke LLM',
        details: error.response?.data || error.message
      };
    }
  },

  // Email Integration
  SendEmail: async (to, subject, body, options = {}) => {
    try {
      const mailOptions = {
        from: options.from || process.env.SMTP_USER,
        to: Array.isArray(to) ? to.join(',') : to,
        subject: subject,
        html: body,
        text: options.text || body.replace(/<[^>]*>/g, '') // Strip HTML for text version
      };

      if (options.attachments) {
        mailOptions.attachments = options.attachments;
      }

      const info = await emailTransporter.sendMail(mailOptions);
      
      return {
        success: true,
        messageId: info.messageId,
        response: info.response
      };
    } catch (error) {
      console.error('Email send error:', error);
      return {
        success: false,
        error: 'Failed to send email',
        details: error.message
      };
    }
  },

  // File Upload Integration
  UploadFile: async (file) => {
    try {
      return {
        success: true,
        filename: file.filename,
        originalName: file.originalname,
        size: file.size,
        mimetype: file.mimetype,
        path: file.path,
        url: `/uploads/${file.filename}`
      };
    } catch (error) {
      console.error('File upload error:', error);
      return {
        success: false,
        error: 'Failed to upload file',
        details: error.message
      };
    }
  },

  // Image Generation Integration (placeholder - you'd integrate with DALL-E, Stable Diffusion, etc.)
  GenerateImage: async (prompt, options = {}) => {
    try {
      // Placeholder implementation - replace with actual image generation service
      return {
        success: true,
        prompt: prompt,
        imageUrl: 'https://via.placeholder.com/512x512?text=Generated+Image',
        message: 'Image generation would be implemented with DALL-E or similar service'
      };
    } catch (error) {
      console.error('Image generation error:', error);
      return {
        success: false,
        error: 'Failed to generate image',
        details: error.message
      };
    }
  },

  // Extract Data from Uploaded File
  ExtractDataFromUploadedFile: async (filePath) => {
    try {
      const fileExt = path.extname(filePath).toLowerCase();
      let extractedData = {};

      if (fileExt === '.csv') {
        // Simple CSV parsing (in production, use a proper CSV parser)
        const content = fs.readFileSync(filePath, 'utf-8');
        const lines = content.split('\n');
        const headers = lines[0].split(',');
        const data = lines.slice(1).map(line => {
          const values = line.split(',');
          const obj = {};
          headers.forEach((header, index) => {
            obj[header.trim()] = values[index]?.trim();
          });
          return obj;
        });
        extractedData = { headers, data, rowCount: data.length };
      } else {
        extractedData = {
          filename: path.basename(filePath),
          size: fs.statSync(filePath).size,
          message: 'Data extraction implemented for CSV files. Other formats would require additional parsing logic.'
        };
      }

      return {
        success: true,
        extractedData: extractedData,
        fileType: fileExt
      };
    } catch (error) {
      console.error('Data extraction error:', error);
      return {
        success: false,
        error: 'Failed to extract data from file',
        details: error.message
      };
    }
  }
};

// API Routes

// Invoke LLM
router.post('/llm/invoke', authenticateToken, async (req, res) => {
  try {
    const { prompt, options } = req.body;
    const result = await Core.InvokeLLM(prompt, options);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: 'LLM invocation failed' });
  }
});

// Send Email
router.post('/email/send', authenticateToken, async (req, res) => {
  try {
    const { to, subject, body, options } = req.body;
    const result = await Core.SendEmail(to, subject, body, options);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: 'Email send failed' });
  }
});

// Upload File
router.post('/file/upload', authenticateToken, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'No file uploaded' });
    }
    
    const result = await Core.UploadFile(req.file);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: 'File upload failed' });
  }
});

// Generate Image
router.post('/image/generate', authenticateToken, async (req, res) => {
  try {
    const { prompt, options } = req.body;
    const result = await Core.GenerateImage(prompt, options);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: 'Image generation failed' });
  }
});

// Extract Data from File
router.post('/file/extract', authenticateToken, async (req, res) => {
  try {
    const { filePath } = req.body;
    const result = await Core.ExtractDataFromUploadedFile(filePath);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: 'Data extraction failed' });
  }
});

// Get Core integrations info
router.get('/core', (req, res) => {
  res.json({
    available_integrations: [
      'InvokeLLM',
      'SendEmail', 
      'UploadFile',
      'GenerateImage',
      'ExtractDataFromUploadedFile'
    ],
    version: '1.0.0'
  });
});

module.exports = router; 