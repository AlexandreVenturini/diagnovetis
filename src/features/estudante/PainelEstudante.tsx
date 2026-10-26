import { usePets } from '../pets/usePets'
import { ModuloAgenda } from '../agenda/ModuloAgenda'
import { ModuloAtendimento } from '../atendimentos/ModuloAtendimento'
import { EstruturaPainel, type UsuarioPainel } from '../painel/EstruturaPainel'
import { MenuPrincipal } from '../painel/MenuPrincipal'
import { useNavegacaoPainel, type ModuloPainel } from '../painel/useNavegacaoPainel'
import { ModuloPets } from '../pets/ModuloPets'
import { ModuloReceitas } from '../receitas/ModuloReceitas'
import { ModuloProntuarios } from '../prontuarios/ModuloProntuarios'
import { InicioEstudante } from './InicioEstudante'

type PainelEstudanteProps = {
  aoSair: () => void
  usuario: UsuarioPainel
}

const MODULOS_ESTUDANTE: ModuloPainel[] = ['inicio', 'pets', 'agenda', 'atendimentos', 'receitas', 'prontuarios']

const AVISO_ESTUDANTE = (
  <aside className="profile-notice">
    <span>▣</span>
    <p>
      <strong>Perfil Estudante:</strong> Você tem acesso ao cadastro de pets, agendamentos, atendimentos, receitas e
      prontuários; atendimentos, receitas e correções precisam da aprovação de um professor
    </p>
  </aside>
)

export function PainelEstudante({ aoSair, usuario }: PainelEstudanteProps) {
  const navegacao = useNavegacaoPainel()
  const petsApi = usePets()
  const { pets } = petsApi

  return (
    <EstruturaPainel usuario={usuario} rotuloPerfil="Estudante" aoSair={aoSair}>
      <MenuPrincipal
        moduloAtivo={navegacao.moduloAtivo}
        aoSelecionar={navegacao.selecionarModulo}
        modulos={MODULOS_ESTUDANTE}
      />
      {navegacao.moduloAtivo === 'inicio' && AVISO_ESTUDANTE}

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
