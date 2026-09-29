import { useEffect, useState } from 'react'
import type { UserRole } from '../auth/LoginPage'
import { SupervisionGate } from '../consultations/SupervisionGate'
import { listarVeterinarios, registrarObitoLiberado } from '../consultations/supervision'
import type { Liberacao, ObitoDados, VeterinarianOption } from '../consultations/supervision'
import { DESTINOS_CORPO, deathToDados, registrarObito, retificarObito } from './death'
import type { DeathRecord } from './death'
import type { ClinicalRecord } from './recordTypes'

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

const toLocalInput = (iso: string) => {
  const date = new Date(iso)
  return new Date(date.getTime() - date.getTimezoneOffset() * 60_000).toISOString().slice(0, 16)
}

function YesNo({ label, value, onChange, disabled }: { label: string; value: boolean; onChange: (value: boolean) => void; disabled?: boolean }) {
  return (
    <fieldset style={{ border: 0, padding: 0, margin: 0, display: 'grid', gap: '0.35rem' }} disabled={disabled}>
      <legend style={{ fontSize: '13px', fontWeight: 600, padding: 0, marginBottom: '0.35rem' }}>{label}</legend>
      <div style={{ display: 'flex', gap: '1rem' }}>
        {[true, false].map((option) => (
          <label key={String(option)} style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontWeight: 400, fontSize: '14px' }}>
            <input type="radio" checked={value === option} onChange={() => onChange(option)} style={{ width: 'auto', height: 'auto' }} />
            {option ? 'Sim' : 'Não'}
          </label>
        ))}
      </div>
    </fieldset>
  )
}

export function DeathForm({ petId, dogName, role, userEmail, records, existing, onDone, onCancel }: DeathFormProps) {
  const isStudent = role === 'attendant'
  const retificando = Boolean(existing)
  const [dados, setDados] = useState<ObitoDados>(() => existing ? deathToDados(existing) : {
    data_hora: new Date().toISOString(), circunstancias: '', causa_provavel: '', houve_reanimacao: false, eutanasia: false,
    medico_responsavel_id: 0, comunicado_responsavel: false, comunicacao_detalhes: '', necropsia: false, destino_corpo: '', consulta_id: null,
  })
  const [motivo, setMotivo] = useState('')
  const [veterinarians, setVeterinarians] = useState<VeterinarianOption[]>([])
  const [saving, setSaving] = useState(false)
  const [approving, setApproving] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    let active = true
    listarVeterinarios()
      .then((vets) => {
        if (!active) return
        setVeterinarians(vets)
        const self = userEmail && vets.find((vet) => vet.email.toLocaleLowerCase('pt-BR') === userEmail.toLocaleLowerCase('pt-BR'))
        if (self) setDados((current) => current.medico_responsavel_id ? current : { ...current, medico_responsavel_id: self.medicoId })
      })
      .catch(() => { if (active) setMessage('Não foi possível carregar a lista de veterinários.') })
    return () => { active = false }
  }, [userEmail])

  function update<K extends keyof ObitoDados>(key: K, value: ObitoDados[K]) {
    setDados((current) => ({ ...current, [key]: value }))
    setMessage('')
  }

  function validar() {
    if (!dados.data_hora) return 'Informe a data e a hora do óbito.'
    if (new Date(dados.data_hora).getTime() > Date.now() + 5 * 60_000) return 'A data do óbito não pode estar no futuro.'
    if (!dados.circunstancias.trim()) return 'Descreva as circunstâncias do óbito.'
    if (!dados.medico_responsavel_id) return 'Selecione o profissional responsável.'
    if (!dados.destino_corpo.trim()) return 'Informe a destinação do corpo.'
    if (retificando && !motivo.trim()) return 'Informe o motivo da retificação.'
    return ''
  }

  async function salvar() {
    const erro = validar()
    if (erro) { setMessage(erro); return }
    if (isStudent) { setApproving(true); return }
    setSaving(true)
    setMessage('')
    try {
      if (existing) {
        const versao = await retificarObito(existing.id, dados, motivo.trim())
        onDone(`Registro de óbito retificado. A versão anterior foi arquivada (versão atual: ${versao}).`)
      } else {
        await registrarObito(petId, dados)
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
      await registrarObitoLiberado(liberacao.id)
      onDone(`Óbito de ${dogName} registrado com aprovação de ${liberacao.supervisor.nome}.`)
    } catch (error) {
      setApproving(false)
      setMessage((error as Error).message)
    } finally {
      setSaving(false)
    }
  }

  if (approving) {
    return (
      <SupervisionGate
        obito={{ petId, dados }}
        onLiberado={(liberacao) => { void concluirAprovado(liberacao) }}
        onCancel={() => setApproving(false)}
        onRecusado={(mensagem) => { setApproving(false); setMessage(`Registro recusado — ${mensagem} Corrija e envie novamente.`); window.scrollTo({ top: 0, behavior: 'smooth' }) }}
      />
    )
  }

  return (
    <section className="clinical-care-module">
      <header className="consultation-header content-card">
        <h2>{retificando ? `Retificar registro de óbito · ${dogName}` : `Registrar óbito · ${dogName}`}</h2>
        <p>{retificando
          ? 'A versão atual será arquivada e continuará visível no prontuário.'
          : 'Depois do registro, o animal passa para o status de óbito. Todo o histórico é mantido, e não será possível criar novos agendamentos, atendimentos ou receitas para ele.'}</p>
        {isStudent && <p><strong>O registro será concluído depois da aprovação de um médico-veterinário.</strong></p>}
      </header>

      {message && <p className="consultation-message" role="status">{message}</p>}

      <fieldset className="consultation-panel content-card" disabled={saving} style={{ display: 'grid', gap: '1rem' }}>
        <div className="consultation-form-grid">
          <label>Data e hora do óbito *
            <input type="datetime-local" value={toLocalInput(dados.data_hora)} max={toLocalInput(new Date().toISOString())} onChange={(event) => { if (event.target.value) update('data_hora', new Date(event.target.value).toISOString()) }} />
          </label>
          <label>Profissional responsável *
            <select value={dados.medico_responsavel_id || ''} onChange={(event) => update('medico_responsavel_id', Number(event.target.value))}>
              <option value="">{veterinarians.length ? 'Selecione o veterinário' : 'Carregando veterinários...'}</option>
              {veterinarians.map((vet) => <option key={vet.medicoId} value={vet.medicoId}>{vet.nome} — CRMV {vet.crmv}</option>)}
            </select>
          </label>
          <label>Atendimento relacionado
            <select value={dados.consulta_id ?? ''} onChange={(event) => update('consulta_id', event.target.value ? Number(event.target.value) : null)}>
              <option value="">Nenhum</option>
              {records.map((record) => <option key={record.id} value={record.id}>Nº {record.id} · {new Date(`${record.date}T12:00:00`).toLocaleDateString('pt-BR')} · {record.veterinarian}</option>)}
            </select>
          </label>
          <label>Destinação do corpo *
            <input list="destinos-corpo" value={dados.destino_corpo} onChange={(event) => update('destino_corpo', event.target.value)} placeholder="Ex.: Cremação" />
            <datalist id="destinos-corpo">{DESTINOS_CORPO.map((destino) => <option key={destino} value={destino} />)}</datalist>
          </label>
        </div>

        <div className="consultation-textareas">
          <label>Circunstâncias do óbito *
            <textarea value={dados.circunstancias} onChange={(event) => update('circunstancias', event.target.value)} placeholder="Descreva como e onde ocorreu o óbito" />
          </label>
          <label>Causa provável
            <textarea value={dados.causa_provavel} onChange={(event) => update('causa_provavel', event.target.value)} placeholder="Quando for possível estimar" />
          </label>
        </div>

        <div className="consultation-form-grid">
          <YesNo label="Houve reanimação?" value={dados.houve_reanimacao} onChange={(value) => update('houve_reanimacao', value)} />
          <YesNo label="Foi eutanásia?" value={dados.eutanasia} onChange={(value) => update('eutanasia', value)} />
          <YesNo label="Necropsia realizada?" value={dados.necropsia} onChange={(value) => update('necropsia', value)} />
          <YesNo label="Responsável pelo animal foi comunicado?" value={dados.comunicado_responsavel} onChange={(value) => update('comunicado_responsavel', value)} />
        </div>

        {dados.comunicado_responsavel && (
          <div className="consultation-textareas">
            <label>Como e quando foi comunicado
              <textarea value={dados.comunicacao_detalhes} onChange={(event) => update('comunicacao_detalhes', event.target.value)} placeholder="Ex.: por telefone às 10h30, pela Dra. Ana" />
            </label>
          </div>
        )}

        {retificando && (
          <div className="consultation-textareas">
            <label>Motivo da retificação *
              <textarea value={motivo} onChange={(event) => { setMotivo(event.target.value); setMessage('') }} placeholder="Ex.: correção do horário do óbito" />
            </label>
          </div>
        )}

        <div className="step-navigation">
          <button type="button" className="secondary-button" onClick={onCancel}>Cancelar</button>
          <button type="button" className="primary-button" onClick={() => void salvar()}>
            {saving ? 'Salvando...' : isStudent ? 'Enviar para aprovação' : retificando ? 'Salvar retificação' : 'Registrar óbito'}
          </button>
        </div>
      </fieldset>
    </section>
  )
}
