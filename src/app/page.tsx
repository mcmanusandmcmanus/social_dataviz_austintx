import { HotspotMap } from "@/components/HotspotMap";
import { IssueChart } from "@/components/IssueChart";
import { MosaicCard } from "@/components/MosaicCard";
import { NarrativeStrip } from "@/components/NarrativeStrip";
import { NetworkGraph } from "@/components/NetworkGraph";
import { TimelineChart } from "@/components/TimelineChart";
import {
  fetchIncidents,
  loadAnalysisSnapshot,
  summarizeIncidents,
  mergeNetwork,
} from "@/lib/traffic";
import { AnalysisSnapshot, TrafficIncident } from "@/types/traffic";

const formatDate = (date?: string) =>
  date ? new Date(date).toLocaleString("en-US", { timeStyle: "short" }) : "—";

export default async function Home() {
  const incidents = await fetchIncidents(340);
  const summary = summarizeIncidents(incidents);

  const analysis: AnalysisSnapshot = await loadAnalysisSnapshot().catch(() => ({
    generated_at: "",
    clusters: [],
    network: { nodes: [], edges: [] },
    torch_training: { epochs: 0, final_loss: 0, note: "Snapshot missing" },
  }));

  const network = mergeNetwork(
    analysis.network.edges ?? [],
    analysis.network.nodes ?? [],
  );

  const recent = incidents.slice(0, 5);
  const topIssue = summary.topIssues[0]?.label ?? "traffic";
  const heroStory = `${summary.total} data points, ${summary.active} live, ${topIssue} trending`;

  const narrativeLines = [
    summary.spotlight,
    `Torch risk pinpoints cluster ${analysis.clusters[0]?.id ?? 0} at ${Math.round((analysis.clusters[0]?.torch_risk ?? 0) * 100)}% heat.`,
    `Network shows ${network.edges.length} corridors converging on ${network.nodes[0]?.id ?? "core arterials"}.`,
  ];

  return (
    <main className="mx-auto flex min-h-screen max-w-6xl flex-col gap-8 px-4 pb-16 pt-12 md:px-8">
      <header className="glass relative overflow-hidden rounded-3xl border px-6 py-10 md:px-10">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-400/10 via-cyan-500/10 to-slate-800/30" />
        <div className="relative flex flex-col gap-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="section-title text-xs">City of Austin open data</p>
              <h1 className="text-3xl font-semibold md:text-4xl">
                Austin Traffic Storyboard
              </h1>
              <p className="mt-3 max-w-2xl text-lg text-muted">
                Mosaic storytelling for real-time incident reports, machine
                learning hotspots, and network intelligence.
              </p>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted">
              <a
                href="https://data.austintexas.gov/Transportation-and-Mobility/Real-Time-Traffic-Incident-Reports/dx9v-zd7x/about_data"
                className="rounded-full bg-white/5 px-3 py-1 hover:text-foreground"
                target="_blank"
                rel="noreferrer"
              >
                Dataset
              </a>
              <a
                href="https://github.com/mcmanusandmcmanus/social_dataviz_austintx"
                className="rounded-full bg-white/5 px-3 py-1 hover:text-foreground"
                target="_blank"
                rel="noreferrer"
              >
                Repo
              </a>
            </div>
          </div>
          <div className="mosaic-grid">
            <div className="glass rounded-2xl border px-4 py-3">
              <p className="text-xs uppercase tracking-[0.25em] text-muted">
                Live Pulse
              </p>
              <p className="text-2xl font-semibold text-foreground">{heroStory}</p>
            </div>
            <div className="glass rounded-2xl border px-4 py-3">
              <p className="text-xs uppercase tracking-[0.25em] text-muted">
                Active
              </p>
              <p className="text-2xl font-semibold text-foreground">
                {summary.active} on network
              </p>
              <p className="text-sm text-muted">
                {summary.archived} recently archived
              </p>
            </div>
            <div className="glass rounded-2xl border px-4 py-3">
              <p className="text-xs uppercase tracking-[0.25em] text-muted">
                Generated
              </p>
              <p className="text-2xl font-semibold text-foreground">
                {analysis.generated_at || "manual snapshot"}
              </p>
              <p className="text-sm text-muted">NetworkX + scikit-learn + torch</p>
            </div>
          </div>
        </div>
      </header>

      <section className="mosaic-grid">
        <MosaicCard title="Volume cadence" subtitle="Diurnal curve" accent="cyan">
          <TimelineChart data={summary.timeline} />
          <p className="text-sm text-muted">
            24h window shows cadence of Austin mobility calls; peaks flag commute
            stress.
          </p>
        </MosaicCard>

        <MosaicCard title="Issue mix" subtitle="Problem taxonomy" accent="amber">
          <IssueChart data={summary.topIssues} />
          <p className="text-sm text-muted">
            The mix highlights where to nudge resources—urgent crashes vs stalled
            vehicles.
          </p>
        </MosaicCard>

        <MosaicCard title="Torch hotspots" subtitle="PyTorch CPU heat" accent="violet">
          <HotspotMap clusters={analysis.clusters} />
          <p className="text-sm text-muted">
            Torch ranks clusters by learned risk; brighter nodes show higher mean
            score.
          </p>
          <div className="mt-2 flex flex-wrap gap-3 text-xs text-muted">
            <span className="rounded-full bg-white/5 px-2 py-1">
              Epochs: {analysis.torch_training.epochs}
            </span>
            <span className="rounded-full bg-white/5 px-2 py-1">
              Final loss: {analysis.torch_training.final_loss}
            </span>
          </div>
        </MosaicCard>

        <MosaicCard title="Roadway graph" subtitle="NetworkX centrality" accent="lime">
          <NetworkGraph nodes={network.nodes} edges={network.edges} />
          <p className="text-sm text-muted">
            Derived from cross-street pairs; central hubs anchor mitigation plans.
          </p>
        </MosaicCard>

        <MosaicCard title="Story beats" subtitle="Narratives" accent="cyan">
          <NarrativeStrip items={narrativeLines} />
        </MosaicCard>

        <MosaicCard title="Newest incidents" subtitle="Scroll the stream" accent="amber">
          <div className="flex flex-col gap-3">
            {recent.map((incident: TrafficIncident) => (
              <div
                key={incident.traffic_report_id}
                className="rounded-xl border border-white/5 bg-white/5 px-3 py-2"
              >
                <p className="text-sm font-semibold text-foreground">
                  {incident.issue_reported}
                </p>
                <p className="text-xs text-muted">
                  {incident.address || "Unknown location"} — {formatDate(incident.published_date)}
                </p>
                <p className="text-[11px] text-muted">
                  Status: {incident.traffic_report_status || "Unknown"} •{" "}
                  {incident.agency || "Agency tbd"}
                </p>
              </div>
            ))}
          </div>
        </MosaicCard>
      </section>
    </main>
  );
}
