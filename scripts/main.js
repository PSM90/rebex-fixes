// scripts/main.js

import { CompendiumUtilities, SpellConcentrationFixer } from './utilities.js';

// Inizializzazione del modulo
Hooks.once('init', () => {
    console.log('Rebex Fixes | Inizializzazione del modulo Rebex Fixes');

    // Registra un'impostazione del modulo per visualizzare l'interfaccia nelle Impostazioni di gioco
    game.settings.registerMenu("rebex-fixes", "rebexFixesMenu", {
        name: "Rebex Fixes",
        label: "Rebex Fixes",
        hint: "Apri l'interfaccia per eseguire fix su compendi e schede.",
        icon: "fas fa-wrench",
        type: RebexFixesApp,
        restricted: true // Solo i GM possono aprire questa impostazione
    });

    // Registra una dummy setting per mantenere il menu nel registro
    game.settings.register("rebex-fixes", "dummySetting", {
        name: "Rebex Fixes Setting",
        scope: "world",
        config: false,
        default: "",
        type: String
    });
});

Hooks.once('ready', () => {
    if (game.user.isGM) {
        console.log('Rebex Fixes | Modulo pronto e disponibile per l\'uso');
    }
});

// Classe per gestire l'interfaccia dell'utente del modulo
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

    activateListeners(html) {
        super.activateListeners(html);

        // Gestisci il click sul pulsante per fixare un attore
        html[0].querySelector('#fix-actor-button').addEventListener('click', async () => {
            const actorSelect = html[0].querySelector('#actor-select');
            const actorName = actorSelect.value;
            await CompendiumUtilities.updateActorItems(actorName);
        });

        // Gestisci il click sul pulsante per fixare un compendio
        html[0].querySelector('#fix-compendium-button').addEventListener('click', async () => {
            const compendiumSelect = html[0].querySelector('#compendium-select');
            const compendiumName = compendiumSelect.value;
            await CompendiumUtilities.updateCompendiumItems(compendiumName);
        });

        // Gestisci il click sul pulsante per correggere la concentrazione
        html[0].querySelector('#fix-concentration-button').addEventListener('click', async () => {
            const compendiumSelect = html[0].querySelector('#compendium-select');
            const compendiumName = compendiumSelect.value;
            await SpellConcentrationFixer.fixConcentration(compendiumName);
        });
    }
}
