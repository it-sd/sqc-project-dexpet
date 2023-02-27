require('dotenv').config() // Read environment variables from .env
const express = require('express')
const path = require('path')
const PORT = process.env.PORT || 5163

const { Pool } = require('pg')

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
})

const query = async function (sql, params) {
  let client 
  let results = []
  try {
    client = await pool.connect()
    const response = await client.query(sql, params)
    if (response && response.rows) {
      results = response.rows
    }
  } catch (err) {
    console.error(err)
  } if (client) client.release()
  return results
}

const queryAllGames = async function() {
  const sql = 'SELECT * FROM games'

  const results = await query(sql)
  return { games: results}
}

express()
  .use(express.static(path.join(__dirname, 'public')))
  .use(express.json())
  .use(express.urlencoded({ extended: true }))
  .set('views', path.join(__dirname, 'views'))
  .set('view engine', 'ejs')
  .get('/', async function (req, res) {
    res.render('pages/index')
  })
  .get('/about', function (req, res) {
    res.render('pages/about')
  })
  .get('/calculator', function (req, res) {
    res.render('pages/calculator')
  })
  .get('/health', async function (req, res) {
    const games = await queryAllGames
    if (games != null) {
      res.status(200).send('Healthy')
    } else {
      res.status(500).send('Database connection has failed')
    }
  })

  // end of implementation ///////////////////////////////////
  .listen(PORT, () => console.log(`Listening on ${PORT}`))

  module.exports = {
    query,
    queryAllGames
  }