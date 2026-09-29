import { describe, expect, it } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { addDays, dateInput, markLoaded, periodRange, rangesToFetch, type RangeCache } from '../features/common/period'
import { summarizePatients, type SummaryItem } from '../features/records/patientSummaries'
import { AppointmentList } from '../features/appointments/AppointmentList'
import type { Appointment } from '../features/appointments/appointmentTypes'
import { DogList } from '../features/dogs/DogList'
import type { Dog } from '../features/dogs/dogTypes'

const item = (key: string, consultaId: number | null, date: string, petId: number, dogName: string): SummaryItem => ({
  key,
  consultaId,
  date,
  veterinarian: 'Dra. Ana',
  pet: { id: petId, dogName, tutorName: 'Maria', breed: 'SRD', weight: '10' },
})

const appointment = (id: number, date: string): Appointment => ({
  id,
  dogName: `Cão ${id}`,
  tutorName: 'Maria',
  veterinarian: 'Dra. Ana',
  date,
  time: '09:00',
  kind: 'scheduled',
  serviceType: 'Consulta',
  notes: '',
  status: 'confirmed',
  cancellationReason: '',
  reminders: [],
})

describe('Troca de períodos nas telas', () => {
  it('depois de carregar Tudo não busca de novo ao voltar para Dia ou Mês', () => {
    let cache: RangeCache = { all: false, ranges: [] }
    const mes = periodRange({ view: 'month', date: '2026-09-28' })
    expect(rangesToFetch(cache, mes)).toEqual([mes])
    cache = markLoaded(cache, mes)
    expect(rangesToFetch(cache, periodRange({ view: 'day', date: '2026-09-28' }))).toEqual([])
    expect(rangesToFetch(cache, periodRange({ view: 'year', date: '2026-09-28' }))).toEqual([
      { start: '2026-01-01', end: '2026-08-31' },
      { start: '2026-10-01', end: '2026-12-31' },
    ])
    cache = markLoaded(cache, null)
    expect(rangesToFetch(cache, periodRange({ view: 'day', date: '2020-01-01' }))).toEqual([])
  })

  it('prontuários mostram só pacientes atendidos no período, mesmo com tudo em memória', () => {
    const carregados = [
      item('c-1', 1, '2026-09-03', 1, 'Rex'),
      item('c-2', 2, '2026-09-23', 2, 'Jade'),
      item('c-3', 3, '2025-05-10', 3, 'Toby'),
      item('p-4', null, '', 4, 'Luna'),
    ]
    expect(summarizePatients(carregados, '', periodRange({ view: 'day', date: '2026-09-28' }))).toEqual([])
    expect(
      summarizePatients(carregados, '', periodRange({ view: 'day', date: '2026-09-23' })).map((p) => p.dogName),
    ).toEqual(['Jade'])
    expect(
      summarizePatients(carregados, '', periodRange({ view: 'month', date: '2026-09-28' })).map((p) => p.dogName),
    ).toEqual(['Jade', 'Rex'])
    expect(summarizePatients(carregados, '', null).map((p) => p.dogName)).toEqual(['Jade', 'Rex', 'Toby'])
    expect(summarizePatients(carregados, 'lu', null).map((p) => p.dogName)).toEqual(['Luna'])
  })

  it('agenda no Dia mostra só as consultas daquele dia', () => {
    const agenda = [appointment(1, '2026-09-03'), appointment(2, '2026-09-23'), appointment(3, '2026-09-23')]
    const render = (view: 'day' | 'month', date: string) =>
      renderToStaticMarkup(
        <AppointmentList
          appointments={agenda}
          onCreate={() => {}}
          onUpdate={() => {}}
          period={{ view, date }}
          onPeriodChange={() => {}}
          query=""
          onQueryChange={() => {}}
        />,
      )
    expect(render('day', '2026-09-28')).toContain('0 resultado(s)')
    expect(render('day', '2026-09-23')).toContain('2 resultado(s)')
    expect(render('month', '2026-09-28')).toContain('3 resultado(s)')
  })

  it('cadastro filtra pela data de cadastro do animal', () => {
    const hoje = dateInput()
    const dog = (id: number, createdAt: string): Dog => ({
      id,
      name: `Cão ${id}`,
      breed: 'SRD',
      age: '2 anos',
      weight: '10',
      sex: '',
      tutor: 'Maria',
      contact: '',
      history: '',
      createdAt,
    })
    const dogs = [dog(1, hoje), dog(2, addDays(hoje, -400)), dog(3, addDays(hoje, -800))]
    localStorage.setItem('diagnovetis:periodo:cadastro', 'day')
    expect(
      renderToStaticMarkup(<DogList dogs={dogs} onCreate={() => {}} onEdit={() => {}} onDetails={() => {}} />),
    ).toContain('1 de 3 animal(is)')
    localStorage.setItem('diagnovetis:periodo:cadastro', 'all')
    expect(
      renderToStaticMarkup(<DogList dogs={dogs} onCreate={() => {}} onEdit={() => {}} onDetails={() => {}} />),
    ).toContain('3 de 3 animal(is)')
  })
})
