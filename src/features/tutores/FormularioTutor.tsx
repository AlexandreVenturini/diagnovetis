import { useState } from 'react'
import type { FormEvent } from 'react'
import type { DadosFormularioTutor, TipoCadastroCompleto } from './tutorTipos'

type FormularioTutorProps = {
  tipo: TipoCadastroCompleto
  nomeInicial: string
  telefoneInicial: string
  aoSalvar: (dados: DadosFormularioTutor) => Promise<void>
  aoCancelar: () => void
}

function hoje() {
  const data = new Date()
  const deslocamento = data.getTimezoneOffset()
  return new Date(data.getTime() - deslocamento * 60_000).toISOString().slice(0, 10)
}

export function FormularioTutor({ tipo, nomeInicial, telefoneInicial, aoSalvar, aoCancelar }: FormularioTutorProps) {
  const ehInstituicao = tipo === 'instituicao'
  const [formulario, setFormulario] = useState<DadosFormularioTutor>({
    tipo,
    nome: nomeInicial,
    cpf: '',
    cnpj: '',
    contato: '',
    telefone: telefoneInicial,
    email: '',
    dataCadastro: hoje(),
    rua: '',
    numero: '',
    bairro: '',
    cidade: '',
    estado: '',
    cep: '',
  })
  const [erro, setErro] = useState('')
  const [salvando, setSalvando] = useState(false)

  function atualizar(key: keyof DadosFormularioTutor, valor: string) {
    setFormulario((atual) => ({ ...atual, [key]: valor }))
  }

  async function enviar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault()
    setErro('')
    setSalvando(true)
    try {
      await aoSalvar(formulario)
    } catch (causa) {
      setErro(causa instanceof Error ? causa.message : 'Não foi possível cadastrar o responsável.')
    } finally {
      setSalvando(false)
    }
  }

  return (
    <form className="dog-form tutor-form" onSubmit={enviar}>
      <div className="tutor-form-notice full-field" role="status">
        <strong>{ehInstituicao ? 'Instituição não encontrada' : 'Responsável não encontrado'}</strong>
        <p>Preencha o cadastro completo. Depois disso, o cão será salvo automaticamente.</p>
      </div>
      <label>
        {ehInstituicao ? 'Nome da instituição' : 'Nome'}
        <input value={formulario.nome} onChange={(evento) => atualizar('nome', evento.target.value)} required />
      </label>
      {ehInstituicao ? (
        <>
          <label>
            CNPJ (opcional)
            <input
              value={formulario.cnpj}
              onChange={(evento) => atualizar('cnpj', evento.target.value)}
              placeholder="00.000.000/0000-00"
            />
          </label>
          <label>
            Pessoa de contato
            <input
              value={formulario.contato}
              onChange={(evento) => atualizar('contato', evento.target.value)}
              placeholder="Ex: Ana Souza"
            />
          </label>
        </>
      ) : (
        <label>
          CPF
          <input
            value={formulario.cpf}
            onChange={(evento) => atualizar('cpf', evento.target.value)}
            placeholder="000.000.000-00"
          />
        </label>
      )}
      <label>
        Telefone
        <input
          type="tel"
          value={formulario.telefone}
          onChange={(evento) => atualizar('telefone', evento.target.value)}
          placeholder="(27) 99999-9999"
          required
        />
      </label>
      <label>
        Email
        <input
          type="email"
          value={formulario.email}
          onChange={(evento) => atualizar('email', evento.target.value)}
          placeholder="nome@email.com"
          required
        />
      </label>
      <label>
        Data de cadastro
        <input
          type="date"
          value={formulario.dataCadastro}
          onChange={(evento) => atualizar('dataCadastro', evento.target.value)}
          required
        />
      </label>
      <div className="address-heading full-field">
        <strong>Endereço</strong>
      </div>
      <label>
        Rua
        <input value={formulario.rua} onChange={(evento) => atualizar('rua', evento.target.value)} required />
      </label>
      <label>
        Número
        <input
          type="number"
          min="0"
          value={formulario.numero}
          onChange={(evento) => atualizar('numero', evento.target.value)}
          required
        />
      </label>
      <label>
        Bairro
        <input value={formulario.bairro} onChange={(evento) => atualizar('bairro', evento.target.value)} required />
      </label>
      <label>
        Cidade
        <input value={formulario.cidade} onChange={(evento) => atualizar('cidade', evento.target.value)} required />
      </label>
      <label>
        UF
        <input
          value={formulario.estado}
          onChange={(evento) => atualizar('estado', evento.target.value.slice(0, 2).toUpperCase())}
          minLength={2}
          maxLength={2}
          placeholder="ES"
          required
        />
      </label>
      <label>
        CEP
        <input
          value={formulario.cep}
          onChange={(evento) => atualizar('cep', evento.target.value)}
          placeholder="29000-000"
          required
        />
      </label>
      {erro && (
        <p className="form-error full-field" role="alert">
          {erro}
        </p>
      )}
      <div className="form-actions full-field">
        <button className="primary-button" type="submit" disabled={salvando}>
          {salvando ? 'Cadastrando...' : 'Cadastrar responsável e salvar cão'}
        </button>
        <button className="secondary-button" type="button" onClick={aoCancelar} disabled={salvando}>
          Voltar
        </button>
      </div>
    </form>
  )
}
