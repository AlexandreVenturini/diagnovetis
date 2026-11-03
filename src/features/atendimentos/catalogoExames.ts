import type { DadosExame, ExameCategoria } from '../../models/Exame'

type CampoBase = { chave: string; rotulo: string; resumo?: boolean }

export type CampoEspecifico =
  | (CampoBase & { tipo: 'numero'; unidade?: string; referencia?: [number | null, number | null] })
  | (CampoBase & { tipo: 'opcoes'; opcoes: readonly string[] })
  | (CampoBase & { tipo: 'multiplo'; opcoes: readonly string[] })
  | (CampoBase & { tipo: 'texto'; longo?: boolean })

export type SecaoExame = { titulo?: string; campos: CampoEspecifico[] }

export const GRUPOS_EXAME = {
  hematologia: 'Hematologia',
  bioquimica: 'Bioquímica e hormônios',
  urina_fezes: 'Urina e fezes',
  infecciosas: 'Doenças infecciosas',
  dermatologia: 'Dermatologia',
  patologia: 'Citologia e patologia',
  imagem: 'Imagem',
  cardiologia: 'Cardiologia',
} as const

export type GrupoExame = keyof typeof GRUPOS_EXAME

export type ModeloExame = {
  id: string
  nome: string
  categoria: ExameCategoria
  grupo: GrupoExame
  termos?: string[]
  secoes: SecaoExame[]
}

const numero = (
  chave: string,
  rotulo: string,
  unidade?: string,
  referencia?: [number | null, number | null],
): CampoEspecifico => ({ tipo: 'numero', chave, rotulo, unidade, referencia })
const opcoes = (chave: string, rotulo: string, lista: readonly string[], resumo = false): CampoEspecifico => ({
  tipo: 'opcoes',
  chave,
  rotulo,
  opcoes: lista,
  resumo,
})
const multiplo = (chave: string, rotulo: string, lista: readonly string[], resumo = false): CampoEspecifico => ({
  tipo: 'multiplo',
  chave,
  rotulo,
  opcoes: lista,
  resumo,
})
const texto = (chave: string, rotulo: string, longo = false, resumo = false): CampoEspecifico => ({
  tipo: 'texto',
  chave,
  rotulo,
  longo,
  resumo,
})

const REAGENTE = ['Não reagente', 'Reagente', 'Inconclusivo'] as const
const POSITIVO = ['Negativo', 'Positivo'] as const
const NIVEIS = ['Negativo', 'Traços', '+', '++', '+++'] as const
const CONTENCAO = ['Sem sedação', 'Sedação', 'Anestesia geral'] as const
const reagente = (chave: string, rotulo: string) => opcoes(chave, rotulo, REAGENTE, true)
const impressao = texto('impressao', 'Impressão diagnóstica', true, true)

export const CATALOGO_EXAMES: ModeloExame[] = [
  {
    id: 'hemograma',
    nome: 'Hemograma',
    categoria: 'laboratorial',
    grupo: 'hematologia',
    termos: ['eritrograma', 'leucograma', 'plaquetas', 'sangue'],
    secoes: [
      {
        titulo: 'Eritrograma',
        campos: [
          numero('hemacias', 'Hemácias', '×10⁶/µL', [5.5, 8.5]),
          numero('hemoglobina', 'Hemoglobina', 'g/dL', [12, 18]),
          numero('hematocrito', 'Hematócrito', '%', [37, 55]),
          numero('vcm', 'VCM', 'fL', [60, 77]),
          numero('chcm', 'CHCM', 'g/dL', [32, 36]),
        ],
      },
      {
        titulo: 'Leucograma',
        campos: [
          numero('leucocitos', 'Leucócitos totais', '×10³/µL', [6, 17]),
          numero('bastonetes', 'Neutrófilos bastonetes', '/µL', [0, 300]),
          numero('segmentados', 'Neutrófilos segmentados', '/µL', [3000, 11500]),
          numero('linfocitos', 'Linfócitos', '/µL', [1000, 4800]),
          numero('monocitos', 'Monócitos', '/µL', [150, 1350]),
          numero('eosinofilos', 'Eosinófilos', '/µL', [100, 1250]),
        ],
      },
      {
        titulo: 'Plaquetas e proteínas',
        campos: [
          numero('plaquetas', 'Plaquetas', '×10³/µL', [200, 500]),
          numero('proteina_plasmatica', 'Proteína plasmática total', 'g/dL', [6, 8]),
          texto('morfologia', 'Morfologia celular / observações', true),
        ],
      },
    ],
  },
  {
    id: 'hemoparasitas',
    nome: 'Pesquisa de hemoparasitas',
    categoria: 'laboratorial',
    grupo: 'hematologia',
    termos: ['esfregaço', 'babesia', 'erliquia', 'ehrlichia', 'anaplasma', 'carrapato'],
    secoes: [
      {
        campos: [
          opcoes('metodo', 'Método', ['Esfregaço de sangue periférico', 'Esfregaço de capa leucocitária', 'Outro']),
          opcoes('resultado', 'Resultado', POSITIVO, true),
          multiplo(
            'agentes',
            'Agentes encontrados',
            [
              'Babesia spp.',
              'Ehrlichia spp. (mórula)',
              'Anaplasma spp.',
              'Hepatozoon spp.',
              'Mycoplasma spp.',
              'Outro',
            ],
            true,
          ),
        ],
      },
    ],
  },
  {
    id: 'coagulograma',
    nome: 'Coagulograma',
    categoria: 'laboratorial',
    grupo: 'hematologia',
    termos: ['coagulação', 'tp', 'ttpa', 'fibrinogênio', 'pré-cirúrgico'],
    secoes: [
      {
        campos: [
          numero('tp', 'Tempo de protrombina (TP)', 's'),
          numero('ttpa', 'Tempo de tromboplastina parcial ativada (TTPA)', 's'),
          numero('fibrinogenio', 'Fibrinogênio', 'mg/dL', [200, 400]),
        ],
      },
    ],
  },
  {
    id: 'bioquimica',
    nome: 'Bioquímica sérica',
    categoria: 'laboratorial',
    grupo: 'bioquimica',
    termos: ['ureia', 'creatinina', 'alt', 'tgp', 'fosfatase', 'albumina', 'glicose', 'renal', 'hepático'],
    secoes: [
      {
        titulo: 'Função renal',
        campos: [
          numero('ureia', 'Ureia', 'mg/dL', [21, 60]),
          numero('creatinina', 'Creatinina', 'mg/dL', [0.5, 1.5]),
          numero('fosforo', 'Fósforo', 'mg/dL', [2.6, 6.2]),
        ],
      },
      {
        titulo: 'Função hepática',
        campos: [
          numero('alt', 'ALT (TGP)', 'U/L', [21, 102]),
          numero('fa', 'Fosfatase alcalina', 'U/L', [20, 156]),
          numero('ggt', 'GGT', 'U/L', [1.2, 6.4]),
          numero('bilirrubina_total', 'Bilirrubina total', 'mg/dL', [0.1, 0.5]),
        ],
      },
      {
        titulo: 'Proteínas e metabolismo',
        campos: [
          numero('proteinas_totais', 'Proteínas totais', 'g/dL', [5.4, 7.1]),
          numero('albumina', 'Albumina', 'g/dL', [2.6, 3.3]),
          numero('globulinas', 'Globulinas', 'g/dL', [2.7, 4.4]),
          numero('glicose', 'Glicose', 'mg/dL', [65, 118]),
          numero('colesterol', 'Colesterol total', 'mg/dL', [135, 270]),
          numero('triglicerideos', 'Triglicerídeos', 'mg/dL', [20, 112]),
          numero('calcio', 'Cálcio total', 'mg/dL', [9, 11.3]),
        ],
      },
    ],
  },
  {
    id: 'hormonios',
    nome: 'Dosagens hormonais',
    categoria: 'laboratorial',
    grupo: 'bioquimica',
    termos: ['t4', 'tsh', 'cortisol', 'tireoide', 'hipotireoidismo', 'cushing', 'acth'],
    secoes: [
      {
        titulo: 'Tireoide',
        campos: [
          numero('t4_total', 'T4 total', 'µg/dL', [1, 4]),
          numero('t4_livre', 'T4 livre', 'ng/dL'),
          numero('tsh', 'TSH canino', 'ng/mL', [null, 0.6]),
        ],
      },
      {
        titulo: 'Adrenal',
        campos: [
          opcoes('protocolo', 'Protocolo do cortisol', [
            'Basal',
            'Estimulação com ACTH',
            'Supressão com dexametasona (baixa dose)',
            'Outro',
          ]),
          numero('cortisol_basal', 'Cortisol basal', 'µg/dL'),
          numero('cortisol_pos', 'Cortisol pós-teste', 'µg/dL'),
        ],
      },
    ],
  },
  {
    id: 'urinalise',
    nome: 'Urinálise',
    categoria: 'laboratorial',
    grupo: 'urina_fezes',
    termos: ['urina', 'eas', 'densidade urinária', 'sedimento'],
    secoes: [
      {
        titulo: 'Coleta e exame físico',
        campos: [
          opcoes('coleta', 'Método de coleta', [
            'Cistocentese',
            'Micção espontânea',
            'Sondagem uretral',
            'Compressão vesical',
          ]),
          opcoes('cor', 'Cor', [
            'Amarelo-claro',
            'Amarelo',
            'Amarelo-escuro',
            'Âmbar',
            'Avermelhada',
            'Marrom',
            'Outra',
          ]),
          opcoes('aspecto', 'Aspecto', ['Límpido', 'Ligeiramente turvo', 'Turvo']),
          numero('densidade', 'Densidade', undefined, [1.015, 1.045]),
        ],
      },
      {
        titulo: 'Exame químico',
        campos: [
          numero('ph', 'pH', undefined, [5.5, 7.5]),
          opcoes('proteina', 'Proteína', NIVEIS),
          opcoes('glicose', 'Glicose', NIVEIS),
          opcoes('cetonas', 'Corpos cetônicos', NIVEIS),
          opcoes('bilirrubina', 'Bilirrubina', NIVEIS),
          opcoes('sangue', 'Sangue oculto', NIVEIS),
        ],
      },
      {
        titulo: 'Sedimentoscopia',
        campos: [texto('sedimento', 'Sedimento (hemácias, leucócitos, cilindros, cristais, bactérias)', true)],
      },
    ],
  },
  {
    id: 'fezes',
    nome: 'Exame de fezes',
    categoria: 'laboratorial',
    grupo: 'urina_fezes',
    termos: ['coproparasitológico', 'parasitológico', 'verminose', 'giárdia'],
    secoes: [
      {
        campos: [
          multiplo('metodo', 'Método', [
            'Direto',
            'Willis (flutuação)',
            'Faust (centrífugo-flutuação)',
            'Hoffman (sedimentação)',
            'Outro',
          ]),
          opcoes('resultado', 'Resultado', POSITIVO, true),
          texto('parasitas', 'Parasitas encontrados', false, true),
        ],
      },
    ],
  },
  {
    id: 'teste_cinomose',
    nome: 'Teste rápido de cinomose',
    categoria: 'laboratorial',
    grupo: 'infecciosas',
    termos: ['snap', 'antígeno', 'cdv', 'imunocromatográfico'],
    secoes: [
      {
        campos: [
          opcoes('amostra', 'Amostra', ['Swab conjuntival', 'Sangue / soro', 'Urina', 'Outra']),
          reagente('resultado', 'Resultado'),
        ],
      },
    ],
  },
  {
    id: 'teste_parvovirose',
    nome: 'Teste rápido de parvovirose',
    categoria: 'laboratorial',
    grupo: 'infecciosas',
    termos: ['snap', 'antígeno', 'cpv', 'parvo', 'imunocromatográfico'],
    secoes: [{ campos: [opcoes('amostra', 'Amostra', ['Fezes', 'Swab retal']), reagente('resultado', 'Resultado')] }],
  },
  {
    id: 'teste_leishmaniose',
    nome: 'Teste rápido de leishmaniose',
    categoria: 'laboratorial',
    grupo: 'infecciosas',
    termos: ['snap', 'anticorpo', 'calazar', 'dpp', 'imunocromatográfico'],
    secoes: [{ campos: [reagente('resultado', 'Resultado')] }],
  },
  {
    id: 'teste_4dx',
    nome: 'Teste rápido 4Dx',
    categoria: 'laboratorial',
    grupo: 'infecciosas',
    termos: ['snap', 'erliquiose', 'ehrlichia', 'anaplasma', 'lyme', 'borrelia', 'dirofilariose', 'verme do coração'],
    secoes: [
      {
        campos: [
          reagente('ehrlichia', 'Ehrlichia spp.'),
          reagente('anaplasma', 'Anaplasma spp.'),
          reagente('borrelia', 'Borrelia burgdorferi (Lyme)'),
          reagente('dirofilaria', 'Dirofilaria immitis'),
        ],
      },
    ],
  },
  {
    id: 'teste_giardia',
    nome: 'Teste rápido de giardíase',
    categoria: 'laboratorial',
    grupo: 'infecciosas',
    termos: ['snap', 'giárdia', 'giardia', 'antígeno'],
    secoes: [{ campos: [reagente('resultado', 'Resultado')] }],
  },
  {
    id: 'sorologia',
    nome: 'Sorologia',
    categoria: 'laboratorial',
    grupo: 'infecciosas',
    termos: ['elisa', 'rifi', 'leptospirose', 'título', 'anticorpos'],
    secoes: [
      {
        campos: [
          texto('agente', 'Agente pesquisado', false, true),
          opcoes('metodo', 'Método', ['ELISA', 'RIFI', 'Soroaglutinação microscópica (SAM)', 'Imunodifusão', 'Outro']),
          texto('titulo', 'Título'),
          reagente('resultado', 'Resultado'),
        ],
      },
    ],
  },
  {
    id: 'pcr',
    nome: 'PCR',
    categoria: 'laboratorial',
    grupo: 'infecciosas',
    termos: ['molecular', 'reação em cadeia da polimerase', 'qpcr'],
    secoes: [
      {
        campos: [
          texto('agente', 'Agente pesquisado', false, true),
          texto('amostra', 'Amostra'),
          opcoes('resultado', 'Resultado', ['Não detectado', 'Detectado', 'Inconclusivo'], true),
          texto('quantificacao', 'Carga / quantificação'),
        ],
      },
    ],
  },
  {
    id: 'cultura_antibiograma',
    nome: 'Cultura e antibiograma',
    categoria: 'laboratorial',
    grupo: 'infecciosas',
    termos: ['bacteriológico', 'antibiótico', 'sensibilidade', 'otite', 'urocultura'],
    secoes: [
      {
        campos: [
          texto('material', 'Material / local da coleta'),
          opcoes('crescimento', 'Crescimento', ['Sem crescimento', 'Com crescimento'], true),
          texto('microrganismo', 'Microrganismo isolado', false, true),
        ],
      },
      {
        titulo: 'Antibiograma',
        campos: [
          texto('sensivel', 'Sensível a', true),
          texto('intermediario', 'Intermediário a', true),
          texto('resistente', 'Resistente a', true),
        ],
      },
    ],
  },
  {
    id: 'raspado_cutaneo',
    nome: 'Raspado cutâneo',
    categoria: 'laboratorial',
    grupo: 'dermatologia',
    termos: ['pele', 'sarna', 'demodex', 'sarcoptes', 'ácaro'],
    secoes: [
      {
        campos: [
          texto('local', 'Local do raspado'),
          opcoes('profundidade', 'Tipo', ['Superficial', 'Profundo']),
          opcoes('resultado', 'Resultado', POSITIVO, true),
          multiplo(
            'achados',
            'Ácaros encontrados',
            ['Demodex spp.', 'Sarcoptes scabiei', 'Cheyletiella spp.', 'Otodectes cynotis', 'Outro'],
            true,
          ),
        ],
      },
    ],
  },
  {
    id: 'tricograma',
    nome: 'Tricograma',
    categoria: 'laboratorial',
    grupo: 'dermatologia',
    termos: ['pelo', 'alopecia', 'pele'],
    secoes: [
      {
        campos: [
          texto('local', 'Local da coleta'),
          texto('achados', 'Achados (fases do pelo, pontas, ectoparasitas, esporos)', true, true),
        ],
      },
    ],
  },
  {
    id: 'cultura_fungica',
    nome: 'Cultura fúngica',
    categoria: 'laboratorial',
    grupo: 'dermatologia',
    termos: ['micológico', 'dermatofitose', 'fungo', 'microsporum', 'pele'],
    secoes: [
      {
        campos: [
          texto('local', 'Local da coleta'),
          opcoes(
            'resultado',
            'Resultado',
            ['Sem crescimento', 'Microsporum canis', 'Microsporum gypseum', 'Trichophyton spp.', 'Outro'],
            true,
          ),
        ],
      },
    ],
  },
  {
    id: 'citologia',
    nome: 'Citologia',
    categoria: 'laboratorial',
    grupo: 'patologia',
    termos: ['paaf', 'punção', 'imprint', 'nódulo', 'otológica', 'ouvido'],
    secoes: [
      {
        campos: [
          texto('material', 'Local / material'),
          opcoes('coleta', 'Método de coleta', [
            'PAAF (punção aspirativa)',
            'Imprint',
            'Swab',
            'Raspado',
            'Lavado',
            'Outro',
          ]),
          texto('diagnostico', 'Diagnóstico citológico', true, true),
        ],
      },
    ],
  },
  {
    id: 'histopatologico',
    nome: 'Histopatológico',
    categoria: 'laboratorial',
    grupo: 'patologia',
    termos: ['biópsia', 'tumor', 'neoplasia', 'nódulo', 'anatomopatológico'],
    secoes: [
      {
        campos: [
          texto('material', 'Material enviado'),
          texto('diagnostico', 'Diagnóstico morfológico', true, true),
          texto('grau', 'Grau histológico'),
          opcoes('margens', 'Margens cirúrgicas', ['Livres', 'Exíguas', 'Comprometidas', 'Não avaliadas']),
        ],
      },
    ],
  },
  {
    id: 'radiografia',
    nome: 'Radiografia',
    categoria: 'imagem',
    grupo: 'imagem',
    termos: ['raio-x', 'rx', 'tórax', 'fratura'],
    secoes: [
      {
        campos: [
          texto('regiao', 'Região examinada'),
          multiplo('projecoes', 'Projeções', [
            'Laterolateral direita',
            'Laterolateral esquerda',
            'Ventrodorsal',
            'Dorsoventral',
            'Craniocaudal',
            'Mediolateral',
            'Oblíqua',
          ]),
          opcoes('contencao', 'Contenção', CONTENCAO),
          impressao,
        ],
      },
    ],
  },
  {
    id: 'ultrassonografia',
    nome: 'Ultrassonografia',
    categoria: 'imagem',
    grupo: 'imagem',
    termos: ['usg', 'ultrassom', 'ecografia', 'abdominal', 'fast', 'gestação'],
    secoes: [
      {
        campos: [
          opcoes('regiao', 'Região', [
            'Abdominal total',
            'Abdominal direcionada',
            'Torácica (T-FAST)',
            'Abdominal (A-FAST)',
            'Gestacional',
            'Cervical',
            'Ocular',
            'Outra',
          ]),
          opcoes('jejum', 'Jejum', ['Sim', 'Não']),
          opcoes('contencao', 'Contenção', CONTENCAO),
          impressao,
        ],
      },
    ],
  },
  {
    id: 'ecocardiograma',
    nome: 'Ecocardiograma',
    categoria: 'imagem',
    grupo: 'cardiologia',
    termos: ['eco', 'coração', 'cardíaco', 'sopro'],
    secoes: [
      {
        campos: [
          numero('fracao_encurtamento', 'Fração de encurtamento', '%', [25, 45]),
          numero('ae_ao', 'Relação AE/Ao', undefined, [null, 1.6]),
          opcoes('contencao', 'Contenção', CONTENCAO),
          impressao,
        ],
      },
    ],
  },
  {
    id: 'eletrocardiograma',
    nome: 'Eletrocardiograma',
    categoria: 'outro',
    grupo: 'cardiologia',
    termos: ['ecg', 'arritmia', 'coração', 'cardíaco'],
    secoes: [
      {
        campos: [
          opcoes(
            'ritmo',
            'Ritmo',
            [
              'Sinusal',
              'Arritmia sinusal respiratória',
              'Taquicardia sinusal',
              'Bradicardia sinusal',
              'Fibrilação atrial',
              'Complexos ventriculares prematuros',
              'Taquicardia ventricular',
              'Bloqueio atrioventricular',
              'Outro',
            ],
            true,
          ),
          numero('frequencia', 'Frequência cardíaca', 'bpm', [70, 160]),
          texto('eixo', 'Eixo elétrico'),
          texto('achados', 'Outros achados', true),
        ],
      },
    ],
  },
]

const normalizar = (valor: string) =>
  valor
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .trim()

export function modeloDoExame(modelo: string | null | undefined, nome?: string): ModeloExame | undefined {
  if (modelo) return CATALOGO_EXAMES.find((item) => item.id === modelo)
  if (!nome) return undefined
  return CATALOGO_EXAMES.find((item) => normalizar(item.nome) === normalizar(nome))
}

export type ResultadoBusca = { modelo: ModeloExame; motivo?: string }

const escapar = (valor: string) => valor.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
const comecaPalavra = (texto: string, palavra: string) => new RegExp(`(^|[^a-z0-9])${escapar(palavra)}`).test(texto)

function relevancia(modelo: ModeloExame, palavras: string[]): ResultadoBusca & { nota: number } {
  const nome = normalizar(modelo.nome)
  const termos = (modelo.termos ?? []).map((termo) => ({ termo, normalizado: normalizar(termo) }))
  const grupo = normalizar(GRUPOS_EXAME[modelo.grupo])
  const tudo = [nome, grupo, ...termos.map((item) => item.normalizado)].join(' | ')
  if (!palavras.every((palavra) => comecaPalavra(tudo, palavra))) return { modelo, nota: -1 }
  if (palavras.every((palavra) => comecaPalavra(nome, palavra)))
    return { modelo, nota: nome.startsWith(palavras[0]) ? 0 : 1 }
  const termo = termos.find((item) => palavras.some((palavra) => comecaPalavra(item.normalizado, palavra)))
  if (termo) return { modelo, motivo: termo.termo, nota: 2 }
  return { modelo, nota: 3 }
}

export function buscarComMotivo(busca: string): ResultadoBusca[] {
  const palavras = normalizar(busca).split(/\s+/).filter(Boolean)
  if (!palavras.length) return []
  return CATALOGO_EXAMES.map((modelo) => relevancia(modelo, palavras))
    .filter((item) => item.nota >= 0)
    .sort((a, b) => a.nota - b.nota)
    .map(({ modelo, motivo }) => ({ modelo, motivo }))
}

export function buscarExames(busca: string, grupo?: GrupoExame): ModeloExame[] {
  if (!normalizar(busca)) return CATALOGO_EXAMES.filter((item) => !grupo || item.grupo === grupo)
  return buscarComMotivo(busca).map((item) => item.modelo)
}

export function agruparResultados(resultados: ResultadoBusca[]) {
  const grupos = new Map<GrupoExame, ResultadoBusca[]>()
  for (const resultado of resultados)
    grupos.set(resultado.modelo.grupo, [...(grupos.get(resultado.modelo.grupo) ?? []), resultado])
  return [...grupos].map(([grupo, itens]) => ({ grupo, itens }))
}

export const mesmoNome = (a: string, b: string) => normalizar(a) === normalizar(b)

export const camposDoModelo = (modelo: ModeloExame) => modelo.secoes.flatMap((secao) => secao.campos)

const formatoNumero = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 4 })

export const formatarNumero = (valor: number) => formatoNumero.format(valor)

export function textoReferencia(campo: CampoEspecifico): string {
  if (campo.tipo !== 'numero' || !campo.referencia) return ''
  const [minimo, maximo] = campo.referencia
  if (minimo !== null && maximo !== null) return `${formatarNumero(minimo)} – ${formatarNumero(maximo)}`
  if (maximo !== null) return `até ${formatarNumero(maximo)}`
  return minimo !== null ? `a partir de ${formatarNumero(minimo)}` : ''
}

export function valorNumerico(valor: string | string[] | undefined): number | null {
  if (typeof valor !== 'string' || !valor.trim()) return null
  const convertido = Number(valor.replace(',', '.'))
  return Number.isFinite(convertido) ? convertido : null
}

export function situacaoValor(campo: CampoEspecifico, valor: string | string[] | undefined): 'abaixo' | 'acima' | '' {
  if (campo.tipo !== 'numero' || !campo.referencia) return ''
  const numeroInformado = valorNumerico(valor)
  if (numeroInformado === null) return ''
  const [minimo, maximo] = campo.referencia
  if (minimo !== null && numeroInformado < minimo) return 'abaixo'
  if (maximo !== null && numeroInformado > maximo) return 'acima'
  return ''
}

export const valorPreenchido = (valor: string | string[] | undefined) =>
  Array.isArray(valor) ? valor.length > 0 : Boolean(valor?.trim())

export function valorFormatado(campo: CampoEspecifico, valor: string | string[] | undefined): string {
  if (Array.isArray(valor)) return valor.join(', ')
  if (!valor?.trim()) return ''
  const numeroInformado = campo.tipo === 'numero' ? valorNumerico(valor) : null
  if (numeroInformado === null) return valor.trim()
  return campo.tipo === 'numero' && campo.unidade
    ? `${formatarNumero(numeroInformado)} ${campo.unidade}`
    : formatarNumero(numeroInformado)
}

export function limparDados(modelo: ModeloExame | undefined, dados: DadosExame | undefined): DadosExame {
  if (!modelo || !dados) return {}
  const limpos: DadosExame = {}
  for (const campo of camposDoModelo(modelo)) {
    const valor = dados[campo.chave]
    if (!valorPreenchido(valor)) continue
    if (campo.tipo === 'multiplo')
      limpos[campo.chave] = (Array.isArray(valor) ? valor : [valor as string]).filter((opcao) =>
        campo.opcoes.includes(opcao),
      )
    else if (typeof valor === 'string') limpos[campo.chave] = valor.trim()
  }
  return limpos
}

export function validarDados(modelo: ModeloExame | undefined, dados: DadosExame | undefined): string {
  if (!modelo || !dados) return ''
  for (const campo of camposDoModelo(modelo)) {
    const valor = dados[campo.chave]
    if (!valorPreenchido(valor)) continue
    if (campo.tipo === 'numero' && valorNumerico(valor) === null)
      return `Informe um número válido em "${campo.rotulo}".`
    if (campo.tipo === 'opcoes' && !campo.opcoes.includes(valor as string))
      return `Escolha uma opção válida em "${campo.rotulo}".`
  }
  return ''
}

export function resumirResultado(modelo: ModeloExame | undefined, dados: DadosExame | undefined): string {
  if (!modelo || !dados) return ''
  const campos = camposDoModelo(modelo)
  const numericos = campos.filter((campo) => campo.tipo === 'numero' && valorPreenchido(dados[campo.chave]))
  const alterados = numericos
    .map((campo) => ({ campo, situacao: situacaoValor(campo, dados[campo.chave]) }))
    .filter((item) => item.situacao)
    .map(
      ({ campo, situacao }) =>
        `${campo.rotulo} ${valorFormatado(campo, dados[campo.chave])} (${situacao} da referência)`,
    )
  const destacados = campos
    .filter((campo) => campo.resumo && valorPreenchido(dados[campo.chave]))
    .map((campo) => `${campo.rotulo}: ${valorFormatado(campo, dados[campo.chave])}`)
  const partes = [...destacados, ...alterados]
  if (!partes.length && numericos.some((campo) => campo.tipo === 'numero' && campo.referencia))
    return 'Valores dentro da referência.'
  return partes.join('; ')
}
