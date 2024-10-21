// scripts/main.js

import { CompendiumUtilities, SpellConcentrationFixer } from './utilities.js';

Hooks.once('init', () => {
    console.log('Rebex Fixes | Inizializzazione del modulo Rebex Fixes');

    // Registra un'impostazione del modulo per visualizzare l'interfaccia
    game.settings.registerMenu("rebex-fixes", "rebexFixesMenu", {
        name: "Rebex Fixes",
        label: "Apri Interfaccia di Fix",
        hint: "Apri l'interfaccia per eseguire fix su compendi e schede.",
        icon: "fas fa-wrench", // Puoi cambiare l'icona se preferisci
        type: RebexFixesApp,
        restricted: true // Solo i GM possono aprire questa impostazione
    });
});

Hooks.once('ready', () => {
    if (game.user.isGM) {
        console.log('Rebex Fixes | Modulo pronto e disponibile per l\'uso');
    }
});

// Classe per l'interfaccia dell'utente del modulo
class RebexFixesApp extends FormApplication {
    constructor() {
        super();
    }

    static get defaultOptions() {
        return mergeObject(super.defaultOptions, {
            id: "rebex-fixes-app",
            title: "Rebex Fixes",
            template: "templates/rebex-fixes.html",
            width: 500,
            height: "auto",
            closeOnSubmit: true
        });
    }

    async getData() {
        // Passaggio dei dati al template HTML
        return {
            actors: game.actors.entities,
            compendiums: game.packs.keys()
        };
    }

    async _updateObject(event, formData) {
        // Gestisci l'invio dei dati del form
        console.log("Dati del form inviati:", formData);
    }
}
