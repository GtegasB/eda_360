import React, { useMemo } from "react";
import { PillarRow, RADAR_EDGES } from "../utils/edaScanner";

interface RadarNetworkProps {
  companyName: string;
  rows: PillarRow[];
}

const statusColor = (status: PillarRow["status"]) => {
  if (status === "forte") return { stroke: "#16a34a", fill: "#dcfce7" };
  if (status === "parcial") return { stroke: "#d97706", fill: "#fef3c7" };
  return { stroke: "#dc2626", fill: "#fee2e2" };
};

const truncateLabel = (value: string) =>
  value.length > 19 ? `${value.slice(0, 19)}...` : value;

export function RadarNetwork({ companyName, rows }: RadarNetworkProps) {
  const nodes = useMemo(() => {
    const cx = 550;
    const cy = 360;
    const radius = 250;

    return rows.map((row, index) => {
      const angle = ((Math.PI * 2) / rows.length) * index - Math.PI / 2;
      const x = cx + Math.cos(angle) * radius + (index % 2 ? 20 : -10);
      const y = cy + Math.sin(angle) * radius + (index % 2 ? -12 : 16);
      return { ...row, x, y };
    });
  }, [rows]);

  if (rows.length === 0) {
    return (
      <div className="h-[520px] rounded-2xl border border-dashed border-slate-200 bg-slate-50 text-sm text-slate-500 flex items-center justify-center">
        Sem dados para desenhar o radar.
      </div>
    );
  }

  const cx = 550;
  const cy = 360;

  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-2 overflow-auto">
      <svg viewBox="0 0 1100 720" className="w-full min-w-[980px] h-[560px] block">
        {RADAR_EDGES.map(([from, to], index) => {
          const a = nodes[from];
          const b = nodes[to];
          if (!a || !b) return null;
          return (
            <line
              key={`edge-${index}`}
              x1={a.x}
              y1={a.y}
              x2={b.x}
              y2={b.y}
              stroke="#e2e8f0"
              strokeWidth="1.5"
              opacity="0.9"
            />
          );
        })}

        <circle cx={cx} cy={cy} r="84" fill="#0f766e" />
        <text x={cx} y={cy - 2} textAnchor="middle" fill="#ffffff" fontSize="24" fontWeight="700">
          {truncateLabel(companyName || "Empresa")}
        </text>
        <text x={cx} y={cy + 20} textAnchor="middle" fill="rgba(255,255,255,.88)" fontSize="13">
          Nucleo E.D.A
        </text>

        {nodes.map((node, index) => {
          const color = statusColor(node.status);
          return (
            <g key={`node-${index}`}>
              <line
                x1={cx}
                y1={cy}
                x2={node.x}
                y2={node.y}
                stroke={color.stroke}
                strokeWidth={node.status === "ausente" ? 2 : 2.8}
                strokeDasharray={node.status === "ausente" ? "8 8" : "0"}
                opacity="0.7"
              />
              <rect
                x={node.x - 92}
                y={node.y - 25}
                width="184"
                height="52"
                rx="14"
                fill={color.fill}
                stroke={color.stroke}
                strokeWidth="2"
              />
              <text
                x={node.x}
                y={node.y - 3}
                textAnchor="middle"
                fill="#0f172a"
                fontSize="11.5"
                fontWeight="700"
              >
                {truncateLabel(node.pilar)}
              </text>
              <text
                x={node.x}
                y={node.y + 14}
                textAnchor="middle"
                fill={color.stroke}
                fontSize="11.5"
                fontWeight="700"
              >
                {node.statusLabel}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

