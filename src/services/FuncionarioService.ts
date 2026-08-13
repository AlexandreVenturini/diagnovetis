import { Funcionario } from "../models/Funcionario";
import { medicoRepository } from "./MedicoService";
import { LocalStorageRepository } from "./storage/LocalStorageRepository";
import { validarData, validarIdUnico } from "./validation/validadores";

interface FuncionarioRaw {
    id: number;
    dataAdmissao: string;
    medicoId: number;
}

export const funcionarioRepository = new LocalStorageRepository<Funcionario>(
    "diagnovetis:funcionarios",
    funcionario => ({
        id: funcionario.id,
        dataAdmissao: funcionario.dataAdmissao.toISOString(),
        medicoId: funcionario.medico.id
    }),
    raw => {
        const r = raw as FuncionarioRaw;
        const medico = medicoRepository.findByIdSync(r.medicoId);
        if (!medico) {
            throw new Error(`Medico ${r.medicoId} nao encontrado para o funcionario ${r.id}`);
        }
        return new Funcionario(r.id, new Date(r.dataAdmissao), medico);
    }
);

export class FuncionarioService {
    async listarFuncionarios(): Promise<Funcionario[]> {
        return funcionarioRepository.getAll();
    }

    async adicionarFuncionario(funcionario: Funcionario): Promise<void> {
        validarIdUnico(funcionario.id, await funcionarioRepository.getAll(), "funcionário");
        validarData(funcionario.dataAdmissao, "dataAdmissao");
        await funcionarioRepository.add(funcionario);
    }

    async buscarPorId(id: number): Promise<Funcionario | undefined> {
        return funcionarioRepository.getById(id);
    }

    async removerFuncionario(id: number): Promise<void> {
        await funcionarioRepository.remove(id);
    }

    async atualizarFuncionario(funcionario: Funcionario): Promise<void> {
        await funcionarioRepository.update(funcionario);
    }
}
