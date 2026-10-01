import { useState } from 'react'
import type { FormEvent } from 'react'
import { AGENDAMENTO_VAZIO } from './agendamentoVazio'
import type { DadosFormularioAgendamento } from './agendaTipos'
import type { PetResumo } from '../pets/petTipos'
import { formatarIdadePet } from '../pets/idadePet'

type FormularioAgendamentoProps = {
  aoSalvar: (dados: DadosFormularioAgendamento) => Promise<boolean>
  aoCancelar: () => void
  erro?: string
  pets: PetResumo[]
}

export function FormularioAgendamento({ aoSalvar, aoCancelar, erro, pets }: FormularioAgendamentoProps) {
  const [formulario, setFormulario] = useState<DadosFormularioAgendamento>(AGENDAMENTO_VAZIO)
  const [buscaPet, setBuscaPet] = useState('')
  const [buscaTutor, setBuscaTutor] = useState('')
  const [buscaPetAberta, setBuscaPetAberta] = useState(false)
  const [buscaTutorAberta, setBuscaTutorAberta] = useState(false)
  const [erroBusca, setErroBusca] = useState('')

  function atualizar(key: keyof DadosFormularioAgendamento, valor: string) {
    setFormulario((atual) => ({ ...atual, [key]: valor }))
  }

  async function enviar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault()
    if (!formulario.petId) {
      setErroBusca('Selecione um cão cadastrado na lista de resultados.')
      setBuscaPetAberta(true)
      return
    }
    await aoSalvar(formulario)
  }

  const buscaPetNormalizada = buscaPet.trim().toLocaleLowerCase('pt-BR')
  const buscaTutorNormalizada = buscaTutor.trim().toLocaleLowerCase('pt-BR')
  const petsEncontrados = pets
    .filter(
      (pet) =>
        !pet.obitoEm &&
        (!buscaPetNormalizada || `${pet.nome} ${pet.raca}`.toLocaleLowerCase('pt-BR').includes(buscaPetNormalizada)) &&
        (!buscaTutorNormalizada || pet.tutor.toLocaleLowerCase('pt-BR').includes(buscaTutorNormalizada)),
    )
    .slice(0, 6)
  const tutores = [
    ...new Map(
      pets.map((pet) => [pet.tutor.trim().toLocaleLowerCase('pt-BR'), { nome: pet.tutor, contato: pet.contato }]),
    ).values(),
  ]
  const tutoresEncontrados = tutores
    .filter(
      (tutor) =>
        !buscaTutorNormalizada ||
        `${tutor.nome} ${tutor.contato}`.toLocaleLowerCase('pt-BR').includes(buscaTutorNormalizada),
    )
    .slice(0, 6)

  function selecionarPet(pet: PetResumo) {
    setFormulario((atual) => ({
      ...atual,
      petId: pet.id,
      nomePet: pet.nome,
      idadePet: formatarIdadePet(pet.idade),
      racaPet: pet.raca,
      nomeTutor: pet.tutor,
    }))
    setBuscaPet(pet.nome)
    setBuscaTutor(pet.tutor)
    setBuscaPetAberta(false)
    setBuscaTutorAberta(false)
    setErroBusca('')
  }

  function buscarPet(valor: string) {
    setBuscaPet(valor)
    setBuscaPetAberta(true)
    setErroBusca('')
    if (valor !== formulario.nomePet)
      setFormulario((atual) => ({ ...atual, petId: undefined, nomePet: '', idadePet: '', racaPet: '' }))
  }

  function selecionarTutor(nome: string) {
    setBuscaTutor(nome)
    setBuscaTutorAberta(false)
    setBuscaPetAberta(true)
    setFormulario((atual) =>
      atual.nomeTutor === nome
        ? atual
        : { ...atual, petId: undefined, nomePet: '', idadePet: '', racaPet: '', nomeTutor: nome },
    )
    if (formulario.nomeTutor !== nome) setBuscaPet('')
  }

  return (
    <section className="content-card appointment-form-card">
      <h2>Agendar Consulta</h2>
      <form className="appointment-form" onSubmit={enviar}>
        <label className="appointment-search-field">
          Buscar cão
          <input
            value={buscaPet}
            onFocus={() => setBuscaPetAberta(true)}
            onChange={(evento) => buscarPet(evento.target.value)}
            placeholder="Digite o nome ou a raça do cão"
            autoComplete="off"
            required
          />
          {buscaPetAberta && buscaPetNormalizada && (
            <div className="appointment-search-results">
              {petsEncontrados.map((pet) => (
                <button
                  type="button"
                  key={pet.id}
                  onMouseDown={(evento) => evento.preventDefault()}
                  onClick={() => selecionarPet(pet)}
                >
                  <i>{pet.nome.charAt(0).toUpperCase()}</i>
                  <span>
                    <strong>{pet.nome}</strong>
                    <small>
                      {pet.raca} · Tutor: {pet.tutor}
                    </small>
                  </span>
                </button>
              ))}
              {petsEncontrados.length === 0 && <p>Nenhum cão encontrado para esta busca.</p>}
            </div>
          )}
          {pets.length === 0 && (
            <small className="field-help warning">Cadastre um cão antes de criar o agendamento.</small>
          )}
        </label>
        <label className="appointment-search-field">
          Buscar tutor
          <input
            value={buscaTutor}
            onFocus={() => setBuscaTutorAberta(true)}
            onChange={(evento) => {
              setBuscaTutor(evento.target.value)
              setBuscaTutorAberta(true)
              if (evento.target.value !== formulario.nomeTutor)
                setFormulario((atual) => ({ ...atual, petId: undefined, nomePet: '', nomeTutor: evento.target.value }))
            }}
            placeholder="Digite o nome ou contato do tutor"
            autoComplete="off"
            required
          />
          {buscaTutorAberta && buscaTutorNormalizada && (
            <div className="appointment-search-results">
              {tutoresEncontrados.map((tutor) => (
                <button
                  type="button"
                  key={tutor.nome}
                  onMouseDown={(evento) => evento.preventDefault()}
                  onClick={() => selecionarTutor(tutor.nome)}
                >
                  <i>{tutor.nome.charAt(0).toUpperCase()}</i>
                  <span>
                    <strong>{tutor.nome}</strong>
                    <small>
                      {tutor.contato} · {pets.filter((pet) => pet.tutor === tutor.nome).length} cão(ões)
                    </small>
                  </span>
                </button>
              ))}
              {tutoresEncontrados.length === 0 && <p>Nenhum tutor encontrado para esta busca.</p>}
            </div>
          )}
        </label>

        {formulario.petId &&
          (() => {
            const pet = pets.find((item) => item.id === formulario.petId)
            return pet ? (
              <div className="scheduled-dog-summary full-field">
                <span>
                  <b>Paciente selecionado</b>
                  {pet.nome}
                </span>
                <span>
                  <b>Raça</b>
                  {pet.raca}
                </span>
                <span>
                  <b>Idade</b>
                  {formatarIdadePet(pet.idade)}
                </span>
                <span>
                  <b>Peso</b>
                  {pet.peso} kg
                </span>
                <span>
                  <b>Tutor</b>
                  {pet.tutor}
                </span>
                <span>
                  <b>Contato</b>
                  {pet.contato}
                </span>
              </div>
            ) : null
          })()}

        <label>
          Data
          <input
            type="date"
            value={formulario.data}
            onChange={(evento) => atualizar('data', evento.target.value)}
            required
          />
        </label>
        <label>
          Horário
          <input
            type="time"
            value={formulario.horario}
            onChange={(evento) => atualizar('horario', evento.target.value)}
            required
          />
        </label>

        <label>
          Tipo de Atendimento
          <select
            value={formulario.tipoServico}
            onChange={(evento) => atualizar('tipoServico', evento.target.value)}
            required
          >
            <option value="">Selecione</option>
            <option>Consulta de Rotina</option>
            <option>Vacinação</option>
            <option>Retorno</option>
            <option>Emergência</option>
            <option>Exames</option>
          </select>
        </label>
        <div aria-hidden="true" />
        <label>
          Veterinário Responsável
          <input
            value={formulario.veterinario}
            onChange={(evento) => atualizar('veterinario', evento.target.value)}
            placeholder="Nome do veterinário"
            required
          />
        </label>
        <label>
          Observações
          <input
            value={formulario.observacoes}
            onChange={(evento) => atualizar('observacoes', evento.target.value)}
            placeholder="Observações sobre o agendamento"
          />
        </label>

        {(erro || erroBusca) && (
          <p className="form-message error full-field" role="alert">
            {erro || erroBusca}
          </p>
        )}
        <div className="form-actions full-field">
          <button className="primary-button" type="submit">
            Confirmar Agendamento
          </button>
          <button className="secondary-button" type="button" onClick={aoCancelar}>
            Cancelar
          </button>
        </div>
      </form>
    </section>
  )
}
