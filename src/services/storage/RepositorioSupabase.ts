import type { Repositorio } from './Repositorio'
import { supabase } from './supabaseClient'

export class RepositorioSupabase<T extends { id: number }> implements Repositorio<T> {
  private readonly tabela: string
  private readonly desserializar: (bruto: unknown) => T
  private readonly serializar: (item: T) => unknown

  constructor(tabela: string, serializar: (item: T) => unknown, desserializar: (bruto: unknown) => T) {
    this.tabela = tabela
    this.serializar = serializar
    this.desserializar = desserializar
  }

  async listarTodos(): Promise<T[]> {
    const { data: dados, error: erro } = await supabase.from(this.tabela).select('*')
    if (erro) throw new Error(erro.message)
    return (dados ?? []).map((linha) => this.desserializar(linha))
  }

  async getById(id: number): Promise<T | undefined> {
    const { data: dados, error: erro } = await supabase.from(this.tabela).select('*').eq('id', id).single()
    if (erro || !dados) return undefined
    return this.desserializar(dados)
  }

  async adicionar(item: T): Promise<void> {
    const { error: erro } = await supabase.from(this.tabela).insert(this.serializar(item) as Record<string, unknown>)
    if (erro) throw new Error(erro.message)
  }

  async atualizar(item: T): Promise<void> {
    const { error: erro } = await supabase
      .from(this.tabela)
      .update(this.serializar(item) as Record<string, unknown>)
      .eq('id', item.id)
    if (erro) throw new Error(erro.message)
  }

  async remover(id: number): Promise<void> {
    const { error: erro } = await supabase.from(this.tabela).delete().eq('id', id)
    if (erro) throw new Error(erro.message)
  }
}
