import type { Ref } from 'react'
import { ExamesProntuario } from './ExamesProntuario'
import { CamposFicha, SecaoFicha, TabelaFicha } from './SecaoFicha'
import type { CampoFicha } from './SecaoFicha'
import { formatarDataAtendimento } from './formatarDataAtendimento'
import type { RegistroClinico, RegistroExameFisico, Prontuario } from '../prontuarioTipos'
import type { Exame } from '../../../models/Exame'

type ItemExameFisico = [label: string, key: keyof RegistroExameFisico, unit?: string]

const COLUNAS_EXAME_FISICO: ItemExameFisico[][] = [
  [
    ['Temperatura', 'temperatura', '°C'],
    ['Frequência cardíaca', 'frequenciaCardiaca', 'bpm'],
    ['Frequência respiratória', 'frequenciaRespiratoria', 'mpm'],
    ['Mucosas', 'mucosas'],
    ['TPC', 'tpc', 'seg'],
    ['Hidratação', 'hidratacao'],
  ],
  [
    ['Pele e pelagem', 'pelePelagem'],
    ['Olhos', 'olhos'],
    ['Ouvidos', 'ouvidos'],
    ['Boca/dentes', 'bocaDentes'],
    ['Sistema respiratório', 'sistemaRespiratorio'],
    ['Sistema cardiovascular', 'sistemaCardiovascular'],
  ],
  [
    ['Sistema gastrointestinal', 'sistemaGastrointestinal'],
    ['Sistema urinário', 'sistemaUrinario'],
    ['Sistema reprodutivo', 'sistemaReprodutivo'],
    ['Sistema neurológico', 'sistemaNeurologico'],
    ['Dor', 'dor'],
    ['Nível de consciência', 'nivelConsciencia'],
  ],
]

type FichaProntuarioProps = {
  ref: Ref<HTMLFormElement>
  paciente: Prontuario
  atendimento: RegistroClinico
  podeEditarExames: boolean
  aoSalvarExame: (exame: Exame) => void
}

export function FichaProntuario({ ref, paciente, atendimento, podeEditarExames, aoSalvarExame }: FichaProntuarioProps) {
  const numeroCadastro = String(paciente.id).padStart(4, '0')
  const ultimoPeso = paciente.pesos.at(-1)?.peso
  const exameFisico = (itens: ItemExameFisico[]): CampoFicha[] =>
    itens.map(([rotulo, key, unidade]) => ({ rotulo, valor: atendimento.exameFisico?.[key] ?? '', unidade }))
  const linhasVacinas = paciente.vacinas.length
    ? paciente.vacinas.map((vacina, indice) => {
        const [nome, data = ''] = vacina.split(' - ')
        return { key: `${vacina}-${indice}`, valores: [nome, data, '', ''] }
      })
    : [{ key: 'vazio', valores: ['Nenhum registro', '', '', ''] }]
  const linhasEvolucao = [...paciente.atendimentos]
    .sort((a, b) => b.data.localeCompare(a.data))
    .map((item) => ({
      key: item.id,
      valores: [formatarDataAtendimento(item.data), item.descricao, 'Consulta', item.veterinario],
    }))

  return (
    <form className="animal-record-form" ref={ref}>
      <header className="animal-record-title">
        <div className="record-logo">✚</div>
        <div>
          <h3>Ficha de Prontuário Animal</h3>
          <p>Registro Clínico Veterinário · IFES Campus Santa Teresa</p>
        </div>
        <label>
          Nº do prontuário
          <input readOnly defaultValue={numeroCadastro} />
        </label>
      </header>

      <div className="animal-record-grid">
        <SecaoFicha numero="1" titulo="Identificação do animal" className="half">
          <CamposFicha
            campos={[
              { rotulo: 'Nome', valor: paciente.nomePet },
              { rotulo: 'Espécie', valor: 'Canino' },
              { rotulo: 'Raça', valor: paciente.raca },
              { rotulo: 'Sexo', valor: paciente.sexo },
              { rotulo: 'Idade', valor: paciente.idade },
              { rotulo: 'Peso', valor: ultimoPeso ? `${ultimoPeso} kg` : '' },
              { rotulo: 'Microchip' },
              { rotulo: 'Nº de cadastro', valor: numeroCadastro },
            ]}
          />
        </SecaoFicha>

        <SecaoFicha numero="2" titulo="Dados do tutor" className="half">
          <CamposFicha
            campos={[
              { rotulo: 'Nome', valor: paciente.nomeTutor },
              { rotulo: 'CPF', valor: paciente.cpfTutor },
              { rotulo: 'Telefone', valor: paciente.telefoneTutor },
              { rotulo: 'E-mail', valor: paciente.emailTutor },
              { rotulo: 'Endereço', valor: paciente.enderecoTutor, largo: true },
              { rotulo: 'Cidade/UF', valor: paciente.cidadeTutor, largo: true },
            ]}
          />
        </SecaoFicha>

        <SecaoFicha numero="3" titulo="Histórico clínico" className="half">
          <CamposFicha
            variante="single"
            campos={[
              { rotulo: 'Queixa principal', valor: atendimento.descricao },
              { rotulo: 'Histórico da doença', valor: atendimento.descricao, multilinha: true },
              { rotulo: 'Doenças anteriores', valor: paciente.doencasAnteriores.join(', ') },
              { rotulo: 'Alergias', valor: paciente.alergias.join(', ') || 'Nenhuma conhecida' },
              { rotulo: 'Observações', multilinha: true },
            ]}
          />
        </SecaoFicha>

        <SecaoFicha numero="4" titulo="Vacinação e prevenção" className="half">
          <TabelaFicha cabecalhos={['Vacina/procedimento', 'Data', 'Dose', 'Próxima dose']} linhas={linhasVacinas} />
          <CamposFicha
            variante="single compact"
            campos={[{ rotulo: 'Controle de pulgas' }, { rotulo: 'Controle de carrapatos' }, { rotulo: 'Observações' }]}
          />
        </SecaoFicha>

        <SecaoFicha numero="5" titulo="Exame físico" className="full">
          <div className="physical-exam-grid">
            {COLUNAS_EXAME_FISICO.map((coluna) => (
              <CamposFicha key={coluna[0][0]} variante="single" campos={exameFisico(coluna)} />
            ))}
          </div>
        </SecaoFicha>

        <SecaoFicha numero="6" titulo="Exames Complementares" className="full" editavel>
          <ExamesProntuario
            key={paciente.id}
            atendimentos={paciente.atendimentos}
            aoSalvo={aoSalvarExame}
            podeEditar={podeEditarExames}
          />
        </SecaoFicha>

        <SecaoFicha numero="7" titulo="Diagnóstico" className="third">
          <CamposFicha
            variante="single"
            campos={[
              { rotulo: 'Suspeita clínica', multilinha: true },
              { rotulo: 'Diagnóstico definitivo', valor: atendimento.diagnostico, multilinha: true },
              { rotulo: 'Diagnósticos diferenciais', multilinha: true },
            ]}
          />
        </SecaoFicha>

        <SecaoFicha numero="8" titulo="Tratamento" className="third">
          <TabelaFicha
            cabecalhos={['Medicamento', 'Dose', 'Frequência']}
            linhas={[{ key: 'receitas', valores: ['Consulte as receitas do animal no início do prontuário', '', ''] }]}
          />
          <CamposFicha
            variante="single compact"
            campos={[{ rotulo: 'Procedimentos', valor: atendimento.conduta }, { rotulo: 'Orientações ao tutor' }]}
          />
        </SecaoFicha>

        <SecaoFicha numero="9" titulo="Evolução clínica" className="two-thirds">
          <TabelaFicha
            cabecalhos={['Data', 'Evolução/observações', 'Procedimentos', 'Responsável']}
            linhas={linhasEvolucao}
          />
        </SecaoFicha>

        <SecaoFicha numero="10" titulo="Retorno" className="third">
          <CamposFicha
            variante="single"
            campos={[
              { rotulo: 'Data recomendada', tipo: 'date' },
              { rotulo: 'Motivo' },
              { rotulo: 'Exames para o retorno' },
              { rotulo: 'Observações', multilinha: true },
            ]}
          />
        </SecaoFicha>

        <SecaoFicha numero="11" titulo="Alta" className="half">
          <CamposFicha
            variante="single"
            campos={[
              { rotulo: 'Data', valor: atendimento.alta?.dados ?? '', tipo: 'date' },
              { rotulo: 'Condição na alta', valor: atendimento.alta?.condicao ?? '' },
              { rotulo: 'Orientações', valor: atendimento.alta?.orientacoes ?? '', multilinha: true },
              { rotulo: 'Prognóstico', valor: atendimento.alta?.prognostico ?? '' },
            ]}
          />
        </SecaoFicha>

        <SecaoFicha numero="12" titulo="Responsável pelo atendimento" className="half">
          <CamposFicha
            variante="single"
            campos={[
              { rotulo: 'Médico(a)-veterinário(a)', valor: atendimento.veterinario },
              { rotulo: 'CRMV', valor: atendimento.crmv },
              { rotulo: 'Alunos participantes', valor: atendimento.estudantes.join(', ') },
              { rotulo: 'Assinatura/validação', valor: atendimento.validadoPor },
              { rotulo: 'Data', valor: atendimento.data ? formatarDataAtendimento(atendimento.data) : '' },
            ]}
          />
        </SecaoFicha>
      </div>

      <footer className="animal-record-footer">DiagnoVetis · Cuidar também é registrar</footer>
    </form>
  )
}
