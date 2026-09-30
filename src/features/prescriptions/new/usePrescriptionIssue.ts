import { useRef, useState } from 'react'
import { PrescriptionService, type IssuedPrescription } from '../../../services/PrescriptionService'
import { SupervisionService } from '../../../services/SupervisionService'

type IssueArgs = Parameters<PrescriptionService['issue']>

const service = new PrescriptionService()
const supervisionService = new SupervisionService()

export function usePrescriptionIssue() {
  const [saving, setSaving] = useState(false)
  const [pendingEmission, setPendingEmission] = useState(false)
  const lock = useRef(false)
  const pending = useRef<IssueArgs | null>(null)

  async function issue(build: () => IssueArgs): Promise<IssuedPrescription | null> {
    if (lock.current) return null
    lock.current = true
    setSaving(true)
    try {
      pending.current ??= build()
      setPendingEmission(true)
      return await service.issue(...pending.current)
    } finally {
      lock.current = false
      setSaving(false)
    }
  }

  async function issueApproved(liberacaoId: string): Promise<IssuedPrescription> {
    setSaving(true)
    try {
      return await service.get(await supervisionService.emitirReceita(liberacaoId))
    } finally {
      setSaving(false)
    }
  }

  function clear() {
    pending.current = null
    setPendingEmission(false)
  }

  return { saving, pendingEmission, issue, issueApproved, clear }
}
