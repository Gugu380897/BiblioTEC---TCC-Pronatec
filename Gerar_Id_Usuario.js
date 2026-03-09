// JS/gerarIdUsuario.js
import { db } from "./Firebase_Auth.js";
import { ref, runTransaction } from "https://www.gstatic.com/firebasejs/12.10.0/firebase-database.js";

export async function gerarProximoIdUsuario() {
    const contadorRef = ref(db, 'contadores/proximoIdUsuario');
    let novoId;
    await runTransaction(contadorRef, (currentValue) => {
        if (currentValue === null) {
            novoId = 1;
            return 2; // próximo valor após usar 1
        } else {
            novoId = currentValue;
            return currentValue + 1;
        }
    });
    return novoId;
}