import { useState } from 'react'
import type { Dispatch, SetStateAction } from 'react'
import type { Appointment } from '../appointments/appointmentTypes'
import type { DogScreen } from '../dogs/dogTypes'

export type DashboardModule =
  'dashboard' | 'dogs' | 'appointments' | 'consultations' | 'prescriptions' | 'records' | 'zoonoses' | 'medications'

type Entry<S> = { screen: S; key: number }

function reopen<S>(setEntry: Dispatch<SetStateAction<Entry<S>>>, screen: NoInfer<S>) {
  setEntry((previous) => ({ screen, key: previous.key + 1 }))
}

export function useDashboardNavigation() {
  const [activeModule, setActiveModule] = useState<DashboardModule>('dashboard')
  const [dogsEntry, setDogsEntry] = useState<Entry<DogScreen>>({ screen: 'list', key: 0 })
  const [appointmentEntry, setAppointmentEntry] = useState<Entry<'list' | 'create'>>({ screen: 'list', key: 0 })
  const [careEntry, setCareEntry] = useState<Entry<Appointment | undefined>>({ screen: undefined, key: 0 })
  const [recordsEntry, setRecordsEntry] = useState<Entry<number | undefined>>({ screen: undefined, key: 0 })

  function selectModule(module: DashboardModule) {
    if (module === 'consultations' && activeModule !== 'consultations') reopen(setCareEntry, undefined)
    if (module === 'records') reopen(setRecordsEntry, undefined)
    if (module === 'dogs') reopen(setDogsEntry, 'list')
    if (module === 'appointments') reopen(setAppointmentEntry, 'list')
    setActiveModule(module)
  }

  function openNewDog() {
    reopen(setDogsEntry, 'create')
    setActiveModule('dogs')
  }

  function openNewAppointment() {
    reopen(setAppointmentEntry, 'create')
    setActiveModule('appointments')
  }

  function startCare(appointment: Appointment) {
    reopen(setCareEntry, appointment)
    setActiveModule('consultations')
  }

  function openRecord(petId: number) {
    reopen(setRecordsEntry, petId)
    setActiveModule('records')
  }

  return {
    activeModule,
    dogsEntry,
    appointmentEntry,
    careEntry,
    recordsEntry,
    selectModule,
    openNewDog,
    openNewAppointment,
    startCare,
    openRecord,
  }
}
