// main.js

import { CompendiumUtilities, SpellConcentrationFixer } from "./utilities.js";

Hooks.once("ready", () => {
    game.settings.registerMenu("rebex-fixes", "menuSettings", {
        name: "Rebex Fixes",
        label: "Impostazioni",
        type: MenuSettings,
        restricted: true
    });

    game.settings.register("rebex-fixes", "selectedActor", {
        name: "Seleziona Scheda PG",
        scope: "client",
        config: false,
        type: String,
        default: ""
    });

    game.settings.register("rebex-fixes", "selectedCompendium", {
        name: "Seleziona Compendio",
        scope: "client",
        config: false,
        type: String,
        default: ""
    });

    console.log("Rebex Fixes inizializzato.");
});

// Event listener per i pulsanti
Hooks.on("renderSettingsConfig", (app, html, data) => {
    html.find("#update-items-button").on("click", () => {
        const actorName = game.settings.get("rebex-fixes", "selectedActor");
        CompendiumUtilities.updateActorItems(actorName);
    });

    html.find("#update-compendium-button").on("click", () => {
        const compendiumName = game.settings.get("rebex-fixes", "selectedCompendium");
        CompendiumUtilities.updateCompendiumItems(compendiumName);
    });

    html.find("#fix-spells-actor-button").on("click", () => {
        const actorName = game.settings.get("rebex-fixes", "selectedActor");
        SpellConcentrationFixer.updateActorSpells(actorName);
    });
});
