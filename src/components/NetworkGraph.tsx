import { NetworkEdge, NetworkNode } from "@/types/traffic";

type NetworkGraphProps = {
  nodes: NetworkNode[];
  edges: NetworkEdge[];
};

export function NetworkGraph({ nodes, edges }: NetworkGraphProps) {
  if (!nodes.length) {
    return <p className="text-sm text-muted">Network is warming up.</p>;
  }

  const normalized = nodes.map((node) => ({
    ...node,
    px: node.x * 100,
    py: node.y * 100,
  }));

  const edgeEls = edges.slice(0, 30).map((edge, idx) => {
    const from = normalized.find((n) => n.id === edge.source);
    const to = normalized.find((n) => n.id === edge.target);
    if (!from || !to) return null;
    return (
      <line
        key={`${edge.source}-${edge.target}-${idx}`}
        x1={`${from.px}%`}
        y1={`${from.py}%`}
        x2={`${to.px}%`}
        y2={`${to.py}%`}
        stroke="rgba(125, 243, 255, 0.25)"
        strokeWidth={Math.max(1, edge.weight * 0.6)}
      />
    );
  });

  return (
    <div className="h-60 w-full rounded-xl bg-[#0c0f17] px-2 py-3">
      <svg className="h-full w-full">
        <defs>
          <linearGradient id="node" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#7df3ff" stopOpacity={0.95} />
            <stop offset="100%" stopColor="#8ef3a1" stopOpacity={0.85} />
          </linearGradient>
        </defs>
        <g>{edgeEls}</g>
        {normalized.slice(0, 30).map((node) => (
          <g key={node.id}>
            <circle
              cx={`${node.px}%`}
              cy={`${node.py}%`}
              r={10 + node.centrality * 16}
              fill="url(#node)"
              opacity={0.9}
            />
            <text
              x={`${node.px}%`}
              y={`${node.py - 12}%`}
              textAnchor="middle"
              fill="#cde9ff"
              fontSize="10"
            >
              {node.id.slice(0, 14)}
            </text>
          </g>
        ))}
      </svg>
    </div>
  );
}
