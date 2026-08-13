import { Tutor } from "../models/Tutor";
import { Endereco } from "../models/Endereco";
import { SupabaseRepository } from "./storage/SupabaseRepository";
import { supabase } from "./storage/supabaseClient";
import { validarObrigatorio, validarEmail, validarTelefone, validarCep, validarData, validarIdUnico } from "./validation/validadores";

interface EnderecoRow {
    id: number;
    rua: string;
    numero: number;
    bairro: string;
    cidade: string;
    uf: string;
    cep: string;
}

interface TutorRow {
    id: number;
    nome: string;
    telefone: string;
    email: string;
    data_cadastro: string;
    endereco_id: number;
    enderecos: EnderecoRow;
}

export const tutorRepository = new SupabaseRepository<Tutor>(
    "tutores",
    tutor => ({
        id: tutor.id,
        nome: tutor.nome,
        telefone: tutor.telefone,
        email: tutor.email,
        data_cadastro: tutor.dataCadastro.toISOString(),
        endereco_id: (tutor as unknown as { _enderecoId?: number })._enderecoId
    }),
    raw => {
        const r = raw as TutorRow;
        const e = r.enderecos;
        return new Tutor(
            r.id, r.nome, r.telefone, r.email,
            new Date(r.data_cadastro),
            new Endereco(e.rua, e.numero, e.bairro, e.cidade, e.uf, e.cep)
        );
    }
);

export class TutorService {
    async listarTutores(): Promise<Tutor[]> {
        const { data, error } = await supabase
            .from("tutores")
            .select("*, enderecos(*)")
        if (error) throw new Error(error.message);
        return (data ?? []).map(r => {
            const e = r.enderecos as EnderecoRow;
            return new Tutor(r.id, r.nome, r.telefone, r.email, new Date(r.data_cadastro), new Endereco(e.rua, e.numero, e.bairro, e.cidade, e.uf, e.cep));
        });
    }

    async adicionarTutor(tutor: Tutor): Promise<void> {
        const todos = await this.listarTutores();
        validarIdUnico(tutor.id, todos, "tutor");
        validarObrigatorio(tutor.nome, "nome");
        validarEmail(tutor.email, "email");
        validarTelefone(tutor.telefone, "telefone");
        validarData(tutor.dataCadastro, "dataCadastro");
        validarObrigatorio(tutor.endereco.rua, "rua");
        validarObrigatorio(tutor.endereco.cidade, "cidade");
        validarObrigatorio(tutor.endereco.uf, "uf");
        validarCep(tutor.endereco.cep, "cep");

        const { data: endData, error: endError } = await supabase
            .from("enderecos")
            .insert({
                rua: tutor.endereco.rua,
                numero: tutor.endereco.numero,
                bairro: tutor.endereco.bairro,
                cidade: tutor.endereco.cidade,
                uf: tutor.endereco.uf,
                cep: tutor.endereco.cep
            })
            .select()
            .single();
        if (endError) throw new Error(endError.message);

        const { error } = await supabase.from("tutores").insert({
            id: tutor.id,
            nome: tutor.nome,
            telefone: tutor.telefone,
            email: tutor.email,
            data_cadastro: tutor.dataCadastro.toISOString(),
            endereco_id: endData.id
        });
        if (error) throw new Error(error.message);
    }

    async buscarPorId(id: number): Promise<Tutor | undefined> {
        const { data, error } = await supabase
            .from("tutores")
            .select("*, enderecos(*)")
            .eq("id", id)
            .single();
        if (error || !data) return undefined;
        const e = data.enderecos as EnderecoRow;
        return new Tutor(data.id, data.nome, data.telefone, data.email, new Date(data.data_cadastro), new Endereco(e.rua, e.numero, e.bairro, e.cidade, e.uf, e.cep));
    }

    async buscarPorNome(nome: string): Promise<Tutor[]> {
        const todos = await this.listarTutores();
        return todos.filter(t => t.nome.toLowerCase().includes(nome.toLowerCase()));
    }

    async buscarPorEmail(email: string): Promise<Tutor | undefined> {
        const todos = await this.listarTutores();
        return todos.find(t => t.email.toLowerCase() === email.toLowerCase());
    }

    async removerTutor(id: number): Promise<void> {
        await supabase.from("tutores").delete().eq("id", id);
    }

    async atualizarTutor(tutor: Tutor): Promise<void> {
        await supabase.from("tutores").update({
            nome: tutor.nome,
            telefone: tutor.telefone,
            email: tutor.email,
            data_cadastro: tutor.dataCadastro.toISOString()
        }).eq("id", tutor.id);
    }
}
