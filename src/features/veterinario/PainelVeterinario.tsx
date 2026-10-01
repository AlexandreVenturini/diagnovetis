import { MenuPrincipal } from '../painel/MenuPrincipal'
import { usePets } from '../pets/usePets'
import { ModuloAgenda } from '../agenda/ModuloAgenda'
import { ModuloAtendimento } from '../atendimentos/ModuloAtendimento'
import { InicioVeterinario } from '../painel/InicioVeterinario'
import { EstruturaPainel, type UsuarioPainel } from '../painel/EstruturaPainel'
import { useNavegacaoPainel } from '../painel/useNavegacaoPainel'
import { ModuloPets } from '../pets/ModuloPets'
import { ModuloMedicamentos } from '../medicamentos/ModuloMedicamentos'
import { ModuloReceitas } from '../receitas/ModuloReceitas'
import { ModuloProntuarios } from '../prontuarios/ModuloProntuarios'
import { SinoPedidos } from '../supervisao/sino/SinoPedidos'
import { ModuloCondicoes } from '../condicoes/ModuloCondicoes'

type PainelVeterinarioProps = {
  aoSair: () => void
  usuario: UsuarioPainel
}

const AVISO_VETERINARIO = (
  <aside className="profile-notice">
    <span>♧</span>
    <p>
      <strong>Perfil Veterinário:</strong> Acesso completo a todos os módulos do sistema
    </p>
  </aside>
)

export function PainelVeterinario({ aoSair, usuario }: PainelVeterinarioProps) {
  const navegacao = useNavegacaoPainel()
  const petsApi = usePets()
  const { pets } = petsApi

  return (
    <EstruturaPainel
      usuario={usuario}
      rotuloPerfil="Médico Veterinário"
      aoSair={aoSair}
      acoesCabecalho={<SinoPedidos />}
    >
      <MenuPrincipal moduloAtivo={navegacao.moduloAtivo} aoSelecionar={navegacao.selecionarModulo} />

      {navegacao.moduloAtivo === 'inicio' && (
        <InicioVeterinario
          pets={pets}
          aoAbrirModulo={navegacao.selecionarModulo}
          aoNovoPet={navegacao.abrirNovoPet}
          aoNovoAgendamento={navegacao.abrirNovoAgendamento}
        />
      )}
      {navegacao.moduloAtivo === 'pets' && (
        <ModuloPets
          key={navegacao.entradaPets.key}
          petsApi={petsApi}
          telaInicial={navegacao.entradaPets.tela}
          aviso={AVISO_VETERINARIO}
        />
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
          papel="veterinarian"
          emailUsuario={usuario?.email}
          aoAbrirProntuario={navegacao.abrirProntuario}
        />
      )}
      {navegacao.moduloAtivo === 'receitas' && (
        <ModuloReceitas pets={pets} aoAbrirProntuario={navegacao.abrirProntuario} />
      )}
      {navegacao.moduloAtivo === 'prontuarios' && (
        <ModuloProntuarios
          key={navegacao.entradaProntuarios.key}
          petIdInicial={navegacao.entradaProntuarios.tela}
          papel="veterinarian"
          emailUsuario={usuario?.email}
        />
      )}
      {navegacao.moduloAtivo === 'condicoes' && <ModuloCondicoes />}
      {navegacao.moduloAtivo === 'medicamentos' && <ModuloMedicamentos />}
    </EstruturaPainel>
  )
}
