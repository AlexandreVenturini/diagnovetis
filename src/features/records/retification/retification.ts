import type { Consulta } from '../../../models/Consulta'
import { EMPTY_CONSULTATION } from '../../consultations/consultationTypes'
import type { ConsultationData } from '../../consultations/consultationTypes'

export const CAMPOS_RETIFICAVEIS: Record<string, string> = {
  observacoes: 'Queixa e histórico',
  diagnostico: 'Diagnóstico',
  conduta: 'Conduta',
  diagnostico_zoonose_status: 'Zoonose (situação)',
  diagnostico_zoonose_observacoes: 'Zoonose (observações)',
  temperatura: 'Temperatura',
  frequencia_cardiaca: 'Frequência cardíaca',
  frequencia_respiratoria: 'Frequência respiratória',
  tpc: 'TPC',
  mucosas: 'Mucosas',
  hidratacao: 'Hidratação',
  nivel_consciencia: 'Nível de consciência',
  pele_pelagem: 'Pele e pelagem',
  olhos: 'Olhos',
  ouvidos: 'Ouvidos',
  boca_dentes: 'Boca/dentes',
  sistema_respiratorio: 'Sistema respiratório',
  sistema_cardiovascular: 'Sistema cardiovascular',
  sistema_gastrointestinal: 'Sistema gastrointestinal',
  sistema_urinario: 'Sistema urinário',
  sistema_reprodutivo: 'Sistema reprodutivo',
  sistema_neurologico: 'Sistema neurológico',
  dor: 'Dor',
  alta_data: 'Data da alta',
  alta_condicao: 'Condição na alta',
  alta_orientacoes: 'Orientações da alta',
  alta_prognostico: 'Prognóstico',
}

export type CamposConsulta = Record<string, string | number | null>

export type VersaoConsulta = {
  versao: number
  dados: CamposConsulta
  motivo: string
  alteradoPorNome: string
  aprovadoPorNome: string
  alteradoEm: string
}

export type AlteracaoCampo = { campo: string; rotulo: string; antes: string; depois: string }

const text = (value: unknown) => (value === null || value === undefined ? '' : String(value))
const orNull = (value: string) => (value.trim() ? value : null)
const numberOrNull = (value: string) => {
  const parsed = parseFloat(value.replace(',', '.'))
  return Number.isFinite(parsed) ? parsed : null
}

export function splitObservacoes(observacoes: string) {
  const match = /^Queixa: ([\s\S]*?)\. Histórico: ([\s\S]*)$/.exec(observacoes)
  return match ? { mainComplaint: match[1], history: match[2] } : { mainComplaint: observacoes, history: '' }
}

export function consultaToData(consulta: Consulta): ConsultationData {
  const { mainComplaint, history } = splitObservacoes(consulta.observacoes ?? '')
  const ef = consulta.exameFisico
  const zoonose = consulta.diagnosticoZoonose
  return {
    ...EMPTY_CONSULTATION,
    dogName: consulta.pet.nome,
    tutorName: consulta.pet.tutor.nome,
    age: consulta.pet.idade,
    breed: consulta.pet.raca,
    veterinarian: consulta.responsavel.nome,
    veterinarianId: String(consulta.responsavel.id),
    mainComplaint,
    history,
    temperature: text(ef.temperatura),
    heartRate: text(ef.frequenciaCardiaca),
    respiratoryRate: text(ef.frequenciaRespiratoria),
    capillaryRefill: text(ef.tpc),
    mucosa: text(ef.mucosas),
    hydration: text(ef.hidratacao),
    consciousness: text(ef.nivelConsciencia),
    skinAndCoat: text(ef.pelePelagem),
    eyes: text(ef.olhos),
    ears: text(ef.ouvidos),
    mouthAndTeeth: text(ef.bocaDentes),
    respiratorySystem: text(ef.sistemaRespiratorio),
    cardiovascularSystem: text(ef.sistemaCardiovascular),
    gastrointestinalSystem: text(ef.sistemaGastrointestinal),
    urinarySystem: text(ef.sistemaUrinario),
    reproductiveSystem: text(ef.sistemaReprodutivo),
    neurologicalSystem: text(ef.sistemaNeurologico),
    pain: text(ef.dor),
    diagnosis: consulta.diagnostico ?? '',
    zoonosisSearch: zoonose.status === 'suspeito' ? zoonose.observacoes : '',
    conduct: consulta.conduta ?? '',
    dischargeDate: text(consulta.alta.data),
    dischargeCondition: text(consulta.alta.condicao),
    dischargeInstructions: text(consulta.alta.orientacoes),
    dischargePrognosis: text(consulta.alta.prognostico),
  }
}

export function dataToCampos(data: ConsultationData): CamposConsulta {
  return {
    observacoes: `Queixa: ${data.mainComplaint}. Histórico: ${data.history}`,
    diagnostico: data.diagnosis,
    conduta: data.conduct,
    diagnostico_zoonose_status: data.zoonosisSearch ? 'suspeito' : 'negativo',
    diagnostico_zoonose_observacoes: data.zoonosisSearch || 'Sem suspeita de zoonose',
    temperatura: numberOrNull(data.temperature),
    frequencia_cardiaca: numberOrNull(data.heartRate),
    frequencia_respiratoria: numberOrNull(data.respiratoryRate),
    tpc: orNull(data.capillaryRefill),
    mucosas: orNull(data.mucosa),
    hidratacao: orNull(data.hydration),
    nivel_consciencia: orNull(data.consciousness),
    pele_pelagem: orNull(data.skinAndCoat),
    olhos: orNull(data.eyes),
    ouvidos: orNull(data.ears),
    boca_dentes: orNull(data.mouthAndTeeth),
    sistema_respiratorio: orNull(data.respiratorySystem),
    sistema_cardiovascular: orNull(data.cardiovascularSystem),
    sistema_gastrointestinal: orNull(data.gastrointestinalSystem),
    sistema_urinario: orNull(data.urinarySystem),
    sistema_reprodutivo: orNull(data.reproductiveSystem),
    sistema_neurologico: orNull(data.neurologicalSystem),
    dor: orNull(data.pain),
    alta_data: orNull(data.dischargeDate),
    alta_condicao: orNull(data.dischargeCondition),
    alta_orientacoes: orNull(data.dischargeInstructions),
    alta_prognostico: orNull(data.dischargePrognosis),
  }
}

export function compararCampos(antes: CamposConsulta, depois: CamposConsulta): AlteracaoCampo[] {
  return Object.entries(CAMPOS_RETIFICAVEIS)
    .filter(([campo]) => text(antes[campo]) !== text(depois[campo]))
    .map(([campo, rotulo]) => ({ campo, rotulo, antes: text(antes[campo]), depois: text(depois[campo]) }))
}
