import { useState } from 'react'
import type { FormEvent } from 'react'
import { Marca } from '../../components/common/Marca'
import { CampoAcesso } from './CampoAcesso'
import { AutenticacaoService } from '../../services/AutenticacaoService'

const autenticacaoService = new AutenticacaoService()

type PaginaLoginProps = {
  aviso: string
  aoDispensarAviso: () => void
  aoCadastrar: () => void
}

function traduzirErroAcesso(codigo: string | undefined, padrao: string) {
  if (codigo === 'email_not_confirmed') {
    return 'Seu e-mail ainda não foi confirmado. Acesse o link que enviamos (verifique também a caixa de spam).'
  }
  if (codigo === 'invalid_credentials') return 'E-mail ou senha incorretos.'
  return padrao
}

export function PaginaLogin({ aviso, aoDispensarAviso, aoCadastrar }: PaginaLoginProps) {
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [mensagem, setMensagem] = useState('')
  const [carregando, setCarregando] = useState(false)

  async function enviar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault()
    setMensagem('')
    aoDispensarAviso()
    if (!autenticacaoService.configurado) {
      setMensagem(
        'Configure VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY (ou VITE_SUPABASE_KEY) no arquivo .env.local e reinicie o servidor local.',
      )
      return
    }
    setCarregando(true)
    try {
      const erro = await autenticacaoService.entrar(email.trim(), senha)
      if (erro) setMensagem(traduzirErroAcesso(erro.codigo, erro.mensagem))
    } catch {
      setMensagem('Não foi possível conectar ao serviço de login. Verifique sua conexão e tente novamente.')
    } finally {
      setCarregando(false)
    }
  }

  return (
    <main className="login-page">
      <section className="login-card" aria-labelledby="login-title">
        <header className="login-brand">
          <Marca />
          <h1 id="login-title">DiagnoVetis</h1>
          <p>IFES Santa Teresa</p>
          <p className="brand-subtitle">Sistema de Gestão Veterinária</p>
        </header>

        <form className="login-form" onSubmit={enviar}>
          <CampoAcesso
            id="email"
            rotulo="E-mail"
            icone="usuario"
            type="email"
            autoComplete="email"
            placeholder="seu.email@ifes.edu.br"
            value={email}
            onChange={(evento) => setEmail(evento.target.value)}
            required
          />
          <CampoAcesso
            id="password"
            rotulo="Senha"
            icone="cadeado"
            type="password"
            autoComplete="current-password"
            placeholder="Digite sua senha"
            value={senha}
            onChange={(evento) => setSenha(evento.target.value)}
            required
          />

          {(mensagem || aviso) && (
            <p className="form-message error" role="status">
              {mensagem || aviso}
            </p>
          )}
          <button className="submit-button" type="submit" disabled={carregando}>
            {carregando ? 'Entrando...' : 'Entrar'}
          </button>
        </form>

        <footer>
          <p>Sistema de Gerenciamento de Atendimento Veterinário</p>
          <p>IFES - Instituto Federal do Espírito Santo</p>
          <button type="button" className="auth-link auth-link--spaced" onClick={aoCadastrar}>
            Criar nova conta
          </button>
        </footer>
      </section>
    </main>
  )
}
