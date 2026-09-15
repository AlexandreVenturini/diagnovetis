import { useEffect, useState } from 'react'
import { PrescriptionService, type IssuedPrescription } from '../../services/PrescriptionService'
import { generatePrescription } from '../consultations/prescriptionReport'

export function PatientPrescriptions({ petId }: { petId: number }) {
  const [items, setItems] = useState<IssuedPrescription[]>([])
  const [message, setMessage] = useState('Carregando receitas…')
  useEffect(() => {
    let active = true
    new PrescriptionService().list(petId).then(rows => {
      if (active) { setItems(rows.filter(row => !row.id.startsWith('consulta-'))); setMessage('') }
    }).catch(error => { if (active) setMessage(error.message) })
    return () => { active = false }
  }, [petId])
  return <section className="content-card saved-prescriptions"><h3>Receituário do animal</h3>
    {message && <p role="status">{message}</p>}
    {!message && !items.length && <p>Nenhuma receita emitida pela nova aba.</p>}
    {items.map(({ id, snapshot }) => <article key={id}><div><strong>{new Date(snapshot.issuedAt).toLocaleString('pt-BR')}</strong><p>{snapshot.patient.veterinarian} · CRMV {snapshot.prescription.crmv}</p><p>{snapshot.prescription.items.map(item => `${item.medication} — ${item.dose}`).join('; ')}</p></div>
      <button className="outline-button" onClick={() => {
        try { setMessage(generatePrescription(snapshot.patient, snapshot.prescription, new Date(snapshot.issuedAt)) ? 'Receita aberta para impressão / PDF.' : 'Permita novas janelas no navegador para imprimir.') }
        catch { setMessage('Não foi possível abrir esta receita.') }
      }}>Ver receita / PDF</button></article>)}
  </section>
}
