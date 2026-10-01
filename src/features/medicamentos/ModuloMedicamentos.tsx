import { useEffect, useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import { MedicamentoService } from '../../services/MedicamentoService'
import { FORMULARIO_MEDICAMENTO_VAZIO, montarMedicamento, medicamentoParaResumo } from './medicamentoRegras'
import { DetalhesMedicamento } from './DetalhesMedicamento'
import { FormularioMedicamento } from './FormularioMedicamento'
import { IconeComprimido, IconeBusca } from './IconesMedicamento'
import type { MedicamentoResumo, DadosFormularioMedicamento } from './medicamentoTipos'

const medicamentoService = new MedicamentoService()

function CartaoMedicamento({
  item,
  selecionado,
  aoSelecionar,
}: {
  item: MedicamentoResumo
  selecionado: boolean
  aoSelecionar: () => void
}) {
  return (
    <button className={`medication-card${selecionado ? ' selected' : ''}`} onClick={aoSelecionar}>
      <span className="medication-card-icon">
        <IconeComprimido />
      </span>
      <span>
        <strong>{item.nomeComercial}</strong>
        <small>{item.principioAtivo}</small>
        {item.indicacoes.length > 0 && (
          <span className="medication-indications">
            <b>Indicações:</b> {item.indicacoes.join(', ')}
          </span>
        )}
        <span className="medication-tags">
          <em>{item.dosagem}</em>
          <em>{item.frequencia}</em>
        </span>
      </span>
    </button>
  )
}

export function ModuloMedicamentos() {
  const [itens, setItens] = useState<MedicamentoResumo[]>([])
  const [tela, setTela] = useState<'consulta' | 'cadastro'>('consulta')
  const [idSelecionado, setIdSelecionado] = useState<number | null>(null)
  const [busca, setBusca] = useState('')
  const [formulario, setFormulario] = useState(FORMULARIO_MEDICAMENTO_VAZIO)
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState('')
  const [salvando, setSalvando] = useState(false)
  const filtrados = useMemo(() => {
    const normalizado = busca.trim().toLocaleLowerCase('pt-BR')
    return itens.filter((item) =>
      `${item.nomeComercial} ${item.principioAtivo} ${item.indicacoes.join(' ')}`
        .toLocaleLowerCase('pt-BR')
        .includes(normalizado),
    )
  }, [itens, busca])
  const selecionado = itens.find((item) => item.id === idSelecionado) ?? null

  useEffect(() => {
    let ativo = true
    medicamentoService
      .listarMedicamentos()
      .then((medicamentos) => {
        if (ativo) setItens(medicamentos.map(medicamentoParaResumo))
      })
      .catch((causa) => {
        if (ativo) setErro(causa instanceof Error ? causa.message : 'Não foi possível carregar os medicamentos.')
      })
      .finally(() => {
        if (ativo) setCarregando(false)
      })
    return () => {
      ativo = false
    }
  }, [])

  function atualizar<K extends keyof DadosFormularioMedicamento>(key: K, valor: DadosFormularioMedicamento[K]) {
    setFormulario((atual) => ({ ...atual, [key]: valor }))
  }

  async function salvar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault()
    setErro('')
    const id = Math.max(0, ...itens.map((item) => item.id)) + 1
    const montado = montarMedicamento(formulario, id)
    if ('erro' in montado) {
      setErro(montado.erro)
      return
    }
    setSalvando(true)
    try {
      await medicamentoService.adicionarMedicamento(montado.medicamento)
      setItens((atual) => [...atual, montado.resumo])
      setIdSelecionado(id)
      setTela('consulta')
      setFormulario(FORMULARIO_MEDICAMENTO_VAZIO)
    } catch (causa) {
      setErro(causa instanceof Error ? causa.message : 'Não foi possível cadastrar o medicamento.')
    } finally {
      setSalvando(false)
    }
  }

  return (
    <section className="medications-module">
      <header className="medications-header content-card">
        <div>
          <h2>
            <IconeComprimido />
            Guia Terapêutico e Calculadora
          </h2>
          <p>Consulte medicamentos por princípio ativo ou indicação clínica e calcule doses precisas para cães.</p>
        </div>
        <div className="medication-header-actions">
          <button
            className={tela === 'consulta' ? 'primary-button' : 'outline-button'}
            onClick={() => setTela('consulta')}
          >
            <IconeBusca />
            Consultar
          </button>
          <button
            className={tela === 'cadastro' ? 'primary-button' : 'outline-button'}
            onClick={() => setTela('cadastro')}
          >
            <span>＋</span>Cadastrar Medicamento
          </button>
        </div>
        {tela === 'consulta' && (
          <label className="medication-search">
            <IconeBusca />
            <input
              value={busca}
              onChange={(evento) => setBusca(evento.target.value)}
              placeholder="Buscar por princípio ativo ou indicação..."
            />
          </label>
        )}
        {erro && (
          <p className="form-message error" role="alert">
            {erro}
          </p>
        )}
      </header>

      {tela === 'cadastro' ? (
        <FormularioMedicamento
          formulario={formulario}
          aoAlterar={atualizar}
          salvando={salvando}
          aoEnviar={salvar}
          aoCancelar={() => setTela('consulta')}
        />
      ) : (
        <div className="medication-browser">
          <div className="medication-list">
            {filtrados.map((item) => (
              <CartaoMedicamento
                key={item.id}
                item={item}
                selecionado={idSelecionado === item.id}
                aoSelecionar={() => setIdSelecionado(item.id)}
              />
            ))}
            {!carregando && filtrados.length === 0 && (
              <div className="medication-empty-list">Nenhum medicamento encontrado.</div>
            )}
            {carregando && <div className="medication-empty-list">Carregando medicamentos...</div>}
          </div>
          <DetalhesMedicamento medicamento={selecionado} />
        </div>
      )}
    </section>
  )
}
