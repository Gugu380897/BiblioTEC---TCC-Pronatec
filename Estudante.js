// JS/Models/Estudante.js
import { Usuario } from './Usuario.js';

export class Estudante extends Usuario {
    constructor(uid, email, dados = {}) {
        super(uid, email, { ...dados, tipo: 'estudante' });
        this.idEstudante = dados.idEstudante || '';
        this.emailInstitucional = dados.emailInstitucional || email;
        this.idNumerico = dados.idNumerico || null;
    }

    toJSON() {
        return {
            ...super.toJSON(),
            idEstudante: this.idEstudante,
            emailInstitucional: this.emailInstitucional,
            idNumerico: this.idNumerico
        };
    }

    static fromJSON(uid, data) {
        return new Estudante(uid, data.email, data);
    }
}