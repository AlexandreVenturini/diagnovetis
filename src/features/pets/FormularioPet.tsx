import { useState } from 'react'
import type { FormEvent } from 'react'
import { PET_VAZIO } from './petVazio'
import { interpretarIdadePet, serializarIdadePet } from './idadePet'
import type { PetResumo, DadosFormularioPet } from './petTipos'
import { MENSAGEM_CADASTRAR_RESPONSAVEL, TutorNaoEncontradoError } from './resolverResponsavel'
import { tipoDoPet, type SugestoesResponsavel } from './responsavelPet'
import type { TipoResponsavel } from '../../models/Tutor'
import { FormularioTutor } from '../tutores/FormularioTutor'
import { ROTULOS_TIPO_RESPONSAVEL, type DadosFormularioTutor } from '../tutores/tutorTipos'

type FormularioPetProps = {
  pet?: PetResumo
  editando?: boolean
  sugestoes: SugestoesResponsavel
  aoSalvar: (dados: DadosFormularioPet) => Promise<void>
  aoCriarTutor: (dados: DadosFormularioTutor) => Promise<void>
  aoCancelar: () => void
}

const TIPOS_RESPONSAVEL = Object.keys(ROTULOS_TIPO_RESPONSAVEL) as TipoResponsavel[]

export function FormularioPet({
  pet,
  editando = false,
  sugestoes,
  aoSalvar,
  aoCriarTutor,
  aoCancelar,
}: FormularioPetProps) {
  const [formulario, setFormulario] = useState<DadosFormularioPet>(pet ? { ...pet } : PET_VAZIO)
  const [idade, setIdade] = useState(() => interpretarIdadePet(pet?.idade ?? ''))
  const [precisaTutor, setPrecisaTutor] = useState(false)
  const [erro, setErro] = useState('')
  const [salvando, setSalvando] = useState(false)
  const tipo = tipoDoPet(formulario)

  function atualizar(key: keyof DadosFormularioPet, valor: string) {
    setFormulario((atual) => ({ ...atual, [key]: valor }))
  }

  function escolherTipo(novoTipo: TipoResponsavel) {
    const origem = pet && tipoDoPet(pet) === novoTipo ? pet : PET_VAZIO
    setFormulario((atual) => ({
      ...atual,
      tipoResponsavel: novoTipo,
      tutor: origem.tutor,
      contato: origem.contato,
      setor: origem.setor ?? '',
      observacoesResponsavel: origem.observacoesResponsavel ?? '',
    }))
  }

  async function enviar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault()
    setErro('')
    setSalvando(true)
    try {
      await aoSalvar({ ...formulario, idade: serializarIdadePet(idade.anos, idade.meses) })
    } catch (causa) {
      if (
        causa instanceof TutorNaoEncontradoError ||
        (causa instanceof Error && causa.message.includes(MENSAGEM_CADASTRAR_RESPONSAVEL))
      ) {
        setPrecisaTutor(true)
      } else {
        setErro(causa instanceof Error ? causa.message : 'Não foi possível salvar o cão.')
      }
    } finally {
      setSalvando(false)
    }
  }

  async function criarTutorEContinuar(tutor: DadosFormularioTutor) {
    await aoCriarTutor(tutor)
    const petComTutor = {
      ...formulario,
      idade: serializarIdadePet(idade.anos, idade.meses),
      tutor: tutor.nome.trim(),
      contato: tutor.telefone.trim(),
    }
    setFormulario(petComTutor)
    await aoSalvar(petComTutor)
  }

  return (
    <section className="content-card form-card">
      <h2>{editando ? 'Editar Cão' : 'Cadastrar Novo Cão'}</h2>
      {precisaTutor ? (
        <FormularioTutor
          tipo={tipo === 'instituicao' ? 'instituicao' : 'pessoa'}
          nomeInicial={formulario.tutor}
          telefoneInicial={formulario.contato}
          aoSalvar={criarTutorEContinuar}
          aoCancelar={() => setPrecisaTutor(false)}
        />
      ) : (
        <form className="dog-form" onSubmit={enviar}>
          <label>
            Nome do Cão
            <input
              value={formulario.nome}
              onChange={(evento) => atualizar('nome', evento.target.value)}
              placeholder="Ex: Bob"
              required
            />
          </label>
          <label>
            Raça
            <select value={formulario.raca} onChange={(evento) => atualizar('raca', evento.target.value)} required>
              <option value="">Selecione a raça</option>
              <option>Labrador</option>
              <option>Pastor Alemão</option>
              <option>Golden Retriever</option>
              <option>Poodle</option>
              <option>Vira-lata</option>
            </select>
          </label>
          <div className="dog-age-fields">
            <label>
              Idade (anos)
              <input
                type="number"
                min="0"
                step="1"
                value={idade.anos}
                onChange={(evento) => setIdade((atual) => ({ ...atual, anos: evento.target.value }))}
                placeholder="Ex: 2"
                required={!idade.meses}
              />
            </label>
            <label>
              Idade (meses)
              <input
                type="number"
                min="0"
                max="11"
                step="1"
                value={idade.meses}
                onChange={(evento) => setIdade((atual) => ({ ...atual, meses: evento.target.value }))}
                placeholder="Ex: 6"
                required={!idade.anos}
              />
            </label>
          </div>
          <label>
            Peso (kg)
            <input
              type="number"
              min="0"
              step="0.1"
              value={formulario.peso}
              onChange={(evento) => atualizar('peso', evento.target.value)}
              placeholder="Ex: 28"
              required
            />
          </label>
          <label>
            Sexo
            <select value={formulario.sexo} onChange={(evento) => atualizar('sexo', evento.target.value)} required>
              <option value="">Selecione</option>
              <option>Macho</option>
              <option>Fêmea</option>
            </select>
          </label>
          <label>
            Tipo de responsável
            <select value={tipo} onChange={(evento) => escolherTipo(evento.target.value as TipoResponsavel)}>
              {TIPOS_RESPONSAVEL.map((opcao) => (
                <option key={opcao} value={opcao}>
                  {ROTULOS_TIPO_RESPONSAVEL[opcao]}
                </option>
              ))}
            </select>
          </label>
          {(tipo === 'pessoa' || tipo === 'instituicao') && (
            <>
              <label>
                {tipo === 'pessoa' ? 'Nome do responsável' : 'Nome da instituição'}
                <input
                  list="responsaveis-cadastrados"
                  value={formulario.tutor}
                  onChange={(evento) => atualizar('tutor', evento.target.value)}
                  placeholder={tipo === 'pessoa' ? 'Ex: João Silva' : 'Ex: ONG Patas Amigas'}
                  required
                />
                <datalist id="responsaveis-cadastrados">
                  {sugestoes[tipo].map((nome) => (
                    <option key={nome} value={nome} />
                  ))}
                </datalist>
              </label>
              <label>
                Contato do responsável
                <input
                  value={formulario.contato}
                  onChange={(evento) => atualizar('contato', evento.target.value)}
                  placeholder="(27) 99999-9999"
                  required
                />
              </label>
            </>
          )}
          {tipo === 'ifes' && (
            <label>
              Setor do IFES
              <input
                list="setores-ifes"
                value={formulario.setor ?? ''}
                onChange={(evento) => atualizar('setor', evento.target.value)}
                placeholder="Ex: Bovinocultura"
                required
              />
              <datalist id="setores-ifes">
                {sugestoes.ifes.map((setor) => (
                  <option key={setor} value={setor} />
                ))}
              </datalist>
            </label>
          )}
          {tipo === 'sem_responsavel' && (
            <label className="full-field">
              Como o animal chegou
              <textarea
                value={formulario.observacoesResponsavel ?? ''}
                onChange={(evento) => atualizar('observacoesResponsavel', evento.target.value)}
                placeholder="Data e local do resgate, quem trouxe o animal..."
              />
            </label>
          )}
          <label className="full-field">
            Histórico de Saúde
            <textarea
              value={formulario.historico}
              onChange={(evento) => atualizar('historico', evento.target.value)}
              placeholder="Informações relevantes sobre o histórico de saúde do cão..."
            />
          </label>
          {erro && (
            <p className="form-error full-field" role="alert">
              {erro}
            </p>
          )}
          <div className="form-actions full-field">
            <button className="primary-button" type="submit" disabled={salvando}>
              {salvando ? 'Salvando...' : editando ? 'Salvar Alterações' : 'Cadastrar Cão'}
            </button>
            <button className="secondary-button" type="button" onClick={aoCancelar}>
              Cancelar
            </button>
          </div>
        </form>
      )}
    </section>
  )
}
