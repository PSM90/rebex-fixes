// main.js

import { CompendiumUtilities, SpellConcentrationFixer } from './utilities.js';

function registerSettings() {
    game.settings.registerMenu("rebex-fixes", "rebexFixesMenu", {
        name: "Rebex Fixes",
        label: "Rebex Fixes",
        hint: "Apri l'interfaccia per eseguire fix su compendi e schede.",
        icon: "fas fa-wrench",
        type: RebexFixesApp,
        restricted: true
    });

    game.settings.register("rebex-fixes", "dummySetting", {
        name: "Rebex Fixes Setting",
        scope: "world",
        config: false,
        default: "",
        type: String
    });
}

Hooks.once('init', () => {
    console.log('Rebex Fixes | Inizializzazione del modulo Rebex Fixes');
    registerSettings();
});

Hooks.once('ready', () => {
    if (game.user.isGM) {
        console.log('Rebex Fixes | Modulo pronto e disponibile per l\'uso');
    }
});

class RebexFixesApp extends FormApplication {
    constructor() {
        super();
    }

    static get defaultOptions() {
        return foundry.utils.mergeObject(super.defaultOptions, {
            id: "rebex-fixes-app",
            title: "Rebex Fixes",
            template: "modules/rebex-fixes/templates/rebex-fixes.html",
            width: 500,
            height: "auto",
            closeOnSubmit: true
        });
    }

    async getData() {
        return {
            actors: game.actors.map(actor => actor.name),
            compendiums: game.packs.filter(pack =>
                pack.documentName === "Item" || pack.documentName === "Actor"
            ).map(pack => pack.collection)
        };
    }

    async _updateObject(event, formData) {
        console.log("Dati del form inviati:", formData);
    }

    activateListeners(html) {
        super.activateListeners(html);

        const fixTypeSelect = html.find('#fix-type');
        const actorSelect = html.find('#actor-select');
        const compendiumSelect = html.find('#compendium-select');
        const fixActorButton = html.find('#fix-actor-button');
        const fixConcentrationButton = html.find('#fix-concentration-button');

        function updateFormVisibility() {
            const fixType = fixTypeSelect.val();
            if (fixType === "actor") {
                actorSelect.show();
                compendiumSelect.hide();
            } else {
                actorSelect.hide();
                compendiumSelect.show();
            }
        }

        updateFormVisibility();

        fixTypeSelect.on('change', updateFormVisibility);

        fixActorButton.on('click', async () => {
            const fixType = fixTypeSelect.val();
            if (fixType === "actor") {
                const actorName = actorSelect.val();
                await CompendiumUtilities.updateActorItems(actorName);
            } else if (fixType === "compendium") {
                const compendiumName = compendiumSelect.val();
                await CompendiumUtilities.updateCompendiumItems(compendiumName);
            }
        });

        fixConcentrationButton.on('click', async () => {
            const fixType = fixTypeSelect.val();
            if (fixType === "actor") {
                const actorName = actorSelect.val();
                await SpellConcentrationFixer.updateActorSpells(actorName);
            } else if (fixType === "compendium") {
                const compendiumName = compendiumSelect.val();
                await SpellConcentrationFixer.updateCompendiumSpells(compendiumName);
            }
        });
    }
}
