import { Medico } from "../models/Medico";
import { SupabaseRepository } from "./storage/SupabaseRepository";
import { validarObrigatorio, validarEmail, validarTelefone, validarCrmv, validarIdUnico } from "./validation/validadores";

interface MedicoRow {
    id: number;
    nome: string;
    telefone: string;
    email: string;
    especialidade: string;
    crmv: string;
}

export const medicoRepository = new SupabaseRepository<Medico>(
    "medicos",
    medico => ({
        id: medico.id,
        nome: medico.nome,
        telefone: medico.telefone,
        email: medico.email,
        especialidade: medico.especialidade,
        crmv: medico.crmv
    }),
    raw => {
        const r = raw as MedicoRow;
        return new Medico(r.id, r.nome, r.telefone, r.email, r.especialidade, r.crmv);
    }
);

export class MedicoService {
    async listarMedicos(): Promise<Medico[]> {
        return medicoRepository.getAll();
    }

    async adicionarMedico(medico: Medico): Promise<void> {
        validarIdUnico(medico.id, await medicoRepository.getAll(), "médico");
        validarObrigatorio(medico.nome, "nome");
        validarEmail(medico.email, "email");
        validarTelefone(medico.telefone, "telefone");
        validarObrigatorio(medico.especialidade, "especialidade");
        validarCrmv(medico.crmv, "crmv");
        await medicoRepository.add(medico);
    }

    async buscarPorId(id: number): Promise<Medico | undefined> {
        return medicoRepository.getById(id);
    }

    async listarPorEspecialidade(especialidade: string): Promise<Medico[]> {
        const todos = await medicoRepository.getAll();
        return todos.filter(m => m.especialidade.toLowerCase().includes(especialidade.toLowerCase()));
    }

    async buscarPorCrmv(crmv: string): Promise<Medico | undefined> {
        const todos = await medicoRepository.getAll();
        return todos.find(m => m.crmv === crmv);
    }

    async removerMedico(id: number): Promise<void> {
        await medicoRepository.remove(id);
    }
}
