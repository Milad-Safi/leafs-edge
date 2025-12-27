// Shared API payload + domain types used across hooks/components.
// Keeping these in /types avoids hooks importing types from UI components.

// ---------- Team summary + ranks ----------

export type RecordSplit = { w: number; l: number };

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

  homeRecord: RecordSplit;
  awayRecord: RecordSplit;
};

type RanksForMetric = Record<string, number | null>;

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

// ---------- Last 5 + hot players ----------

export type TeamLast5 = {
  team: string;
  games: number;
  record: { w: number; l: number; otl: number };
  goalsForPerGame: number;
  goalsAgainstPerGame: number;
  shotsForPerGame: number;
  shotsAgainstPerGame: number;
  powerPlay: { goals: number; opps: number; pct: number | null };
  penaltyKill: { oppPPGoals: number; oppPPOpps: number; pct: number | null };
  gameIds: number[];
  skippedPPGames?: number[];
  note?: string;
};

export type HotLeader = {
  playerId: number;
  name: string;
  goals: number;
  assists: number;
  points: number;
  shots: number;
};

export type HotL5Payload = {
  team: string;
  leaders: {
    goals: HotLeader | null;
    points: HotLeader | null;
    shots: HotLeader | null;
  };
};

// ---------- ML trend ----------

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
  features?: Record<string, number>;
  model_info?: Record<string, unknown>;
};

// ---------- Matchup history ----------

export type HistoryLeader = {
  playerId: number;
  name: string;
  goals: number;
  points: number;
  sog: number;
};

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

// ---------- Goalies ----------

export type GoalieRecord = { wins: number; losses: number; ot: number };

export type Last5GoalieSplits = {
  games: number;
  record: { w: number; l: number; ot: number };
  svPct: number | null;
  gaa: number | null;
};

export type ProjectedStarter = {
  playerId: number;
  name: string;
  headshot: string | null;

  record: GoalieRecord;
  gamesPlayed: number;

  savePct: number | null;
  gaa: number | null;

  last5Starts?: number | null;
  last5Splits?: Last5GoalieSplits | null;
};

export type GoalieApiPayload = {
  team: string;
  projectedStarter: ProjectedStarter | null;
  meta?: any;
  error?: string;
};

// ---------- NHL EDGE ----------

export type EdgeFastestSkater = {
  playerId: number;
  name: string;
  mph: number;
  kph: number;
  gameDate: string;
  gameCenterLink?: string;
  period?: number;
  time?: string;
};

export type EdgeHardestShooter = {
  playerId: number;
  name: string;
  mph: number;
  kph: number;
  gameDate: string;
  time?: string;
};

export type EdgeAreaRow = {
  area: string;
  sog: number;
  goals: number;
  shootingPctg: number;
};

export type TeamSkatingSpeedResponse = {
  ok: boolean;
  team: string;
  season: string | null;
  fastestSkaters: EdgeFastestSkater[];
};

export type TeamShotSpeedResponse = {
  ok: boolean;
  team: string;
  season: string | null;
  hardestShooters: EdgeHardestShooter[];
};

export type TeamShotLocationResponse = {
  ok: boolean;
  team: string;
  season: string | null;
  areas: EdgeAreaRow[];
  scale?: { maxSog: number; maxGoals: number };
};

export type TeamEdgeBundle = {
  skating: TeamSkatingSpeedResponse;
  shotSpeed: TeamShotSpeedResponse;
  shotLocation: TeamShotLocationResponse;
};
