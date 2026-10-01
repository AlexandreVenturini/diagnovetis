import { useState } from 'react'
import type { FormEvent } from 'react'
import { Marca } from '../../components/common/Marca'
import { Icone } from '../../components/common/Icone'
import { CampoAcesso } from './CampoAcesso'
import { CadastroConcluido } from './CadastroConcluido'
import { UFS, formatarMatricula, cadastrarUsuario, validarCadastro, type DadosCadastro } from './cadastro'

type PaginaCadastroProps = {
  aoVoltar: () => void
}

const CADASTRO_VAZIO: DadosCadastro = {
  nome: '',
  email: '',
  senha: '',
  confirmacao: '',
  papel: 'veterinarian',
  crmvUf: 'ES',
  crmvNumero: '',
  matricula: '',
}

const ROTULOS_PAPEL = { veterinarian: '🩺 Veterinário(a)', attendant: '📚 Estudante' } as const

export function PaginaCadastro({ aoVoltar }: PaginaCadastroProps) {
  const [dados, setDados] = useState(CADASTRO_VAZIO)
  const [mensagem, setMensagem] = useState('')
  const [sucesso, setSucesso] = useState(false)
  const [carregando, setCarregando] = useState(false)

  function set<K extends keyof DadosCadastro>(key: K, valor: DadosCadastro[K]) {
    setDados((atual) => ({ ...atual, [key]: valor }))
  }

  async function enviar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault()
    setMensagem('')
    const invalido = validarCadastro(dados)
    if (invalido) {
      setMensagem(invalido)
      return
    }
    setCarregando(true)
    const erro = await cadastrarUsuario(dados)
    setCarregando(false)
    if (erro) setMensagem(erro)
    else setSucesso(true)
  }

  if (sucesso) return <CadastroConcluido email={dados.email} aoVoltar={aoVoltar} />

  return (
    <main className="login-page">
      <section className="login-card" aria-labelledby="register-title">
        <header className="login-brand">
          <Marca />
          <h1 id="register-title">DiagnoVetis</h1>
          <p>IFES Santa Teresa</p>
          <p className="brand-subtitle">Criar nova conta</p>
        </header>

        <form className="login-form" onSubmit={enviar}>
          <label>Perfil de acesso</label>
          <div className="role-options">
            {(['veterinarian', 'attendant'] as const).map((papel) => (
              <button
                key={papel}
                type="button"
                className={`role-option${dados.papel === papel ? ' active' : ''}`}
                onClick={() => set('papel', papel)}
              >
                {ROTULOS_PAPEL[papel]}
              </button>
            ))}
          </div>

          <CampoAcesso
            id="reg-name"
            rotulo="Nome completo"
            icone="usuario"
            type="text"
            placeholder="Ex: Maria da Silva"
            value={dados.nome}
            onChange={(evento) => set('nome', evento.target.value)}
            required
          />
          <CampoAcesso
            id="reg-email"
            rotulo="E-mail"
            icone="email"
            type="email"
            autoComplete="email"
            placeholder="seu.email@ifes.edu.br"
            value={dados.email}
            onChange={(evento) => set('email', evento.target.value)}
            required
          />
          <CampoAcesso
            id="reg-password"
            rotulo="Senha"
            icone="cadeado"
            type="password"
            autoComplete="new-password"
            placeholder="Mínimo 6 caracteres"
            value={dados.senha}
            onChange={(evento) => set('senha', evento.target.value)}
            required
          />
          <CampoAcesso
            id="reg-confirm"
            rotulo="Confirmar senha"
            icone="cadeado"
            type="password"
            autoComplete="new-password"
            placeholder="Repita a senha"
            value={dados.confirmacao}
            onChange={(evento) => set('confirmacao', evento.target.value)}
            required
          />

          {dados.papel === 'veterinarian' && (
            <>
              <label htmlFor="reg-crmv">CRMV</label>
              <div className="crmv-fields">
                <select
                  id="reg-crmv-uf"
                  className="crmv-uf"
                  aria-label="UF do CRMV"
                  value={dados.crmvUf}
                  onChange={(evento) => set('crmvUf', evento.target.value)}
                >
                  {UFS.map((uf) => (
                    <option key={uf} value={uf}>
                      {uf}
                    </option>
                  ))}
                </select>
                <div className="input-wrap crmv-number">
                  <Icone>
                    <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2" />
                    <rect x="9" y="3" width="6" height="4" rx="1" />
                  </Icone>
                  <input
                    id="reg-crmv"
                    type="text"
                    inputMode="numeric"
                    placeholder="Número. Ex: 12345"
                    value={dados.crmvNumero}
                    onChange={(evento) => set('crmvNumero', evento.target.value.replace(/\D/g, '').slice(0, 10))}
                    required
                  />
                </div>
              </div>
            </>
          )}

          {dados.papel === 'attendant' && (
            <CampoAcesso
              id="reg-matricula"
              rotulo="Matrícula"
              icone="cartao"
              type="text"
              placeholder="Sua matrícula no IFES"
              value={dados.matricula}
              onChange={(evento) => set('matricula', formatarMatricula(evento.target.value))}
              required
            />
          )}

          {mensagem && (
            <p className="form-message error" role="status">
              {mensagem}
            </p>
          )}

          <button className="submit-button" type="submit" disabled={carregando}>
            {carregando ? 'Cadastrando...' : 'Criar conta'}
          </button>
        </form>

        <footer>
          <button type="button" className="auth-link" onClick={aoVoltar}>
            ← Já tenho uma conta
          </button>
        </footer>
      </section>
    </main>
  )
}
