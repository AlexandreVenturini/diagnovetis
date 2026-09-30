import type { ObitoDados, VeterinarianOption } from '../../supervision/supervisionTypes'
import type { ClinicalRecord } from '../recordTypes'
import { DESTINOS_CORPO, toLocalInput } from './deathRules'

type Update = <K extends keyof ObitoDados>(key: K, value: ObitoDados[K]) => void

type DeathFieldsProps = {
  dados: ObitoDados
  update: Update
  veterinarians: VeterinarianOption[]
  records: ClinicalRecord[]
}

function YesNo({ label, value, onChange }: { label: string; value: boolean; onChange: (value: boolean) => void }) {
  return (
    <fieldset className="yes-no">
      <legend>{label}</legend>
      <div className="yes-no-options">
        {[true, false].map((option) => (
          <label key={String(option)}>
            <input type="radio" checked={value === option} onChange={() => onChange(option)} />
            {option ? 'Sim' : 'Não'}
          </label>
        ))}
      </div>
    </fieldset>
  )
}

const PERGUNTAS: { label: string; campo: 'houve_reanimacao' | 'eutanasia' | 'necropsia' | 'comunicado_responsavel' }[] =
  [
    { label: 'Houve reanimação?', campo: 'houve_reanimacao' },
    { label: 'Foi eutanásia?', campo: 'eutanasia' },
    { label: 'Necropsia realizada?', campo: 'necropsia' },
    { label: 'Responsável pelo animal foi comunicado?', campo: 'comunicado_responsavel' },
  ]

export function DeathFields({ dados, update, veterinarians, records }: DeathFieldsProps) {
  return (
    <>
      <div className="consultation-form-grid">
        <label>
          Data e hora do óbito *
          <input
            type="datetime-local"
            value={toLocalInput(dados.data_hora)}
            max={toLocalInput(new Date().toISOString())}
            onChange={(event) => {
              if (event.target.value) update('data_hora', new Date(event.target.value).toISOString())
            }}
          />
        </label>
        <label>
          Profissional responsável *
          <select
            value={dados.medico_responsavel_id || ''}
            onChange={(event) => update('medico_responsavel_id', Number(event.target.value))}
          >
            <option value="">{veterinarians.length ? 'Selecione o veterinário' : 'Carregando veterinários...'}</option>
            {veterinarians.map((vet) => (
              <option key={vet.medicoId} value={vet.medicoId}>
                {vet.nome} — CRMV {vet.crmv}
              </option>
            ))}
          </select>
        </label>
        <label>
          Atendimento relacionado
          <select
            value={dados.consulta_id ?? ''}
            onChange={(event) => update('consulta_id', event.target.value ? Number(event.target.value) : null)}
          >
            <option value="">Nenhum</option>
            {records.map((record) => (
              <option key={record.id} value={record.id}>
                Nº {record.id} · {new Date(`${record.date}T12:00:00`).toLocaleDateString('pt-BR')} ·{' '}
                {record.veterinarian}
              </option>
            ))}
          </select>
        </label>
        <label>
          Destinação do corpo *
          <input
            list="destinos-corpo"
            value={dados.destino_corpo}
            onChange={(event) => update('destino_corpo', event.target.value)}
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
            onChange={(event) => update('circunstancias', event.target.value)}
            placeholder="Descreva como e onde ocorreu o óbito"
          />
        </label>
        <label>
          Causa provável
          <textarea
            value={dados.causa_provavel}
            onChange={(event) => update('causa_provavel', event.target.value)}
            placeholder="Quando for possível estimar"
          />
        </label>
      </div>

      <div className="consultation-form-grid">
        {PERGUNTAS.map(({ label, campo }) => (
          <YesNo key={campo} label={label} value={dados[campo]} onChange={(value) => update(campo, value)} />
        ))}
      </div>

      {dados.comunicado_responsavel && (
        <div className="consultation-textareas">
          <label>
            Como e quando foi comunicado
            <textarea
              value={dados.comunicacao_detalhes}
              onChange={(event) => update('comunicacao_detalhes', event.target.value)}
              placeholder="Ex.: por telefone às 10h30, pela Dra. Ana"
            />
          </label>
        </div>
      )}
    </>
  )
}
