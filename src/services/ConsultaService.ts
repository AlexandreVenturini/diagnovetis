import { Consulta } from "../models/Consulta";
import { DiagnosticoZoonose } from "../models/DiagnosticoZoonose";
import { Exame } from "../models/Exame";
import { Medicamento } from "../models/Medicamento";
import { MedicamentoReceitado } from "../models/MedicamentoReceitado";
import { Receita } from "../models/Receita";
import { medicoRepository } from "./MedicoService";
import { petRepository } from "./PetService";
import { alunoRepository } from "./AlunoService";
import { LocalStorageRepository } from "./storage/LocalStorageRepository";
import { validarObrigatorio, validarDataFutura, validarIdUnico } from "./validation/validadores";

interface ExameRaw {
    id: number;
    nomeExame: string;
    dataExame: string;
    resultado: string;
}

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

interface MedicamentoReceitadoRaw {
    quantidade: number;
    dose: string;
    vezesAoDia: number;
    duracaoDias: number;
    medicamento: MedicamentoRaw;
    observacao: string;
}

interface ReceitaRaw {
    id: number;
    medicamentosReceitados: MedicamentoReceitadoRaw[];
}

interface DiagnosticoZoonoseRaw {
    status: string;
    observacoes: string;
    dataConfirmacao: string;
}

interface ConsultaRaw {
    id: number;
    dataConsulta: string;
    horario: string;
    diagnostico: string;
    observacoes: string;
    responsavelId: number;
    petId: number;
    exames: ExameRaw[];
    receitas: ReceitaRaw[];
    alunoIds: number[];
    diagnosticoZoonose: DiagnosticoZoonoseRaw;
}

function serializeExame(exame: Exame): ExameRaw {
    return {
        id: exame.id,
        nomeExame: exame.nomeExame,
        dataExame: exame.dataExame.toISOString(),
        resultado: exame.resultado
    };
}

function deserializeExame(raw: ExameRaw): Exame {
    return new Exame(raw.id, raw.nomeExame, new Date(raw.dataExame), raw.resultado);
}

function serializeMedicamento(medicamento: Medicamento): MedicamentoRaw {
    return {
        id: medicamento.id,
        nomeComercial: medicamento.nome,
        principioAtivo: medicamento.principioAtivo,
        descricao: medicamento.descricao,
        concentracao: medicamento.concentracao,
        unidadeConcentracao: medicamento.unidadeConcentracao,
        formaFarmaceutica: medicamento.formaFarmaceutica,
        viaAdministracao: medicamento.viaAdministracao,
        tipoUso: medicamento.tipo
    };
}

function deserializeMedicamento(raw: MedicamentoRaw): Medicamento {
    return new Medicamento(
        raw.id,
        raw.nomeComercial,
        raw.principioAtivo,
        raw.descricao,
        raw.concentracao,
        raw.unidadeConcentracao,
        raw.formaFarmaceutica,
        raw.viaAdministracao,
        raw.tipoUso
    );
}

function serializeMedicamentoReceitado(item: MedicamentoReceitado): MedicamentoReceitadoRaw {
    return {
        quantidade: item.quantidade,
        dose: item.dose,
        vezesAoDia: item.vezesAoDia,
        duracaoDias: item.duracaoDias,
        medicamento: serializeMedicamento(item.medicamento),
        observacao: item.observacao
    };
}

function deserializeMedicamentoReceitado(raw: MedicamentoReceitadoRaw): MedicamentoReceitado {
    return new MedicamentoReceitado(
        raw.quantidade,
        raw.dose,
        raw.vezesAoDia,
        raw.duracaoDias,
        deserializeMedicamento(raw.medicamento),
        raw.observacao
    );
}

function serializeReceita(receita: Receita): ReceitaRaw {
    return {
        id: receita.id,
        medicamentosReceitados: receita.medicamentosReceitados.map(serializeMedicamentoReceitado)
    };
}

function deserializeReceita(raw: ReceitaRaw): Receita {
    return new Receita(raw.id, raw.medicamentosReceitados.map(deserializeMedicamentoReceitado));
}

function serializeDiagnosticoZoonose(diagnostico: DiagnosticoZoonose): DiagnosticoZoonoseRaw {
    return {
        status: diagnostico.status,
        observacoes: diagnostico.observacoes,
        dataConfirmacao: diagnostico.dataConfirmacao.toISOString()
    };
}

function deserializeDiagnosticoZoonose(raw: DiagnosticoZoonoseRaw): DiagnosticoZoonose {
    return new DiagnosticoZoonose(raw.status, raw.observacoes, new Date(raw.dataConfirmacao));
}

export const consultaRepository = new LocalStorageRepository<Consulta>(
    "diagnovetis:consultas",
    consulta => ({
        id: consulta.id,
        dataConsulta: consulta.dataConsulta.toISOString(),
        horario: consulta.horario,
        diagnostico: consulta.diagnostico,
        observacoes: consulta.observacoes,
        responsavelId: consulta.responsavel.id,
        petId: consulta.pet.id,
        exames: consulta.exames.map(serializeExame),
        receitas: consulta.receitas.map(serializeReceita),
        alunoIds: consulta.alunos.map(aluno => aluno.id),
        diagnosticoZoonose: serializeDiagnosticoZoonose(consulta.diagnosticoZoonose)
    }),
    raw => {
        const consultaRaw = raw as ConsultaRaw;

        const responsavel = medicoRepository.findByIdSync(consultaRaw.responsavelId);
        if (!responsavel) {
            throw new Error(`Medico ${consultaRaw.responsavelId} nao encontrado para a consulta ${consultaRaw.id}`);
        }

        const pet = petRepository.findByIdSync(consultaRaw.petId);
        if (!pet) {
            throw new Error(`Pet ${consultaRaw.petId} nao encontrado para a consulta ${consultaRaw.id}`);
        }

        const consulta = new Consulta(
            consultaRaw.id,
            new Date(consultaRaw.dataConsulta),
            consultaRaw.horario,
            consultaRaw.diagnostico,
            consultaRaw.observacoes,
            responsavel,
            pet,
            deserializeDiagnosticoZoonose(consultaRaw.diagnosticoZoonose),
            consultaRaw.exames.map(deserializeExame),
            consultaRaw.receitas.map(deserializeReceita)
        );

        pet.adicionarConsulta(consulta);

        for (const alunoId of consultaRaw.alunoIds) {
            const aluno = alunoRepository.findByIdSync(alunoId);
            if (aluno) {
                consulta.adicionarAluno(aluno);
            }
        }

        return consulta;
    }
);

export class ConsultaService {
    async listarConsultas(): Promise<Consulta[]> {
        return consultaRepository.getAll();
    }

    async adicionarConsulta(consulta: Consulta): Promise<void> {
        validarIdUnico(consulta.id, await consultaRepository.getAll(), "consulta");
        validarDataFutura(consulta.dataConsulta, "dataConsulta");
        validarObrigatorio(consulta.horario, "horario");
        consulta.pet.adicionarConsulta(consulta);
        await consultaRepository.add(consulta);
    }

    async buscarPorId(id: number): Promise<Consulta | undefined> {
        return consultaRepository.getById(id);
    }

    async listarPorPet(petId: number): Promise<Consulta[]> {
        const todas = await consultaRepository.getAll();
        return todas.filter(c => c.pet.id === petId);
    }

    async listarPorMedico(medicoId: number): Promise<Consulta[]> {
        const todas = await consultaRepository.getAll();
        return todas.filter(c => c.responsavel.id === medicoId);
    }

    async listarPorData(data: Date): Promise<Consulta[]> {
        const dataStr = data.toISOString().split("T")[0];
        const todas = await consultaRepository.getAll();
        return todas.filter(c => c.dataConsulta.toISOString().split("T")[0] === dataStr);
    }

    async listarPorAluno(alunoId: number): Promise<Consulta[]> {
        const todas = await consultaRepository.getAll();
        return todas.filter(c => c.alunos.some(a => a.id === alunoId));
    }
}
