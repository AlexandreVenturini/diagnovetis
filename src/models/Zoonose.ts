import type { ClinicalMetadata } from '../features/zoonoses/zoonosisTypes'

export class Zoonose {
    clinical: ClinicalMetadata | null = null;
    private _id: number;
    private _nome: string;
    private _agenteEtiologico: string;
    private _sintomas: string;
    private _medidasPreventivas: string;
    private _grauRisco: string;

    constructor(
        id: number,
        nome: string,
        agenteEtiologico: string,
        sintomas: string,
        medidasPreventivas: string,
        grauRisco: string
    ) {
        this._id = id;
        this._nome = nome;
        this._agenteEtiologico = agenteEtiologico;
        this._sintomas = sintomas;
        this._medidasPreventivas = medidasPreventivas;
        this._grauRisco = grauRisco;
    }

    get nome(): string {
        return this._nome;
    }

    get id(): number {
        return this._id;
    }

    getId(): number {
        return this._id;
    }

    getNome(): string {
        return this._nome;
    }

    get agenteEtiologico(): string {
        return this._agenteEtiologico;
    }

    getAgenteEtiologico(): string {
        return this._agenteEtiologico;
    }

    get sintomas(): string {
        return this._sintomas;
    }

    getSintomas(): string {
        return this._sintomas;
    }

    get medidasPreventivas(): string {
        return this._medidasPreventivas;
    }

    getMedidasPreventivas(): string {
        return this._medidasPreventivas;
    }

    get grauRisco(): string {
        return this._grauRisco;
    }

    getGrauRisco(): string {
        return this._grauRisco;
    }

    isAltoRisco(): boolean {
        return this._grauRisco.toLowerCase() === "alto";
    }
}
