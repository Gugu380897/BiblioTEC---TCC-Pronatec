// JS/Models/Leitor.js
import { Usuario } from './Usuario.js';

export class Leitor extends Usuario {
    constructor(uid, email, dados = {}) {
        super(uid, email, { ...dados, tipo: 'leitor' });
        this.cpf = dados.cpf || '';
        this.idNumerico = dados.idNumerico || null;
    }

    toJSON() {
        return {
            ...super.toJSON(),
            cpf: this.cpf,
            idNumerico: this.idNumerico
        };
    }

    static fromJSON(uid, data) {
        return new Leitor(uid, data.email, data);
    }
}