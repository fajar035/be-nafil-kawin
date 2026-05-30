const express = require('express');
const cors = require('cors');
const pool = require('./src/config/db');
require('dotenv').config();

const app = express();
const host = process.env.HOST;
const PORT = process.env.PORT;

app.use(
  cors({
    origin: [
      'http://localhost:5173', // local dev
      'https://fe-nafil-kawin.vercel.app' // ganti dengan domain FE vercel kamu
    ],
    methods: ['GET', 'POST']
  })
);

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
        available::int AS available,
        created_at
      FROM comment
      ORDER BY created_at ASC
      LIMIT $1 OFFSET $2
      `,
      [limit, offset]
    );

    const countResult = await pool.query(`
      SELECT 
        COUNT(*) AS total,
        COUNT(*) FILTER (WHERE available = B'1') AS available,
        COUNT(*) FILTER (WHERE available = B'0') AS unavailable
      FROM comment
    `);

    const total = parseInt(countResult.rows[0].total);
    const totalPages = Math.ceil(total / limit);

    res.json({
      data: result.rows,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        available: parseInt(countResult.rows[0].available),
        unavailable: parseInt(countResult.rows[0].unavailable)
      }
    });
  } catch (err) {
    console.error('GET /comments error:', err);
    res.status(500).json({ error: err.message });
  }
});

// tambah comment
app.post('/comments', async (req, res) => {
  try {
    const { name, comment, available } = req.body;

    // validasi field wajib
    if (!name || !comment || available === undefined) {
      return res.status(400).json({
        error: 'Field name, comment, dan available wajib diisi'
      });
    }

    // normalisasi available → bit(1)
    // terima: true/false, 1/0, "1"/"0", "hadir"/"tidak hadir"
    const availableBit =
      available === true ||
      available === 1 ||
      available === '1' ||
      available === 'hadir'
        ? '1'
        : '0';

    const result = await pool.query(
      `INSERT INTO comment (name, comment, available)
       VALUES ($1, $2, $3::bit(1))
       RETURNING id, name, comment, available::int AS available, created_at`,
      [name.trim(), comment.trim(), availableBit]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('POST /comments error:', err);
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server running at ${host}:${PORT}`);
});
