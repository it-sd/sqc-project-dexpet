require('dotenv').config()
const express = require('express')
const path = require('path')
const app = express()
const PORT = process.env.PORT || 5163
const TOKEN = process.env.TOKEN
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args))

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

const queryAllGames = async function () {
  const sql = 'SELECT * FROM games ORDER BY date;'

  const results = await query(sql)
  return { games: results }
}

const queryAllGoals = async function () {
  const sql = 'Select count(ovGoals) FROM games;'

  const results = await query(sql)
  return { games: results }
}

const queryLatestGoal = async function () {
  const sql = 'Select gameID FROM games WHERE ovGoals > 0 ORDER BY date'

  const gameID = await query(sql)

  const sql2 = `Select * FROM games WHERE gameID = ${gameID};`

  const results = await query(sql2)
  return { games: results }
}

module.exports = {
  query,
  queryAllGames,
  queryLatestGoal,
  queryAllGoals
}

app.use(express.static(path.join(__dirname, 'public')))
app.use(express.static(path.join(__dirname, 'docs')))
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.set('views', path.join(__dirname, 'views'))
app.set('view engine', 'ejs')
app.get('/', function (req, res) {
  res.render('pages/index')
})
app.get('/about', function (req, res) {
  res.render('pages/about')
})
app.get('/calculator', function (req, res) {
  res.render('pages/calculator')
})
app.get('/import', function (req, res) {
  res.render('pages/import')
})
app.get('/health', async function (req, res) {
  const games = await queryAllGames
  if (games != null) {
    res.status(200).send('healthy')
  } else {
    res.status(500).send('Database connection has failed')
  }
})

app.post('/insertGame', (req, res) => {
  // get information from req body
  const date = req.body.date
  const opponent = req.body.opponent
  const opponentGoals = req.body.opponentGoals
  const home = req.body.home
  const capsGoals = req.body.capsGoals
  const ovGoals = req.body.ovGoals

  // Insert into database
  const insertQuery = `INSERT INTO games (result, date, opponent, opponentGoals, home, capsGoals, ovGoals) VALUES ('${capsGoals > opponentGoals ? 'W' : 'L'}, ${date}, '${opponent}', ${opponentGoals}, '${home}', ${capsGoals}, ${ovGoals})`
  pool.query(insertQuery)
  if (err) {
    console.error(err.message)
    res.status(500).send('Error upon inserting game into database.')
  } else {
    console.log(`Game added to the database with ID ${this.lastID}`)
    res.send(`Game added to the database with ID ${this.lastID}`)
  }
})

app.get('/update-db')

app.get('/get-schedule', async (req, res) => {
  try {
    const response = await fetch(`http://api.sportradar.us/nhl/trial/v7/en/games/2022/REG/schedule.json?api_key=${TOKEN}`)
    const data = await response.json()

    // Loop through the data and pull out all Wash Caps gameIDs to store in DB.
    const games = data.games.filter(game => {
      return game.home.name === 'Washington Capitals' || game.away.name === 'Washington Capitals'
    }).map(game => {
      const gameID = game.reference
      let result = 'U'
      let capsGoals = 0
      let oppGoals = 0
      const date = game.scheduled
      const home = game.home.alias.includes('WSH') ? 'Y' : 'N'
      const opponent = game.home.alias.includes('WSH') ? game.away.name : game.home.name
      if (game.away_points && game.away.alias.includes('WSH')) {
        capsGoals = game.away_points
        oppGoals = game.home_points
        result = (capsGoals > oppGoals) ? 'Y' : 'N'
      } else if (game.home_points && game.home.alias.includes('WSH')) {
        capsGoals = game.home_points
        oppGoals = game.away_points
        result = (capsGoals > oppGoals) ? 'Y' : 'N'
      }
      return {
        gameID: gameID,
        seasonID: 2022,
        result: result,
        date: date,
        opponent: opponent,
        oppGoals: oppGoals,
        capsGoals: capsGoals,
        home: home
      }
    })

    // Insert the game information into the database
    const client = await pool.connect()
    const query = 'INSERT INTO games (seasonID, result, date, opponent, opponentGoals, home, capsGoals) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)'
    games.forEach(game => {
      client.query(query, [game.gameID, game.seasonID, game.result, game.date, game.opponent, game.opponentGoals, game.capsGoals, game.home])
    })
    client.release()

    res.json(games)
  } catch (error) {
    console.error(error)
    res.status(500).send('An error occurred while fetching the schedule.')
  }
})

// end of implementation ///////////////////////////////////
app.listen(PORT, () => console.log(`Listening on ${PORT}`))
