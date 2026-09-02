import { Funcionario } from "../models/Funcionario";
import { Medico } from "../models/Medico";
import { supabase } from "./storage/supabaseClient";
import { validarData, validarIdUnico } from "./validation/validadores";

interface MedicoRow { id: number; nome: string; telefone: string; email: string; especialidade: string; crmv: string; }
interface FuncionarioRow { id: number; data_admissao: string; medico_id: number; medicos: MedicoRow; }

function rowToFuncionario(r: FuncionarioRow): Funcionario {
    const m = r.medicos;
    return new Funcionario(r.id, new Date(r.data_admissao),
        new Medico(m.id, m.nome, m.telefone, m.email, m.especialidade, m.crmv));
}

export class FuncionarioService {
    async listarFuncionarios(): Promise<Funcionario[]> {
        const { data, error } = await supabase.from("funcionarios").select("*, medicos(*)");
        if (error) throw new Error(error.message);
        return (data ?? []).map(r => rowToFuncionario(r as FuncionarioRow));
    }

    async adicionarFuncionario(funcionario: Funcionario): Promise<void> {
        const todos = await this.listarFuncionarios();
        validarIdUnico(funcionario.id, todos, "funcionário");
        validarData(funcionario.dataAdmissao, "dataAdmissao");
        const { error } = await supabase.from("funcionarios").insert({
            id: funcionario.id,
            data_admissao: funcionario.dataAdmissao.toISOString(),
            medico_id: funcionario.medico.id
        });
        if (error) throw new Error(error.message);
    }

    async buscarPorId(id: number): Promise<Funcionario | undefined> {
        const { data, error } = await supabase.from("funcionarios").select("*, medicos(*)").eq("id", id).single();
        if (error || !data) return undefined;
        return rowToFuncionario(data as FuncionarioRow);
    }

    async removerFuncionario(id: number): Promise<void> {
        await supabase.from("funcionarios").delete().eq("id", id);
    }

    async atualizarFuncionario(funcionario: Funcionario): Promise<void> {
        await supabase.from("funcionarios").update({
            data_admissao: funcionario.dataAdmissao.toISOString(),
            medico_id: funcionario.medico.id
        }).eq("id", funcionario.id);
    }
}
