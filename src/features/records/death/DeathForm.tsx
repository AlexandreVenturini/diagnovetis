import { useCallback, useState } from 'react'
import type { UserRole } from '../../auth/profile'
import { SupervisionGate } from '../../supervision/gate/SupervisionGate'
import { SupervisionService } from '../../../services/SupervisionService'
import type { Liberacao, ObitoDados, VeterinarianOption } from '../../supervision/supervisionTypes'
import type { ClinicalRecord } from '../recordTypes'
import { DeathService } from '../../../services/DeathService'
import { deathToDados, novoObito, validarObito } from './deathRules'
import type { DeathRecord } from './deathTypes'
import { DeathFields } from './DeathFields'
import { useResponsibleVeterinarians } from './useResponsibleVeterinarians'

const supervisionService = new SupervisionService()
const deathService = new DeathService()

type DeathFormProps = {
  petId: number
  dogName: string
  role: UserRole
  userEmail?: string
  records: ClinicalRecord[]
  existing?: DeathRecord | null
  onDone: (message: string) => void
  onCancel: () => void
}

function submitLabel(saving: boolean, isStudent: boolean, retificando: boolean) {
  if (saving) return 'Salvando...'
  if (isStudent) return 'Enviar para aprovação'
  return retificando ? 'Salvar retificação' : 'Registrar óbito'
}

export function DeathForm({ petId, dogName, role, userEmail, records, existing, onDone, onCancel }: DeathFormProps) {
  const isStudent = role === 'attendant'
  const retificando = Boolean(existing)
  const [dados, setDados] = useState<ObitoDados>(() => (existing ? deathToDados(existing) : novoObito()))
  const [motivo, setMotivo] = useState('')
  const [saving, setSaving] = useState(false)
  const [approving, setApproving] = useState(false)
  const [message, setMessage] = useState('')

  const selectSelf = useCallback((vet: VeterinarianOption) => {
    setDados((current) =>
      current.medico_responsavel_id ? current : { ...current, medico_responsavel_id: vet.medicoId },
    )
  }, [])
  const veterinarians = useResponsibleVeterinarians(userEmail, { onSelf: selectSelf, onError: setMessage })

  function update<K extends keyof ObitoDados>(key: K, value: ObitoDados[K]) {
    setDados((current) => ({ ...current, [key]: value }))
    setMessage('')
  }

  async function salvar() {
    const erro = validarObito(dados, retificando, motivo)
    if (erro) {
      setMessage(erro)
      return
    }
    if (isStudent) {
      setApproving(true)
      return
    }
    setSaving(true)
    setMessage('')
    try {
      if (existing) {
        const versao = await deathService.retificar(existing.id, dados, motivo.trim())
        onDone(`Registro de óbito retificado. A versão anterior foi arquivada (versão atual: ${versao}).`)
      } else {
        await deathService.registrar(petId, dados)
        onDone(`Óbito de ${dogName} registrado. O histórico do animal foi mantido.`)
      }
    } catch (error) {
      setMessage((error as Error).message)
    } finally {
      setSaving(false)
    }
  }

  async function concluirAprovado(liberacao: Liberacao) {
    setSaving(true)
    try {
      await supervisionService.registrarObito(liberacao.id)
      onDone(`Óbito de ${dogName} registrado com aprovação de ${liberacao.supervisor.nome}.`)
    } catch (error) {
      setApproving(false)
      setMessage((error as Error).message)
    } finally {
      setSaving(false)
    }
  }

  if (approving)
    return (
      <SupervisionGate
        obito={{ petId, dados }}
        onLiberado={(liberacao) => void concluirAprovado(liberacao)}
        onCancel={() => setApproving(false)}
        onRecusado={(mensagem) => {
          setApproving(false)
          setMessage(`Registro recusado — ${mensagem} Corrija e envie novamente.`)
          window.scrollTo({ top: 0, behavior: 'smooth' })
        }}
      />
    )

  return (
    <section className="clinical-care-module">
      <header className="consultation-header content-card">
        <h2>{retificando ? `Retificar registro de óbito · ${dogName}` : `Registrar óbito · ${dogName}`}</h2>
        <p>
          {retificando
            ? 'A versão atual será arquivada e continuará visível no prontuário.'
            : 'Depois do registro, o animal passa para o status de óbito. Todo o histórico é mantido, e não será possível criar novos agendamentos, atendimentos ou receitas para ele.'}
        </p>
        {isStudent && (
          <p>
            <strong>O registro será concluído depois da aprovação de um médico-veterinário.</strong>
          </p>
        )}
      </header>

      {message && (
        <p className="consultation-message" role="status">
          {message}
        </p>
      )}

      <fieldset className="consultation-panel content-card death-form" disabled={saving}>
        <DeathFields dados={dados} update={update} veterinarians={veterinarians} records={records} />

        {retificando && (
          <div className="consultation-textareas">
            <label>
              Motivo da retificação *
              <textarea
                value={motivo}
                onChange={(event) => {
                  setMotivo(event.target.value)
                  setMessage('')
                }}
                placeholder="Ex.: correção do horário do óbito"
              />
            </label>
          </div>
        )}

        <div className="step-navigation">
          <button type="button" className="secondary-button" onClick={onCancel}>
            Cancelar
          </button>
          <button type="button" className="primary-button" onClick={() => void salvar()}>
            {submitLabel(saving, isStudent, retificando)}
          </button>
        </div>
      </fieldset>
    </section>
  )
}
