import { useRef, useState } from 'react'
import { VersoesAtendimento } from './VersoesAtendimento'
import { SeletorAtendimento } from './SeletorAtendimento'
import { FichaProntuario } from './FichaProntuario'
import { SecaoObito } from '../obito/SecaoObito'
import { ReceitasDoPet } from '../../receitas/ReceitasDoPet'
import { exportarProntuario } from '../relatorioProntuario'
import type { RegistroClinico, Prontuario } from '../prontuarioTipos'
import type { Exame } from '../../../models/Exame'

const REGISTRO_VAZIO: RegistroClinico = {
  id: 0,
  data: '',
  veterinario: '',
  crmv: '',
  estudantes: [],
  descricao: '',
  diagnostico: '',
  conduta: '',
  validadoPor: '',
}

type DetalhesProntuarioProps = {
  selecionado: Prontuario
  aoVoltar: () => void
  aoSalvarExame: (exame: Exame) => void
  aoRetificar: (atendimentoId: number) => void
  aoRegistrarObito: () => void
  aoRetificarObito: () => void
  podeEditarExames: boolean
  podeRetificarObito: boolean
  atendimentoInicialId?: number
  avisoInicial?: string
}

export function DetalhesProntuario({
  selecionado,
  aoVoltar,
  aoSalvarExame,
  aoRetificar,
  aoRegistrarObito,
  aoRetificarObito,
  podeEditarExames,
  podeRetificarObito,
  atendimentoInicialId,
  avisoInicial = '',
}: DetalhesProntuarioProps) {
  const formularioRef = useRef<HTMLFormElement>(null)
  const [aviso, setAviso] = useState(avisoInicial)
  const [mostrarVersoes, setMostrarVersoes] = useState(false)
  const atendimentosOrdenados = [...selecionado.atendimentos].sort(
    (a, b) => b.data.localeCompare(a.data) || b.id - a.id,
  )
  const [atendimentoId, setAtendimentoId] = useState<number | undefined>(
    atendimentoInicialId ?? atendimentosOrdenados[0]?.id,
  )
  const atendimentoAtual =
    atendimentosOrdenados.find((atendimento) => atendimento.id === atendimentoId) ?? atendimentosOrdenados[0]

  function exportarPdf() {
    const abriu = formularioRef.current ? exportarProntuario(formularioRef.current, selecionado.nomePet) : false
    setAviso(
      abriu ? 'Relatório aberto para impressão ou salvamento em PDF.' : 'O navegador bloqueou a janela do relatório.',
    )
  }

  return (
    <section className="record-details-module">
      <div className="records-heading record-detail-heading">
        <div>
          <button className="text-back-button" onClick={aoVoltar}>
            ‹ Prontuários
          </button>
          <h2>
            {selecionado.nomePet}
            {selecionado.obito && (
              <span className="pill pill--dark record-death-pill">
                Óbito em {new Date(selecionado.obito.dataHora).toLocaleDateString('pt-BR')}
              </span>
            )}
          </h2>
          <p>
            Responsável: {selecionado.nomeTutor} · {selecionado.raca} · {selecionado.idade}
          </p>
        </div>
        <div className="record-header-actions">
          <button className="outline-button" onClick={exportarPdf}>
            ⇩ Exportar PDF
          </button>
          {!selecionado.obito && (
            <button className="secondary-button" onClick={aoRegistrarObito}>
              Registrar óbito
            </button>
          )}
        </div>
      </div>

      {aviso && (
        <p className="record-notice" role="status">
          {aviso}
        </p>
      )}

      <SeletorAtendimento
        atendimentos={atendimentosOrdenados}
        atual={atendimentoAtual}
        aoSelecionar={(id) => {
          setAtendimentoId(id)
          setMostrarVersoes(false)
        }}
        mostrarVersoes={mostrarVersoes}
        aoAlternarVersoes={() => setMostrarVersoes((valor) => !valor)}
        aoRetificar={aoRetificar}
      />

      {mostrarVersoes && atendimentoAtual && (
        <VersoesAtendimento consultaId={atendimentoAtual.id} aoFechar={() => setMostrarVersoes(false)} />
      )}

      {selecionado.obito && (
        <SecaoObito obito={selecionado.obito} podeRetificar={podeRetificarObito} aoRetificar={aoRetificarObito} />
      )}

      <ReceitasDoPet petId={selecionado.id} />

      <FichaProntuario
        ref={formularioRef}
        paciente={selecionado}
        atendimento={atendimentoAtual ?? REGISTRO_VAZIO}
        podeEditarExames={podeEditarExames}
        aoSalvarExame={aoSalvarExame}
      />
    </section>
  )
}
