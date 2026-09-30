import { useEffect, useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import { MedicamentoService } from '../../services/MedicamentoService'
import { EMPTY_MEDICATION_FORM, buildMedication, medicamentoToMedication } from './medicationData'
import { MedicationDetails } from './MedicationDetails'
import { MedicationForm } from './MedicationForm'
import { PillIcon, SearchIcon } from './MedicationIcons'
import type { Medication, MedicationFormData } from './medicationTypes'

const medicamentoService = new MedicamentoService()

function MedicationCard({ item, selected, onSelect }: { item: Medication; selected: boolean; onSelect: () => void }) {
  return (
    <button className={`medication-card${selected ? ' selected' : ''}`} onClick={onSelect}>
      <span className="medication-card-icon">
        <PillIcon />
      </span>
      <span>
        <strong>{item.commercialName}</strong>
        <small>{item.activeIngredient}</small>
        {item.indications.length > 0 && (
          <span className="medication-indications">
            <b>Indicações:</b> {item.indications.join(', ')}
          </span>
        )}
        <span className="medication-tags">
          <em>{item.dosage}</em>
          <em>{item.frequency}</em>
        </span>
      </span>
    </button>
  )
}

export function MedicationsModule() {
  const [items, setItems] = useState<Medication[]>([])
  const [screen, setScreen] = useState<'browse' | 'create'>('browse')
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [query, setQuery] = useState('')
  const [form, setForm] = useState(EMPTY_MEDICATION_FORM)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const filtered = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase('pt-BR')
    return items.filter((item) =>
      `${item.commercialName} ${item.activeIngredient} ${item.indications.join(' ')}`
        .toLocaleLowerCase('pt-BR')
        .includes(normalized),
    )
  }, [items, query])
  const selected = items.find((item) => item.id === selectedId) ?? null

  useEffect(() => {
    let active = true
    medicamentoService
      .listarMedicamentos()
      .then((medicamentos) => {
        if (active) setItems(medicamentos.map(medicamentoToMedication))
      })
      .catch((cause) => {
        if (active) setError(cause instanceof Error ? cause.message : 'Não foi possível carregar os medicamentos.')
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [])

  function update<K extends keyof MedicationFormData>(key: K, value: MedicationFormData[K]) {
    setForm((current) => ({ ...current, [key]: value }))
  }

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    const id = Math.max(0, ...items.map((item) => item.id)) + 1
    const built = buildMedication(form, id)
    if ('error' in built) {
      setError(built.error)
      return
    }
    setSaving(true)
    try {
      await medicamentoService.adicionarMedicamento(built.medicamento)
      setItems((current) => [...current, built.medication])
      setSelectedId(id)
      setScreen('browse')
      setForm(EMPTY_MEDICATION_FORM)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Não foi possível cadastrar o medicamento.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <section className="medications-module">
      <header className="medications-header content-card">
        <div>
          <h2>
            <PillIcon />
            Guia Terapêutico e Calculadora
          </h2>
          <p>Consulte medicamentos por princípio ativo ou indicação clínica e calcule doses precisas para cães.</p>
        </div>
        <div className="medication-header-actions">
          <button
            className={screen === 'browse' ? 'primary-button' : 'outline-button'}
            onClick={() => setScreen('browse')}
          >
            <SearchIcon />
            Consultar
          </button>
          <button
            className={screen === 'create' ? 'primary-button' : 'outline-button'}
            onClick={() => setScreen('create')}
          >
            <span>＋</span>Cadastrar Medicamento
          </button>
        </div>
        {screen === 'browse' && (
          <label className="medication-search">
            <SearchIcon />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Buscar por princípio ativo ou indicação..."
            />
          </label>
        )}
        {error && (
          <p className="form-message error" role="alert">
            {error}
          </p>
        )}
      </header>

      {screen === 'create' ? (
        <MedicationForm
          form={form}
          onChange={update}
          saving={saving}
          onSubmit={save}
          onCancel={() => setScreen('browse')}
        />
      ) : (
        <div className="medication-browser">
          <div className="medication-list">
            {filtered.map((item) => (
              <MedicationCard
                key={item.id}
                item={item}
                selected={selectedId === item.id}
                onSelect={() => setSelectedId(item.id)}
              />
            ))}
            {!loading && filtered.length === 0 && (
              <div className="medication-empty-list">Nenhum medicamento encontrado.</div>
            )}
            {loading && <div className="medication-empty-list">Carregando medicamentos...</div>}
          </div>
          <MedicationDetails medication={selected} />
        </div>
      )}
    </section>
  )
}
