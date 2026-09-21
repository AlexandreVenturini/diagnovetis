import { Exame } from '../models/Exame'
import { supabase } from './storage/supabaseClient'
import { exameFromRow, type ExameRow } from './storage/exameMapping'
import { draftToExam, type ExamDraft } from '../features/consultations/examTypes'

export class ExameService {
    criarSolicitacoes(drafts: ExamDraft[]): Exame[] { return drafts.map(draftToExam) }

    async listarPorConsulta(consultaId: number): Promise<Exame[]> {
        const { data, error } = await supabase.from('exames').select('*').eq('consulta_id', consultaId)
        if (error) throw new Error(error.message)
        return (data ?? []).map(row => exameFromRow(row as ExameRow))
    }
    async listarTodos(): Promise<Exame[]> {
        const { data, error } = await supabase.from('exames').select('*')
        if (error) throw new Error(error.message)
        return (data ?? []).map(row => exameFromRow(row as ExameRow))
    }
    async buscarPorId(id: number): Promise<Exame | undefined> {
        const { data, error } = await supabase.from('exames').select('*').eq('id', id).maybeSingle()
        if (error) throw new Error(error.message)
        return data ? exameFromRow(data as ExameRow) : undefined
    }
    async listarPorPet(petId: number): Promise<Exame[]> {
        const { data, error } = await supabase.from('consultas').select('id').eq('pet_id', petId)
        if (error) throw new Error(error.message)
        return (await Promise.all((data ?? []).map(row => this.listarPorConsulta(row.id)))).flat()
    }
    async atualizarResultado(exam: Exame, draft: ExamDraft): Promise<Exame> {
        // Nome, categoria, solicitação e consulta de origem não são alterados nesta operação.
        const updated = draftToExam({ ...draft, nome: exam.nomeExame, categoria: exam.categoria,
            dataSolicitacao: `${exam.dataSolicitacao.getFullYear()}-${String(exam.dataSolicitacao.getMonth() + 1).padStart(2, '0')}-${String(exam.dataSolicitacao.getDate()).padStart(2, '0')}` })
        const { data, error } = await supabase.from('exames').update({
            data_realizacao: draft.dataRealizacao || null, status: updated.status,
            laudo: updated.laudo, laudo_anexo: updated.laudoAnexo, resultado: updated.resultado, interpretacao_clinica: updated.interpretacao,
        }).eq('id', exam.id).eq('consulta_id', exam.consultaId).select('*').single()
        if (error || !data) throw new Error('Não foi possível salvar o resultado. Confira a conexão e a atualização do banco. Os campos foram mantidos.')
        return exameFromRow(data as ExameRow)
    }
}
