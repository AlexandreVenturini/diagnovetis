import { useCallback, useEffect, useState } from 'react'
import type { RiskLevel, Zoonosis, ZoonosisFormData } from '../features/zoonoses/zoonosisTypes'
import { Zoonose } from '../models/Zoonose'
import { ZoonoseService } from '../services/ZoonoseService'

const zoonoseService = new ZoonoseService()

const GRAU_MAP: Record<RiskLevel, string> = { Alto: 'alto', Médio: 'medio', Baixo: 'baixo' }
const GRAU_MAP_REVERSE: Record<string, RiskLevel> = { alto: 'Alto', medio: 'Médio', baixo: 'Baixo' }

function zoonoseToFrontend(z: Zoonose): Zoonosis {
    return {
        id: z.id,
        name: z.nome,
        agent: z.agenteEtiologico,
        risk: GRAU_MAP_REVERSE[z.grauRisco] ?? 'Médio',
        prevalence: 'Média',
        hosts: [],
        transmission: '',
        symptoms: z.sintomas.split(',').map(s => s.trim()).filter(Boolean),
        diagnostics: [],
        prevention: z.medidasPreventivas.split(',').map(s => s.trim()).filter(Boolean),
    }
}

export function useZoonoses() {
    const [zoonoses, setZoonoses] = useState<Zoonosis[]>([])

    const refresh = useCallback(async () => {
        const lista = await zoonoseService.listarZoonoses()
        setZoonoses(lista.map(zoonoseToFrontend))
    }, [])

    useEffect(() => { refresh() }, [refresh])

    async function createZoonosis(form: ZoonosisFormData) {
        const lista = await zoonoseService.listarZoonoses()
        const novoId = lista.length > 0 ? Math.max(...lista.map(z => z.id)) + 1 : 1
        const zoonose = new Zoonose(
            novoId, form.name, form.agent,
            form.symptoms.join(', '),
            form.prevention.join(', '),
            GRAU_MAP[form.risk] ?? 'medio'
        )
        await zoonoseService.adicionarZoonose(zoonose)
        await refresh()
    }

    async function removeZoonosis(id: number) {
        await zoonoseService.removerZoonose(id)
        await refresh()
    }

    return { zoonoses, createZoonosis, removeZoonosis }
}
