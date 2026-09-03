import { Pessoa } from "./Pessoa";
import type { Endereco } from "./Endereco";
import type { Pet } from "./Pet";

export class Tutor extends Pessoa {
    private _dataCadastro: Date;
    private _endereco: Endereco;
    private _pets: Pet[];
    cpf: string;

    constructor(
        id: number,
        nome: string,
        telefone: string,
        email: string,
        dataCadastro: Date,
        endereco: Endereco,
        pets: Pet[] = [],
        cpf: string = ''
    ) {
        super(id, nome, telefone, email);
        this.cpf = cpf;

        this._dataCadastro = dataCadastro;
        this._endereco = endereco;
        this._pets = pets;
    }

    get dataCadastro(): Date {
        return this._dataCadastro;
    }

    getDataCadastro(): Date {
        return this._dataCadastro;
    }

    set dataCadastro(dataCadastro: Date) {
        this._dataCadastro = dataCadastro;
    }

    get endereco(): Endereco {
        return this._endereco;
    }

    getEndereco(): Endereco {
        return this._endereco;
    }

    set endereco(endereco: Endereco) {
        this._endereco = endereco;
    }

    setEndereco(endereco: Endereco): void {
        this._endereco = endereco;
    }

    get pets(): Pet[] {
        return [...this._pets];
    }

    getPets(): Pet[] {
        return [...this._pets];
    }

    adicionarPet(pet: Pet): void {
        if (!this._pets.includes(pet)) {
            this._pets.push(pet);
        }
    }

    removerPet(pet: Pet): void {
        this._pets = this._pets.filter(petCadastrado => petCadastrado !== pet);
    }
}
