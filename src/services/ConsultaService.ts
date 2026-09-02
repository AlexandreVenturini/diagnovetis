import { Aluno } from "../models/Aluno";
import { Consulta } from "../models/Consulta";
import { DiagnosticoZoonose } from "../models/DiagnosticoZoonose";
import { Exame } from "../models/Exame";
import { Medico } from "../models/Medico";
import { Medicamento } from "../models/Medicamento";
import { MedicamentoReceitado } from "../models/MedicamentoReceitado";
import { Receita } from "../models/Receita";
import { supabase } from "./storage/supabaseClient";
import { PetService } from "./PetService";
import { validarObrigatorio, validarDataFutura, validarIdUnico } from "./validation/validadores";

const petService = new PetService();

interface MedicoRow { id: number; nome: string; telefone: string; email: string; especialidade: string; crmv: string; }
interface MedRowInAluno { id: number; nome: string; telefone: string; email: string; especialidade: string; crmv: string; }
interface AlunoRowJoined { id: number; nome: string; telefone: string; email: string; matricula: string; periodo: number; curso: string; medico_orientador_id: number; medicos: MedRowInAluno; }
interface MedicamentoRow { id: number; nome_comercial: string; principio_ativo: string; descricao: string; concentracao: number; unidade_concentracao: string; forma_farmaceutica: string; via_administracao: string; tipo_uso: string; }
interface MedicamentoReceitadoRow { quantidade: number; dose: string; vezes_ao_dia: number; duracao_dias: number; observacao: string; medicamentos: MedicamentoRow; }
interface ReceitaRow { id: number; medicamentos_receitados: MedicamentoReceitadoRow[]; }
interface ExameRow { id: number; nome_exame: string; data_exame: string; resultado: string; }
interface ConsultaRow { id: number; data_consulta: string; horario: string; diagnostico: string; observacoes: string; responsavel_id: number; pet_id: number; diagnostico_zoonose_status: string; diagnostico_zoonose_observacoes: string; diagnostico_zoonose_data_confirmacao: string; medicos: MedicoRow; }

async function carregarConsulta(row: ConsultaRow): Promise<Consulta | null> {
    const pet = await petService.buscarPorId(row.pet_id);
    if (!pet) return null;

    const m = row.medicos;
    const responsavel = new Medico(m.id, m.nome, m.telefone, m.email, m.especialidade, m.crmv);

    const { data: examesData } = await supabase.from("exames").select("*").eq("consulta_id", row.id);
    const exames: Exame[] = (examesData ?? []).map((e: ExameRow) =>
        new Exame(e.id, e.nome_exame, new Date(e.data_exame), e.resultado)
    );

    const { data: receitasData } = await supabase
        .from("receitas")
        .select("*, medicamentos_receitados(*, medicamentos(*))")
        .eq("consulta_id", row.id);
    const receitas: Receita[] = (receitasData ?? []).map((r: ReceitaRow) => {
        const itens = (r.medicamentos_receitados ?? []).map((mr: MedicamentoReceitadoRow) => {
            const med = mr.medicamentos;
            const medicamento = new Medicamento(med.id, med.nome_comercial, med.principio_ativo, med.descricao, med.concentracao, med.unidade_concentracao, med.forma_farmaceutica, med.via_administracao, med.tipo_uso);
            return new MedicamentoReceitado(mr.quantidade, mr.dose, mr.vezes_ao_dia, mr.duracao_dias, medicamento, mr.observacao);
        });
        return new Receita(r.id, itens);
    });

    const { data: alunosData } = await supabase
        .from("consulta_alunos")
        .select("alunos(*, medicos!medico_orientador_id(*))")
        .eq("consulta_id", row.id);
    const alunos: Aluno[] = (alunosData ?? [])
        .filter((ca: { alunos: AlunoRowJoined | null }) => ca.alunos)
        .map((ca: { alunos: AlunoRowJoined }) => {
            const a = ca.alunos;
            const am = a.medicos;
            return new Aluno(a.id, a.nome, a.telefone, a.email, a.matricula, a.periodo, a.curso,
                new Medico(am.id, am.nome, am.telefone, am.email, am.especialidade, am.crmv));
        });

    const diagnosticoZoonose = new DiagnosticoZoonose(
        row.diagnostico_zoonose_status,
        row.diagnostico_zoonose_observacoes,
        new Date(row.diagnostico_zoonose_data_confirmacao)
    );

    return new Consulta(row.id, new Date(row.data_consulta), row.horario, row.diagnostico, row.observacoes, responsavel, pet, diagnosticoZoonose, exames, receitas, alunos);
}

export class ConsultaService {
    async listarConsultas(): Promise<Consulta[]> {
        const { data, error } = await supabase.from("consultas").select("*, medicos!responsavel_id(*)");
        if (error) throw new Error(error.message);
        const results = await Promise.all((data ?? []).map(r => carregarConsulta(r as ConsultaRow)));
        return results.filter((c): c is Consulta => c !== null);
    }

    async adicionarConsulta(consulta: Consulta): Promise<void> {
        const todos = await this.listarConsultas();
        validarIdUnico(consulta.id, todos, "consulta");
        validarDataFutura(consulta.dataConsulta, "dataConsulta");
        validarObrigatorio(consulta.horario, "horario");

        const { error } = await supabase.from("consultas").insert({
            id: consulta.id,
            data_consulta: consulta.dataConsulta.toISOString(),
            horario: consulta.horario,
            diagnostico: consulta.diagnostico,
            observacoes: consulta.observacoes,
            responsavel_id: consulta.responsavel.id,
            pet_id: consulta.pet.id,
            diagnostico_zoonose_status: consulta.diagnosticoZoonose.status,
            diagnostico_zoonose_observacoes: consulta.diagnosticoZoonose.observacoes,
            diagnostico_zoonose_data_confirmacao: consulta.diagnosticoZoonose.dataConfirmacao.toISOString()
        });
        if (error) throw new Error(error.message);

        for (const exame of consulta.exames) {
            await supabase.from("exames").insert({
                id: exame.id,
                consulta_id: consulta.id,
                nome_exame: exame.nomeExame,
                data_exame: exame.dataExame.toISOString(),
                resultado: exame.resultado
            });
        }

        for (const receita of consulta.receitas) {
            await supabase.from("receitas").insert({ id: receita.id, consulta_id: consulta.id });
            for (const item of receita.medicamentosReceitados) {
                await supabase.from("medicamentos_receitados").insert({
                    receita_id: receita.id,
                    medicamento_id: item.medicamento.id,
                    quantidade: item.quantidade,
                    dose: item.dose,
                    vezes_ao_dia: item.vezesAoDia,
                    duracao_dias: item.duracaoDias,
                    observacao: item.observacao
                });
            }
        }

        for (const aluno of consulta.alunos) {
            await supabase.from("consulta_alunos").insert({ consulta_id: consulta.id, aluno_id: aluno.id });
        }

        consulta.pet.adicionarConsulta(consulta);
    }

    async buscarPorId(id: number): Promise<Consulta | undefined> {
        const { data, error } = await supabase.from("consultas").select("*, medicos!responsavel_id(*)").eq("id", id).single();
        if (error || !data) return undefined;
        return (await carregarConsulta(data as ConsultaRow)) ?? undefined;
    }

    async listarPorPet(petId: number): Promise<Consulta[]> {
        const { data, error } = await supabase.from("consultas").select("*, medicos!responsavel_id(*)").eq("pet_id", petId);
        if (error) throw new Error(error.message);
        const results = await Promise.all((data ?? []).map(r => carregarConsulta(r as ConsultaRow)));
        return results.filter((c): c is Consulta => c !== null);
    }

    async listarPorMedico(medicoId: number): Promise<Consulta[]> {
        const { data, error } = await supabase.from("consultas").select("*, medicos!responsavel_id(*)").eq("responsavel_id", medicoId);
        if (error) throw new Error(error.message);
        const results = await Promise.all((data ?? []).map(r => carregarConsulta(r as ConsultaRow)));
        return results.filter((c): c is Consulta => c !== null);
    }

    async listarPorData(data: Date): Promise<Consulta[]> {
        const dataStr = data.toISOString().split("T")[0];
        const todas = await this.listarConsultas();
        return todas.filter(c => c.dataConsulta.toISOString().split("T")[0] === dataStr);
    }

    async listarPorAluno(alunoId: number): Promise<Consulta[]> {
        const { data, error } = await supabase.from("consulta_alunos").select("consulta_id").eq("aluno_id", alunoId);
        if (error) throw new Error(error.message);
        const ids = (data ?? []).map((r: { consulta_id: number }) => r.consulta_id);
        const results = await Promise.all(ids.map(id => this.buscarPorId(id)));
        return results.filter((c): c is Consulta => c !== undefined);
    }
}
