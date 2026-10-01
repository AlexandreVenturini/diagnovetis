import { describe, expect, it } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import {
  somarDias,
  dataParaCampo,
  marcarCarregado,
  intervaloPeriodo,
  intervalosParaBuscar,
  type CacheIntervalos,
} from '../features/shared/periodo'
import { resumirProntuarios, type ItemResumo } from '../features/prontuarios/resumoProntuarios'
import { ListaAgendamentos } from '../features/agenda/ListaAgendamentos'
import type { Agendamento } from '../features/agenda/agendaTipos'
import { ListaPets } from '../features/pets/ListaPets'
import type { PetResumo } from '../features/pets/petTipos'

const item = (key: string, consultaId: number | null, data: string, petId: number, nomePet: string): ItemResumo => ({
  key,
  consultaId,
  data,
  veterinario: 'Dra. Ana',
  pet: { id: petId, nomePet, nomeTutor: 'Maria', raca: 'SRD', peso: '10' },
})

const agendamento = (id: number, data: string): Agendamento => ({
  id,
  nomePet: `Cão ${id}`,
  nomeTutor: 'Maria',
  veterinario: 'Dra. Ana',
  data,
  horario: '09:00',
  tipo: 'scheduled',
  tipoServico: 'Consulta',
  observacoes: '',
  status: 'confirmed',
  motivoCancelamento: '',
  lembretes: [],
})

describe('Troca de períodos nas telas', () => {
  it('depois de carregar Tudo não busca de novo ao voltar para Dia ou Mês', () => {
    let cache: CacheIntervalos = { todos: false, intervalos: [] }
    const mes = intervaloPeriodo({ visao: 'mes', data: '2026-09-28' })
    expect(intervalosParaBuscar(cache, mes)).toEqual([mes])
    cache = marcarCarregado(cache, mes)
    expect(intervalosParaBuscar(cache, intervaloPeriodo({ visao: 'dia', data: '2026-09-28' }))).toEqual([])
    expect(intervalosParaBuscar(cache, intervaloPeriodo({ visao: 'ano', data: '2026-09-28' }))).toEqual([
      { inicio: '2026-01-01', fim: '2026-08-31' },
      { inicio: '2026-10-01', fim: '2026-12-31' },
    ])
    cache = marcarCarregado(cache, null)
    expect(intervalosParaBuscar(cache, intervaloPeriodo({ visao: 'dia', data: '2020-01-01' }))).toEqual([])
  })

  it('prontuários mostram só pacientes atendidos no período, mesmo com tudo em memória', () => {
    const carregados = [
      item('c-1', 1, '2026-09-03', 1, 'Rex'),
      item('c-2', 2, '2026-09-23', 2, 'Jade'),
      item('c-3', 3, '2025-05-10', 3, 'Toby'),
      item('p-4', null, '', 4, 'Luna'),
    ]
    expect(resumirProntuarios(carregados, '', intervaloPeriodo({ visao: 'dia', data: '2026-09-28' }))).toEqual([])
    expect(
      resumirProntuarios(carregados, '', intervaloPeriodo({ visao: 'dia', data: '2026-09-23' })).map((p) => p.nomePet),
    ).toEqual(['Jade'])
    expect(
      resumirProntuarios(carregados, '', intervaloPeriodo({ visao: 'mes', data: '2026-09-28' })).map((p) => p.nomePet),
    ).toEqual(['Jade', 'Rex'])
    expect(resumirProntuarios(carregados, '', null).map((p) => p.nomePet)).toEqual(['Jade', 'Rex', 'Toby'])
    expect(resumirProntuarios(carregados, 'lu', null).map((p) => p.nomePet)).toEqual(['Luna'])
  })

  it('agenda no Dia mostra só as consultas daquele dia', () => {
    const agenda = [agendamento(1, '2026-09-03'), agendamento(2, '2026-09-23'), agendamento(3, '2026-09-23')]
    const renderizar = (visao: 'dia' | 'mes', data: string) =>
      renderToStaticMarkup(
        <ListaAgendamentos
          agendamentos={agenda}
          aoCriar={() => {}}
          aoAtualizar={() => {}}
          periodo={{ visao, data }}
          aoAlterarPeriodo={() => {}}
          busca=""
          aoAlterarBusca={() => {}}
        />,
      )
    expect(renderizar('dia', '2026-09-28')).toContain('0 resultado(s)')
    expect(renderizar('dia', '2026-09-23')).toContain('2 resultado(s)')
    expect(renderizar('mes', '2026-09-28')).toContain('3 resultado(s)')
  })

  it('cadastro filtra pela data de cadastro do animal', () => {
    const hoje = dataParaCampo()
    const pet = (id: number, cadastradoEm: string): PetResumo => ({
      id,
      nome: `Cão ${id}`,
      raca: 'SRD',
      idade: '2 anos',
      peso: '10',
      sexo: '',
      tutor: 'Maria',
      contato: '',
      historico: '',
      cadastradoEm,
    })
    const pets = [pet(1, hoje), pet(2, somarDias(hoje, -400)), pet(3, somarDias(hoje, -800))]
    localStorage.setItem('diagnovetis:periodo:cadastro', 'dia')
    expect(
      renderToStaticMarkup(<ListaPets pets={pets} aoCriar={() => {}} aoEditar={() => {}} aoDetalhar={() => {}} />),
    ).toContain('1 de 3 animal(is)')
    localStorage.setItem('diagnovetis:periodo:cadastro', 'tudo')
    expect(
      renderToStaticMarkup(<ListaPets pets={pets} aoCriar={() => {}} aoEditar={() => {}} aoDetalhar={() => {}} />),
    ).toContain('3 de 3 animal(is)')
  })
})
