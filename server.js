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
  const sql = 'Select sum(ovGoals) FROM games;'

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
  const games = await queryAllGames()
  if (games != null) {
    res.status(200).send('healthy')
  } else {
    res.status(500).send('Database connection has failed')
  }
})
app.get('/goal-finder', async function (req, res) {
  const client = await pool.connect()
  const query = 'Select sum(ovGoals) FROM games;'
  const queryResults = await client.query(query)
  if (queryResults && queryResults.rows) {
    const currentGoals = queryResults.rows[0].count
    res.json(currentGoals)
  }
})

app.get('/get-goals', async (req, res) => {
  try {
    const client = await pool.connect()
    const query = 'Select referenceID from games where result=\'U\' AND date <= current_date ORDER BY date;'
    let gameID
    const queryResults = await client.query(query)
    if (queryResults && queryResults.rows) {
      gameID = queryResults.rows[0].referenceid
    }
    const response = await fetch(`http://api.sportradar.us/nhl/trial/v7/en/games/${gameID}/boxscore.json?api_key=${TOKEN}`)
    const gameData = await response.json()
    if (gameData.status !== 'closed') {
      return res.status(500).send('There is a game scheduled, but it has not finished.')
    }
    let ovGoals = 0
    const capsGoals = gameData.home.name.includes('Capitals') ? gameData.home.points : gameData.away.points
    gameData.home.leaders.goals.forEach(goal => {
      if (goal.full_name.includes('Alex Ovechkin')) {
        ovGoals = goal.statistics.total.goals
      }
    })
    gameData.away.leaders.goals.forEach(goal => {
      if (goal.full_name.includes('Alex Ovechkin')) {
        ovGoals = goal.statistics.total.goals
      }
    })
    const opponentGoals = gameData.home.name.includes('Capitals') ? gameData.away.points : gameData.home.points
    const gameResult = (capsGoals > opponentGoals) ? 'Y' : 'N'
    const updateQuery = `Update games SET capsgoals = ${capsGoals}, result=\'${gameResult}\', opponentgoals=${opponentGoals}, ovgoals=${ovGoals} WHERE referenceID=\'${gameID}\';`

    const returnData = {
      capsgoals: capsGoals,
      ovgoals: ovGoals,
      opponentgoals: opponentGoals,
      result: gameResult
    }

    client.query(updateQuery)
    client.release()

    res.json(returnData)
  } catch (error) {
    console.error(error)
    res.status(500).send('An error occurred while looking for the most recent goal.')
  }
})

app.get('/get-schedule', async (req, res) => {
  try {
    const response = await fetch(`http://api.sportradar.us/nhl/trial/v7/en/games/2022/REG/schedule.json?api_key=${TOKEN}`)
    const data = await response.json()

    // Loop through the data and pull out all Wash Caps gameIDs to store in DB.
    const games = data.games.filter(game => {
      return game.home.name === 'Washington Capitals' || game.away.name === 'Washington Capitals'
    }).map(game => {
      const gameID = game.id
      let result = 'U'
      let capsGoals = 0
      let oppGoals = 0
      const date = game.scheduled
      const home = game.home.alias.includes('WSH') ? 'Y' : 'N'
      const opponent = game.home.alias.includes('WSH') ? game.away.name : game.home.name
      if (game.away_points && game.away.alias.includes('WSH')) {
        capsGoals = game.away_points
        oppGoals = game.home_points
        result = (capsGoals > oppGoals) ? 'W' : 'L'
      } else if (game.home_points && game.home.alias.includes('WSH')) {
        capsGoals = game.home_points
        oppGoals = game.away_points
        result = (capsGoals > oppGoals) ? 'W' : 'L'
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
    const query = 'INSERT INTO games ( referenceID, result, date, opponent, opponentGoals, home, capsGoals) VALUES ($1, $2, $3, $4, $5, $6, $7)'
    games.forEach(game => {
      client.query(query, [game.gameID, game.result, game.date, game.opponent, game.opponentGoals, game.home, game.capsGoals])
    })
    client.release()

    res.json(games)
  }
  catch (error) {
    console.error(error)
    res.status(500).send('An error occurred while fetching the schedule.')
  }
})

// end of implementation ///////////////////////////////////
app.listen(PORT, () => console.log(`Listening on ${PORT}`))
