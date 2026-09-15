import type { Zoonosis } from './zoonosisTypes'

export const CATEGORIES = ['Infecciosas', 'Parasitárias', 'Dermatológicas', 'Gastrointestinais', 'Endócrinas', 'Neurológicas']
export const SYSTEMS = ['Renal', 'Hepático', 'Sistêmico', 'Respiratório', 'Gastrointestinal', 'Neurológico', 'Tegumentar', 'Endócrino', 'Cardiovascular', 'Musculoesquelético', 'Reprodutivo']
export const ETIOLOGIES = ['Bacteriana', 'Viral', 'Parasitária', 'Fúngica', 'Metabólica', 'Imunomediada', 'Genética', 'Traumática', 'Neoplásica', 'Idiopática']
export const AGES = ['Filhote', 'Adulto', 'Idoso']
export type ClinicalFilters = { query: string; category: string; system: string; etiology: string; zoonosis: string; age: string; sort: string }
export const EMPTY_FILTERS: ClinicalFilters = { query: '', category: '', system: '', etiology: '', zoonosis: '', age: '', sort: 'az' }
const normalize = (text: string) => text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('pt-BR')

export function filterConditions(items: Zoonosis[], filters: ClinicalFilters) {
  return items.filter(item => {
    const c = item.clinical
    return normalize([item.name, item.agent, ...item.symptoms].join(' ')).includes(normalize(filters.query.trim()))
      && (!filters.category || c.category === filters.category)
      && (!filters.system || c.systems.includes(filters.system))
      && (!filters.etiology || c.etiology === filters.etiology)
      && (!filters.zoonosis || c.isZoonosis === (filters.zoonosis === 'yes'))
      && (!filters.age || c.ageGroups.includes(filters.age))
  }).sort((a, b) => filters.sort === 'za' ? b.name.localeCompare(a.name, 'pt-BR') : filters.sort === 'risk' ? ({ Alto: 0, Médio: 1, Baixo: 2 }[a.risk] - { Alto: 0, Médio: 1, Baixo: 2 }[b.risk]) || a.name.localeCompare(b.name, 'pt-BR') : a.name.localeCompare(b.name, 'pt-BR'))
}
