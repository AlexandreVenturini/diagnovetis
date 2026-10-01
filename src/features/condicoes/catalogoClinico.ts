import type { Condicao } from './condicaoTipos'

export const CATEGORIAS = [
  'Infecciosas',
  'Parasitárias',
  'Dermatológicas',
  'Gastrointestinais',
  'Endócrinas',
  'Neurológicas',
]
export const SISTEMAS = [
  'Renal',
  'Hepático',
  'Sistêmico',
  'Respiratório',
  'Gastrointestinal',
  'Neurológico',
  'Tegumentar',
  'Endócrino',
  'Cardiovascular',
  'Musculoesquelético',
  'Reprodutivo',
]
export const ETIOLOGIAS = [
  'Bacteriana',
  'Viral',
  'Parasitária',
  'Fúngica',
  'Metabólica',
  'Imunomediada',
  'Genética',
  'Traumática',
  'Neoplásica',
  'Idiopática',
]
export const FAIXAS_ETARIAS = ['Filhote', 'Adulto', 'Idoso']
export type FiltrosClinicos = {
  busca: string
  categoria: string
  sistema: string
  etiologia: string
  condicao: string
  idade: string
  ordem: string
}
export const FILTROS_VAZIOS: FiltrosClinicos = {
  busca: '',
  categoria: '',
  sistema: '',
  etiologia: '',
  condicao: '',
  idade: '',
  ordem: 'az',
}
const normalizar = (texto: string) =>
  texto
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('pt-BR')

export function filtrarCondicoes(itens: Condicao[], filtros: FiltrosClinicos) {
  return itens
    .filter((item) => {
      const c = item.dadosClinicos
      return (
        normalizar([item.nome, item.agente, ...item.sintomas].join(' ')).includes(normalizar(filtros.busca.trim())) &&
        (!filtros.categoria || c.categoria === filtros.categoria) &&
        (!filtros.sistema || c.sistemas.includes(filtros.sistema)) &&
        (!filtros.etiologia || c.etiologia === filtros.etiologia) &&
        (!filtros.condicao || c.ehZoonose === (filtros.condicao === 'yes')) &&
        (!filtros.idade || c.faixasEtarias.includes(filtros.idade))
      )
    })
    .sort((a, b) =>
      filtros.ordem === 'za'
        ? b.nome.localeCompare(a.nome, 'pt-BR')
        : filtros.ordem === 'risk'
          ? { Alto: 0, Médio: 1, Baixo: 2 }[a.risco] - { Alto: 0, Médio: 1, Baixo: 2 }[b.risco] ||
            a.nome.localeCompare(b.nome, 'pt-BR')
          : a.nome.localeCompare(b.nome, 'pt-BR'),
    )
}

export const mostrarValor = (valor: string | string[]) =>
  (Array.isArray(valor) ? valor.join(', ') : valor) || 'Não informado'
