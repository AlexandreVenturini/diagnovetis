import { useEffect, useState } from 'react'
import { AutenticacaoService } from '../../services/AutenticacaoService'
import { PerfilService, type AlteracoesPerfil } from '../../services/PerfilService'
import type { Perfil } from '../acesso/perfil'

type DadosAdmin = { idUsuarioAtual: string | null; perfis: Perfil[]; erro: string }

const autenticacaoService = new AutenticacaoService()
const perfilService = new PerfilService()

async function buscarDadosAdmin(): Promise<DadosAdmin> {
  const [usuario, perfis] = await Promise.all([
    autenticacaoService.usuarioAtual(),
    perfilService.listar().then(
      (listar) => ({ listar, erro: '' }),
      (erro: Error) => ({ listar: [] as Perfil[], erro: erro.message }),
    ),
  ])
  return { idUsuarioAtual: usuario?.id ?? null, perfis: perfis.listar, erro: perfis.erro }
}

async function tentar(acao: () => Promise<void>): Promise<string> {
  try {
    await acao()
    return ''
  } catch (erro) {
    return (erro as Error).message
  }
}

export function useUsuariosAdmin() {
  const [perfis, setPerfis] = useState<Perfil[]>([])
  const [idUsuarioAtual, setIdUsuarioAtual] = useState<string | null>(null)
  const [carregando, setCarregando] = useState(true)
  const [mensagem, setMensagem] = useState('')

  function aplicar(resultado: DadosAdmin) {
    setIdUsuarioAtual(resultado.idUsuarioAtual)
    if (resultado.erro) setMensagem('Erro ao carregar usuários: ' + resultado.erro)
    setPerfis(resultado.perfis)
    setCarregando(false)
  }

  async function carregar() {
    setCarregando(true)
    setMensagem('')
    aplicar(await buscarDadosAdmin())
  }

  useEffect(() => {
    let ativo = true
    void buscarDadosAdmin().then((resultado) => {
      if (ativo) aplicar(resultado)
    })
    return () => {
      ativo = false
    }
  }, [])

  async function atualizar(idUsuario: string, alteracoes: AlteracoesPerfil, rotuloErro: string) {
    const erro = await tentar(() => perfilService.atualizar(idUsuario, alteracoes))
    if (erro) {
      setMensagem(rotuloErro + ': ' + erro)
      return
    }
    await carregar()
  }

  async function remover(idUsuario: string, rotuloErro: string) {
    const erro = await tentar(() => perfilService.remover(idUsuario))
    if (erro) {
      setMensagem(rotuloErro + ': ' + erro)
      return
    }
    await carregar()
  }

  return {
    pendentes: perfis.filter((perfil) => perfil.situacao === 'pendente'),
    usuarios: perfis.filter((perfil) => perfil.situacao !== 'pendente'),
    idUsuarioAtual,
    carregando,
    mensagem,
    aprovar: (idUsuario: string) => atualizar(idUsuario, { situacao: 'aprovado' }, 'Erro ao aprovar'),
    rejeitar: (idUsuario: string) => {
      if (!window.confirm('Rejeitar este cadastro? A conta será excluída.')) return
      return remover(idUsuario, 'Erro ao rejeitar')
    },
    alternarAdmin: (usuario: Perfil) => atualizar(usuario.id, { ehAdmin: !usuario.ehAdmin }, 'Erro ao atualizar admin'),
    alternarSuspensao: (usuario: Perfil) =>
      atualizar(
        usuario.id,
        { situacao: usuario.situacao === 'suspenso' ? 'aprovado' : 'suspenso' },
        'Erro ao suspender',
      ),
    remover: (idUsuario: string) => {
      if (!window.confirm('Tem certeza que deseja remover este usuário permanentemente?')) return
      return remover(idUsuario, 'Erro ao remover')
    },
  }
}

export type UsuariosAdmin = ReturnType<typeof useUsuariosAdmin>
