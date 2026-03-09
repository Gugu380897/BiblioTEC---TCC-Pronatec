// JS/Models/Bibliotecario.js
import { Usuario } from './Usuario.js';

export class Bibliotecario extends Usuario {
    constructor(uid, email, dados = {}) {
        super(uid, email, { ...dados, tipo: 'bibliotecario' });
        this.nome = dados.nome || '';
        this.idBiblioteca = dados.idBiblioteca || '';
        this.idBibliotecarioNum = dados.idBibliotecarioNum || null;
    }

    toJSON() {
        return {
            ...super.toJSON(),
            nome: this.nome,
            idBiblioteca: this.idBiblioteca,
            idBibliotecarioNum: this.idBibliotecarioNum
        };
    }

    static fromJSON(uid, data) {
        return new Bibliotecario(uid, data.email, data);
    }
}