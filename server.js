require('dotenv').config() // Read environment variables from .env
const express = require('express')
const path = require('path')
const PORT = process.env.PORT || 5163

express()
  .use(express.static(path.join(__dirname, 'public')))
  .use(express.json())
  .use(express.urlencoded({ extended: true }))
  .set('views', path.join(__dirname, 'views'))
  .set('view engine', 'ejs')
  .get('/', function (req, res) {
    res.render('pages/index', { red: 0, green: 0, blue: 0 })
  })
  .get('/', function (req, res) {
    res.render('pages/index')
  })
  .get('/about', function (req, res) {
    res.render('pages/about')
  })
  .get('/health', function (req, res) {
    res.status(200).send('Healthy')
  })
// TODO: Make the GET route to accept URLs such as '/128.0.255'
// in red.green.blue order. Clamp colors to 0–255 (inclusive)
// before passing them to the EJS file.

// end of implementation ///////////////////////////////////
  .listen(PORT, () => console.log(`Listening on ${PORT}`))
