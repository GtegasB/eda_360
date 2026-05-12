import React, { useMemo, useState } from 'react';
import { EDAReport } from '../types';

type Mode = 'overview' | 'supply' | 'marketing' | 'sales' | 'expansion' | 'channels';
type FluxoContext = 'vitrine' | 'diagnostico';

type Node = {
  id: string;
  title: string;
  x: number;
  y: number;
  group: Exclude<Mode, 'overview'> | 'core';
};

type Edge = {
  from: string;
  to: string;
};

const nodes: Node[] = [
  { id: 'core', title: 'Empresa', x: 50, y: 50, group: 'core' },
  { id: 'estrutura', title: 'Estrutura', x: 28, y: 30, group: 'supply' },
  { id: 'conteudo', title: 'Conteúdo', x: 50, y: 26, group: 'supply' },
  { id: 'trafego', title: 'Tráfego', x: 72, y: 30, group: 'supply' },
  { id: 'marketing', title: 'Funil Marketing', x: 16, y: 54, group: 'marketing' },
  { id: 'instagram', title: 'Instagram', x: 66, y: 14, group: 'channels' },
  { id: 'google', title: 'Google', x: 34, y: 14, group: 'channels' },
  { id: 'site', title: 'Site/PAC', x: 50, y: 10, group: 'channels' },
  { id: 'whatsapp', title: 'WhatsApp', x: 80, y: 54, group: 'channels' },
  { id: 'vendas', title: 'Vendas', x: 84, y: 54, group: 'sales' },
  { id: 'expansao', title: 'Expansão', x: 84, y: 76, group: 'expansion' }
];

const edges: Edge[] = [
  { from: 'core', to: 'estrutura' },
  { from: 'core', to: 'conteudo' },
  { from: 'core', to: 'trafego' },
  { from: 'core', to: 'instagram' },
  { from: 'core', to: 'google' },
  { from: 'core', to: 'site' },
  { from: 'core', to: 'whatsapp' },
  { from: 'marketing', to: 'core' },
  { from: 'site', to: 'vendas' },
  { from: 'whatsapp', to: 'vendas' },
  { from: 'vendas', to: 'expansao' }
];

const groupsByMode: Record<Mode, Set<Node['group']>> = {
  overview: new Set(['core', 'supply', 'marketing', 'sales', 'expansion', 'channels']),
  supply: new Set(['core', 'supply']),
  marketing: new Set(['core', 'marketing', 'channels']),
  sales: new Set(['core', 'sales', 'channels']),
  expansion: new Set(['core', 'expansion', 'sales']),
  channels: new Set(['core', 'channels'])
};

type FluxoMAVProps = {
  companyName?: string;
  context?: FluxoContext;
  report?: EDAReport | null;
};

const channelNodeMap: Record<string, string> = {
  instagram: 'instagram',
  google: 'google',
  site: 'site',
  whatsapp: 'whatsapp'
};

export function FluxoMAV({ companyName, context = 'vitrine', report = null }: FluxoMAVProps) {
  const [mode, setMode] = useState<Mode>('overview');
  const visibleGroups = groupsByMode[mode];

  const visibleNodeIds = useMemo(
    () => new Set(nodes.filter((n) => visibleGroups.has(n.group)).map((n) => n.id)),
    [visibleGroups]
  );

  const modeLabel: Record<Mode, string> = {
    overview: 'Visão geral',
    supply: 'Abastecimento',
    marketing: 'Marketing',
    sales: 'Vendas',
    expansion: 'Expansão',
    channels: 'Canais'
  };

  const channelStatusByNodeId = useMemo(() => {
    if (context !== 'diagnostico' || !report) return new Map<string, 'active' | 'inactive' | 'recommended'>();

    const map = new Map<string, 'active' | 'inactive' | 'recommended'>();
    Object.entries(channelNodeMap).forEach(([channelKey, nodeId]) => {
      const hit = report.canais.find((c) => c.canal.toLowerCase().includes(channelKey));
      if (!hit) {
        map.set(nodeId, 'recommended');
      } else if (hit.encontrado && hit.ativo) {
        map.set(nodeId, 'active');
      } else {
        map.set(nodeId, 'inactive');
      }
    });
    return map;
  }, [context, report]);

  return (
    <div className="rounded-xl border border-rc-line bg-rc-surface text-rc-text p-4 shadow-[var(--shadow-soft)]">
      <div className="flex items-center justify-between gap-3 mb-3 flex-wrap">
        <div>
          <p className="text-[11px] uppercase tracking-wider text-rc-muted font-bold">E.D.A M.A.V V4</p>
          <h4 className="text-lg font-extrabold">Fluxo Estratégico • {companyName || 'Empresa'}</h4>
        </div>
        <div className="text-xs text-rc-muted bg-rc-surface3 border border-rc-line px-3 py-1 rounded-full font-semibold">
          {context === 'vitrine' ? 'Modo Vitrine E.D.A' : 'Modo Ecossistema da Empresa'} • {modeLabel[mode]}
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2 mb-4">
        {(Object.keys(modeLabel) as Mode[]).map((m) => (
          <button
            key={m}
            onClick={() => setMode(m)}
            className={`text-xs rounded-lg px-3 py-2 border transition ${
              mode === m
                ? 'bg-brand-50 border-brand-300 text-brand-700'
                : 'bg-rc-surface border-rc-line text-rc-muted hover:bg-rc-surface3'
            }`}
          >
            {modeLabel[m]}
          </button>
        ))}
      </div>

      <div className="relative w-full h-[520px] rounded-lg border border-rc-line bg-[radial-gradient(circle_at_50%_30%,rgba(93,134,188,0.14),transparent_35%),radial-gradient(circle_at_50%_65%,rgba(47,169,156,0.12),transparent_35%)] overflow-hidden">
        <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full">
          {edges.map((edge, idx) => {
            const a = nodes.find((n) => n.id === edge.from);
            const b = nodes.find((n) => n.id === edge.to);
            if (!a || !b) return null;
            const visible = visibleNodeIds.has(a.id) && visibleNodeIds.has(b.id);
            return (
              <line
                key={idx}
                x1={a.x}
                y1={a.y}
                x2={b.x}
                y2={b.y}
                stroke={visible ? 'rgba(93,104,118,.55)' : 'rgba(135,147,161,.22)'}
                strokeWidth={0.45}
              />
            );
          })}
        </svg>

        {nodes.map((node) => {
          const visible = visibleNodeIds.has(node.id);
          const isCore = node.id === 'core';
          const status = channelStatusByNodeId.get(node.id);
          const statusTone =
            status === 'active'
              ? 'ring-2 ring-emerald-400/70'
              : status === 'inactive'
                ? 'opacity-60'
                : status === 'recommended'
                  ? 'ring-2 ring-amber-400/70'
                  : '';
          return (
            <div
              key={node.id}
              className={`absolute -translate-x-1/2 -translate-y-1/2 rounded-xl px-3 py-2 border text-center transition ${
                isCore
                  ? 'bg-brand-500 border-brand-600 text-white font-extrabold shadow-[var(--shadow-soft)]'
                  : 'bg-rc-surface border-rc-line text-rc-text'
              } ${statusTone} ${visible ? 'opacity-100' : 'opacity-25'}`}
              style={{ left: `${node.x}%`, top: `${node.y}%` }}
            >
              <div className="text-[11px] leading-tight whitespace-nowrap">{node.title}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
