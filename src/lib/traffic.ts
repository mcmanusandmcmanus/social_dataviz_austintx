import { promises as fs } from "fs";
import path from "path";
import {
  AnalysisSnapshot,
  IncidentSummary,
  NetworkEdge,
  NetworkNode,
  TrafficIncident,
} from "@/types/traffic";

const DATASET_URL =
  "https://data.austintexas.gov/resource/dx9v-zd7x.json?$order=published_date DESC";

type RawIncident = {
  traffic_report_id?: string;
  published_date?: string;
  issue_reported?: string;
  address?: string;
  status?: string;
  traffic_report_status?: string;
  latitude?: string;
  longitude?: string;
  agency?: string;
};

const SAMPLE_INCIDENTS_PATH = path.join(
  process.cwd(),
  "public",
  "data",
  "incidents-sample.json",
);

const ANALYSIS_SNAPSHOT_PATH = path.join(
  process.cwd(),
  "public",
  "data",
  "analysis.json",
);

export const fetchIncidents = async (
  limit = 320,
): Promise<TrafficIncident[]> => {
  const headers: HeadersInit = {};
  if (process.env.AUSTIN_DATA_APP_TOKEN) {
    headers["X-App-Token"] = process.env.AUSTIN_DATA_APP_TOKEN;
  }

  try {
    const response = await fetch(`${DATASET_URL}&$limit=${limit}`, {
      headers,
      next: { revalidate: 300 },
    });

    if (!response.ok) {
      throw new Error(`Dataset fetch failed: ${response.statusText}`);
    }

    const raw = (await response.json()) as RawIncident[];
    return raw.map(normalizeIncident);
  } catch (error) {
    console.warn("Falling back to bundled incidents:", error);
    try {
      return await loadSampleIncidents();
    } catch (readError) {
      console.error("No bundled incidents available", readError);
      return [];
    }
  }
};

export const loadSampleIncidents = async (): Promise<TrafficIncident[]> => {
  const contents = await fs.readFile(SAMPLE_INCIDENTS_PATH, "utf-8");
  const raw = JSON.parse(contents) as RawIncident[];
  return raw.map(normalizeIncident);
};

export const loadAnalysisSnapshot = async (): Promise<AnalysisSnapshot> => {
  const contents = await fs.readFile(ANALYSIS_SNAPSHOT_PATH, "utf-8");
  return JSON.parse(contents) as AnalysisSnapshot;
};

export const summarizeIncidents = (
  incidents: TrafficIncident[],
): IncidentSummary => {
  const total = incidents.length;
  const active = incidents.filter(
    (i) => (i.traffic_report_status || "").toLowerCase() !== "archived",
  ).length;
  const archived = total - active;

  const counts: Record<string, number> = {};
  const timeline = new Array(24).fill(0);

  incidents.forEach((incident) => {
    if (incident.issue_reported) {
      counts[incident.issue_reported] =
        (counts[incident.issue_reported] ?? 0) + 1;
    }
    if (incident.published_date) {
      const hour = new Date(incident.published_date).getHours();
      timeline[hour] += 1;
    }
  });

  const topIssues = Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([label, count]) => ({ label, count }));

  const spotlight =
    topIssues.length > 0
      ? `${topIssues[0].label} dominates right now`
      : "Live Austin mobility pulse";

  return {
    total,
    active,
    archived,
    topIssues,
    timeline: timeline.map((count, hour) => ({ hour, count })),
    spotlight,
  };
};

export const normalizeIncident = (raw: RawIncident): TrafficIncident => ({
  traffic_report_id: raw.traffic_report_id,
  published_date: raw.published_date,
  issue_reported: raw.issue_reported,
  address: raw.address,
  status: raw.status,
  traffic_report_status: raw.traffic_report_status,
  latitude:
    raw.latitude !== undefined ? parseFloat(raw.latitude as string) : undefined,
  longitude:
    raw.longitude !== undefined
      ? parseFloat(raw.longitude as string)
      : undefined,
  agency: raw.agency?.trim(),
});

export const mergeNetwork = (edges: NetworkEdge[], nodes: NetworkNode[]) => {
  const keyed = new Set(nodes.map((n) => n.id));
  const safeEdges = edges.filter(
    (edge) => keyed.has(edge.source) && keyed.has(edge.target),
  );
  return { nodes, edges: safeEdges };
};
