import { CabecalhoTela } from '../../components/common/CabecalhoTela'
import type { PetResumo } from './petTipos'
import { formatarIdadePet } from './idadePet'
import { tipoDoPet } from './responsavelPet'
import { ROTULOS_TIPO_RESPONSAVEL } from '../tutores/tutorTipos'

type DetalhesPetProps = {
  pet: PetResumo
  erro?: string
  aoVoltar: () => void
  aoRemover?: () => void
}

function ItemDetalhe({ rotulo, valor }: { rotulo: string; valor: string }) {
  return (
    <div className="detail-item">
      <span>{rotulo}</span>
      <strong>{valor}</strong>
    </div>
  )
}

export function DetalhesPet({ pet, erro, aoVoltar, aoRemover }: DetalhesPetProps) {
  const tipo = tipoDoPet(pet)
  const temContato = tipo === 'pessoa' || tipo === 'instituicao'
  return (
    <>
      <CabecalhoTela
        voltar={{ rotulo: 'Cães Cadastrados', aoClicar: aoVoltar }}
        titulo={
          <>
            {pet.nome}
            {pet.obitoEm && <span className="pill pill--dark dog-death-pill">Óbito</span>}
          </>
        }
        descricao={`${pet.raca} · Responsável: ${pet.tutor}`}
        acoes={
          aoRemover && (
            <button className="secondary-button" onClick={aoRemover}>
              Remover
            </button>
          )
        }
      />
      {erro && (
        <p className="page-error" role="alert">
          {erro}
        </p>
      )}
      <section className="content-card details-card">
        <div className="details-grid">
          <ItemDetalhe rotulo="Nome" valor={pet.nome} />
          <ItemDetalhe rotulo="Espécie" valor="Cão" />
          <ItemDetalhe rotulo="Raça" valor={pet.raca} />
          <ItemDetalhe rotulo="Idade" valor={formatarIdadePet(pet.idade)} />
          <ItemDetalhe rotulo="Peso" valor={`${pet.peso} kg`} />
          <ItemDetalhe rotulo="Sexo" valor={pet.sexo} />
          <ItemDetalhe rotulo="Tipo de responsável" valor={ROTULOS_TIPO_RESPONSAVEL[tipo]} />
          <ItemDetalhe rotulo="Responsável" valor={pet.tutor} />
          {temContato && <ItemDetalhe rotulo="Contato" valor={pet.contato} />}
          {tipo === 'sem_responsavel' && (
            <div className="detail-item detail-history">
              <span>Como o animal chegou</span>
              <strong>{pet.observacoesResponsavel || 'Não informado'}</strong>
            </div>
          )}
          <div className="detail-item detail-history">
            <span>Histórico de Saúde</span>
            <strong>{pet.historico || 'Não informado'}</strong>
          </div>
        </div>
      </section>
    </>
  )
}
