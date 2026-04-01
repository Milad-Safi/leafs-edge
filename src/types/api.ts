// api.ts
// Shared data type descriptions

// Used in components so they know what fields exist
// Used in hooks when data is fetched

// Home/Away record splits
export type RecordSplit = { w: number; l: number };

// Current season summary for a team
export type TeamSummary = {
  teamAbbrev: string;
  teamFullName: string | null;
  gamesPlayed: number | null;

  goalsForPerGame: number | null;
  goalsAgainstPerGame: number | null;

  powerPlayPct: number | null;
  penaltyKillPct: number | null;

  shotsForPerGame: number | null;
  shotsAgainstPerGame: number | null;

  wins: number | null;
  losses: number | null;
  otLosses: number | null;
  points: number | null;

  leagueSequence: number | null;
  streakCode: string | null;
  streakCount: number | null;

  homeRecord: RecordSplit;
  awayRecord: RecordSplit;
};

// Helper type for ranks, stores ranks and team abbreviation
type RanksForMetric = Record<string, number | null>;

// Rank payload for the matchup comparison
export type TeamRanks = {
  seasonId: number;
  teamsCount: number;
  teamA: string;
  teamB: string;
  ranks: {
    goalsForPerGame: RanksForMetric;
    goalsAgainstPerGame: RanksForMetric;
    powerPlayPct: RanksForMetric;
    penaltyKillPct: RanksForMetric;
    shotsForPerGame: RanksForMetric;
    shotsAgainstPerGame: RanksForMetric;
  };
};

export type TeamSplit = {
  team: string;
  games: number;
  window: number | null;
  venue?: "home" | "away" | null;
  record: { w: number; l: number; otl: number };

  goalsFor: number;
  goalsAgainst: number;

  goalsForPerGame: number;
  goalsAgainstPerGame: number;
  shotsForPerGame: number;
  shotsAgainstPerGame: number;
  powerPlay: { goals: number; opps: number; pct: number | null };
  penaltyKill: { oppPPGoals: number; oppPPOpps: number; pct: number | null };
  gameIds: number[];
  skippedPPGames?: number[];
};

// Machine learning trend endpoint response, next n games
export type TeamTrendResponse = {
  team: string;
  as_of: string;
  n_requested: number;
  n_used: number;
  range: {
    newest: string;
    oldest: string;
  };
  trend: "UP" | "FLAT" | "DOWN";
  confidence: number;
  probs: {
    DOWN: number;
    FLAT: number;
    UP: number;
  };
};

export type HistoryLeader = {
  playerId: number;
  name: string;
  goals: number;
  points: number;
  sog: number;
};

export type MatchupRecord = {
  w: number;
  l: number;
  otl: number;
};

export type MatchupSeasonGames = {
  season: number;
  gameIds: number[];
};

export type MatchupValueLeader = {
  playerId: number;
  name: string;
  value: number;
};

export type MatchupHistoryPayload = {
  team: string;
  opp: string;
  filterBy: string;
  seasons: number[];
  perSeason: MatchupSeasonGames[];
  perSeasonPlayed: MatchupSeasonGames[];
  gamesFound: number;
  lastPlayedDate: string | null;

  records: Record<string, MatchupRecord>;
  avgGoalsFor: Record<string, number | null>;
  avgGoalsAgainst: Record<string, number | null>;
  avgShotsOnGoal: Record<string, number | null>;

  leaders: Record<
    string,
    {
      topGoals: HistoryLeader | null;
      topPoints: HistoryLeader | null;
      topSog: HistoryLeader | null;
      goalsLeaders: MatchupValueLeader[];
      assistLeaders: MatchupValueLeader[];
      sogLeaders: MatchupValueLeader[];
      shotAttemptLeaders: MatchupValueLeader[];
      blockLeaders: MatchupValueLeader[];
      savePctLeaders: MatchupValueLeader[];
    }
  >;
};

// Goalie record defined
export type GoalieRecord = { wins: number; losses: number; ot: number };

// Last 5 splits for a goalie, ( last 5 starts for that goalie not the team)
// Can become weird when goalies are pulled due to the way NHL records starts
export type Last5GoalieSplits = {
  games: number;
  record: { w: number; l: number; ot: number };
  svPct: number | null;
  gaa: number | null;
};

// projected starter data for goalie card
export type ProjectedStarter = {
  playerId: number;
  name: string;
  headshot: string | null;
  record: GoalieRecord;
  gamesPlayed: number;
  savePct: number | null;
  gaa: number | null;

  last5Starts?: number;

  last5Splits: Last5GoalieSplits;
};

// goalies endpoint payload
export type GoalieApiPayload = {
  team: string;
  projectedStarter: ProjectedStarter | null;
};

// Edge stats:

// Fastest Skater row
export type EdgeFastestSkater = {
  playerId: number;
  name: string;
  mph: number;
  kph: number;
  gameDate: string;
};

// Hardest Shooter row
export type EdgeHardestShooter = {
  playerId: number;
  name: string;
  mph: number;
  kph: number;
  gameDate: string;
};

// Shot location, grouped by ice area/zone
export type EdgeAreaRow = {
  area: string;
  sog: number;
  goals: number;
  shootingPctg: number;
};

// team skating speed response
export type TeamSkatingSpeedResponse = {
  ok: boolean;
  team: string;
  season: string | null;
  fastestSkaters: EdgeFastestSkater[];
};

// team shot speed response
export type TeamShotSpeedResponse = {
  ok: boolean;
  team: string;
  season: string | null;
  hardestShooters: EdgeHardestShooter[];
};

// team shot location response
export type TeamShotLocationResponse = {
  ok: boolean;
  team: string;
  season: string | null;
  areas: EdgeAreaRow[];
};