Delete FROM games where gameID=1;
Update games
SET result='L', opponentgoals=2, capsgoals=0, ovgoals=0
Where gameID=9;
Update games
Set result='L', opponentgoals=4, capsgoals=0, ovgoals=0
Where gameID=21;
-- Because we don't have all of the games added into our DB, we have to add a game that 
-- will cointain all the goals that OV has up to this point in the NHL season
INSERT INTO games(result, date, opponent, opponentgoals, home, capsgoals, ovgoals)
  VALUES('X', '01/01/3000', 'NHL', 0, 'X', 0, 816);