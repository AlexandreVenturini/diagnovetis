import { useCallback, useState } from 'react'
import type { Papel } from '../../acesso/perfil'
import { TelaLiberacao } from '../../supervisao/liberacao/TelaLiberacao'
import { SupervisaoService } from '../../../services/SupervisaoService'
import type { Liberacao, ObitoDados, OpcaoVeterinario } from '../../supervisao/supervisaoTipos'
import type { RegistroClinico } from '../prontuarioTipos'
import { ObitoService } from '../../../services/ObitoService'
import { obitoParaDados, novoObito, validarObito } from './obitoRegras'
import type { RegistroObito } from './obitoTipos'
import { CamposObito } from './CamposObito'
import { useVeterinariosResponsaveis } from './useVeterinariosResponsaveis'

const supervisaoService = new SupervisaoService()
const obitoService = new ObitoService()

type FormularioObitoProps = {
  petId: number
  nomePet: string
  papel: Papel
  emailUsuario?: string
  atendimentos: RegistroClinico[]
  existente?: RegistroObito | null
  aoConcluir: (mensagem: string) => void
  aoCancelar: () => void
}

function rotuloEnviar(salvando: boolean, ehEstudante: boolean, retificando: boolean) {
  if (salvando) return 'Salvando...'
  if (ehEstudante) return 'Enviar para aprovação'
  return retificando ? 'Salvar retificação' : 'Registrar óbito'
}

export function FormularioObito({
  petId,
  nomePet,
  papel,
  emailUsuario,
  atendimentos,
  existente,
  aoConcluir,
  aoCancelar,
}: FormularioObitoProps) {
  const ehEstudante = papel === 'attendant'
  const retificando = Boolean(existente)
  const [dados, setDados] = useState<ObitoDados>(() => (existente ? obitoParaDados(existente) : novoObito()))
  const [motivo, setMotivo] = useState('')
  const [salvando, setSalvando] = useState(false)
  const [aprovando, setAprovando] = useState(false)
  const [mensagem, setMensagem] = useState('')

  const selecionarProprio = useCallback((veterinario: OpcaoVeterinario) => {
    setDados((atual) =>
      atual.medico_responsavel_id ? atual : { ...atual, medico_responsavel_id: veterinario.medicoId },
    )
  }, [])
  const veterinarios = useVeterinariosResponsaveis(emailUsuario, {
    aoEncontrarProprio: selecionarProprio,
    aoErro: setMensagem,
  })

  function atualizar<K extends keyof ObitoDados>(key: K, valor: ObitoDados[K]) {
    setDados((atual) => ({ ...atual, [key]: valor }))
    setMensagem('')
  }

  async function salvar() {
    const erro = validarObito(dados, retificando, motivo)
    if (erro) {
      setMensagem(erro)
      return
    }
    if (ehEstudante) {
      setAprovando(true)
      return
    }
    setSalvando(true)
    setMensagem('')
    try {
      if (existente) {
        const versao = await obitoService.retificar(existente.id, dados, motivo.trim())
        aoConcluir(`Registro de óbito retificado. A versão anterior foi arquivada (versão atual: ${versao}).`)
      } else {
        await obitoService.registrar(petId, dados)
        aoConcluir(`Óbito de ${nomePet} registrado. O histórico do animal foi mantido.`)
      }
    } catch (erro) {
      setMensagem((erro as Error).message)
    } finally {
      setSalvando(false)
    }
  }

  async function concluirAprovado(liberacao: Liberacao) {
    setSalvando(true)
    try {
      await supervisaoService.registrarObito(liberacao.id)
      aoConcluir(`Óbito de ${nomePet} registrado com aprovação de ${liberacao.supervisor.nome}.`)
    } catch (erro) {
      setAprovando(false)
      setMensagem((erro as Error).message)
    } finally {
      setSalvando(false)
    }
  }

  if (aprovando)
    return (
      <TelaLiberacao
        obito={{ petId, dados }}
        aoLiberar={(liberacao) => void concluirAprovado(liberacao)}
        aoCancelar={() => setAprovando(false)}
        aoRecusar={(mensagem) => {
          setAprovando(false)
          setMensagem(`Registro recusado — ${mensagem} Corrija e envie novamente.`)
          window.scrollTo({ top: 0, behavior: 'smooth' })
        }}
      />
    )

  return (
    <section className="clinical-care-module">
      <header className="consultation-header content-card">
        <h2>{retificando ? `Retificar registro de óbito · ${nomePet}` : `Registrar óbito · ${nomePet}`}</h2>
        <p>
          {retificando
            ? 'A versão atual será arquivada e continuará visível no prontuário.'
            : 'Depois do registro, o animal passa para o status de óbito. Todo o histórico é mantido, e não será possível criar novos agendamentos, atendimentos ou receitas para ele.'}
        </p>
        {ehEstudante && (
          <p>
            <strong>O registro será concluído depois da aprovação de um médico-veterinário.</strong>
          </p>
        )}
      </header>

      {mensagem && (
        <p className="consultation-message" role="status">
          {mensagem}
        </p>
      )}

      <fieldset className="consultation-panel content-card death-form" disabled={salvando}>
        <CamposObito dados={dados} atualizar={atualizar} veterinarios={veterinarios} atendimentos={atendimentos} />

        {retificando && (
          <div className="consultation-textareas">
            <label>
              Motivo da retificação *
              <textarea
                value={motivo}
                onChange={(evento) => {
                  setMotivo(evento.target.value)
                  setMensagem('')
                }}
                placeholder="Ex.: correção do horário do óbito"
              />
            </label>
          </div>
        )}

        <div className="step-navigation">
          <button type="button" className="secondary-button" onClick={aoCancelar}>
            Cancelar
          </button>
          <button type="button" className="primary-button" onClick={() => void salvar()}>
            {rotuloEnviar(salvando, ehEstudante, retificando)}
          </button>
        </div>
      </fieldset>
    </section>
  )
}
