// scripts/main.js

import { CompendiumUtilities, SpellConcentrationFixer } from './utilities.js';

Hooks.once('init', () => {
    console.log('Rebex Fixes | Inizializzazione del modulo Rebex Fixes');
});

Hooks.once('ready', () => {
    if (game.user.isGM) {
        console.log('Rebex Fixes | Modulo pronto e disponibile per l\'uso');
        new RebexFixesApp().render(true);
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
        // Gestisce l'invio dei dati del form
        console.log("Dati del form inviati:", formData);
    }
}

$(document).on('click', '#fix-actor-button', async function() {
    const actorName = $('#actor-select').val();
    await CompendiumUtilities.updateActorItems(actorName);
});

$(document).on('click', '#fix-compendium-button', async function() {
    const compendiumName = $('#compendium-select').val();
    await CompendiumUtilities.updateCompendiumItems(compendiumName);
});

$(document).on('click', '#fix-concentration-button', async function() {
    const compendiumName = $('#compendium-select').val();
    await SpellConcentrationFixer.fixConcentration(compendiumName);
});
