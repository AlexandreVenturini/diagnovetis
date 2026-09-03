import { useEffect, useMemo, useState } from 'react'
import { Icon } from '../../components/common/Icon'
import type { Consulta } from '../../models/Consulta'
import { Medico } from '../../models/Medico'
import type { Pet } from '../../models/Pet'
import { ConsultaService } from '../../services/ConsultaService'
import { PetService } from '../../services/PetService'

const petService = new PetService()
const consultaService = new ConsultaService()

function formatDate(date: Date) {
  return date.toLocaleDateString('pt-BR', { timeZone: 'UTC' })
}

function formatPrescription(consultation: Consulta) {
  return consultation.receitas.flatMap((prescription) => prescription.medicamentosReceitados)
}

export function RecordsModule() {
  const [pets, setPets] = useState<Pet[]>([])
  const [selectedPet, setSelectedPet] = useState<Pet | null>(null)
  const [consultations, setConsultations] = useState<Consulta[]>([])
  const [query, setQuery] = useState('')
  const [loadingPets, setLoadingPets] = useState(true)
  const [loadingHistory, setLoadingHistory] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    petService.listarPets()
      .then((result) => {
        if (active) setPets(result)
      })
      .catch((cause) => {
        if (active) setError(cause instanceof Error ? cause.message : 'Não foi possível carregar os pets.')
      })
      .finally(() => {
        if (active) setLoadingPets(false)
      })
    return () => { active = false }
  }, [])

  const filteredPets = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase('pt-BR')
    return pets.filter((pet) => !normalizedQuery || pet.nome.toLocaleLowerCase('pt-BR').includes(normalizedQuery))
  }, [pets, query])

  async function selectPet(pet: Pet) {
    setSelectedPet(pet)
    setConsultations([])
    setError('')
    setLoadingHistory(true)
    try {
      const history = await consultaService.listarPorPet(pet.id)
      setConsultations(history.sort((a, b) => b.dataConsulta.getTime() - a.dataConsulta.getTime()))
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Não foi possível carregar o histórico do pet.')
    } finally {
      setLoadingHistory(false)
    }
  }

  if (selectedPet) {
    return <section className="records-module">
      <div className="records-heading record-detail-heading">
        <div>
          <button className="text-back-button" onClick={() => { setSelectedPet(null); setConsultations([]); setError('') }}>‹ Prontuários</button>
          <h2>{selectedPet.nome}</h2>
          <p>Tutor: {selectedPet.tutor.nome} · {selectedPet.especie} · {selectedPet.raca || 'Raça não informada'}</p>
        </div>
        <div className="records-stat"><strong>{consultations.length}</strong><span>consultas encontradas</span></div>
      </div>

      <div className="record-pet-summary content-card">
        <div><span>Idade</span><strong>{selectedPet.idade || 'Não informada'}</strong></div>
        <div><span>Sexo</span><strong>{selectedPet.sexo || 'Não informado'}</strong></div>
        <div><span>Peso</span><strong>{selectedPet.peso ? `${selectedPet.peso} kg` : 'Não informado'}</strong></div>
        <div><span>Contato do tutor</span><strong>{selectedPet.tutor.telefone || 'Não informado'}</strong></div>
      </div>

      {error && <p className="record-notice record-error" role="alert">{error}</p>}
      {loadingHistory && <div className="record-loading content-card" role="status">Carregando histórico de consultas...</div>}
      {!loadingHistory && !error && consultations.length === 0 && <div className="record-loading content-card">Nenhuma consulta registrada para este pet.</div>}
      {!loadingHistory && consultations.length > 0 && <div className="records-consultation-list">
        {consultations.map((consultation) => <ConsultationCard key={consultation.id} consultation={consultation} />)}
      </div>}
    </section>
  }

  return <section className="records-module">
    <div className="records-heading">
      <div><h2>Prontuários Clínicos</h2><p>Busque um pet para consultar todo o histórico de atendimentos.</p></div>
      <div className="records-stat"><strong>{pets.length}</strong><span>pets cadastrados</span></div>
    </div>
    <div className="record-search content-card">
      <Icon><circle cx="11" cy="11" r="7" /><path d="m16 16 5 5" /></Icon>
      <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar pelo nome do pet..." />
    </div>
    {error && <p className="record-notice record-error" role="alert">{error}</p>}
    {loadingPets ? <div className="record-loading content-card" role="status">Carregando pets...</div> :
      <div className="patient-record-grid">
        {filteredPets.map((pet) => <button className="patient-record-card record-pet-card" key={pet.id} onClick={() => selectPet(pet)}>
          <div className="patient-card-top"><div><h3>{pet.nome}</h3><p>Tutor: {pet.tutor.nome}</p></div><span>Ver histórico</span></div>
          <div className="patient-clinical-flags"><span>{pet.especie}</span><span>{pet.raca || 'Raça não informada'}</span><span>{pet.peso ? `${pet.peso} kg` : 'Peso não informado'}</span></div>
          <div className="record-pet-card-footer"><span>{pet.idade || 'Idade não informada'}</span><strong>Consultar prontuário →</strong></div>
        </button>)}
        {filteredPets.length === 0 && <div className="empty-appointments">Nenhum pet encontrado.</div>}
      </div>}
  </section>
}

function ConsultationCard({ consultation }: { consultation: Consulta }) {
  const veterinarian = consultation.responsavel
  const crmv = veterinarian instanceof Medico ? veterinarian.crmv : ''
  const prescribedMedications = formatPrescription(consultation)

  return <article className="record-consultation-card content-card">
    <header>
      <div><span>Consulta #{consultation.id}</span><h3>{formatDate(consultation.dataConsulta)} às {consultation.horario}</h3></div>
      <div><strong>{veterinarian.nome}</strong>{crmv && <small>CRMV {crmv}</small>}</div>
    </header>
    <div className="record-consultation-clinical">
      <section><h4>Diagnóstico</h4><p>{consultation.diagnostico || 'Não informado.'}</p></section>
      <section><h4>Observações</h4><p>{consultation.observacoes || 'Sem observações.'}</p></section>
    </div>
    <div className="record-consultation-complements">
      <section>
        <h4>Exames <span>{consultation.exames.length}</span></h4>
        {consultation.exames.length === 0 ? <p className="record-empty-complement">Nenhum exame registrado.</p> : <ul>{consultation.exames.map((exam) => <li key={exam.id}><strong>{exam.nomeExame}</strong><span>{formatDate(exam.dataExame)}</span><p>{exam.resultado || 'Resultado não informado.'}</p></li>)}</ul>}
      </section>
      <section>
        <h4>Receitas <span>{consultation.receitas.length}</span></h4>
        {prescribedMedications.length === 0 ? <p className="record-empty-complement">Nenhuma receita registrada.</p> : <ul>{prescribedMedications.map((item, index) => <li key={`${item.medicamento.id}-${index}`}><strong>{item.medicamento.nome}</strong><span>{item.dose} · {item.vezesAoDia}x ao dia · {item.duracaoDias} dia(s)</span><p>Quantidade: {item.quantidade}{item.observacao ? ` · ${item.observacao}` : ''}</p></li>)}</ul>}
      </section>
    </div>
  </article>
}
