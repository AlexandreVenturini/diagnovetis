import { Aluno } from "../models/Aluno";
import { Consulta, type ExameFisico, type Alta } from "../models/Consulta";
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
interface AlunoRowJoined { id: number; nome: string; telefone: string; email: string; matricula: string; periodo: number; curso: string; medico_orientador_id: number; medicos?: MedRowInAluno | null; }
interface MedicamentoRow { id: number; nome_comercial: string; principio_ativo: string; descricao: string; concentracao: number; unidade_concentracao: string; forma_farmaceutica: string; via_administracao: string; tipo_uso: string; }
interface MedicamentoReceitadoRow { quantidade: number; dose: string; vezes_ao_dia: number; duracao_dias: number; observacao: string; medicamentos: MedicamentoRow; }
interface ReceitaRow { id: number; medicamentos_receitados: MedicamentoReceitadoRow[]; }
interface ExameRow { id: number; nome_exame: string; data_exame: string; resultado: string; }
interface ConsultaRow { id: number; data_consulta: string; horario: string; diagnostico: string; observacoes: string; responsavel_id: number; pet_id: number; diagnostico_zoonose_status: string; diagnostico_zoonose_observacoes: string; diagnostico_zoonose_data_confirmacao: string; medicos: MedicoRow; temperatura?: number; frequencia_cardiaca?: number; frequencia_respiratoria?: number; tpc?: string; mucosas?: string; hidratacao?: string; nivel_consciencia?: string; pele_pelagem?: string; olhos?: string; ouvidos?: string; boca_dentes?: string; sistema_respiratorio?: string; sistema_cardiovascular?: string; sistema_gastrointestinal?: string; sistema_urinario?: string; sistema_reprodutivo?: string; sistema_neurologico?: string; dor?: string; alta_data?: string; alta_condicao?: string; alta_orientacoes?: string; alta_prognostico?: string; }

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
    const alunoRows = (alunosData ?? []) as unknown as Array<{ alunos: AlunoRowJoined | null }>;
    const alunos: Aluno[] = await Promise.all(alunoRows
        .filter((ca): ca is { alunos: AlunoRowJoined } => ca.alunos != null)
        .map(async (ca) => {
            const a = ca.alunos;
            let am = a.medicos;
            if (!am) {
                const { data: medicoData } = await supabase.from("medicos").select("*").eq("id", a.medico_orientador_id).single();
                am = medicoData as MedRowInAluno | null;
            }
            if (!am) throw new Error(`Médico orientador do aluno ${a.id} não encontrado.`);
            return new Aluno(a.id, a.nome, a.telefone, a.email, a.matricula, a.periodo, a.curso,
                new Medico(am.id, am.nome, am.telefone, am.email, am.especialidade, am.crmv));
        }));

    const diagnosticoZoonose = new DiagnosticoZoonose(
        row.diagnostico_zoonose_status,
        row.diagnostico_zoonose_observacoes,
        new Date(row.diagnostico_zoonose_data_confirmacao)
    );

    const exameFisico: ExameFisico = {
        temperatura: row.temperatura ?? undefined,
        frequenciaCardiaca: row.frequencia_cardiaca ?? undefined,
        frequenciaRespiratoria: row.frequencia_respiratoria ?? undefined,
        tpc: row.tpc ?? undefined,
        mucosas: row.mucosas ?? undefined,
        hidratacao: row.hidratacao ?? undefined,
        nivelConsciencia: row.nivel_consciencia ?? undefined,
        pelePelagem: row.pele_pelagem ?? undefined,
        olhos: row.olhos ?? undefined,
        ouvidos: row.ouvidos ?? undefined,
        bocaDentes: row.boca_dentes ?? undefined,
        sistemaRespiratorio: row.sistema_respiratorio ?? undefined,
        sistemaCardiovascular: row.sistema_cardiovascular ?? undefined,
        sistemaGastrointestinal: row.sistema_gastrointestinal ?? undefined,
        sistemaUrinario: row.sistema_urinario ?? undefined,
        sistemaReprodutivo: row.sistema_reprodutivo ?? undefined,
        sistemaNeurologico: row.sistema_neurologico ?? undefined,
        dor: row.dor ?? undefined,
    };
    const alta: Alta = {
        data: row.alta_data ?? undefined,
        condicao: row.alta_condicao ?? undefined,
        orientacoes: row.alta_orientacoes ?? undefined,
        prognostico: row.alta_prognostico ?? undefined,
    };

    return new Consulta(row.id, new Date(row.data_consulta), row.horario, row.diagnostico, row.observacoes, responsavel, pet, diagnosticoZoonose, exames, receitas, alunos, exameFisico, alta);
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
            diagnostico_zoonose_data_confirmacao: consulta.diagnosticoZoonose.dataConfirmacao.toISOString(),
            temperatura: consulta.exameFisico.temperatura ?? null,
            frequencia_cardiaca: consulta.exameFisico.frequenciaCardiaca ?? null,
            frequencia_respiratoria: consulta.exameFisico.frequenciaRespiratoria ?? null,
            tpc: consulta.exameFisico.tpc ?? null,
            mucosas: consulta.exameFisico.mucosas ?? null,
            hidratacao: consulta.exameFisico.hidratacao ?? null,
            nivel_consciencia: consulta.exameFisico.nivelConsciencia ?? null,
            pele_pelagem: consulta.exameFisico.pelePelagem ?? null,
            olhos: consulta.exameFisico.olhos ?? null,
            ouvidos: consulta.exameFisico.ouvidos ?? null,
            boca_dentes: consulta.exameFisico.bocaDentes ?? null,
            sistema_respiratorio: consulta.exameFisico.sistemaRespiratorio ?? null,
            sistema_cardiovascular: consulta.exameFisico.sistemaCardiovascular ?? null,
            sistema_gastrointestinal: consulta.exameFisico.sistemaGastrointestinal ?? null,
            sistema_urinario: consulta.exameFisico.sistemaUrinario ?? null,
            sistema_reprodutivo: consulta.exameFisico.sistemaReprodutivo ?? null,
            sistema_neurologico: consulta.exameFisico.sistemaNeurologico ?? null,
            dor: consulta.exameFisico.dor ?? null,
            alta_data: consulta.alta.data ?? null,
            alta_condicao: consulta.alta.condicao ?? null,
            alta_orientacoes: consulta.alta.orientacoes ?? null,
            alta_prognostico: consulta.alta.prognostico ?? null,
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
