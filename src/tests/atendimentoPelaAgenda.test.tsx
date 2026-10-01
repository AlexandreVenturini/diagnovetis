import { describe, expect, it } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { ListaAgendamentos } from '../features/agenda/ListaAgendamentos'
import type { Agendamento } from '../features/agenda/agendaTipos'
import { ModuloAtendimento } from '../features/atendimentos/ModuloAtendimento'
import { atendimentoDoAgendamento } from '../features/atendimentos/atendimentoDoAgendamento'
import type { PetResumo } from '../features/pets/petTipos'

const agendamento: Agendamento = {
  id: 42,
  petId: 2,
  nomePet: 'Rex',
  nomeTutor: 'Maria',
  veterinario: 'Dra. Ana',
  data: '2026-09-21',
  horario: '09:30',
  tipo: 'scheduled',
  tipoServico: 'Retorno',
  observacoes: 'Reavaliar exames',
  status: 'confirmed',
  motivoCancelamento: '',
  lembretes: [],
  idadePet: '3 anos',
  racaPet: 'Poodle',
}
const pets: PetResumo[] = [
  {
    id: 1,
    nome: 'Rex',
    tutor: 'José',
    idade: '9 anos',
    raca: 'Labrador',
    historico: 'Outro paciente',
    peso: '',
    sexo: '',
    contato: '',
  },
  {
    id: 2,
    nome: 'Rex',
    tutor: 'Maria',
    idade: '4 anos',
    raca: 'Poodle',
    historico: 'Histórico de Maria',
    peso: '',
    sexo: '',
    contato: '',
  },
]

describe('Atendimento a partir da agenda', () => {
  it('preenche o paciente correto pelo vínculo e combina histórico e observações', () => {
    expect(atendimentoDoAgendamento(agendamento, pets)).toMatchObject({
      nomePet: 'Rex',
      nomeTutor: 'Maria',
      veterinario: 'Dra. Ana',
      idade: '4 anos',
      raca: 'Poodle',
      queixaPrincipal: 'Retorno',
      historico: 'Histórico de Maria\nReavaliar exames',
    })
    expect(atendimentoDoAgendamento({ ...agendamento, petId: undefined }, pets).idade).toBe('4 anos')
    expect(atendimentoDoAgendamento(agendamento, []).idade).toBe('3 anos')
  })
  it('mostra a ação apenas para situações abertas e perfil com acesso ao atendimento', () => {
    for (const status of ['confirmed', 'waiting', 'in-progress', 'completed', 'cancelled', 'no-show'] as const) {
      const html = renderToStaticMarkup(
        <ListaAgendamentos
          agendamentos={[{ ...agendamento, status }]}
          aoCriar={() => {}}
          aoAtualizar={() => {}}
          aoIniciarAtendimento={() => {}}
        />,
      )
      expect(html.includes('Ir para atendimento')).toBe(['confirmed', 'waiting', 'in-progress'].includes(status))
    }
    const html = renderToStaticMarkup(
      <ListaAgendamentos agendamentos={[agendamento]} aoCriar={() => {}} aoAtualizar={() => {}} />,
    )
    expect(html).not.toContain('Ir para atendimento')
  })
  it('abre a identificação preenchida imediatamente sem esperar outra busca da agenda', () => {
    const html = renderToStaticMarkup(<ModuloAtendimento pets={pets} agendamentoInicial={agendamento} />)
    expect(html).toContain('value="Rex"')
    expect(html).toContain('value="Maria"')
    expect(html).toContain('Veterinário que Atendeu *<select')
    expect(html).toContain('value="4 anos"')
  })
  it('exige a liberação do professor antes de abrir o atendimento do estudante', () => {
    const html = renderToStaticMarkup(
      <ModuloAtendimento pets={pets} agendamentoInicial={agendamento} papel="attendant" />,
    )
    expect(html).not.toContain('1. Identificação do Paciente')
    expect(html).toContain('Carregando professores e estudantes')
  })
})
