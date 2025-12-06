import json
import math
import os
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Tuple

import networkx as nx
import pandas as pd
import requests
import torch
import torch.nn as nn
from sklearn.cluster import KMeans
from sklearn.preprocessing import MinMaxScaler

DATA_URL = "https://data.austintexas.gov/resource/dx9v-zd7x.json"
PROJECT_ROOT = Path(__file__).resolve().parents[1]
PUBLIC_DATA = PROJECT_ROOT / "public" / "data"


def fetch_records(limit: int = 360) -> List[Dict]:
    """Pull a recent slice of traffic incidents from Socrata."""
    headers = {}
    token = os.getenv("AUSTIN_DATA_APP_TOKEN")
    if token:
        headers["X-App-Token"] = token

    response = requests.get(
        DATA_URL,
        params={"$limit": limit, "$order": "published_date DESC"},
        headers=headers,
        timeout=30,
    )
    response.raise_for_status()
    return response.json()


def severity(issue: str) -> float:
    text = (issue or "").lower()
    if any(k in text for k in ("urgent", "collision", "injury", "major")):
        return 1.0
    if "crash" in text:
        return 0.8
    if any(k in text for k in ("stalled", "obstruction", "blocked")):
        return 0.55
    return 0.4


def normalize(records: List[Dict]) -> pd.DataFrame:
    df = pd.DataFrame(records)
    if df.empty:
        return df
    df["latitude"] = pd.to_numeric(df.get("latitude"), errors="coerce")
    df["longitude"] = pd.to_numeric(df.get("longitude"), errors="coerce")
    df = df[
        (df["latitude"].between(29, 31))
        & (df["longitude"].between(-99, -97))
    ]
    issues = df["issue_reported"] if "issue_reported" in df else pd.Series([""] * len(df))
    df["severity"] = issues.apply(severity)
    return df


def build_network(df: pd.DataFrame) -> Tuple[List[Dict], List[Dict]]:
    G = nx.Graph()
    address_series = df.get("address").fillna("")

    for _, address in address_series.items():
        if not isinstance(address, str):
            continue
        if "/" in address:
            parts = [part.strip() for part in address.split("/") if part.strip()]
            if len(parts) >= 2:
                a, b = parts[0], parts[1]
                if a and b:
                    weight = 1 + (G.get_edge_data(a, b, {}).get("weight", 0))
                    G.add_edge(a, b, weight=weight)

    if len(G.nodes) == 0:
        return [], []

    # Spring layout for consistent positions; normalize to 0..1 for the UI
    positions = nx.spring_layout(G, weight="weight", seed=7, iterations=60)
    centrality = nx.betweenness_centrality(G, k=min(40, len(G.nodes)))

    def normalize_coord(value: float, axis: int) -> float:
        coords = [pos[axis] for pos in positions.values()]
        min_c, max_c = min(coords), max(coords)
        return (
            0.5 if math.isclose(min_c, max_c) else (value - min_c) / (max_c - min_c)
        )

    nodes = []
    for node_id, pos in positions.items():
        nodes.append(
            {
                "id": node_id,
                "centrality": float(centrality.get(node_id, 0)),
                "degree": int(G.degree[node_id]),
                "x": normalize_coord(pos[0], 0),
                "y": normalize_coord(pos[1], 1),
            }
        )

    nodes = sorted(nodes, key=lambda n: n["centrality"], reverse=True)[:30]
    edges = [
        {"source": u, "target": v, "weight": data.get("weight", 1)}
        for u, v, data in G.edges(data=True)
    ]
    edges = sorted(edges, key=lambda e: e["weight"], reverse=True)[:40]
    return nodes, edges


def cluster_hotspots(df: pd.DataFrame) -> pd.DataFrame:
    coords = df[["latitude", "longitude", "severity"]].dropna()
    if coords.empty:
        return pd.DataFrame()

    # Normalize coordinates for clustering stability
    scaler = MinMaxScaler()
    scaled = scaler.fit_transform(coords[["latitude", "longitude"]])
    k = max(2, min(6, len(coords) // 40))
    model = KMeans(n_clusters=k, n_init="auto", random_state=7)
    labels = model.fit_predict(scaled)
    coords = coords.copy()
    coords["cluster"] = labels
    return coords


def torch_risk(coords: pd.DataFrame) -> Tuple[pd.DataFrame, float]:
    """Train a tiny MLP to score incident risk by location + severity."""
    if coords.empty:
        return coords, 0.0

    X = torch.tensor(
        coords[["latitude", "longitude", "severity"]].values, dtype=torch.float32
    )
    # Normalize lat/long for the model
    X[:, 0] = (X[:, 0] - X[:, 0].min()) / (X[:, 0].max() - X[:, 0].min() + 1e-6)
    X[:, 1] = (X[:, 1] - X[:, 1].min()) / (X[:, 1].max() - X[:, 1].min() + 1e-6)
    y = (coords["severity"].values > 0.65).astype(float)
    y = torch.tensor(y, dtype=torch.float32).unsqueeze(1)

    model = nn.Sequential(
        nn.Linear(3, 16),
        nn.ReLU(),
        nn.Linear(16, 8),
        nn.ReLU(),
        nn.Linear(8, 1),
    )
    loss_fn = nn.BCEWithLogitsLoss()
    optimizer = torch.optim.Adam(model.parameters(), lr=0.02)

    epochs = 55
    for _ in range(epochs):
        optimizer.zero_grad()
        logits = model(X)
        loss = loss_fn(logits, y)
        loss.backward()
        optimizer.step()

    with torch.no_grad():
        risk = torch.sigmoid(model(X)).squeeze().numpy()
    coords = coords.copy()
    coords["torch_risk"] = risk
    return coords, float(loss.item())


def compose_snapshot(df: pd.DataFrame) -> Dict:
    network_nodes, network_edges = build_network(df)
    clusters = cluster_hotspots(df)
    if not clusters.empty:
        clusters, final_loss = torch_risk(clusters)
    else:
        final_loss = 0.0

    grouped = []
    if not clusters.empty:
        for cluster_id, group in clusters.groupby("cluster"):
            grouped.append(
                {
                    "id": int(cluster_id),
                    "count": int(len(group)),
                    "center": {
                        "lat": float(group["latitude"].mean()),
                        "lon": float(group["longitude"].mean()),
                    },
                    "top_issue": str(
                        df.loc[group.index]["issue_reported"]
                        .fillna("Unknown")
                        .mode()
                        .iloc[0]
                        if len(group.index)
                        else "Unknown"
                    ),
                    "torch_risk": round(float(group["torch_risk"].mean()), 4),
                }
            )

    snapshot = {
        "generated_at": datetime.utcnow().isoformat() + "Z",
        "clusters": grouped,
        "network": {"nodes": network_nodes, "edges": network_edges},
        "torch_training": {
            "epochs": 55,
            "final_loss": round(final_loss, 5),
            "note": "Tiny torch MLP trained on normalized lat/lon/severity",
        },
    }
    return snapshot


def write_json(path: Path, payload: Dict | List):
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", encoding="utf-8") as f:
        json.dump(payload, f, ensure_ascii=False, indent=2)


def main():
    records = fetch_records(limit=360)
    write_json(PUBLIC_DATA / "incidents-sample.json", records)

    df = normalize(records)
    snapshot = compose_snapshot(df)
    write_json(PUBLIC_DATA / "analysis.json", snapshot)
    print("Analysis snapshot written to public/data/")


if __name__ == "__main__":
    main()
