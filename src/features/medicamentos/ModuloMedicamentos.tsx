import { useMemo, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import type { FormEvent } from 'react'
import { Abas } from '../../components/common/Abas'
import { CabecalhoLista } from '../../components/common/CabecalhoLista'
import { CabecalhoTela } from '../../components/common/CabecalhoTela'
import { CampoBusca } from '../../components/common/CampoBusca'
import { MedicamentoService } from '../../services/MedicamentoService'
import { CHAVES } from '../shared/consultas'
import { FORMULARIO_MEDICAMENTO_VAZIO, montarMedicamento, medicamentoParaResumo } from './medicamentoRegras'
import { DetalhesMedicamento } from './DetalhesMedicamento'
import { FormularioMedicamento } from './FormularioMedicamento'
import { IconeComprimido } from './IconesMedicamento'
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
  const cliente = useQueryClient()
  const consulta = useQuery({
    queryKey: CHAVES.medicamentos,
    queryFn: () => medicamentoService.listarMedicamentos(),
  })
  const itens = useMemo(() => (consulta.data ?? []).map(medicamentoParaResumo), [consulta.data])
  const carregando = consulta.isPending
  const [tela, setTela] = useState<'consulta' | 'cadastro'>('consulta')
  const [idSelecionado, setIdSelecionado] = useState<number | null>(null)
  const [busca, setBusca] = useState('')
  const [formulario, setFormulario] = useState(FORMULARIO_MEDICAMENTO_VAZIO)
  const [erroFormulario, setErro] = useState('')
  const erro = erroFormulario || (consulta.isError ? consulta.error.message : '')
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
      await cliente.invalidateQueries({ queryKey: CHAVES.medicamentos })
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
      <CabecalhoTela
        titulo="Guia Terapêutico e Calculadora"
        descricao="Consulte medicamentos por princípio ativo ou indicação clínica e calcule doses precisas para cães."
      />
      <Abas
        rotulo="Medicamentos"
        abas={[
          { id: 'consulta', rotulo: 'Consultar' },
          { id: 'cadastro', rotulo: 'Cadastrar Medicamento' },
        ]}
        ativa={tela}
        aoSelecionar={setTela}
      />
      {erro && (
        <p className="page-error" role="alert">
          {erro}
        </p>
      )}

      {tela === 'cadastro' ? (
        <FormularioMedicamento
          formulario={formulario}
          aoAlterar={atualizar}
          salvando={salvando}
          aoEnviar={salvar}
          aoCancelar={() => setTela('consulta')}
        />
      ) : (
        <>
          <div className="filter-bar content-card">
            <div className="filter-fields">
              <CampoBusca valor={busca} aoAlterar={setBusca} placeholder="Nome, princípio ativo ou indicação" />
            </div>
          </div>
          <CabecalhoLista titulo="Medicamentos" contagem={`${filtrados.length} encontrado(s)`} />
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
        </>
      )}
    </section>
  )
}
