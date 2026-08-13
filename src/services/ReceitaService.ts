import { Receita } from "../models/Receita";
import { consultaRepository } from "./ConsultaService";

export class ReceitaService {
    async listarPorConsulta(consultaId: number): Promise<Receita[]> {
        const consulta = await consultaRepository.getById(consultaId);
        return consulta?.receitas ?? [];
    }

    async listarTodas(): Promise<Receita[]> {
        const consultas = await consultaRepository.getAll();
        return consultas.flatMap(consulta => consulta.receitas);
    }

    async buscarPorId(receitaId: number): Promise<Receita | undefined> {
        const todas = await this.listarTodas();
        return todas.find(r => r.id === receitaId);
    }

    async listarPorPet(petId: number): Promise<Receita[]> {
        const consultas = await consultaRepository.getAll();
        return consultas
            .filter(consulta => consulta.pet.id === petId)
            .flatMap(consulta => consulta.receitas);
    }
}
