import { Tutor } from "./Tutor";
import type { Consulta } from "./Consulta";

export class Pet {
    private _id: number;
    private _nome: string;
    private _especie: string;
    private _raca: string;
    private _tutor: Tutor;
    private _historicoConsulta: Consulta[];
    private _idade: string;
    private _peso: string;
    private _sexo: string;
    private _historico: string;
    criadoEm: string | null = null;

    constructor(
        id: number,
        nome: string,
        especie: string,
        raca: string,
        tutor: Tutor,
        historicoConsulta: Consulta[] = [],
        idade: string = '',
        peso: string = '',
        sexo: string = '',
        historico: string = ''
    ) {
        this._id = id;
        this._nome = nome;
        this._especie = especie;
        this._raca = raca;
        this._tutor = tutor;
        this._historicoConsulta = historicoConsulta;
        this._idade = idade;
        this._peso = peso;
        this._sexo = sexo;
        this._historico = historico;
    }

    get id(): number {
        return this._id;
    }

    getId(): number {
        return this._id;
    }

    get nome(): string {
        return this._nome;
    }

    getNome(): string {
        return this._nome;
    }

    get especie(): string {
        return this._especie;
    }

    getEspecie(): string {
        return this._especie;
    }

    set especie(especie: string) {
        this._especie = especie;
    }

    setEspecie(especie: string): void {
        this._especie = especie;
    }

    get raca(): string {
        return this._raca;
    }

    getRaca(): string {
        return this._raca;
    }

    set raca(raca: string) {
        this._raca = raca;
    }

    setRaca(raca: string): void {
        this._raca = raca;
    }

    get tutor(): Tutor {
        return this._tutor;
    }

    getTutor(): Tutor {
        return this._tutor;
    }

    get historicoConsulta(): Consulta[] {
        return [...this._historicoConsulta];
    }

    getHistoricoConsulta(): Consulta[] {
        return [...this._historicoConsulta];
    }

    adicionarConsulta(consulta: Consulta): void {
        this._historicoConsulta.push(consulta);
    }

    get idade(): string {
        return this._idade;
    }

    get peso(): string {
        return this._peso;
    }

    get sexo(): string {
        return this._sexo;
    }

    get historico(): string {
        return this._historico;
    }
}
