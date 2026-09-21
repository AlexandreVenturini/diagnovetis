export const EXAME_STATUS = ['solicitado', 'agendado', 'coletado', 'aguardando_resultado', 'concluido', 'cancelado'] as const;
export type ExameStatus = typeof EXAME_STATUS[number];
export type ExameCategoria = 'laboratorial' | 'imagem' | 'outro';
export const EXAME_STATUS_LABEL: Record<ExameStatus, string> = {
    solicitado: 'Solicitado', agendado: 'Agendado', coletado: 'Coletado',
    aguardando_resultado: 'Aguardando resultado', concluido: 'Concluído', cancelado: 'Cancelado',
};

export type LaudoAnexo = { nome: string; tipo: string; dados: string };

export class Exame {
    laudo = '';
    laudoAnexo: LaudoAnexo | null = null;
    categoria: ExameCategoria = 'outro';
    dataSolicitacao: Date;
    dataRealizacao: Date | null;
    status: ExameStatus;
    interpretacao = '';
    consultaId?: number;
    private _id: number;
    private _nomeExame: string;
    private _dataExame: Date;
    private _resultado: string;

    constructor(
        id: number,
        nomeExame: string,
        dataExame: Date,
        resultado: string
    ) {
        this._id = id;
        this._nomeExame = nomeExame;
        this._dataExame = dataExame;
        this._resultado = resultado;
        this.dataSolicitacao = dataExame;
        this.dataRealizacao = resultado.trim() ? dataExame : null;
        this.status = resultado.trim() ? 'concluido' : 'solicitado';
    }

    get nomeExame(): string {
        return this._nomeExame;
    }

    get id(): number {
        return this._id;
    }

    getId(): number {
        return this._id;
    }

    getNomeExame(): string {
        return this._nomeExame;
    }

    get dataExame(): Date {
        return this._dataExame;
    }

    getDataExame(): Date {
        return this._dataExame;
    }

    get resultado(): string {
        return this._resultado;
    }

    getResultado(): string {
        return this._resultado;
    }

    set resultado(resultado: string) {
        this._resultado = resultado;
    }

    setResultado(resultado: string): void {
        this._resultado = resultado;
    }
}
