import { Zoonose } from "../models/Zoonose";
import { SupabaseRepository } from "./storage/SupabaseRepository";
import { validarObrigatorio, validarGrauRisco, validarIdUnico } from "./validation/validadores";

interface ZoonoseRow {
    id: number;
    nome: string;
    agente_etiologico: string;
    sintomas: string;
    medidas_preventivas: string;
    grau_risco: string;
}

export const zoonoseRepository = new SupabaseRepository<Zoonose>(
    "zoonoses",
    zoonose => ({
        id: zoonose.id,
        nome: zoonose.nome,
        agente_etiologico: zoonose.agenteEtiologico,
        sintomas: zoonose.sintomas,
        medidas_preventivas: zoonose.medidasPreventivas,
        grau_risco: zoonose.grauRisco
    }),
    raw => {
        const r = raw as ZoonoseRow;
        return new Zoonose(r.id, r.nome, r.agente_etiologico, r.sintomas, r.medidas_preventivas, r.grau_risco);
    }
);

export class ZoonoseService {
    async listarZoonoses(): Promise<Zoonose[]> {
        return zoonoseRepository.getAll();
    }

    async adicionarZoonose(zoonose: Zoonose): Promise<void> {
        validarIdUnico(zoonose.id, await zoonoseRepository.getAll(), "zoonose");
        validarObrigatorio(zoonose.nome, "nome");
        validarObrigatorio(zoonose.agenteEtiologico, "agenteEtiologico");
        validarObrigatorio(zoonose.sintomas, "sintomas");
        validarObrigatorio(zoonose.medidasPreventivas, "medidasPreventivas");
        validarGrauRisco(zoonose.grauRisco, "grauRisco");
        await zoonoseRepository.add(zoonose);
    }

    async buscarPorId(id: number): Promise<Zoonose | undefined> {
        return zoonoseRepository.getById(id);
    }

    async buscarPorNome(nome: string): Promise<Zoonose[]> {
        const todos = await zoonoseRepository.getAll();
        return todos.filter(z => z.nome.toLowerCase().includes(nome.toLowerCase()));
    }

    async listarAltoRisco(): Promise<Zoonose[]> {
        const todos = await zoonoseRepository.getAll();
        return todos.filter(z => z.isAltoRisco());
    }

    async removerZoonose(id: number): Promise<void> {
        await zoonoseRepository.remove(id);
    }

    async atualizarZoonose(zoonose: Zoonose): Promise<void> {
        await zoonoseRepository.update(zoonose);
    }
}
