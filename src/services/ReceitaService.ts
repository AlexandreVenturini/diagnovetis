import { Receita } from "../models/Receita";
import { ConsultaService } from "./ConsultaService";

const consultaService = new ConsultaService();

export class ReceitaService {
    async listarPorConsulta(consultaId: number): Promise<Receita[]> {
        const consulta = await consultaService.buscarPorId(consultaId);
        return consulta?.receitas ?? [];
    }

    async listarTodas(): Promise<Receita[]> {
        const consultas = await consultaService.listarConsultas();
        return consultas.flatMap(consulta => consulta.receitas);
    }

    async buscarPorId(receitaId: number): Promise<Receita | undefined> {
        const todas = await this.listarTodas();
        return todas.find(r => r.id === receitaId);
    }

    async listarPorPet(petId: number): Promise<Receita[]> {
        const consultas = await consultaService.listarPorPet(petId);
        return consultas.flatMap(consulta => consulta.receitas);
    }
}
