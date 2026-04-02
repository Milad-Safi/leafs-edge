from .nhlpy_proxy import nhl_client


TEAM_ID = 10
SEASON = "20252026"


def main():
    edge = nhl_client().edge

    shot_speed = edge.team_shot_speed_detail(team_id=TEAM_ID, season=SEASON)
    skating_speed = edge.team_skating_speed_detail(team_id=TEAM_ID, season=SEASON)
    shot_location = edge.team_shot_location_detail(team_id=TEAM_ID, season=SEASON)
    zone_time = edge.team_zone_time_details(team_id=TEAM_ID, season=SEASON)
    detail = edge.team_detail(team_id=TEAM_ID, season=SEASON)

    print("\nHARDEST SHOTS")
    for row in shot_speed.get("hardestShots", [])[:5]:
        print(row)

    print("\nTOP SKATING SPEEDS")
    for row in skating_speed.get("topSkatingSpeeds", [])[:5]:
        print(row)

    print("\nSHOT LOCATION DETAILS")
    for row in shot_location.get("shotLocationDetails", []):
        print(row)

    print("\nZONE TIME DETAILS")
    for row in zone_time.get("zoneTimeDetails", []):
        print(row)

    print("\nSHOT DIFFERENTIAL")
    print(zone_time.get("shotDifferential"))

    print("\nTEAM DETAIL SUMMARY")
    print(detail.get("shotSpeed"))
    print(detail.get("skatingSpeed"))
    print(detail.get("distanceSkated"))
    print(detail.get("zoneTimeDetails"))


if __name__ == "__main__":
    main()