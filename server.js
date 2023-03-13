require('dotenv').config()
const express = require('express')
const path = require('path')
const app = express()
const PORT = process.env.PORT || 5163
const TOKEN = process.env.TOKEN

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
  return { games: results}
}

module.exports = {
  query,
  queryAllGames
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

app.get('/get-schedule', async (req, res) => {
  try {
    const seasonID = '5d08ca09-ec49-4559-9c0f-257c0158e57f'
    const response = await fetch(`https://api.sportradar.us/nhl/trial/v7/en/games/${seasonID}/schedule.json?api_key=${TOKEN}`)
    const data = await response.json()

    // Loop through the data and pull out all Wash Caps gameIDs to store in DB.
    const games = data.games.filter(game => {
      return game.home.name === 'Washington Capitals' || game.away.name === 'Washington Capitals';
    }).map(game => {
      return {
        gameId: game.id,
        seasonId: game.season.id,
        homeTeam: game.home.name,
        awayTeam: game.away.name,
        homeTeamGoals: 0,
        awayTeamGoals: 0
      }
    })

    // Insert the game information into the database
    const client = await pool.connect()
    const query = 'INSERT INTO games (game_id, season_id, home_team, away_team, home_team_goals, away_team_goals) VALUES ($1, $2, $3, $4, $5, $6)'
    games.forEach(game => {
      client.query(query, [game.gameId, game.seasonId, game.homeTeam, game.awayTeam, game.homeTeamGoals, game.awayTeamGoals])
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