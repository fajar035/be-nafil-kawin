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
    let { page, limit } = req.query;

    page = parseInt(page) || 1;
    limit = parseInt(limit) || 10;

    const offset = (page - 1) * limit;

    const result = await pool.query(
      `
      SELECT 
        id,
        name,
        comment,
        available::int AS available
      FROM comment
      ORDER BY id DESC
      LIMIT $1 OFFSET $2
      `,
      [limit, offset]
    );

    const countResult = await pool.query(`  SELECT 
    COUNT(*) AS total,
    COUNT(*) FILTER (WHERE available = B'1') AS available,
    COUNT(*) FILTER (WHERE available = B'0') AS unavailable
  FROM comment`);

    const total = parseInt(countResult.rows[0].total);
    const totalPages = Math.ceil(total / limit);

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: 'No comments found'
      });
    }

    res.json({
      data: result.rows,
      pagination: {
        total,
        totalPages,
        available: parseInt(countResult.rows[0].available),
        unavailable: parseInt(countResult.rows[0].unavailable)
      }
    });
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
