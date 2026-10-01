import { useEffect, useState } from 'react'
import { ReceitaService, type ReceitaEmitida } from '../../services/ReceitaService'
import { gerarReceita } from './receita'

export function ReceitasDoPet({ petId }: { petId: number }) {
  const [itens, setItens] = useState<ReceitaEmitida[]>([])
  const [mensagem, setMensagem] = useState('Carregando receitas…')
  useEffect(() => {
    let ativo = true
    new ReceitaService()
      .listar(petId)
      .then((linhas) => {
        if (ativo) {
          setItens(linhas.filter((linha) => !linha.id.startsWith('consulta-')))
          setMensagem('')
        }
      })
      .catch((erro) => {
        if (ativo) setMensagem(erro.message)
      })
    return () => {
      ativo = false
    }
  }, [petId])
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
