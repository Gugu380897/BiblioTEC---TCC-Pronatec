// JS/Models/Usuario.js
export class Usuario {
    constructor(uid, email, dados = {}) {
        this.uid = uid;
        this.email = email;
        this.tipo = dados.tipo || 'desconhecido';
        this.createdAt = dados.createdAt || new Date().toISOString();
        this.idNumerico = dados.idNumerico || null;
    }

    getTipoDisplay() {
        const tipos = {
            estudante: 'Estudante',
            leitor: 'Leitor',
            bibliotecario: 'Bibliotecário'
        };
        return tipos[this.tipo] || 'Usuário';
    }

    toJSON() {
        return {
            email: this.email,
            tipo: this.tipo,
            createdAt: this.createdAt,
            idNumerico: this.idNumerico
        };
    }
}