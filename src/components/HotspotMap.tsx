import { HotspotCluster } from "@/types/traffic";

type HotspotMapProps = {
  clusters: HotspotCluster[];
};

const LAT_RANGE: [number, number] = [30.1, 30.6];
const LON_RANGE: [number, number] = [-98.1, -97.4];

const scale = (value: number, [min, max]: [number, number]) =>
  Math.min(1, Math.max(0, (value - min) / (max - min)));

export function HotspotMap({ clusters }: HotspotMapProps) {
  if (!clusters.length) {
    return <p className="text-sm text-muted">Hotspots will render soon.</p>;
  }

  return (
    <div className="relative h-64 w-full overflow-hidden rounded-xl bg-gradient-to-br from-[#0f1d2e] via-[#0c1018] to-[#0f1626]">
      <div className="absolute inset-0 opacity-40">
        <div className="dotted-surface h-full w-full" />
      </div>
      <div className="absolute inset-0">
        {clusters.map((cluster) => {
          const left = scale(cluster.center.lon, LON_RANGE) * 100;
          const top = (1 - scale(cluster.center.lat, LAT_RANGE)) * 100;
          const size = 12 + Math.min(30, cluster.count / 8);
          const intensity = Math.min(1, cluster.torch_risk);

          return (
            <div
              key={cluster.id}
              className="absolute rounded-full bg-gradient-to-br from-cyan-300/80 via-emerald-400/50 to-amber-300/40 shadow-lg"
              style={{
                left: `${left}%`,
                top: `${top}%`,
                width: size,
                height: size,
                opacity: 0.8 + intensity * 0.2,
                transform: "translate(-50%, -50%)",
                filter: "blur(0.2px)",
              }}
              title={`Cluster ${cluster.id}: ${cluster.count} incidents`}
            />
          );
        })}
      </div>
      <div className="absolute bottom-3 left-3 rounded-full bg-white/5 px-3 py-1 text-xs text-muted">
        Torch risk-coded Austin hotspots
      </div>
    </div>
  );
}
