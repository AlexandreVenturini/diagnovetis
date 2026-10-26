import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { AutenticacaoService } from '../../services/AutenticacaoService'
import { PerfilService, type AlteracoesPerfil } from '../../services/PerfilService'
import type { Perfil } from '../acesso/perfil'
import { CHAVES } from '../shared/consultas'

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
  const cliente = useQueryClient()
  const consulta = useQuery({ queryKey: CHAVES.usuariosAdmin, queryFn: () => buscarDadosAdmin() })
  const [erroAcao, setMensagem] = useState('')
  const perfis = consulta.data?.perfis ?? []
  const erroCarga = consulta.data?.erro ? 'Erro ao carregar usuários: ' + consulta.data.erro : ''
  const mensagem = erroAcao || erroCarga

  async function carregar() {
    setMensagem('')
    await cliente.invalidateQueries({ queryKey: CHAVES.usuariosAdmin })
  }

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
    idUsuarioAtual: consulta.data?.idUsuarioAtual ?? null,
    carregando: consulta.isPending,
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
