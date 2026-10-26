import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { ReceitaService, type ReceitaEmitida } from '../../services/ReceitaService'
import { CHAVES } from '../shared/consultas'
import { gerarReceita } from './receita'

const receitaService = new ReceitaService()

export function ReceitasDoPet({ petId }: { petId: number }) {
  const consulta = useQuery({
    queryKey: [...CHAVES.receitasDoPet, petId],
    queryFn: async () =>
      (await receitaService.listar(petId)).filter((linha: ReceitaEmitida) => !linha.id.startsWith('consulta-')),
  })
  const itens = consulta.data ?? []
  const [aviso, setMensagem] = useState('')
  const mensagem = consulta.isPending ? 'Carregando receitas…' : consulta.error?.message || aviso
  return (
    <section className="content-card saved-prescriptions">
      <h3>Receituário do animal</h3>
      {mensagem && <p role="status">{mensagem}</p>}
      {!mensagem && !itens.length && <p>Nenhuma receita emitida pela nova aba.</p>}
      {itens.map(({ id, snapshot }) => (
        <article key={id}>
          <div>
            <strong>{new Date(snapshot.emitidaEm).toLocaleString('pt-BR')}</strong>
            <p>
              {snapshot.paciente.veterinario} · CRMV {snapshot.receita.crmv}
            </p>
            <p>{snapshot.receita.itens.map((item) => `${item.medicamento} — ${item.dose}`).join('; ')}</p>
          </div>
          <button
            className="outline-button"
            onClick={() => {
              try {
                setMensagem(
                  gerarReceita(snapshot.paciente, snapshot.receita, new Date(snapshot.emitidaEm))
                    ? 'Receita aberta para impressão / PDF.'
                    : 'Permita novas janelas no navegador para imprimir.',
                )
              } catch {
                setMensagem('Não foi possível abrir esta receita.')
              }
            }}
          >
            Ver receita / PDF
          </button>
        </article>
      ))}
    </section>
  )
}
