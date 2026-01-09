// api.ts
// Shared data type descriptions

// Used in components so they know what fields exist
// Used in hooks when data is fetched


// Home/Away record splits 
export type RecordSplit = { w: number; l: number };


// Current season summary for a team
export type TeamSummary = {
  teamAbbrev: string; // TOR or OTT , etc
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

  homeRecord: RecordSplit;
  awayRecord: RecordSplit;
};

// Helper type for ranks, stores ranks and team oppreviation
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

// last 5 stats for a team
export type TeamLast5 = {
  team: string;
  games: number;
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

// Single leader stats, used by hot players and history leaders
export type HotLeader = {
  playerId: number;
  name: string;
  goals: number;
  assists: number;
  points: number;
  shots: number;
};

// Hot leader payload for one team, each leader grouped by stat
export type HotL5Payload = {
  team: string;
  leaders: {
    goals: HotLeader | null;
    points: HotLeader | null;
    shots: HotLeader | null;
  };
};

// Machine learning trend endpoint response, next n games.
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

// A single matchup history leader
export type HistoryLeader = {
  playerId: number;
  name: string;
  goals: number;
  points: number;
  sog: number;
};

// Matchup history payload, similar to last 5
export type MatchupHistoryPayload = {
  team: string;
  opp: string;
  seasons: number[];
  gamesFound: number;
  leaders: Record<
    string,
    {
      topGoals: HistoryLeader | null;
      topPoints: HistoryLeader | null;
      topSog: HistoryLeader | null;
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

// Bundle so that a hook can fetch all three edge datasets at the same time
export type TeamEdgeBundle = {
  skating: TeamSkatingSpeedResponse;
  shotSpeed: TeamShotSpeedResponse;
  shotLocation: TeamShotLocationResponse;
};
