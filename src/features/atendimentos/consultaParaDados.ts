import type { Consulta } from '../../models/Consulta'
import { ATENDIMENTO_VAZIO } from './atendimentoTipos'
import type { DadosAtendimento } from './atendimentoTipos'

const texto = (valor: unknown) => (valor === null || valor === undefined ? '' : String(valor))

export function separarObservacoes(observacoes: string) {
  const correspondencia = /^Queixa: ([\s\S]*?)\. Histórico: ([\s\S]*)$/.exec(observacoes)
  return correspondencia
    ? { queixaPrincipal: correspondencia[1], historico: correspondencia[2] }
    : { queixaPrincipal: observacoes, historico: '' }
}

export function consultaParaDados(consulta: Consulta): DadosAtendimento {
  const { queixaPrincipal, historico } = separarObservacoes(consulta.observacoes ?? '')
  const ef = consulta.exameFisico
  const zoonose = consulta.diagnosticoZoonose
  return {
    ...ATENDIMENTO_VAZIO,
    nomePet: consulta.pet.nome,
    nomeTutor: consulta.pet.tutor.nome,
    idade: consulta.pet.idade,
    raca: consulta.pet.raca,
    veterinario: consulta.responsavel.nome,
    veterinarioId: String(consulta.responsavel.id),
    queixaPrincipal,
    historico,
    temperatura: texto(ef.temperatura),
    frequenciaCardiaca: texto(ef.frequenciaCardiaca),
    frequenciaRespiratoria: texto(ef.frequenciaRespiratoria),
    tpc: texto(ef.tpc),
    mucosas: texto(ef.mucosas),
    hidratacao: texto(ef.hidratacao),
    nivelConsciencia: texto(ef.nivelConsciencia),
    pelePelagem: texto(ef.pelePelagem),
    olhos: texto(ef.olhos),
    ouvidos: texto(ef.ouvidos),
    bocaDentes: texto(ef.bocaDentes),
    sistemaRespiratorio: texto(ef.sistemaRespiratorio),
    sistemaCardiovascular: texto(ef.sistemaCardiovascular),
    sistemaGastrointestinal: texto(ef.sistemaGastrointestinal),
    sistemaUrinario: texto(ef.sistemaUrinario),
    sistemaReprodutivo: texto(ef.sistemaReprodutivo),
    sistemaNeurologico: texto(ef.sistemaNeurologico),
    dor: texto(ef.dor),
    diagnostico: consulta.diagnostico ?? '',
    suspeitaZoonose: zoonose.status === 'suspeito' ? zoonose.observacoes : '',
    conduta: consulta.conduta ?? '',
    dataAlta: texto(consulta.alta.dados),
    condicaoAlta: texto(consulta.alta.condicao),
    orientacoesAlta: texto(consulta.alta.orientacoes),
    prognosticoAlta: texto(consulta.alta.prognostico),
  }
}
