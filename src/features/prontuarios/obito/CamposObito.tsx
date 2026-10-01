import type { ObitoDados, OpcaoVeterinario } from '../../supervisao/supervisaoTipos'
import type { RegistroClinico } from '../prontuarioTipos'
import { DESTINOS_CORPO, paraCampoLocal } from './obitoRegras'

type Atualizacao = <K extends keyof ObitoDados>(key: K, valor: ObitoDados[K]) => void

type CamposObitoProps = {
  dados: ObitoDados
  atualizar: Atualizacao
  veterinarios: OpcaoVeterinario[]
  atendimentos: RegistroClinico[]
}

function SimNao({ rotulo, valor, aoAlterar }: { rotulo: string; valor: boolean; aoAlterar: (valor: boolean) => void }) {
  return (
    <fieldset className="yes-no">
      <legend>{rotulo}</legend>
      <div className="yes-no-options">
        {[true, false].map((opcao) => (
          <label key={String(opcao)}>
            <input type="radio" checked={valor === opcao} onChange={() => aoAlterar(opcao)} />
            {opcao ? 'Sim' : 'Não'}
          </label>
        ))}
      </div>
    </fieldset>
  )
}

const PERGUNTAS: {
  rotulo: string
  campo: 'houve_reanimacao' | 'eutanasia' | 'necropsia' | 'comunicado_responsavel'
}[] = [
  { rotulo: 'Houve reanimação?', campo: 'houve_reanimacao' },
  { rotulo: 'Foi eutanásia?', campo: 'eutanasia' },
  { rotulo: 'Necropsia realizada?', campo: 'necropsia' },
  { rotulo: 'Responsável pelo animal foi comunicado?', campo: 'comunicado_responsavel' },
]

export function CamposObito({ dados, atualizar, veterinarios, atendimentos }: CamposObitoProps) {
  return (
    <>
      <div className="consultation-form-grid">
        <label>
          Data e hora do óbito *
          <input
            type="datetime-local"
            value={paraCampoLocal(dados.data_hora)}
            max={paraCampoLocal(new Date().toISOString())}
            onChange={(evento) => {
              if (evento.target.value) atualizar('data_hora', new Date(evento.target.value).toISOString())
            }}
          />
        </label>
        <label>
          Profissional responsável *
          <select
            value={dados.medico_responsavel_id || ''}
            onChange={(evento) => atualizar('medico_responsavel_id', Number(evento.target.value))}
          >
            <option value="">{veterinarios.length ? 'Selecione o veterinário' : 'Carregando veterinários...'}</option>
            {veterinarios.map((veterinario) => (
              <option key={veterinario.medicoId} value={veterinario.medicoId}>
                {veterinario.nome} — CRMV {veterinario.crmv}
              </option>
            ))}
          </select>
        </label>
        <label>
          Atendimento relacionado
          <select
            value={dados.consulta_id ?? ''}
            onChange={(evento) => atualizar('consulta_id', evento.target.value ? Number(evento.target.value) : null)}
          >
            <option value="">Nenhum</option>
            {atendimentos.map((atendimento) => (
              <option key={atendimento.id} value={atendimento.id}>
                Nº {atendimento.id} · {new Date(`${atendimento.data}T12:00:00`).toLocaleDateString('pt-BR')} ·{' '}
                {atendimento.veterinario}
              </option>
            ))}
          </select>
        </label>
        <label>
          Destinação do corpo *
          <input
            list="destinos-corpo"
            value={dados.destino_corpo}
            onChange={(evento) => atualizar('destino_corpo', evento.target.value)}
            placeholder="Ex.: Cremação"
          />
          <datalist id="destinos-corpo">
            {DESTINOS_CORPO.map((destino) => (
              <option key={destino} value={destino} />
            ))}
          </datalist>
        </label>
      </div>

      <div className="consultation-textareas">
        <label>
          Circunstâncias do óbito *
          <textarea
            value={dados.circunstancias}
            onChange={(evento) => atualizar('circunstancias', evento.target.value)}
            placeholder="Descreva como e onde ocorreu o óbito"
          />
        </label>
        <label>
          Causa provável
          <textarea
            value={dados.causa_provavel}
            onChange={(evento) => atualizar('causa_provavel', evento.target.value)}
            placeholder="Quando for possível estimar"
          />
        </label>
      </div>

      <div className="consultation-form-grid">
        {PERGUNTAS.map(({ rotulo, campo }) => (
          <SimNao key={campo} rotulo={rotulo} valor={dados[campo]} aoAlterar={(valor) => atualizar(campo, valor)} />
        ))}
      </div>

      {dados.comunicado_responsavel && (
        <div className="consultation-textareas">
          <label>
            Como e quando foi comunicado
            <textarea
              value={dados.comunicacao_detalhes}
              onChange={(evento) => atualizar('comunicacao_detalhes', evento.target.value)}
              placeholder="Ex.: por telefone às 10h30, pela Dra. Ana"
            />
          </label>
        </div>
      )}
    </>
  )
}
