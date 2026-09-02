import { Medicamento } from "../models/Medicamento";
import { supabase } from "./storage/supabaseClient";
import { validarObrigatorio, validarPositivo, validarIdUnico } from "./validation/validadores";

interface MedicamentoRow {
    id: number;
    nome_comercial: string;
    principio_ativo: string;
    descricao: string;
    concentracao: number;
    unidade_concentracao: string;
    forma_farmaceutica: string;
    via_administracao: string;
    tipo_uso: string;
}

function rowToMedicamento(r: MedicamentoRow): Medicamento {
    return new Medicamento(r.id, r.nome_comercial, r.principio_ativo, r.descricao, r.concentracao, r.unidade_concentracao, r.forma_farmaceutica, r.via_administracao, r.tipo_uso);
}

export class MedicamentoService {
    async listarMedicamentos(): Promise<Medicamento[]> {
        const { data, error } = await supabase.from("medicamentos").select("*");
        if (error) throw new Error(error.message);
        return (data ?? []).map(r => rowToMedicamento(r as MedicamentoRow));
    }

    async adicionarMedicamento(medicamento: Medicamento): Promise<void> {
        const todos = await this.listarMedicamentos();
        validarIdUnico(medicamento.id, todos, "medicamento");
        validarObrigatorio(medicamento.nome, "nomeComercial");
        validarObrigatorio(medicamento.principioAtivo, "principioAtivo");
        validarObrigatorio(medicamento.formaFarmaceutica, "formaFarmaceutica");
        validarObrigatorio(medicamento.viaAdministracao, "viaAdministracao");
        validarPositivo(medicamento.concentracao, "concentracao");
        const { error } = await supabase.from("medicamentos").insert({
            id: medicamento.id,
            nome_comercial: medicamento.nome,
            principio_ativo: medicamento.principioAtivo,
            descricao: medicamento.descricao,
            concentracao: medicamento.concentracao,
            unidade_concentracao: medicamento.unidadeConcentracao,
            forma_farmaceutica: medicamento.formaFarmaceutica,
            via_administracao: medicamento.viaAdministracao,
            tipo_uso: medicamento.tipo
        });
        if (error) throw new Error(error.message);
    }

    async buscarPorId(id: number): Promise<Medicamento | undefined> {
        const { data, error } = await supabase.from("medicamentos").select("*").eq("id", id).single();
        if (error || !data) return undefined;
        return rowToMedicamento(data as MedicamentoRow);
    }

    async buscarPorNome(nome: string): Promise<Medicamento[]> {
        const todos = await this.listarMedicamentos();
        return todos.filter(m => m.nome.toLowerCase().includes(nome.toLowerCase()));
    }

    async buscarPorPrincipioAtivo(principioAtivo: string): Promise<Medicamento[]> {
        const todos = await this.listarMedicamentos();
        return todos.filter(m => m.principioAtivo.toLowerCase().includes(principioAtivo.toLowerCase()));
    }

    async removerMedicamento(id: number): Promise<void> {
        await supabase.from("medicamentos").delete().eq("id", id);
    }

    async atualizarMedicamento(medicamento: Medicamento): Promise<void> {
        await supabase.from("medicamentos").update({
            nome_comercial: medicamento.nome,
            principio_ativo: medicamento.principioAtivo,
            descricao: medicamento.descricao,
            concentracao: medicamento.concentracao,
            unidade_concentracao: medicamento.unidadeConcentracao,
            forma_farmaceutica: medicamento.formaFarmaceutica,
            via_administracao: medicamento.viaAdministracao,
            tipo_uso: medicamento.tipo
        }).eq("id", medicamento.id);
    }
}
