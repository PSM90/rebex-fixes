// scripts/main.js

import { CompendiumUtilities, SpellConcentrationFixer } from './utilities.js';

// Funzione per registrare le impostazioni
function registerSettings() {
    // Registra un'impostazione del modulo per aprire il menu
    game.settings.registerMenu("rebex-fixes", "rebexFixesMenu", {
        name: "Rebex Fixes",
        label: "Rebex Fixes",
        hint: "Apri l'interfaccia per eseguire fix su compendi e schede.",
        icon: "fas fa-wrench",
        type: RebexFixesApp,
        restricted: true // Solo i GM possono aprire questa impostazione
    });

    // Registra una dummy setting per mantenere l'impostazione
    game.settings.register("rebex-fixes", "dummySetting", {
        name: "Rebex Fixes Setting",
        scope: "world",
        config: false,
        default: "",
        type: String
    });
}

// Inizializzazione del modulo
Hooks.once('init', () => {
    console.log('Rebex Fixes | Inizializzazione del modulo Rebex Fixes');
    registerSettings();
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
            template: "modules/rebex-fixes/templates/rebex-fixes.html",
            width: 500,
            height: "auto",
            closeOnSubmit: true
        });
    }

    async getData() {
        // Passaggio dei dati al template HTML
        return {
            actors: game.actors.map(actor => actor.name),
            compendiums: game.packs.map(pack => pack.collection)
        };
    }

    async _updateObject(event, formData) {
        // Gestisci l'invio dei dati del form
        console.log("Dati del form inviati:", formData);
    }

    activateListeners(html) {
        super.activateListeners(html);

        // Rendi visibili solo le opzioni pertinenti in base al tipo di fix selezionato
        const fixTypeSelect = html[0].querySelector('#fix-type');
        const actorSelect = html[0].querySelector('#actor-select');
        const compendiumSelect = html[0].querySelector('#compendium-select');
        const fixActorButton = html[0].querySelector('#fix-actor-button');
        const fixConcentrationButton = html[0].querySelector('#fix-concentration-button');

        function updateFormVisibility() {
            const fixType = fixTypeSelect.value;
            if (fixType === "actor") {
                actorSelect.style.display = "block";
                compendiumSelect.style.display = "none";
            } else {
                actorSelect.style.display = "none";
                compendiumSelect.style.display = "block";
            }
        }

        // Aggiorna la visibilità iniziale
        updateFormVisibility();

        // Cambia la visibilità quando si cambia il tipo di fix
        fixTypeSelect.addEventListener('change', updateFormVisibility);

        // Gestisci il click sul pulsante per fixare le schede PG
        fixActorButton.addEventListener('click', async () => {
            const actorName = actorSelect.value;
            await CompendiumUtilities.updateActorItems(actorName);
        });

        // Gestisci il click sul pulsante per fixare la concentrazione
        fixConcentrationButton.addEventListener('click', async () => {
            const fixType = fixTypeSelect.value;
            if (fixType === "actor") {
                // Esegui il fix della concentrazione sulle spell della scheda PG
                const actorName = actorSelect.value;
                await SpellConcentrationFixer.fixActorConcentration(actorName);
            } else if (fixType === "compendium") {
                // Esegui il fix della concentrazione su tutte le spell del compendio
                const compendiumName = compendiumSelect.value;
                await SpellConcentrationFixer.fixConcentration(compendiumName);
            }
        });
    }
}
