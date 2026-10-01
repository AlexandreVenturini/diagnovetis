import type { DadosAtendimento } from '../../atendimentos/atendimentoTipos'
import { htmlReceita, type Receita } from '../receita'

type RevisaoReceitaProps = {
  paciente: DadosAtendimento
  receita: Receita
  ehEstudante: boolean
  salvando: boolean
  emissaoPendente: boolean
  aoEditar: () => void
  aoConfirmar: () => void
}

function rotuloConfirmar(salvando: boolean, ehEstudante: boolean, emissaoPendente: boolean) {
  if (salvando) return 'Emitindo…'
  if (ehEstudante) return 'Enviar para aprovação'
  return emissaoPendente ? 'Tentar emissão novamente' : 'Emitir e salvar no prontuário'
}

export function RevisaoReceita({
  paciente,
  receita,
  ehEstudante,
  salvando,
  emissaoPendente,
  aoEditar,
  aoConfirmar,
}: RevisaoReceitaProps) {
  return (
    <section className="content-card rx-details">
      <h3>{ehEstudante ? 'Revise a receita antes de enviar' : 'Revise a receita antes de emitir'}</h3>
      <iframe
        title="Visualização da nova receita"
        className="rx-preview"
        sandbox=""
        srcDoc={htmlReceita(paciente, receita)}
      />
      <p>
        {ehEstudante
          ? 'A receita só é emitida depois da aprovação de um médico-veterinário, que assina com o próprio nome e CRMV.'
          : 'Confira os dados e as doses. A emissão salva uma cópia no prontuário.'}
      </p>
      <div className="form-actions">
        <button className="secondary-button" disabled={salvando || emissaoPendente} onClick={aoEditar}>
          Voltar e editar
        </button>
        <button className="primary-button" disabled={salvando} onClick={aoConfirmar}>
          {rotuloConfirmar(salvando, ehEstudante, emissaoPendente)}
        </button>
      </div>
      {emissaoPendente && !salvando && (
        <p>A emissão ainda não foi confirmada. Tente novamente para verificar e concluir a mesma receita.</p>
      )}
    </section>
  )
}
