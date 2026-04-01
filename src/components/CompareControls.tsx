"use client";

import type {
    CompareFilter,
    CompareMode,
    CompareOption,
    TeamOption,
} from "@/lib/compare";

type CompareControlsProps = {
    team1: string;
    team2: string;
    compareBy: CompareMode;
    filterBy: CompareFilter;
    teamOptions: TeamOption[];
    compareOptions: CompareOption<CompareMode>[];
    filterOptions: CompareOption<CompareFilter>[];
    onTeam1Change: (value: string) => void;
    onTeam2Change: (value: string) => void;
    onCompareByChange: (value: CompareMode) => void;
    onFilterByChange: (value: CompareFilter) => void;
    onSwapTeams: () => void;
    onResetSelections: () => void;
};

export default function CompareControls({
    team1,
    team2,
    compareBy,
    filterBy,
    teamOptions,
    compareOptions,
    filterOptions,
    onTeam1Change,
    onTeam2Change,
    onCompareByChange,
    onFilterByChange,
}: CompareControlsProps) {
    return (
        <section className="compareControlsCard" aria-label="Comparison controls">
            <div className="compareControlsGrid">
                <label className="compareControl">
                    <span className="compareControlLabel">Team 1</span>

                    <select
                        className="compareSelect"
                        value={team1}
                        onChange={(event) => onTeam1Change(event.target.value)}
                    >
                        <option value="">No selection</option>
                        {teamOptions.map((team) => (
                            <option key={team.value} value={team.value}>
                                {team.label}
                            </option>
                        ))}
                    </select>
                </label>

                <label className="compareControl">
                    <span className="compareControlLabel">Team 2</span>

                    <select
                        className="compareSelect"
                        value={team2}
                        onChange={(event) => onTeam2Change(event.target.value)}
                    >
                        <option value="">No selection</option>
                        {teamOptions.map((team) => (
                            <option key={team.value} value={team.value}>
                                {team.label}
                            </option>
                        ))}
                    </select>
                </label>

                <label className="compareControl">
                    <span className="compareControlLabel">Compare by</span>

                    <select
                        className="compareSelect"
                        value={compareBy}
                        onChange={(event) =>
                            onCompareByChange(event.target.value as CompareMode)
                        }
                    >
                        {compareOptions.map((option) => (
                            <option key={option.value} value={option.value}>
                                {option.label}
                            </option>
                        ))}
                    </select>
                </label>

                <label className="compareControl">
                    <span className="compareControlLabel">Filter by</span>

                    <select
                        className="compareSelect"
                        value={filterBy}
                        onChange={(event) =>
                            onFilterByChange(event.target.value as CompareFilter)
                        }
                    >
                        {filterOptions.map((option) => (
                            <option key={option.value} value={option.value}>
                                {option.label}
                            </option>
                        ))}
                    </select>
                </label>
            </div>
        </section>
    );
}