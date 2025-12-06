export type TrafficIncident = {
  traffic_report_id?: string;
  published_date?: string;
  issue_reported?: string;
  address?: string;
  status?: string;
  traffic_report_status?: string;
  latitude?: number;
  longitude?: number;
  agency?: string;
};

export type IncidentSummary = {
  total: number;
  active: number;
  archived: number;
  topIssues: { label: string; count: number }[];
  timeline: { hour: number; count: number }[];
  spotlight: string;
};

export type HotspotCluster = {
  id: number | string;
  count: number;
  center: { lat: number; lon: number };
  top_issue: string;
  torch_risk: number;
};

export type NetworkNode = {
  id: string;
  centrality: number;
  degree: number;
  x: number;
  y: number;
};

export type NetworkEdge = { source: string; target: string; weight: number };

export type AnalysisSnapshot = {
  generated_at: string;
  clusters: HotspotCluster[];
  network: { nodes: NetworkNode[]; edges: NetworkEdge[] };
  torch_training: { epochs: number; final_loss: number; note: string };
};
