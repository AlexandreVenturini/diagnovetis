import { Aluno } from "../models/Aluno";
import { Medico } from "../models/Medico";
import { supabase } from "./storage/supabaseClient";
import { validarObrigatorio, validarEmailIfes, validarTelefone, validarPeriodo, validarIdUnico } from "./validation/validadores";

interface MedicoRow { id: number; nome: string; telefone: string; email: string; especialidade: string; crmv: string; }
interface AlunoRow { id: number; nome: string; telefone: string; email: string; matricula: string; periodo: number; curso: string; medico_orientador_id: number; medicos: MedicoRow; }

function rowToAluno(r: AlunoRow): Aluno {
    const m = r.medicos;
    return new Aluno(r.id, r.nome, r.telefone, r.email, r.matricula, r.periodo, r.curso,
        new Medico(m.id, m.nome, m.telefone, m.email, m.especialidade, m.crmv));
}

export class AlunoService {
    async listarAlunos(): Promise<Aluno[]> {
        const { data, error } = await supabase.from("alunos").select("*, medicos!medico_orientador_id(*)");
        if (error) throw new Error(error.message);
        return (data ?? []).map(r => rowToAluno(r as AlunoRow));
    }

    async adicionarAluno(aluno: Aluno): Promise<void> {
        const todos = await this.listarAlunos();
        validarIdUnico(aluno.id, todos, "aluno");
        validarObrigatorio(aluno.nome, "nome");
        validarEmailIfes(aluno.email, "email");
        validarTelefone(aluno.telefone, "telefone");
        validarObrigatorio(aluno.matricula, "matricula");
        validarPeriodo(aluno.periodo, "periodo");
        validarObrigatorio(aluno.curso, "curso");
        const { error } = await supabase.from("alunos").insert({
            id: aluno.id,
            nome: aluno.nome,
            telefone: aluno.telefone,
            email: aluno.email,
            matricula: aluno.matricula,
            periodo: aluno.periodo,
            curso: aluno.curso,
            medico_orientador_id: aluno.medicoOrientador.id
        });
        if (error) throw new Error(error.message);
    }

    async buscarPorId(id: number): Promise<Aluno | undefined> {
        const { data, error } = await supabase.from("alunos").select("*, medicos!medico_orientador_id(*)").eq("id", id).single();
        if (error || !data) return undefined;
        return rowToAluno(data as AlunoRow);
    }

    async removerAluno(id: number): Promise<void> {
        await supabase.from("alunos").delete().eq("id", id);
    }
}
