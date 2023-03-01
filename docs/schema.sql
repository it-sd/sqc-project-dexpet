DROP TABLE IF EXISTS games, season;

CREATE TABLE season (
  seasonID INT GENERATED ALWAYS AS IDENTITY,
  result VarChar(35),
  capsWins smallint,
  capsLosses smallint,
  overtimeLoss smallint,
  year VarChar(7),
  points smallint,
  PRIMARY KEY (seasonID)
);

INSERT INTO season(result, capsWins, capsLosses, overtimeLoss, year, points)
  VALUES('First round of playoffs', 44, 26, 12, 2021-22, 100);

CREATE TABLE games (
  gameID INT GENERATED ALWAYS AS IDENTITY,
  seasonID INT,
  result VarChar(1),
  date date,
  opponent VarChar(35),
  opponentGoals smallint,
  home VarChar(1),
  capsGoals smallint,
  ovGoals smallint,
  PRIMARY KEY(gameID),
  CONSTRAINT seasonID
  FOREIGN KEY(seasonID)
  REFERENCES season(seasonID)
);

INSERT INTO games(result, date, opponent, opponentGoals, home, capsGoals, ovGoals)
  VALUES('L', '02/26/2023', 'Buffalo Sabers', 7, 'N', 4, 1);

INSERT INTO season(result, capsWins, capsLosses, overtimeLoss, year, points)
  VALUES('First round of playoffs', 44, 26, 12, 2021-22, 100);