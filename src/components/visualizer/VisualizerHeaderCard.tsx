import { VISUALIZER_PRESETS } from "@/lib/visualizer";

type Props = {
    selectedPresetId: string;
    onPresetClick: (presetId: string) => void;
};

export default function VisualizerHeaderCard({
    selectedPresetId,
    onPresetClick,
}: Props) {
    return (
        <section className="visualizerHeaderCard">
            <div className="visualizerHeaderTop">
                <div>
                    <p className="visualizerEyebrow">Visualizer</p>
                    <h1 className="visualizerTitle">Team Data Visualizer</h1>
                </div>

                <span className="visualizerHeaderBadge">32 teams</span>
            </div>

            <div className="visualizerPresetHeader">
                <p className="visualizerGroupLabel">Suggested filters</p>
            </div>

            <div className="visualizerPresetStrip">
                {VISUALIZER_PRESETS.map((preset) => {
                    const isActive = selectedPresetId === preset.id;

                    return (
                        <button
                            key={preset.id}
                            type="button"
                            className={`visualizerPresetButton${
                                isActive
                                    ? " visualizerPresetButtonActive"
                                    : ""
                            }`}
                            onClick={() => onPresetClick(preset.id)}
                        >
                            <span className="visualizerPresetLabel">
                                {preset.label}
                            </span>
                        </button>
                    );
                })}
            </div>
        </section>
    );
}