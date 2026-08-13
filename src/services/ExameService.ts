import { Exame } from "../models/Exame";
import { consultaRepository } from "./ConsultaService";

export class ExameService {
    async listarPorConsulta(consultaId: number): Promise<Exame[]> {
        const consulta = await consultaRepository.getById(consultaId);
        return consulta?.exames ?? [];
    }

    async listarTodos(): Promise<Exame[]> {
        const consultas = await consultaRepository.getAll();
        return consultas.flatMap(consulta => consulta.exames);
    }

    async buscarPorId(exameId: number): Promise<Exame | undefined> {
        const todos = await this.listarTodos();
        return todos.find(e => e.id === exameId);
    }

    async listarPorPet(petId: number): Promise<Exame[]> {
        const consultas = await consultaRepository.getAll();
        return consultas
            .filter(consulta => consulta.pet.id === petId)
            .flatMap(consulta => consulta.exames);
    }
}
