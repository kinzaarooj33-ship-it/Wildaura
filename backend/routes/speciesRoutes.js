const express = require('express')
const router = express.Router()
const db = require('../config/db')

// Helper — sab hunters ko notify karo
async function notifyHunters(type, title, message) {
  try {
    const [hunters] = await db.promise().query(
      `SELECT email FROM authuser WHERE role = 'user'`
    );
    for (const hunter of hunters) {
      await db.promise().query(
        `INSERT INTO notifications (user_email, type, title, message, is_read, created_at, user_role) 
         VALUES (?, ?, ?, ?, 0, NOW(), 'user')`,
        [hunter.email, type, title, message]
      );
    }
  } catch (err) {
    console.error("Notify hunters error:", err);
  }
}

// GET all species
router.get('/', (req, res) => {
  db.query('SELECT * FROM species ORDER BY id ASC', (err, results) => {
    if (err) return res.status(500).json({ error: err.message })
    res.json(results)
  })
})

// POST - add new
router.post('/', async (req, res) => {
  const fields = [
    'name','subtitle','description','image','status',
    'scientific_name','common_name','animal_type','lifespan',
    'found_in','common_areas','habitat_type','climate',
    'legal_status','hunting_season','permit_required','average_weight'
  ]
  const values = fields.map(f => req.body[f] || null)

  db.query(
    `INSERT INTO species (${fields.join(',')}) VALUES (${fields.map(() => '?').join(',')})`,
    values,
    async (err, result) => {
      if (err) return res.status(500).json({ error: err.message })

      // ✅ Notify hunters
      await notifyHunters(
        'species_update',
        `New Species Added: ${req.body.name}`,
        `${req.body.name} has been added. Check it out!`
      );

      res.json({ id: result.insertId, message: 'Added successfully' })
    }
  )
})

// PUT - update
router.put('/:id', async (req, res) => {
  const fields = [
    'name','subtitle','description','image','status',
    'scientific_name','common_name','animal_type','lifespan',
    'found_in','common_areas','habitat_type','climate',
    'legal_status','hunting_season','permit_required','average_weight'
  ]
  const values = fields.map(f => req.body[f] || null)
  values.push(req.params.id)

  const setClause = fields.map(f => `${f} = ?`).join(', ')

  db.query(
    `UPDATE species SET ${setClause} WHERE id = ?`,
    values,
    async (err, result) => {
      if (err) return res.status(500).json({ error: err.message })
      if (result.affectedRows === 0) return res.status(404).json({ error: 'Species not found' })

      // ✅ Notify hunters
      await notifyHunters(
        'species_update',
        `Species Update: ${req.body.name}`,
        `${req.body.name} has been updated. Check the details!`
      );

      res.json({ message: 'Updated successfully' })
    }
  )
})

// DELETE
router.delete('/:id', (req, res) => {
  db.query('DELETE FROM species WHERE id = ?', [req.params.id], (err) => {
    if (err) return res.status(500).json({ error: err.message })
    res.json({ message: 'Deleted successfully' })
  })
})

module.exports = router