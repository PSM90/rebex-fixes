// main.js

import { showFixSelectionDialog } from './helpers.js';

Hooks.once('init', async function () {
    console.log("Rebex Fixes | Inizializzazione del modulo...");
});

Hooks.once('ready', async function () {
    console.log("Rebex Fixes | Modulo pronto!");

    // Aggiunta dell'opzione nelle impostazioni per aprire la finestra di dialogo di selezione
    game.settings.registerMenu("rebex-fixes", "fixSelection", {
        name: "Rebex Fixes",
        label: "Apri finestra di Fix",
        hint: "Permette di selezionare un target e applicare i fix di oggetti e incantesimi.",
        icon: "fas fa-wrench",
        type: showFixSelectionDialog,
        restricted: true
    });

    console.log("Rebex Fixes | Impostazione di gioco registrata.");
});

Hooks.on('renderSettingsConfig', (app, html, data) => {
    // Questa funzione serve per assicurarsi che la finestra di dialogo venga visualizzata correttamente
    console.log("Rebex Fixes | Configurazione delle impostazioni resa.");
});
