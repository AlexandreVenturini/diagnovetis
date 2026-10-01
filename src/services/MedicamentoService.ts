import { Medicamento } from '../models/Medicamento'
import { supabase } from './storage/supabaseClient'
import { validarObrigatorio, validarPositivo, validarIdUnico } from './validation/validadores'

interface MedicamentoRow {
  id: number
  nome_comercial: string
  principio_ativo: string
  descricao: string
  concentracao: number
  unidade_concentracao: string
  forma_farmaceutica: string
  via_administracao: string
  tipo_uso: string
}

function linhaParaMedicamento(r: MedicamentoRow): Medicamento {
  return new Medicamento(
    r.id,
    r.nome_comercial,
    r.principio_ativo,
    r.descricao,
    r.concentracao,
    r.unidade_concentracao,
    r.forma_farmaceutica,
    r.via_administracao,
    r.tipo_uso,
  )
}

export class MedicamentoService {
  async listarMedicamentos(): Promise<Medicamento[]> {
    const { data: dados, error: erro } = await supabase.from('medicamentos').select('*')
    if (erro) throw new Error(erro.message)
    return (dados ?? []).map((r) => linhaParaMedicamento(r as MedicamentoRow))
  }

  async adicionarMedicamento(medicamento: Medicamento): Promise<void> {
    const todos = await this.listarMedicamentos()
    validarIdUnico(medicamento.id, todos, 'medicamento')
    validarObrigatorio(medicamento.nome, 'nomeComercial')
    validarObrigatorio(medicamento.principioAtivo, 'principioAtivo')
    validarObrigatorio(medicamento.formaFarmaceutica, 'formaFarmaceutica')
    validarObrigatorio(medicamento.viaAdministracao, 'viaAdministracao')
    validarPositivo(medicamento.concentracao, 'concentracao')
    const { error: erro } = await supabase.from('medicamentos').insert({
      id: medicamento.id,
      nome_comercial: medicamento.nome,
      principio_ativo: medicamento.principioAtivo,
      descricao: medicamento.descricao,
      concentracao: medicamento.concentracao,
      unidade_concentracao: medicamento.unidadeConcentracao,
      forma_farmaceutica: medicamento.formaFarmaceutica,
      via_administracao: medicamento.viaAdministracao,
      tipo_uso: medicamento.tipo,
    })
    if (erro) throw new Error(erro.message)
  }

  async buscarPorId(id: number): Promise<Medicamento | undefined> {
    const { data: dados, error: erro } = await supabase.from('medicamentos').select('*').eq('id', id).single()
    if (erro || !dados) return undefined
    return linhaParaMedicamento(dados as MedicamentoRow)
  }

  async buscarPorNome(nome: string): Promise<Medicamento[]> {
    const todos = await this.listarMedicamentos()
    return todos.filter((m) => m.nome.toLowerCase().includes(nome.toLowerCase()))
  }
}
