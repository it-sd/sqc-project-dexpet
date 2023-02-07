<h1> Ove Goal Calc</h1>

For this project, I would like to create a main page that links to the goal calc. The goal calc will ask if it has the most recent game, then when prompted, it will output if/when Ovechkin is on pace
to break the goal scoring record. This is going to be a pretty simple calculation, but I do think it would be fun to add what ifs, such as "check this box to see what it would look like if player lockout didn't happen" and similar for COVID shortened season. 

Then, we'll have a page that is dedicated to fetching the information from the api and storing it into the DB for games. That way we can update when the capitals finish a game or season, and keep on track with how many games are remaining on OV's contract, and with his career average, what he's projected to finish with for scored goals. Then, I plan on having another page to import the season's that have transpired. As to start, I'll probably have our goal calculation simply include Ovechkin's career goals, plus whatever he has scored this season. But at the end, I hope to have all 17 season's with games/goals that are being pulled from the DB to view in the season viewer page. This project will only require 2 tables, one for games, one for goals. Each will have a FK from the other table. 

Once we have all of those past season's imported, there would be no reason to continue to have that page in the site, so it would be removed shortly after.

<h2>Web Service</h2>

For a web service, I'll be using [Sport Data Api](https://sportdataapi.com/) apiKey to update when a game is completed. I'll be submitting a GET request for the information, only for Capitals games.



<h2>Database Use</h2>

DB Games
This is going to be updated by our Games Import page using Sport Data Api, when a game is completed, updating the score and if any goals were scored by OV.
DB Seasons
This is going to be updated by our Seasons Import page using Sport Data API, this will be done after the project is live, to allow us to rework the calc once all seasons are implemented.

<h2>Initial Designs</h2>

![Site master Page](/layout.png)

![Site Map](/sitemap.png)