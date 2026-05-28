const express = require('express');
const pool = require('./src/config/db');
require('dotenv').config();

const app = express();
const host = process.env.HOST;
const PORT = process.env.PORT;

app.use(express.json());

app.get('/', (req, res) => {
  res.send('Nafil Kawin API');
});

// ambil data comments
app.get('/comments', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM comment ORDER BY id DESC');

    res.json(result.rows);
  } catch (err) {
    res.status(500).json({
      error: err.message
    });
  }
});

// tambah comment
app.post('/comments', async (req, res) => {
  try {
    const { name, comment, available } = req.body;

    const result = await pool.query(
      `INSERT INTO comment (name, comment, available)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [name, comment, available]
    );

    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({
      error: err.message
    });
  }
});

app.listen(PORT, (req, res) => {
  console.log(`Server running at ${host}${PORT}`);
});
