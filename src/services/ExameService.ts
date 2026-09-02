import { Exame } from "../models/Exame";
import { ConsultaService } from "./ConsultaService";

const consultaService = new ConsultaService();

export class ExameService {
    async listarPorConsulta(consultaId: number): Promise<Exame[]> {
        const consulta = await consultaService.buscarPorId(consultaId);
        return consulta?.exames ?? [];
    }

    async listarTodos(): Promise<Exame[]> {
        const consultas = await consultaService.listarConsultas();
        return consultas.flatMap(consulta => consulta.exames);
    }

    async buscarPorId(exameId: number): Promise<Exame | undefined> {
        const todos = await this.listarTodos();
        return todos.find(e => e.id === exameId);
    }

    async listarPorPet(petId: number): Promise<Exame[]> {
        const consultas = await consultaService.listarPorPet(petId);
        return consultas.flatMap(consulta => consulta.exames);
    }
}
