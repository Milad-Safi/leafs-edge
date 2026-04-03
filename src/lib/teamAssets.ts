export const TEAM_LOGO_BY_LABEL: Record<string, string> = {
    "Anaheim Ducks": "/Anaheim.png",
    "Boston Bruins": "/Boston.png",
    "Buffalo Sabres": "/Buffalo.png",
    "Calgary Flames": "/Calgary.png",
    "Carolina Hurricanes": "/Carolina.png",
    "Chicago Blackhawks": "/Chicago.png",
    "Colorado Avalanche": "/Colorado.png",
    "Columbus Blue Jackets": "/Columbus.png",
    "Dallas Stars": "/Dallas.png",
    "Detroit Red Wings": "/Detroit.png",
    "Edmonton Oilers": "/Edmonton.png",
    "Florida Panthers": "/Florida.png",
    "Los Angeles Kings": "/Los Angeles.png",
    "Minnesota Wild": "/Minnesota.png",
    "Montreal Canadiens": "/Montreal.png",
    "Montréal Canadiens": "/Montreal.png",
    "Nashville Predators": "/Nashville.png",
    "New Jersey Devils": "/New Jersey.png",
    "New York Islanders": "/NY Islanders.png",
    "New York Rangers": "/NY Rangers.png",
    "Ottawa Senators": "/Ottawa.png",
    "Philadelphia Flyers": "/Philadelphia.png",
    "Pittsburgh Penguins": "/Pittsburgh.png",
    "San Jose Sharks": "/San Jose.png",
    "Seattle Kraken": "/Seattle.png",
    "St. Louis Blues": "/St. Louis.png",
    "Tampa Bay Lightning": "/Tampa Bay.png",
    "Toronto Maple Leafs": "/Toronto.png",
    "Utah Mammoth": "/UTA.png",
    "Vancouver Canucks": "/Vancouver.png",
    "Vegas Golden Knights": "/Vegas.png",
    "Washington Capitals": "/Washington.png",
    "Winnipeg Jets": "/Winnipeg.png",
};

export function getTeamLogoSrc(teamLabel: string, teamAbbrev: string) {
    const normalizedLabel = teamLabel.trim();

    if (normalizedLabel && TEAM_LOGO_BY_LABEL[normalizedLabel]) {
        return TEAM_LOGO_BY_LABEL[normalizedLabel];
    }

    return `/${teamAbbrev}.png`;
}