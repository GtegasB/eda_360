import React, { useMemo, useState } from 'react';
import { AppView, CompanyInput, ComplementaryEntityInput, EDAReport } from './types';
import { analyzeCompany } from './services/geminiService';
import { Button, Card, Input, MacroTitle, MesoText, MicroLabel, Badge } from './components/UI';
import { RadarNetwork } from './components/RadarNetwork';
import { FluxoMAV } from './components/FluxoMAV';
import { derivePillarRows } from './utils/edaScanner';
import {
  Radar,
  Check,
  X,
  Download,
  ChevronRight,
  Activity,
  Shield,
  Target,
  Building2,
  LayoutGrid,
  AlertCircle,
  Sparkles,
  Plus,
  Trash2,
  Clipboard,
  Workflow
} from 'lucide-react';

const MAX_COMPLEMENTARY_ENTITIES = 3;
const ENTITY_TYPES = ['Institucional', 'Profissional', 'Unidade', 'Plataforma', 'Social'];

const EXAMPLE_INPUT: CompanyInput = {
  identifier: 'Gluh',
  cityUF: 'Cotia / SP',
  segment: 'Plataforma de RH, endomarketing e recompensas',
  site: 'https://gluh.com.br',
  strategicNote: 'Analisar institucional + plataforma + posicionamento digital',
  complementaryEntities: [
    { type: 'Institucional', name: 'Gluh Plataforma', link: 'https://gluh.com.br' },
    { type: 'Plataforma', name: 'Portal Odoo', link: 'https://gluh2.odoo.com' },
    { type: 'Social', name: '@gluh.platform', link: 'https://instagram.com/gluh.platform' }
  ]
};

const createEmptyEntity = (): ComplementaryEntityInput => ({
  type: ENTITY_TYPES[0],
  name: '',
  link: ''
});

const scoreTone = (score: number) => {
  if (score >= 8) return 'text-rc-green';
  if (score >= 5) return 'text-rc-amber';
  return 'text-rc-red';
};

const actionTone = (action: string) => {
  if (action === 'Fortalecer') return 'bg-green-50 text-rc-green border-green-200';
  if (action === 'Ajustar') return 'bg-amber-50 text-rc-amber border-amber-200';
  return 'bg-red-50 text-rc-red border-red-200';
};

function SystemSidebar({ active }: { active: 'form' | 'report' }) {
  return (
    <aside className="bg-rc-surface text-rc-text p-6 lg:p-5 lg:sticky lg:top-0 lg:h-screen overflow-auto border-r border-rc-line-soft">
      <div className="flex flex-col gap-1 mb-7">
        <strong className="text-xl font-bold tracking-tight">EDA360</strong>
        <span className="text-xs text-rc-muted leading-relaxed font-semibold">
          Centro de Inteligencia Digital<br />
          Estrutura EDA
        </span>
      </div>

      <div className="grid gap-2 mb-6 text-sm">
        <div className={`rounded-lg px-3 py-2 border font-semibold ${active === 'form' ? 'bg-brand-50 border-brand-300 text-brand-700' : 'bg-rc-surface3 border-rc-line text-rc-muted'}`}>Nova analise</div>
        <div className={`rounded-lg px-3 py-2 border font-semibold ${active === 'report' ? 'bg-brand-50 border-brand-300 text-brand-700' : 'bg-rc-surface3 border-rc-line text-rc-muted'}`}>Relatorio</div>
        <div className="rounded-lg px-3 py-2 bg-rc-surface3 border border-rc-line text-rc-muted font-semibold">Radar dos pilares</div>
        <div className="rounded-lg px-3 py-2 bg-rc-surface3 border border-rc-line text-rc-muted font-semibold">Ecossistema visual</div>
        <div className="rounded-lg px-3 py-2 bg-rc-surface3 border border-rc-line text-rc-muted font-semibold">Sessao estrategica</div>
      </div>

      <div className="rounded-xl border border-rc-line bg-rc-surface3 p-4 text-xs text-rc-muted leading-relaxed">
        O EDA360 analisa empresa principal + ate 3 entidades complementares, organiza os 19 pilares da E.D.A e mostra
        como o ecossistema digital esta conectado.
      </div>
    </aside>
  );
}

export default function App() {
  const [view, setView] = useState<AppView>(AppView.LANDING);
  const [input, setInput] = useState<CompanyInput>({
    identifier: '',
    cityUF: '',
    segment: '',
    site: '',
    strategicNote: '',
    complementaryEntities: [createEmptyEntity()]
  });
  const [report, setReport] = useState<EDAReport | null>(null);
  const [processingStep, setProcessingStep] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  const sanitizeInput = (val: string) => {
    const cleaned = val.trim();
    if (!cleaned) return '';

    try {
      if (cleaned.toLowerCase().startsWith('http') || cleaned.toLowerCase().includes('.com')) {
        const urlStr = cleaned.startsWith('http') ? cleaned : `https://${cleaned}`;
        const url = new URL(urlStr);

        if (url.hostname.includes('instagram.com')) {
          const pathParts = url.pathname.split('/').filter(p => p);
          if (pathParts.length > 0) return `@${pathParts[0]}`;
        }

        return url.hostname.replace('www.', '');
      }
    } catch {
      return cleaned.split('?')[0];
    }

    return cleaned;
  };

  const clearForm = () => {
    setInput({
      identifier: '',
      cityUF: '',
      segment: '',
      site: '',
      strategicNote: '',
      complementaryEntities: [createEmptyEntity()]
    });
    setError(null);
  };

  const fillExample = () => {
    setInput(EXAMPLE_INPUT);
    setError(null);
  };

  const addEntity = () => {
    setInput(prev => {
      if (prev.complementaryEntities.length >= MAX_COMPLEMENTARY_ENTITIES) return prev;
      return { ...prev, complementaryEntities: [...prev.complementaryEntities, createEmptyEntity()] };
    });
  };

  const removeEntity = (index: number) => {
    setInput(prev => {
      const next = prev.complementaryEntities.filter((_, idx) => idx !== index);
      return { ...prev, complementaryEntities: next.length > 0 ? next : [createEmptyEntity()] };
    });
  };

  const updateEntity = (index: number, field: keyof ComplementaryEntityInput, value: string) => {
    setInput(prev => {
      const next = [...prev.complementaryEntities];
      next[index] = { ...next[index], [field]: value };
      return { ...prev, complementaryEntities: next };
    });
  };

  const handleStart = async () => {
    const aistudio = (window as any).aistudio;
    if (aistudio) {
      const hasKey = await aistudio.hasSelectedApiKey();
      if (!hasKey) {
        await aistudio.openSelectKey();
      }
    }
    setView(AppView.FORM);
  };

  const handleRunDiagnosis = async () => {
    if (!input.identifier.trim()) return;

    setError(null);
    setView(AppView.PROCESSING);

    const steps = [
      'Mapeando presenca da empresa principal...',
      'Cruzando entidades complementares...',
      'Validando pilares com Google Search...',
      'Lendo conexoes do ecossistema...',
      'Classificando criar, ajustar e fortalecer...',
      'Fechando relatorio E.D.A...'
    ];

    let stepIndex = 0;
    const interval = setInterval(() => {
      if (stepIndex < steps.length) {
        setProcessingStep(steps[stepIndex]);
        stepIndex++;
      }
    }, 1800);

    const sanitizedInput: CompanyInput = {
      identifier: sanitizeInput(input.identifier),
      cityUF: input.cityUF?.trim() || '',
      segment: input.segment?.trim() || '',
      site: input.site?.trim() || '',
      strategicNote: input.strategicNote?.trim() || '',
      complementaryEntities: input.complementaryEntities
        .map(entity => ({
          type: entity.type?.trim() || 'Institucional',
          name: sanitizeInput(entity.name || ''),
          link: sanitizeInput(entity.link || '')
        }))
        .filter(entity => entity.name || entity.link)
        .slice(0, MAX_COMPLEMENTARY_ENTITIES)
    };

    try {
      const result = await analyzeCompany(sanitizedInput);
      setReport(result);
      clearInterval(interval);
      setView(AppView.REPORT);
    } catch (err: unknown) {
      clearInterval(interval);
      console.error(err);

      const aistudio = (window as any).aistudio;
      if ((err as Error).message === 'API_KEY_RESOURCE_NOT_FOUND') {
        setProcessingStep('Recurso nao liberado na chave.');
        setTimeout(async () => {
          if (aistudio) await aistudio.openSelectKey();
          setView(AppView.FORM);
          setError('Sua chave atual nao permite busca no Google. Selecione uma chave com Billing ativo.');
        }, 1800);
      } else {
        setProcessingStep('Erro ao processar analise.');
        setTimeout(() => {
          setView(AppView.FORM);
          setError('Nao foi possivel processar essa empresa agora. Tente nome da empresa, site principal ou @perfil oficial.');
        }, 1800);
      }
    }
  };

  const hasComplementaryEntities = useMemo(
    () => input.complementaryEntities.some(item => item.name.trim().length > 0 || item.link.trim().length > 0),
    [input.complementaryEntities]
  );

  const LandingView = () => (
    <div className="min-h-screen bg-rc-bg p-6 md:p-10">
      <div className="max-w-5xl mx-auto grid lg:grid-cols-2 gap-8 items-center min-h-[85vh]">
        <div className="space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rc-surface border border-rc-line shadow-[var(--shadow-soft)]">
            <Sparkles className="w-4 h-4 text-brand-600" />
            <span className="text-xs font-bold text-rc-muted">Estrutura EDA</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-black tracking-tight text-rc-text leading-tight">
            EDA360
            <span className="block text-brand-700 mt-1">Scanner estrategico de estrutura digital</span>
          </h1>
          <p className="text-rc-muted text-base md:text-lg leading-relaxed max-w-2xl font-medium">
            Produto de entrada do <strong>Centro de Inteligencia Digital</strong> para leitura inicial da maturidade digital
            e abertura para implantacao da metodologia <strong>E.D.A</strong>.
          </p>

          <Button onClick={handleStart} className="w-full md:w-auto px-10 py-5 text-base">
            Iniciar diagnostico gratuito
            <ChevronRight className="w-4 h-4" />
          </Button>
          <Button variant="secondary" onClick={() => setView(AppView.VITRINE)} className="w-full md:w-auto px-10 py-5 text-base">
            Ver Mapa E.D.A.
            <LayoutGrid className="w-4 h-4" />
          </Button>
        </div>

        <Card className="shadow-[var(--shadow)] bg-rc-surface">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 bg-gradient-to-br from-brand-500 to-brand-700 rounded-2xl flex items-center justify-center text-white">
              <Radar className="w-7 h-7" />
            </div>
            <div>
              <h2 className="text-xl font-extrabold text-rc-text">Leitura aplicada do scanner</h2>
              <p className="text-sm text-rc-muted mt-1">Layout em formato de sistema com radar de pilares e mapa visual.</p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );

  const FormView = () => (
    <div className="min-h-screen bg-rc-bg lg:grid lg:grid-cols-[280px_1fr]">
      <SystemSidebar active="form" />

      <main className="p-6 md:p-8">
        <div className="max-w-6xl mx-auto space-y-6">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <h2 className="text-3xl font-black text-rc-text">Entrada da analise</h2>
            <div className="flex gap-2 flex-wrap">
              <Button variant="secondary" className="!py-2 !px-4" onClick={fillExample}>Exemplo Gluh</Button>
              <Button variant="ghost" className="!py-2 !px-4" onClick={clearForm}>Limpar</Button>
            </div>
          </div>

          <Card className="space-y-6 shadow-xl border-0 p-8 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-brand-400 to-brand-700"></div>
            {error && (
              <div className="p-4 bg-red-50 border border-red-100 rounded-2xl flex flex-col gap-2 text-red-600">
                <div className="flex items-center gap-2 font-bold text-xs uppercase">
                  <AlertCircle className="w-4 h-4" /> Erro de Configuracao
                </div>
                <p className="text-[11px] leading-relaxed">{error}</p>
                <button
                  onClick={() => (window as any).aistudio?.openSelectKey()}
                  className="text-[10px] font-black underline uppercase text-left hover:text-red-700 mt-1"
                >
                  Trocar chave de API
                </button>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
              <div className="md:col-span-6">
                <Input
                  label="Empresa principal"
                  placeholder="Ex: Gluh"
                  value={input.identifier}
                  onChange={e => setInput(prev => ({ ...prev, identifier: e.target.value }))}
                  autoFocus
                />
              </div>
              <div className="md:col-span-3">
                <Input
                  label="Cidade / UF"
                  placeholder="Ex: Cotia / SP"
                  value={input.cityUF || ''}
                  onChange={e => setInput(prev => ({ ...prev, cityUF: e.target.value }))}
                />
              </div>
              <div className="md:col-span-3">
                <Input
                  label="Segmento"
                  placeholder="Ex: RH e endomarketing"
                  value={input.segment || ''}
                  onChange={e => setInput(prev => ({ ...prev, segment: e.target.value }))}
                />
              </div>

              <div className="md:col-span-6">
                <Input
                  label="Site ou link principal"
                  placeholder="https://..."
                  value={input.site || ''}
                  onChange={e => setInput(prev => ({ ...prev, site: e.target.value }))}
                />
              </div>
              <div className="md:col-span-6">
                <Input
                  label="Observacao estrategica"
                  placeholder="Ex: analisar institucional + profissional"
                  value={input.strategicNote || ''}
                  onChange={e => setInput(prev => ({ ...prev, strategicNote: e.target.value }))}
                />
              </div>
            </div>

            <div className="space-y-3">
              {input.complementaryEntities.map((entity, idx) => (
                <div key={idx} className="border border-rc-line bg-rc-surface3 rounded-xl p-4">
                  <div className="flex items-center justify-between gap-3 mb-3">
                    <strong className="text-sm text-rc-text">Entidade complementar {idx + 1}</strong>
                    <span className="text-[10px] uppercase tracking-wide font-bold text-brand-700 bg-brand-50 border border-brand-100 px-2 py-1 rounded-full">
                      ate 3 analises
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
                    <div className="md:col-span-3 flex flex-col gap-2">
                      <label className="text-xs font-bold text-rc-muted ml-1 uppercase tracking-wide">Tipo</label>
                      <select
                        value={entity.type}
                        onChange={e => updateEntity(idx, 'type', e.target.value)}
                        className="w-full p-3 rounded-lg border border-rc-line bg-rc-surface text-rc-text focus:border-brand-500 focus:ring-2 focus:ring-brand-100 outline-none"
                      >
                        {ENTITY_TYPES.map(type => (
                          <option key={type} value={type}>{type}</option>
                        ))}
                      </select>
                    </div>
                    <div className="md:col-span-5">
                      <Input
                        label="Nome"
                        placeholder="Ex: unidade centro"
                        value={entity.name}
                        onChange={e => updateEntity(idx, 'name', e.target.value)}
                      />
                    </div>
                    <div className="md:col-span-4">
                      <Input
                        label="Link ou arroba"
                        placeholder="https://... ou @..."
                        value={entity.link}
                        onChange={e => updateEntity(idx, 'link', e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="mt-3">
                    <Button variant="ghost" type="button" className="!py-2 !px-3 text-xs" onClick={() => removeEntity(idx)}>
                      <Trash2 className="w-4 h-4" /> Remover entidade
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            <div className="rounded-xl bg-rc-surface3 border border-rc-line p-4 text-xs text-rc-muted">
              {!hasComplementaryEntities
                ? 'Sem entidades complementares: o diagnostico sera focado na empresa principal.'
                : 'Com entidades complementares: o relatorio incluira leitura cruzada do ecossistema digital.'}
            </div>

            <div className="flex flex-wrap gap-2 pt-2">
              <Button
                variant="secondary"
                type="button"
                className="!py-3"
                onClick={addEntity}
                disabled={input.complementaryEntities.length >= MAX_COMPLEMENTARY_ENTITIES}
              >
                <Plus className="w-4 h-4" /> Adicionar entidade
              </Button>
              <Button onClick={handleRunDiagnosis} className="!py-3 flex-1 min-w-[220px]">
                Analisar E.D.A
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </Card>

          <p className="text-[10px] text-rc-soft uppercase font-bold tracking-widest text-center">
            Requer Google Cloud Billing para busca ativa
          </p>
        </div>
      </main>
    </div>
  );

  const VitrineView = () => (
    <div className="min-h-screen bg-rc-bg p-6 md:p-8">
      <div className="max-w-6xl mx-auto space-y-4">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <h2 className="text-2xl md:text-3xl font-black text-rc-text">Vitrine E.D.A • Ecossistema visual completo</h2>
          <Button variant="ghost" onClick={() => setView(AppView.LANDING)} className="!py-2 !px-4">
            Voltar
          </Button>
        </div>
        <Card className="border-0 shadow-sm">
          <FluxoMAV companyName="E.D.A" context="vitrine" />
        </Card>
      </div>
    </div>
  );

  const ProcessingView = () => (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[radial-gradient(circle_at_top,_#ecfdf5_0%,_#ffffff_55%)] p-6 text-center">
      <div className="relative">
      <div className="w-24 h-24 border-4 border-rc-line-soft rounded-full"></div>
        <div className="w-24 h-24 border-4 border-brand-500 border-t-transparent rounded-full animate-spin absolute top-0 left-0 shadow-[0_0_15px_rgba(16,185,129,0.3)]"></div>
      </div>
      <h2 className="text-xl font-extrabold mt-10 text-rc-text animate-pulse">{processingStep}</h2>
      <p className="text-sm text-rc-muted mt-2">Consolidando leitura do ecossistema digital...</p>
    </div>
  );

  const ReportView = () => {
    if (!report) return null;

    const handlePrint = () => window.print();
    const companyName = report.empresaPrincipal.nome || input.identifier;
    const companyCity = report.empresaPrincipal.cidade || 'Nacional';
    const companySegment = report.empresaPrincipal.segmento || 'Nao identificado';

    const rows = derivePillarRows(report.pilares);
    const strong = rows.filter(row => row.status === 'forte').length;
    const partial = rows.filter(row => row.status === 'parcial').length;
    const absent = rows.filter(row => row.status === 'ausente').length;

    const createFallback = rows.filter(row => row.status === 'ausente').slice(0, 6).map(row => row.leitura);
    const adjustFallback = rows.filter(row => row.status === 'parcial').slice(0, 6).map(row => row.leitura);
    const strengthenFallback = rows.filter(row => row.status === 'forte').slice(0, 6).map(row => row.leitura);

    const createList = report.leituraEstrutural.criar.length > 0 ? report.leituraEstrutural.criar : createFallback;
    const adjustList = report.leituraEstrutural.ajustar.length > 0 ? report.leituraEstrutural.ajustar : adjustFallback;
    const strengthenList = report.leituraEstrutural.fortalecer.length > 0 ? report.leituraEstrutural.fortalecer : strengthenFallback;

    const clipboardText = [
      `Empresa: ${companyName}`,
      `Nota geral E.D.A: ${report.notaGeralEDA}/10`,
      `Pilares fortes: ${strong} | Parciais: ${partial} | Ausentes: ${absent}`,
      `Resumo: ${report.resumoExecutivo}`,
      `Proximo passo: ${report.recomendacaoComercial.proximoPasso}`
    ].join('\n');

    const copySummary = async () => {
      try {
        await navigator.clipboard.writeText(clipboardText);
      } catch (err) {
        console.error(err);
      }
    };

    return (
      <div className="min-h-screen bg-slate-100 lg:grid lg:grid-cols-[280px_1fr]">
        <SystemSidebar active="report" />

        <main className="p-4 md:p-8">
          <div className="max-w-6xl mx-auto space-y-6">
            <div className="bg-white/90 backdrop-blur-md border border-slate-100 p-4 rounded-2xl no-print flex justify-between items-center gap-3 flex-wrap shadow-sm">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-gradient-to-br from-brand-500 to-brand-700 rounded-xl flex items-center justify-center text-white shadow-md shadow-brand-500/20">
                  <LayoutGrid className="w-4 h-4" />
                </div>
                <div>
                  <span className="font-bold text-slate-900 tracking-tight block">EDA360 Scanner</span>
                  <span className="text-[10px] uppercase tracking-wide text-slate-500">Centro de Inteligencia Digital</span>
                </div>
              </div>
              <div className="flex gap-2 flex-wrap">
                <Button variant="secondary" className="!py-2 !px-4" onClick={() => setView(AppView.FORM)}>Nova analise</Button>
                <Button variant="ghost" className="!py-2 !px-4" onClick={copySummary}><Clipboard className="w-4 h-4" /></Button>
                <Button variant="ghost" className="!py-2 !px-4" onClick={handlePrint}><Download className="w-4 h-4" /></Button>
              </div>
            </div>
            <Card className="border-0 shadow-sm relative overflow-hidden bg-gradient-to-br from-white to-brand-50/60">
              <div className="relative z-10">
                <MicroLabel>Relatorio Estrutural E.D.A</MicroLabel>
                <MacroTitle className="mb-2">{companyName}</MacroTitle>
                <div className="flex flex-wrap items-center gap-2 text-sm text-slate-500">
                  <span className="font-medium text-slate-700">{companyCity}</span>
                  <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
                  <span className="font-medium text-brand-700 px-2 py-0.5 bg-brand-50 rounded-lg">{companySegment}</span>
                  <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
                  <span className="font-medium text-slate-600">{report.dataGeracao}</span>
                </div>
                <p className="text-sm text-slate-600 mt-4 max-w-3xl leading-relaxed">{report.resumoExecutivo}</p>
              </div>
              <div className="absolute -top-8 -right-8 opacity-[0.05]">
                <Radar className="w-56 h-56" />
              </div>
            </Card>

            <section className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="!p-5 border-0 shadow-sm text-center">
                <small className="text-[11px] uppercase tracking-wider text-slate-400">Nota geral</small>
                <div className={`text-5xl font-black mt-2 ${scoreTone(report.notaGeralEDA)}`}>{report.notaGeralEDA}</div>
                <p className="text-xs text-slate-500 mt-2">Maturidade estrutural da E.D.A</p>
              </Card>
              <Card className="!p-5 border-0 shadow-sm text-center">
                <small className="text-[11px] uppercase tracking-wider text-slate-400">Pilares fortes</small>
                <div className="text-5xl font-black mt-2 text-emerald-600">{strong}</div>
                <p className="text-xs text-slate-500 mt-2">Base ja utilizavel</p>
              </Card>
              <Card className="!p-5 border-0 shadow-sm text-center">
                <small className="text-[11px] uppercase tracking-wider text-slate-400">Pilares parciais</small>
                <div className="text-5xl font-black mt-2 text-amber-600">{partial}</div>
                <p className="text-xs text-slate-500 mt-2">Pontos de ajuste</p>
              </Card>
              <Card className="!p-5 border-0 shadow-sm text-center">
                <small className="text-[11px] uppercase tracking-wider text-slate-400">Pilares ausentes</small>
                <div className="text-5xl font-black mt-2 text-rose-600">{absent}</div>
                <p className="text-xs text-slate-500 mt-2">Pontos de criacao</p>
              </Card>
            </section>

            <Card className="border-0 shadow-sm">
              <h3 className="text-lg font-bold text-slate-900 mb-3">Resumo estrategico</h3>
              <div className="p-4 rounded-xl bg-brand-50 border-l-4 border-brand-500 text-sm text-slate-700 leading-relaxed">
                <strong>{report.recomendacaoComercial.nivelProntidao}</strong> prontidao de ecossistema. {report.recomendacaoComercial.aberturaSessaoEstrategica}
                {' '}Direcao sugerida: {report.recomendacaoComercial.proximoPasso}
              </div>
            </Card>

            <section className="grid lg:grid-cols-2 gap-6 page-break">
              <Card className="border-0 shadow-sm">
                <div className="flex items-center gap-2 mb-4">
                  <Activity className="w-5 h-5 text-brand-600" />
                  <h3 className="text-lg font-bold text-slate-900">Radar dos 19 pilares</h3>
                </div>
                <div className="overflow-auto border border-slate-100 rounded-xl">
                  <table className="min-w-[860px] w-full border-collapse">
                    <thead>
                      <tr className="bg-slate-50 text-[11px] uppercase tracking-wider text-slate-500">
                        <th className="text-left p-3">Pilar</th>
                        <th className="text-left p-3">Status</th>
                        <th className="text-left p-3">Acao</th>
                        <th className="text-left p-3">Ligacao principal</th>
                        <th className="text-left p-3">Leitura</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rows.map((row, idx) => (
                        <tr key={idx} className="border-t border-slate-100 align-top text-sm">
                          <td className="p-3 font-semibold text-slate-800">{row.pilar}</td>
                          <td className="p-3">
                            <span className={`px-2 py-1 rounded-full text-xs font-bold ${row.status === 'forte' ? 'bg-emerald-50 text-emerald-700' : row.status === 'parcial' ? 'bg-amber-50 text-amber-700' : 'bg-rose-50 text-rose-700'}`}>
                              {row.statusLabel}
                            </span>
                          </td>
                          <td className="p-3">
                            <span className={`px-2 py-1 text-[10px] font-bold uppercase rounded-full border ${actionTone(row.acao)}`}>
                              {row.acao}
                            </span>
                          </td>
                          <td className="p-3 text-slate-600">{row.relation}</td>
                          <td className="p-3 text-slate-600">{row.leitura}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>

              <Card className="border-0 shadow-sm">
                <h3 className="text-lg font-bold text-slate-900 mb-4">Mapa do ecossistema</h3>
                <RadarNetwork companyName={companyName} rows={rows} />
              </Card>
            </section>

            <section className="grid grid-cols-1 gap-6">
              <Card className="border-0 shadow-sm">
                <h3 className="text-lg font-bold text-slate-900 mb-4">Fluxo estratégico E.D.A M.A.V V4</h3>
                <FluxoMAV companyName={companyName} context="diagnostico" report={report} />
              </Card>
            </section>

            <section className="grid lg:grid-cols-3 gap-4">
              <Card className="border-0 shadow-sm">
                <div className="flex items-center gap-2 mb-3">
                  <Workflow className="w-4 h-4 text-rose-600" />
                  <h3 className="font-bold text-slate-900">Criar</h3>
                </div>
                <ul className="space-y-2 text-sm text-slate-600 list-disc list-inside">
                  {createList.map((item, idx) => <li key={idx}>{item}</li>)}
                  {createList.length === 0 && <li className="text-slate-400">Sem itens prioritarios.</li>}
                </ul>
              </Card>
              <Card className="border-0 shadow-sm">
                <div className="flex items-center gap-2 mb-3">
                  <Workflow className="w-4 h-4 text-amber-600" />
                  <h3 className="font-bold text-slate-900">Ajustar</h3>
                </div>
                <ul className="space-y-2 text-sm text-slate-600 list-disc list-inside">
                  {adjustList.map((item, idx) => <li key={idx}>{item}</li>)}
                  {adjustList.length === 0 && <li className="text-slate-400">Sem itens prioritarios.</li>}
                </ul>
              </Card>
              <Card className="border-0 shadow-sm">
                <div className="flex items-center gap-2 mb-3">
                  <Workflow className="w-4 h-4 text-emerald-600" />
                  <h3 className="font-bold text-slate-900">Fortalecer</h3>
                </div>
                <ul className="space-y-2 text-sm text-slate-600 list-disc list-inside">
                  {strengthenList.map((item, idx) => <li key={idx}>{item}</li>)}
                  {strengthenList.length === 0 && <li className="text-slate-400">Sem itens prioritarios.</li>}
                </ul>
              </Card>
            </section>

            <section className="grid lg:grid-cols-2 gap-6">
              <Card className="border-0 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-slate-900">Empresas no diagnostico</h3>
                  <Badge active>Ancoragem: {report.ancoraOficial}</Badge>
                </div>
                <div className="space-y-3 text-sm">
                  <div className="p-4 rounded-2xl border border-slate-100 bg-slate-50">
                    <div className="flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-brand-600" />
                      <span className="font-semibold text-slate-900">Principal</span>
                    </div>
                    <p className="text-slate-700 mt-2">{report.empresaPrincipal.nome} • {report.empresaPrincipal.cidade} • {report.empresaPrincipal.segmento}</p>
                  </div>
                  {report.entidadesComplementares.length > 0 ? (
                    report.entidadesComplementares.map((entity, idx) => (
                      <div key={idx} className="p-4 rounded-2xl border border-slate-100 bg-white">
                        <span className="text-[11px] uppercase tracking-wide text-slate-500">Complementar {idx + 1}</span>
                        <p className="text-slate-800 mt-1 font-medium">{entity.nome}</p>
                        <p className="text-xs text-slate-500 mt-1">{entity.cidade} • {entity.segmento}</p>
                      </div>
                    ))
                  ) : (
                    <div className="p-4 rounded-2xl border border-dashed border-slate-200 text-slate-500 text-xs">
                      Nenhuma entidade complementar informada ou identificada.
                    </div>
                  )}
                </div>
              </Card>

              <Card className="border-0 shadow-sm">
                <div className="flex items-center gap-2 mb-4">
                  <Shield className="w-4 h-4 text-brand-600" />
                  <h3 className="text-lg font-bold text-slate-900">Canais digitais</h3>
                </div>
                <div className="space-y-3 max-h-[360px] overflow-auto pr-1">
                  {report.canais.map((c, i) => (
                    <div key={i} className="flex items-center justify-between p-4 bg-slate-50/80 rounded-2xl border border-transparent hover:border-slate-100">
                      <div className="flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${c.encontrado ? 'bg-gradient-to-br from-brand-400 to-brand-600 text-white' : 'bg-slate-200 text-slate-500'}`}>
                          {c.encontrado ? <Check className="w-5 h-5" /> : <X className="w-5 h-5" />}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-900">{c.canal}</p>
                          <p className="text-xs text-slate-500">{c.tipo}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        {c.pareceOficial && <span className="text-[9px] font-black text-brand-600 bg-brand-50 px-2 py-0.5 rounded border border-brand-100 uppercase">Oficial</span>}
                        <div className={`w-2.5 h-2.5 rounded-full shadow-inner ${c.ativo ? 'bg-brand-500 animate-pulse' : 'bg-slate-300'}`}></div>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </section>

            <div className="text-center pt-4 no-print pb-16">
              <Button className="mx-auto w-full md:w-auto text-base px-10 py-5">
                <Target className="w-4 h-4" /> Agendar Sessao Estrategica E.D.A
              </Button>
              <MesoText className="mt-3 text-xs text-slate-500">
                O EDA360 e a porta de entrada gratuita para implantacao completa da metodologia.
              </MesoText>
            </div>
          </div>
        </main>
      </div>
    );
  };

  return (
    <>
      {view === AppView.LANDING && <LandingView />}
      {view === AppView.VITRINE && <VitrineView />}
      {view === AppView.FORM && <FormView />}
      {view === AppView.PROCESSING && <ProcessingView />}
      {view === AppView.REPORT && <ReportView />}
    </>
  );
}
