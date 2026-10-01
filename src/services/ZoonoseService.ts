import { Zoonose } from '../models/Zoonose'
import { dadosClinicosDeJson, dadosClinicosParaJson, type Json } from './storage/conversaoJson'
import { RepositorioSupabase } from './storage/RepositorioSupabase'
import { validarObrigatorio, validarGrauRisco, validarIdUnico } from './validation/validadores'

interface ZoonoseRow {
  clinical_data?: Json | null
  id: number
  nome: string
  agente_etiologico: string
  sintomas: string
  medidas_preventivas: string
  grau_risco: string
}

export const repositorioZoonose = new RepositorioSupabase<Zoonose>(
  'zoonoses',
  (zoonose) => ({
    id: zoonose.id,
    nome: zoonose.nome,
    agente_etiologico: zoonose.agenteEtiologico,
    sintomas: zoonose.sintomas,
    medidas_preventivas: zoonose.medidasPreventivas,
    grau_risco: zoonose.grauRisco,
    ...(zoonose.dadosClinicos ? { clinical_data: dadosClinicosParaJson(zoonose.dadosClinicos) } : {}),
  }),
  (bruto) => {
    const r = bruto as ZoonoseRow
    const item = new Zoonose(r.id, r.nome, r.agente_etiologico, r.sintomas, r.medidas_preventivas, r.grau_risco)
    item.dadosClinicos = dadosClinicosDeJson(r.clinical_data)
    return item
  },
)

export class ZoonoseService {
  async listarZoonoses(): Promise<Zoonose[]> {
    return repositorioZoonose.listarTodos()
  }

  async adicionarZoonose(zoonose: Zoonose): Promise<void> {
    validarIdUnico(zoonose.id, await repositorioZoonose.listarTodos(), 'zoonose')
    validarObrigatorio(zoonose.nome, 'nome')
    validarObrigatorio(zoonose.agenteEtiologico, 'agenteEtiologico')
    validarObrigatorio(zoonose.sintomas, 'sintomas')
    validarObrigatorio(zoonose.medidasPreventivas, 'medidasPreventivas')
    validarGrauRisco(zoonose.grauRisco, 'grauRisco')
    await repositorioZoonose.adicionar(zoonose)
  }

  async buscarPorId(id: number): Promise<Zoonose | undefined> {
    return repositorioZoonose.getById(id)
  }

  async buscarPorNome(nome: string): Promise<Zoonose[]> {
    const todos = await repositorioZoonose.listarTodos()
    return todos.filter((z) => z.nome.toLowerCase().includes(nome.toLowerCase()))
  }
}
