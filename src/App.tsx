import { useEffect, useRef, useState } from 'react'
import { PaginaLogin } from './features/acesso/PaginaLogin'
import { PaginaCadastro } from './features/acesso/PaginaCadastro'
import { verificarAcesso, type Papel } from './features/acesso/perfil'
import { PainelVeterinario } from './features/veterinario/PainelVeterinario'
import { PainelEstudante } from './features/estudante/PainelEstudante'
import { AutenticacaoService, type UsuarioSessao } from './services/AutenticacaoService'

type UsuarioAutenticado = { email: string; nome: string; ehAdmin: boolean }

const autenticacaoService = new AutenticacaoService()

function App() {
  const [papel, setPapel] = useState<Papel | null>(null)
  const [usuario, setUsuario] = useState<UsuarioAutenticado | null>(null)
  const [verificandoSessao, setVerificandoSessao] = useState(true)
  const [cadastrando, setCadastrando] = useState(false)
  const [aviso, setAviso] = useState('')
  const idRequisicao = useRef(0)

  async function aplicarSessao(usuarioSessao: UsuarioSessao | null) {
    const atual = ++idRequisicao.current

    if (!usuarioSessao) {
      setPapel(null)
      setUsuario(null)
      setVerificandoSessao(false)
      return
    }

    const acesso = await verificarAcesso(usuarioSessao.id)
    if (atual !== idRequisicao.current) return

    if (!acesso.ok) {
      setPapel(null)
      setUsuario(null)
      setAviso(acesso.mensagem)
      setVerificandoSessao(false)
      await autenticacaoService.sair()
      return
    }

    setAviso('')
    setCadastrando(false)
    setPapel(acesso.papel)
    setUsuario({ email: acesso.perfil.email, nome: acesso.perfil.nome, ehAdmin: acesso.perfil.ehAdmin })
    setVerificandoSessao(false)
  }

  useEffect(() => {
    let ativo = true

    autenticacaoService.usuarioDaSessao().then((usuarioSessao) => {
      if (ativo) void aplicarSessao(usuarioSessao)
    })

    const parar = autenticacaoService.observarSessao((evento, usuarioSessao) => {
      if (!ativo || evento === 'TOKEN_REFRESHED' || evento === 'INITIAL_SESSION') return
      setTimeout(() => {
        if (ativo) void aplicarSessao(usuarioSessao)
      }, 0)
    })

    return () => {
      ativo = false
      parar()
    }
  }, [])

  async function sair() {
    await autenticacaoService.sair()
  }

  if (verificandoSessao) {
    return (
      <main className="auth-loading" role="status">
        Verificando sessão...
      </main>
    )
  }

  if (papel === 'veterinarian') {
    return <PainelVeterinario aoSair={sair} usuario={usuario} />
  }

  if (papel === 'attendant') {
    return <PainelEstudante aoSair={sair} usuario={usuario} />
  }

  if (cadastrando) {
    return <PaginaCadastro aoVoltar={() => setCadastrando(false)} />
  }

  return (
    <PaginaLogin
      aviso={aviso}
      aoDispensarAviso={() => setAviso('')}
      aoCadastrar={() => {
        setAviso('')
        setCadastrando(true)
      }}
    />
  )
}

export default App
