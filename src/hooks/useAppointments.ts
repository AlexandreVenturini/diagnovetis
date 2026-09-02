import { useState, useCallback, useEffect } from 'react'
import type { Appointment, AppointmentFormData } from '../features/appointments/appointmentTypes'
import { supabase } from '../services/storage/supabaseClient'

type Row = {
    id: number; dog_id?: number; dog_name: string; dog_age?: string; dog_breed?: string;
    kind: string; tutor_name: string; date: string; time: string; service_type: string;
    veterinarian: string; notes: string; status: string; cancellation_reason: string;
    reminders: Appointment['reminders'];
}

function rowToAppointment(r: Row): Appointment {
    return {
        id: r.id, dogId: r.dog_id, dogName: r.dog_name, dogAge: r.dog_age, dogBreed: r.dog_breed,
        kind: r.kind as Appointment['kind'], tutorName: r.tutor_name, date: r.date, time: r.time,
        serviceType: r.service_type, veterinarian: r.veterinarian, notes: r.notes,
        status: r.status as Appointment['status'], cancellationReason: r.cancellation_reason ?? '',
        reminders: r.reminders ?? [],
    }
}

export function useAppointments() {
    const [appointments, setAppointments] = useState<Appointment[]>([])

    const refresh = useCallback(async () => {
        const { data } = await supabase.from('agendamentos').select('*').order('date').order('time')
        setAppointments((data ?? []).map(r => rowToAppointment(r as Row)))
    }, [])

    useEffect(() => { refresh() }, [refresh])

    const createAppointment = useCallback(async (data: AppointmentFormData): Promise<boolean> => {
        const { data: current } = await supabase.from('agendamentos').select('*')
        const conflict = data.kind === 'scheduled' && (current ?? []).some(
            (a: Row) => a.status !== 'cancelled' && a.veterinarian === data.veterinarian
                && a.date === data.date && a.time === data.time
        )
        if (conflict) return false

        const id = Date.now()
        const { error } = await supabase.from('agendamentos').insert({
            id, dog_id: data.dogId ?? null, dog_name: data.dogName, dog_age: data.dogAge ?? null,
            dog_breed: data.dogBreed ?? null, kind: data.kind, tutor_name: data.tutorName,
            date: data.date, time: data.time, service_type: data.serviceType,
            veterinarian: data.veterinarian, notes: data.notes, status: 'confirmed',
            cancellation_reason: '', reminders: [],
        })
        if (error) return false
        await refresh()
        return true
    }, [refresh])

    const updateAppointment = useCallback(async (id: number, changes: Partial<Appointment>) => {
        const mapped: Partial<Row> = {}
        if (changes.status !== undefined) mapped.status = changes.status
        if (changes.cancellationReason !== undefined) mapped.cancellation_reason = changes.cancellationReason
        if (changes.reminders !== undefined) mapped.reminders = changes.reminders
        if (changes.veterinarian !== undefined) mapped.veterinarian = changes.veterinarian
        if (changes.date !== undefined) mapped.date = changes.date
        if (changes.time !== undefined) mapped.time = changes.time
        if (changes.notes !== undefined) mapped.notes = changes.notes
        await supabase.from('agendamentos').update(mapped as Record<string, unknown>).eq('id', id)
        await refresh()
    }, [refresh])

    return { appointments, createAppointment, updateAppointment }
}
