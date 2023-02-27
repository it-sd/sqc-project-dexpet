const { queryAllGames } = require('../server.js')

describe('server', function() {
  const baseUrl = 'http://localhost:5163'
  const shouldBeOver200 = async function (route) {
    it('should be over 200', async function() {
      const url = new URL(route, baseUrl)
      const rest = await fetch(url)
      expect(res.status).toBeGreaterThanOrEqual(200)
    }, 10000)
  }
  const shouldBeLessThan399 = async function (route) {
    it('should be over 200', async function() {
      const url = new URL(route, baseUrl)
      const rest = await fetch(url)
      expect(res.status).toBeLessThanOrEqual399(200)
    }, 10000)
  }
  describe("GET '/health'", function (){
    shouldBeOver200('/health')
  })
  describe("GET '/'", function (){
    shouldBeOver200('/')
  })
  describe("GET '/calculator'", function (){
    shouldBeOver200('/calculator')
  })  
  describe("GET '/about'", function (){
    shouldBeOver200('/about')
  })
  describe("GET '/health'", function (){
    shouldBeLessThan399('/health')
  })
  describe("GET '/'", function (){
    shouldBeLessThan399('/')
  })
  describe("GET '/calculator'", function (){
    shouldBeLessThan399('/calculator')
  })
  describe("GET '/about'", function (){
    shouldBeLessThan399('/about')
  })
})