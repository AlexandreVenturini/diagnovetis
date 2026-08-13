import { Medicamento } from "../models/Medicamento";
import { LocalStorageRepository } from "./storage/LocalStorageRepository";
import { validarObrigatorio, validarPositivo, validarIdUnico } from "./validation/validadores";

interface MedicamentoRaw {
    id: number;
    nomeComercial: string;
    principioAtivo: string;
    descricao: string;
    concentracao: number;
    unidadeConcentracao: string;
    formaFarmaceutica: string;
    viaAdministracao: string;
    tipoUso: string;
}

export const medicamentoRepository = new LocalStorageRepository<Medicamento>(
    "diagnovetis:medicamentos",
    medicamento => ({
        id: medicamento.id,
        nomeComercial: medicamento.nome,
        principioAtivo: medicamento.principioAtivo,
        descricao: medicamento.descricao,
        concentracao: medicamento.concentracao,
        unidadeConcentracao: medicamento.unidadeConcentracao,
        formaFarmaceutica: medicamento.formaFarmaceutica,
        viaAdministracao: medicamento.viaAdministracao,
        tipoUso: medicamento.tipo
    }),
    raw => {
        const r = raw as MedicamentoRaw;
        return new Medicamento(r.id, r.nomeComercial, r.principioAtivo, r.descricao, r.concentracao, r.unidadeConcentracao, r.formaFarmaceutica, r.viaAdministracao, r.tipoUso);
    }
);

export class MedicamentoService {
    async listarMedicamentos(): Promise<Medicamento[]> {
        return medicamentoRepository.getAll();
    }

    async adicionarMedicamento(medicamento: Medicamento): Promise<void> {
        validarIdUnico(medicamento.id, await medicamentoRepository.getAll(), "medicamento");
        validarObrigatorio(medicamento.nome, "nomeComercial");
        validarObrigatorio(medicamento.principioAtivo, "principioAtivo");
        validarObrigatorio(medicamento.formaFarmaceutica, "formaFarmaceutica");
        validarObrigatorio(medicamento.viaAdministracao, "viaAdministracao");
        validarPositivo(medicamento.concentracao, "concentracao");
        await medicamentoRepository.add(medicamento);
    }

    async buscarPorId(id: number): Promise<Medicamento | undefined> {
        return medicamentoRepository.getById(id);
    }

    async buscarPorNome(nome: string): Promise<Medicamento[]> {
        const todos = await medicamentoRepository.getAll();
        return todos.filter(m => m.nome.toLowerCase().includes(nome.toLowerCase()));
    }

    async buscarPorPrincipioAtivo(principioAtivo: string): Promise<Medicamento[]> {
        const todos = await medicamentoRepository.getAll();
        return todos.filter(m => m.principioAtivo.toLowerCase().includes(principioAtivo.toLowerCase()));
    }

    async removerMedicamento(id: number): Promise<void> {
        await medicamentoRepository.remove(id);
    }

    async atualizarMedicamento(medicamento: Medicamento): Promise<void> {
        await medicamentoRepository.update(medicamento);
    }
}
