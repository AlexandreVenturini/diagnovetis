import { useState } from 'react'
import type { IssuedPrescription } from '../../services/PrescriptionService'
import type { UserRole } from '../auth/profile'
import { generatePrescription, validatePrescription } from '../consultations/prescriptionReport'
import type { Dog } from '../dogs/dogTypes'
import { SupervisionGate } from '../supervision/gate/SupervisionGate'
import type { Liberacao } from '../supervision/supervisionTypes'
import { PrescriptionDetails } from './history/PrescriptionDetails'
import { PrescriptionHistory } from './history/PrescriptionHistory'
import { PrescriptionHistoryFilters } from './history/PrescriptionHistoryFilters'
import { usePrescriptionHistory } from './history/usePrescriptionHistory'
import { NewPrescriptionForm } from './new/NewPrescriptionForm'
import { PrescriptionReview } from './new/PrescriptionReview'
import { usePrescriptionDraft } from './new/usePrescriptionDraft'
import { usePrescriptionIssue } from './new/usePrescriptionIssue'
import { usePrescriptionCatalog } from './usePrescriptionCatalog'

type PrescriptionsModuleProps = {
  dogs: Dog[]
  onOpenRecord: (id: number) => void
  role?: UserRole
}

function printMessage(row: IssuedPrescription) {
  try {
    const { patient, prescription, issuedAt } = row.snapshot
    return generatePrescription(patient, prescription, new Date(issuedAt))
      ? 'Receita aberta. Use Imprimir / Salvar PDF.'
      : 'Permita novas janelas no navegador para imprimir.'
  } catch {
    return 'Não foi possível abrir esta receita. Confira os dados salvos.'
  }
}

export function PrescriptionsModule({ dogs, onOpenRecord, role = 'veterinarian' }: PrescriptionsModuleProps) {
  const isStudent = role === 'attendant'
  const [tab, setTab] = useState<'history' | 'new'>('history')
  const [selected, setSelected] = useState<IssuedPrescription | null>(null)
  const [preview, setPreview] = useState(false)
  const [approving, setApproving] = useState(false)
  const [message, setMessage] = useState('')
  const catalog = usePrescriptionCatalog()
  const history = usePrescriptionHistory()
  const draft = usePrescriptionDraft(dogs, catalog.medicos, isStudent)
  const emission = usePrescriptionIssue()
  const { dog, vet, patient } = draft

  const loading = catalog.loading || history.loading
  const error = catalog.error || history.error

  function startNew() {
    draft.reset()
    emission.clear()
    setPreview(false)
    setApproving(false)
    setMessage('')
    setSelected(null)
    setTab('new')
  }

  function afterIssued(row: IssuedPrescription, text: string) {
    history.showIssued(row)
    draft.reset()
    emission.clear()
    setSelected(row)
    setTab('history')
    setPreview(false)
    setApproving(false)
    setMessage(text)
  }

  function review() {
    const validation = validatePrescription(patient, draft.previewPrescription)
    if (validation || !draft.hasValidWeight) {
      setMessage(validation || 'Informe um peso válido em kg.')
      return
    }
    setMessage('')
    setPreview(true)
  }

  async function issue() {
    if (!dog || !vet) return
    setMessage('')
    try {
      const row = await emission.issue(() => [
        crypto.randomUUID(),
        dog.id,
        vet.id,
        {
          version: 1,
          issuedAt: new Date().toISOString(),
          patient: { ...patient },
          prescription: structuredClone(draft.prescription),
        },
      ])
      if (row) afterIssued(row, 'Receita emitida e salva no prontuário do animal.')
    } catch (reason) {
      setMessage((reason as Error).message)
    }
  }

  async function handleApproved(liberacao: Liberacao) {
    setMessage('')
    try {
      const row = await emission.issueApproved(liberacao.id)
      afterIssued(row, `Receita aprovada por ${liberacao.supervisor.nome} e salva no prontuário do animal.`)
    } catch (reason) {
      setApproving(false)
      setMessage((reason as Error).message)
    }
  }

  function renderHistory() {
    if (selected)
      return (
        <PrescriptionDetails
          row={selected}
          onBack={() => setSelected(null)}
          onPrint={() => setMessage(printMessage(selected))}
          onOpenRecord={() => onOpenRecord(selected.petId)}
          onNew={startNew}
        />
      )
    return (
      <PrescriptionHistory
        rows={history.filtered}
        view={history.filters.view}
        searching={history.searching}
        onSelect={(row) => {
          setSelected(row)
          setMessage('')
        }}
      />
    )
  }

  function renderNew() {
    if (approving && dog)
      return (
        <SupervisionGate
          receita={{
            petId: dog.id,
            dados: {
              version: 1,
              issuedAt: new Date().toISOString(),
              patient: { ...patient },
              prescription: structuredClone(draft.previewPrescription),
            },
          }}
          onLiberado={(liberacao) => void handleApproved(liberacao)}
          onCancel={() => setApproving(false)}
          onRecusado={(mensagem) => {
            setApproving(false)
            setPreview(false)
            setMessage(`Receita recusada — ${mensagem} Corrija e envie novamente.`)
            window.scrollTo({ top: 0, behavior: 'smooth' })
          }}
        />
      )
    if (preview)
      return (
        <PrescriptionReview
          patient={patient}
          prescription={draft.previewPrescription}
          isStudent={isStudent}
          saving={emission.saving}
          pendingEmission={emission.pendingEmission}
          onEdit={() => setPreview(false)}
          onConfirm={() => {
            if (isStudent) {
              setMessage('')
              setApproving(true)
            } else void issue()
          }}
        />
      )
    return (
      <NewPrescriptionForm
        dogs={dogs}
        medicos={catalog.medicos}
        medications={catalog.medications}
        draft={draft}
        isStudent={isStudent}
        onReview={review}
      />
    )
  }

  function renderContent() {
    if (loading) return <p role="status">Carregando receituário…</p>
    if (error)
      return (
        <div role="alert">
          <p>{error}</p>
          <button
            className="secondary-button"
            onClick={() => {
              catalog.retry()
              history.reset()
            }}
          >
            Tentar novamente
          </button>
        </div>
      )
    if (tab === 'history') return renderHistory()
    return (
      <>
        <p className="rx-flow">Identificação → Medicamentos e dose → Orientações → Visualização → Emissão</p>
        {renderNew()}
      </>
    )
  }

  return (
    <section className="receituario-module">
      <div className="records-heading">
        <div>
          <h2>Receituário</h2>
          <p>
            {isStudent
              ? 'Monte receitas para aprovação de um veterinário e acompanhe o histórico de cada animal.'
              : 'Emita receitas e acompanhe o histórico de cada animal.'}
          </p>
        </div>
      </div>
      <div className="form-actions" role="group" aria-label="Receituário">
        <button
          className={tab === 'history' ? 'primary-button' : 'secondary-button'}
          disabled={emission.saving}
          onClick={() => {
            setTab('history')
            setMessage('')
          }}
        >
          Histórico
        </button>
        <button
          className={tab === 'new' ? 'primary-button' : 'secondary-button'}
          disabled={emission.saving}
          onClick={() => {
            if (selected) startNew()
            else setTab('new')
          }}
        >
          Nova receita
        </button>
      </div>
      {message && (
        <p role="status" className="consultation-message">
          {message}
        </p>
      )}
      {tab === 'history' && !error && (
        <PrescriptionHistoryFilters
          history={history.history}
          value={history.filters}
          onChange={(value) => {
            history.setFilters(value)
            setSelected(null)
          }}
        />
      )}
      {renderContent()}
    </section>
  )
}
