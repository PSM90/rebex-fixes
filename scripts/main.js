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
    game.settings.registerMenu('rebex-fixes', 'tokenPathFixMenu', {
        name: 'Fix Percorsi Token',
        label: 'Apri Scheda',
        hint: 'Modifica massivamente i percorsi dei token nei compendi selezionati.',
        icon: 'fas fa-map-marker-alt',
        type: TokenPathFixForm,
        restricted: true,
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
        const fixFeetToMetersButton = html.find('#fix-feet-to-meters-button');
        const fixFeetToMetersButtonPG = html.find('#fix-feet-to-meters-pg-button');
        const fixFeetToMetersButtonTK = html.find('#fix-feet-to-meters-tk-button');

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

        fixFeetToMetersButton.on('click', async () => {
            const fixType = fixTypeSelect.val();
            if (fixType === "actor") {
                const actorName = actorSelect.val();
                await CompendiumUtilities.fixFeetToMetersActor(actorName, 'items');
            } else if (fixType === "compendium") {
                const compendiumName = compendiumSelect.val();
                await CompendiumUtilities.fixFeetToMetersCompendium(compendiumName, 'items');
            }
        });

        fixFeetToMetersButtonPG.on('click', async () => {
            const fixType = fixTypeSelect.val();
            if (fixType === "actor") {
                const actorName = actorSelect.val();
                await CompendiumUtilities.fixFeetToMetersActor(actorName, 'pg');
            } else if (fixType === "compendium") {
                const compendiumName = compendiumSelect.val();
                await CompendiumUtilities.fixFeetToMetersCompendium(compendiumName, 'pg');
            }
        });

        fixFeetToMetersButtonTK.on('click', async () => {
            const fixType = fixTypeSelect.val();
            if (fixType === "actor") {
                const actorName = actorSelect.val();
                await CompendiumUtilities.updateVisionForActor(actorName);
            } else if (fixType === "compendium") {
                const compendiumName = compendiumSelect.val();
                await CompendiumUtilities.updateVisionForCompendium(compendiumName);
            }
        });
    }
}

class TokenPathFixForm extends FormApplication {
    constructor(...args) {
        super(...args);
        this.mostCommonPath = ''; // Path più ricorrente
    }

    static get defaultOptions() {
        return mergeObject(super.defaultOptions, {
            id: 'token-path-fix-form',
            title: 'Fix Percorsi Token',
            template: 'modules/rebex-fixes/templates/token-path-fix.html',
            width: 600,
            height: 'auto',
        });
    }

    /** Ottieni i dati per la scheda */
    async getData() {
        const compendiums = game.packs.contents
            .filter((pack) => pack.metadata.type === 'Actor')
            .map((pack) => ({ name: pack.collection, label: pack.metadata.label }));
        return { compendiums, mostCommonPath: this.mostCommonPath };
    }

    /** Gestisci invio del form */
    async _updateObject(event, formData) {
        const compendiumName = formData.compendiumSelect;
        const newPath = formData.newTokenPath.trim();

        if (!newPath.endsWith('/')) {
            ui.notifications.error('Il percorso deve terminare con una "/"');
            return;
        }

        await CompendiumUtilities.fixTokenPaths(compendiumName, newPath);
        ui.notifications.info('Percorsi aggiornati con successo!');
    }

    /** Eventi del form */
    activateListeners(html) {
        super.activateListeners(html);

        // Aggiorna il path più ricorrente
        html.find('#compendiumSelect').on('change', async (event) => {
            const compendiumName = event.target.value;
            const mostCommonPath = await CompendiumUtilities.getMostCommonPath(compendiumName);
            this.mostCommonPath = mostCommonPath || 'Nessun dato disponibile';
            html.find('#mostCommonPath').text(this.mostCommonPath);
        });
    }
}
