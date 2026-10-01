import type { ReactNode } from 'react'
import { Icone } from '../../components/common/Icone'
import { usePets } from '../pets/usePets'
import { ModuloAgenda } from '../agenda/ModuloAgenda'
import { ModuloAtendimento } from '../atendimentos/ModuloAtendimento'
import { EstruturaPainel, type UsuarioPainel } from '../painel/EstruturaPainel'
import { useNavegacaoPainel, type ModuloPainel } from '../painel/useNavegacaoPainel'
import { ModuloPets } from '../pets/ModuloPets'
import { ModuloReceitas } from '../receitas/ModuloReceitas'
import { ModuloProntuarios } from '../prontuarios/ModuloProntuarios'
import { InicioEstudante } from './InicioEstudante'

type PainelEstudanteProps = {
  aoSair: () => void
  usuario: UsuarioPainel
}

const ITENS_MENU: { id: ModuloPainel; rotulo: string; icone: ReactNode }[] = [
  {
    id: 'inicio',
    rotulo: 'Dashboard',
    icone: (
      <Icone>
        <path d="M4 20V10m6 10V4m6 16v-7m5 7H2" />
      </Icone>
    ),
  },
  {
    id: 'pets',
    rotulo: 'Cadastro',
    icone: (
      <Icone>
        <circle cx="7" cy="6" r="2" />
        <circle cx="15" cy="5" r="2" />
        <circle cx="18" cy="11" r="2" />
        <path d="M7 13c2-4 8-2 9 2 1 4-3 5-5 3-2 2-6 0-4-5Z" />
      </Icone>
    ),
  },
  {
    id: 'agenda',
    rotulo: 'Agendamento',
    icone: (
      <Icone>
        <rect x="3" y="5" width="18" height="16" rx="2" />
        <path d="M7 3v4m10-4v4M3 10h18" />
      </Icone>
    ),
  },
  {
    id: 'atendimentos',
    rotulo: 'Atendimento',
    icone: (
      <Icone>
        <path d="M9 3h6v4H9zM5 5h4m6 0h4v16H5V5" />
        <path d="M12 11v6m-3-3h6" />
      </Icone>
    ),
  },
  {
    id: 'receitas',
    rotulo: 'Receituário',
    icone: (
      <Icone>
        <path d="M7 3h7l4 4v14H7zM14 3v4h4" />
        <path d="M10 11h5m-5 4h3" />
      </Icone>
    ),
  },
  {
    id: 'prontuarios',
    rotulo: 'Prontuários',
    icone: (
      <Icone>
        <path d="M6 3h8l4 4v14H6zM14 3v5h5M9 12h6m-6 4h6" />
      </Icone>
    ),
  },
]

export function PainelEstudante({ aoSair, usuario }: PainelEstudanteProps) {
  const navegacao = useNavegacaoPainel()
  const petsApi = usePets()
  const { pets } = petsApi

  return (
    <EstruturaPainel usuario={usuario} rotuloPerfil="Estudante" aoSair={aoSair}>
      <nav className="attendant-nav" aria-label="Módulos do atendente">
        {ITENS_MENU.map(({ id, rotulo, icone }) => (
          <button
            key={id}
            className={navegacao.moduloAtivo === id ? 'active' : ''}
            onClick={() => navegacao.selecionarModulo(id)}
          >
            {icone}
            {rotulo}
          </button>
        ))}
        <span>Cadastro, agenda, atendimento, receitas e prontuários</span>
      </nav>

      {navegacao.moduloAtivo !== 'inicio' && (
        <aside className="attendant-notice">
          <span>▣</span>
          <p>
            <strong>Perfil Estudante:</strong> Você tem acesso ao cadastro de pets, agendamentos, atendimentos, receitas
            e prontuários; atendimentos, receitas e correções precisam da aprovação de um professor
          </p>
        </aside>
      )}

      {navegacao.moduloAtivo === 'inicio' && (
        <InicioEstudante
          pets={pets}
          aoAbrirPets={() => navegacao.selecionarModulo('pets')}
          aoAbrirAgenda={() => navegacao.selecionarModulo('agenda')}
          aoNovoPet={navegacao.abrirNovoPet}
          aoNovoAgendamento={navegacao.abrirNovoAgendamento}
        />
      )}
      {navegacao.moduloAtivo === 'pets' && (
        <ModuloPets key={navegacao.entradaPets.key} petsApi={petsApi} telaInicial={navegacao.entradaPets.tela} />
      )}
      {navegacao.moduloAtivo === 'agenda' && (
        <ModuloAgenda
          pets={pets}
          key={navegacao.entradaAgenda.key}
          telaInicial={navegacao.entradaAgenda.tela}
          aoIniciarAtendimento={navegacao.iniciarAtendimento}
        />
      )}
      {navegacao.moduloAtivo === 'atendimentos' && (
        <ModuloAtendimento
          key={navegacao.entradaAtendimento.key}
          pets={pets}
          agendamentoInicial={navegacao.entradaAtendimento.tela}
          papel="attendant"
          emailUsuario={usuario?.email}
          aoAbrirProntuario={navegacao.abrirProntuario}
        />
      )}
      {navegacao.moduloAtivo === 'receitas' && (
        <ModuloReceitas pets={pets} aoAbrirProntuario={navegacao.abrirProntuario} papel="attendant" />
      )}
      {navegacao.moduloAtivo === 'prontuarios' && (
        <ModuloProntuarios
          key={navegacao.entradaProntuarios.key}
          petIdInicial={navegacao.entradaProntuarios.tela}
          papel="attendant"
          emailUsuario={usuario?.email}
        />
      )}
    </EstruturaPainel>
  )
}
