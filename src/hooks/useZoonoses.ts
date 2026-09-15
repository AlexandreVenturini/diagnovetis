import { useCallback, useEffect, useRef, useState } from 'react'
import type { RiskLevel, Zoonosis, ZoonosisFormData } from '../features/zoonoses/zoonosisTypes'
import { EMPTY_CLINICAL } from '../features/zoonoses/zoonosisTypes'
import { Zoonose } from '../models/Zoonose'
import { ZoonoseService } from '../services/ZoonoseService'

const service = new ZoonoseService()
const risks: Record<RiskLevel, string> = { Alto: 'alto', Médio: 'medio', Baixo: 'baixo' }
const riskLabels: Record<string, RiskLevel> = { alto: 'Alto', medio: 'Médio', baixo: 'Baixo' }

export function zoonoseToFrontend(z: Zoonose): Zoonosis {
  const clinical = { ...EMPTY_CLINICAL, ...z.clinical }
  return {
    id: z.id, name: z.nome, agent: z.agenteEtiologico, risk: riskLabels[z.grauRisco] ?? 'Médio',
    clinical, prevalence: clinical.prevalence, hosts: clinical.hosts, transmission: clinical.transmission,
    symptoms: z.sintomas.split(',').map(s => s.trim()).filter(Boolean), diagnostics: clinical.diagnostics,
    prevention: z.medidasPreventivas.split(',').map(s => s.trim()).filter(Boolean),
  }
}

export function useZoonoses() {
  const [zoonoses, setZoonoses] = useState<Zoonosis[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [updatedAt, setUpdatedAt] = useState<Date | null>(null)
  const request = useRef(0)

  const fetchItems = useCallback(() => {
    const version = ++request.current
    return service.listarZoonoses().then(list => {
      if (version === request.current) { setZoonoses(list.map(zoonoseToFrontend)); setError(''); setUpdatedAt(new Date()) }
    }).catch(() => {
      if (version === request.current) setError('Não foi possível atualizar o catálogo. Confira sua conexão e tente novamente.')
    }).finally(() => { if (version === request.current) setLoading(false) })
  }, [])

  useEffect(() => { const tracker = request; void fetchItems(); return () => { tracker.current++ } }, [fetchItems])
  function refresh() { setLoading(true); return fetchItems() }

  async function createZoonosis(form: ZoonosisFormData) {
    const list = await service.listarZoonoses()
    const id = Math.max(0, ...list.map(item => item.id)) + 1
    const item = new Zoonose(id, form.name, form.agent, form.symptoms.join(', '), form.prevention.join(', '), risks[form.risk])
    item.clinical = { ...form.clinical, hosts: form.hosts, transmission: form.transmission, diagnostics: form.diagnostics, prevalence: form.prevalence }
    await service.adicionarZoonose(item)
    setZoonoses(current => [...current, zoonoseToFrontend(item)])
    setUpdatedAt(new Date())
  }

  return { zoonoses, loading, error, updatedAt, refresh, createZoonosis }
}
