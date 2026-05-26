import { describe, expect, it } from 'vitest';
import { derivePillarRows, statusFromScore } from './edaScanner';

describe('statusFromScore', () => {
  it('classifica forte quando nota >= 8', () => {
    expect(statusFromScore(8)).toBe('forte');
    expect(statusFromScore(10)).toBe('forte');
  });

  it('classifica parcial quando nota >= 5 e < 8', () => {
    expect(statusFromScore(5)).toBe('parcial');
    expect(statusFromScore(7)).toBe('parcial');
  });

  it('classifica ausente quando nota < 5', () => {
    expect(statusFromScore(0)).toBe('ausente');
    expect(statusFromScore(4)).toBe('ausente');
  });
});

describe('derivePillarRows', () => {
  it('deriva linhas com status e labels coerentes', () => {
    const rows = derivePillarRows([
      {
        pilar: 'Instagram',
        nota: 9,
        acaoPrioritaria: 'Fortalecer',
        justificativa: 'Presenca forte',
        recomendacao: 'Escalar'
      },
      {
        pilar: 'Automacoes e CRM',
        nota: 6,
        acaoPrioritaria: 'Ajustar',
        justificativa: 'Fluxo parcial',
        recomendacao: 'Refinar'
      },
      {
        pilar: 'Seguranca e Protecao',
        nota: 2,
        acaoPrioritaria: 'Criar',
        justificativa: 'Ausente',
        recomendacao: 'Implantar'
      }
    ]);

    expect(rows).toHaveLength(3);
    expect(rows[0].status).toBe('forte');
    expect(rows[1].status).toBe('parcial');
    expect(rows[2].status).toBe('ausente');
    expect(rows[0].statusLabel).toBe('Forte');
  });
});

