import { z } from "zod";

const actionSchema = z
  .string()
  .transform((v) => v.toLowerCase())
  .transform((v) => (v.includes("fortal") ? "Fortalecer" : v.includes("ajust") ? "Ajustar" : "Criar"));

const pillarSchema = z.object({
  pilar: z.string(),
  nota: z.coerce.number().optional(),
  acaoPrioritaria: actionSchema.optional(),
  justificativa: z.string().optional(),
  recomendacao: z.string().optional(),
});

const ecosystemEntitySchema = z.object({
  id: z.string().optional(),
  nome: z.string().optional(),
  tipo: z.enum(["Principal", "Complementar"]).optional(),
  papel: z.string().optional(),
  statusConexao: z.enum(["Conectada", "Parcial", "Isolada"]).optional(),
  forcaDigital: z.coerce.number().optional(),
});

const ecosystemLinkSchema = z.object({
  de: z.string().optional(),
  para: z.string().optional(),
  tipo: z.string().optional(),
  status: z.enum(["Ativo", "Fraco", "Ausente"]).optional(),
  observacao: z.string().optional(),
});

export const reportInputSchema = z.object({
  identidadeProduto: z
    .object({
      nomeInstitucional: z.string().optional(),
      metodologia: z.string().optional(),
      aplicativo: z.string().optional(),
      papelAplicativo: z.string().optional(),
    })
    .optional(),
  empresaPrincipal: z
    .object({
      nome: z.string().optional(),
      cidade: z.string().optional(),
      segmento: z.string().optional(),
    })
    .optional(),
  dadosIdentificados: z
    .object({
      nome: z.string().optional(),
      cidade: z.string().optional(),
      segmento: z.string().optional(),
    })
    .optional(),
  entidadesComplementares: z
    .array(
      z.object({
        nome: z.string().optional(),
        cidade: z.string().optional(),
        segmento: z.string().optional(),
      })
    )
    .optional(),
  resumoExecutivo: z.string().optional(),
  ancoraOficial: z.string().optional(),
  notaGeralEDA: z.coerce.number().optional(),
  canais: z
    .array(
      z.object({
        tipo: z.string().optional(),
        canal: z.string().optional(),
        url: z.string().optional(),
        nomeExibido: z.string().optional(),
        encontrado: z.coerce.boolean().optional(),
        pareceOficial: z.coerce.boolean().optional(),
        ativo: z.coerce.boolean().optional(),
        ultimoSinal: z.string().optional(),
        observacoes: z.string().optional(),
      })
    )
    .optional(),
  notasEDA: z
    .array(
      z.object({
        dimensao: z.string().optional(),
        nota: z.coerce.number().optional(),
        justificativa: z.string().optional(),
      })
    )
    .optional(),
  pilares: z.array(pillarSchema).optional(),
  leituraEstrutural: z
    .object({
      criar: z.array(z.string()).optional(),
      ajustar: z.array(z.string()).optional(),
      fortalecer: z.array(z.string()).optional(),
    })
    .optional(),
  ecossistema: z
    .object({
      entidades: z.array(ecosystemEntitySchema).optional(),
      conexoes: z.array(ecosystemLinkSchema).optional(),
      leitura: z.string().optional(),
    })
    .optional(),
  planoAcao: z
    .object({
      criar: z.array(z.string()).optional(),
      ajustar: z.array(z.string()).optional(),
      fortalecer: z.array(z.string()).optional(),
    })
    .optional(),
  recomendacaoComercial: z
    .object({
      nivelProntidao: z.string().optional(),
      aberturaSessaoEstrategica: z.string().optional(),
      proximoPasso: z.string().optional(),
    })
    .optional(),
  dataGeracao: z.string().optional(),
});

export type ReportInput = z.infer<typeof reportInputSchema>;
