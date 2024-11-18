const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const mysql = require('mysql2');
const dotenv = require('dotenv');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const PDFDocument = require('pdfkit'); // Import PDFKit

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5001;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Database Connection
const db = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT,
});

// Test the Database Connection
db.getConnection((err) => {
  if (err) {
    console.error('Database connection failed:', err);
  } else {
    console.log('Connected to the MySQL database');
  }
});

// Default Route
app.get('/', (req, res) => {
  res.send('Server is running');
});

// User Registration
app.post('/api/register', async (req, res) => {
  const { name, email, password, role } = req.body;
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const query = `INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)`;
    db.query(query, [name, email, hashedPassword, role], (err, results) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      res.status(201).json({ message: 'User registered successfully!' });
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to register user' });
  }
});

// User Login
app.post('/api/login', (req, res) => {
  const { email, password } = req.body;
  const query = `SELECT * FROM users WHERE email = ?`;

  db.query(query, [email], async (err, results) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    if (results.length === 0 || !(await bcrypt.compare(password, results[0].password))) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign({ user_id: results[0].user_id, role: results[0].role }, process.env.JWT_SECRET || 'defaultsecret', { expiresIn: '1h' });
    res.json({ token, message: 'Login successful' });
  });
});

// Create Internship
app.post('/api/internships', (req, res) => {
  const { title, description, company, location, created_by } = req.body;
  const query = `INSERT INTO internships (title, description, company, location, created_by) VALUES (?, ?, ?, ?, ?)`;
  db.query(query, [title, description, company, location, created_by], (err, results) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.status(201).json({ message: 'Internship created successfully!' });
  });
});

// Get All Internships
app.get('/api/internships', (req, res) => {
  const query = `SELECT * FROM internships`;
  db.query(query, (err, results) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(results);
  });
});

// Get Internship by ID
app.get('/api/internships/:id', (req, res) => {
  const { id } = req.params;
  const query = `SELECT * FROM internships WHERE internship_id = ?`;
  db.query(query, [id], (err, results) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (results.length === 0) {
      return res.status(404).json({ message: 'Internship not found' });
    }
    res.json(results[0]);
  });
});

// Submit Application
app.post('/api/applications', (req, res) => {
  const { user_id, internship_id } = req.body;
  const query = `INSERT INTO applications (user_id, internship_id) VALUES (?, ?)`;
  db.query(query, [user_id, internship_id], (err, results) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.status(201).json({ message: 'Application submitted successfully!' });
  });
});

// Get Applications for a User
app.get('/api/applications/user/:user_id', (req, res) => {
  const { user_id } = req.params;
  const query = `
    SELECT internships.*, applications.status 
    FROM applications 
    INNER JOIN internships ON applications.internship_id = internships.internship_id 
    WHERE applications.user_id = ?`;
  db.query(query, [user_id], (err, results) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(results);
  });
});

// Update Application Status
app.put('/api/applications/:id', (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  const query = `UPDATE applications SET status = ? WHERE application_id = ?`;
  db.query(query, [status, id], (err, results) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json({ message: 'Application status updated successfully' });
  });
});

// Start the Server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

