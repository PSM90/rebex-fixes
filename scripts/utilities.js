// utilities.js

export class CompendiumUtilities {
    // Funzione per aggiornare gli oggetti di una scheda personaggio se 0/0
    static async updateActorItems(actorName) {
        let actor = game.actors.getName(actorName);
        if (!actor) {
            ui.notifications.error(`Personaggio "${actorName}" non trovato.`);
            return;
        }

        await this.updateItems(actor.items);
        ui.notifications.info(`${actor.name}: Oggetti aggiornati correttamente!`);
    }

    // Funzione per aggiornare tutti gli oggetti in un compendio se 0/0
    static async updateCompendiumItems(compendiumName) {
        const pack = game.packs.get(compendiumName);
        if (!pack) {
            ui.notifications.error(`Compendio "${compendiumName}" non trovato.`);
            return;
        }

        if (pack.locked) {
            await pack.configure({ locked: false });
        }

        const items = await pack.getDocuments();

        for (let item of items) {
            if (item.type === "character") {
                // Aggiorna gli oggetti di una scheda personaggio nel compendio
                await this.updateItems(item.items);
            } else {
                // Aggiorna un oggetto normale nel compendio
                await this.updateSingleItem(item);
            }
        }
        ui.notifications.info(`Compendio "${compendiumName}" aggiornato correttamente!`);
    }

    // Funzione per fixare un compendio di spell seguendo l'azione manuale specificata
    static async fixSpellCompendium(compendiumName) {
        const pack = game.packs.get(compendiumName);
        if (!pack) {
            ui.notifications.error(`Compendio "${compendiumName}" non trovato.`);
            return;
        }

        const wasLocked = pack.locked;
        if (wasLocked) await pack.configure({ locked: false });

        const documents = await pack.getDocuments();

        for (let spell of documents) {
            await this.applyManualSpellFix(spell);
        }

        if (wasLocked) await pack.configure({ locked: true });
        ui.notifications.info(`Compendio di incantesimi "${compendiumName}" aggiornato correttamente!`);
    }

    // Funzione per applicare manualmente il fix a ciascun incantesimo
    static async applyManualSpellFix(spell) {
        const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

        return new Promise((resolve) => {
            const sheet = spell.sheet;
            sheet.render(true);

            Hooks.once("renderItemSheet5e", async (app, html) => {
                const $html = $(html);

                // Step 2: Apri la scheda DETAILS e applica le fix per system.uses.max e system.uses.spent
                $html.find('a[data-tab="details"]').click();
                await delay(2000);
                console.log("Step 2: Aperta la scheda DETAILS.");

                // Check and fix for 0/0 on uses
                const usesMax = $html.find('input[name="system.uses.max"]').val();
                const usesSpent = $html.find('input[name="system.uses.spent"]').val();

                if (usesMax === "0" && usesSpent === "0") {
                    $html.find('input[name="system.uses.max"]').val('');
                }
                await delay(2000);
                console.log("Step 2b: Applicata fix su system.uses.max e system.uses.spent.");

                // Fix concentrazione
                if (
                    spell.type === "spell" &&
                    spell.flags?.dnd5e?.migratedProperties?.includes("concentration") &&
                    !spell.system.duration.concentration
                ) {
                    $html.find('[name="system.properties.concentration"]').prop('checked', true);
                }
                await delay(2000);
                console.log("Step 2c: Applicata fix di concentrazione.");

                // Step 3: Apri la scheda ACTIVITIES
                $html.find('a[data-tab="activities"]').click();
                await delay(2000);
                console.log("Step 3: Aperta la scheda ACTIVITIES.");

                // Step 4-8: Per ogni activity, applica la fix
                const activityCards = $html.find('.activity.card');
                for (let activityCard of activityCards) {
                    const $activity = $(activityCard);

                    // Step 5: Apri la scheda ACTIVATION
                    $activity.find('a[data-tab="activation"][data-action="tab"]').click();
                    await delay(2000);
                    console.log("Step 5: Aperta la scheda ACTIVATION per l'activity.");

                    // Step 6: Apri la scheda CONSUMPTION
                    $activity.find('a[data-group="activation"][data-tab="consumption"]').click();
                    await delay(2000);
                    console.log("Step 6: Aperta la scheda CONSUMPTION per l'activity.");

                    // Step 7: Controllo e rimozione itemUses se necessario
                    const consumptionType = $activity.find('select[name="system.consumption.targets.0.type"]').val();
                    const consumptionValue = $activity.find('input[name="system.consumption.targets.0.value"]').val();

                    if (consumptionType === "itemUses" && consumptionValue === "0") {
                        $activity.find('button[data-action="deleteConsumption"]').trigger('click');
                        await delay(2000);
                        console.log("Step 7: Rimosso itemUses dall'activity.");
                    }
                }

                // Step 9: Salva e chiude la scheda della spell
                await app.submit();
                $html.find('.header-button.control.close').trigger('click');
                await delay(2000);
                console.log("Step 9: Salvata e chiusa la scheda della spell.");

                resolve();
            });
        });
    }

    // Funzione generica per aggiornare una lista di oggetti
    static async updateItems(items) {
        for (let item of items) {
            if (item.system.uses && (item.system.uses.max === 0 || item.system.uses.max === "") && item.system.uses.spent === 0) {
                const updateData = {
                    "system.uses.max": "",
                    "system.uses.spent": 0,
                    "system.activities": item.system.activities ? {
                        ...item.system.activities,
                        "dnd5eactivity000": {
                            ...item.system.activities.dnd5eactivity000,
                            "consumption": {
                                "targets": [],
                                "scaling": {
                                    "allowed": false,
                                    "max": ""
                                },
                                "spellSlot": true
                            }
                        }
                    } : {}
                };

                console.log(`Aggiornamento item ${item.name}:`, updateData);
                try {
                    await item.update(updateData);
                    console.log(`Item ${item.name} aggiornato con successo`);
                } catch (error) {
                    console.error(`Errore nell'aggiornamento di ${item.name}:`, error);
                }
            }
        }
    }

    // Funzione per aggiornare un singolo oggetto
    static async updateSingleItem(item) {
        if (item.system.uses && (item.system.uses.max === 0 || item.system.uses.max === "") && item.system.uses.spent === 0) {
            const updateData = {
                "system.uses.max": "",
                "system.uses.spent": 0,
                "system.activities": item.system.activities ? {
                    ...item.system.activities,
                    "dnd5eactivity000": {
                        ...item.system.activities.dnd5eactivity000,
                        "consumption": {
                            "targets": [],
                            "scaling": {
                                "allowed": false,
                                "max": ""
                            },
                            "spellSlot": true
                        }
                    }
                } : {}
            };

            console.log(`Aggiornamento item compendio ${item.name}:`, updateData);
            try {
                await item.update(updateData);
                console.log(`Item compendio ${item.name} aggiornato con successo`);
            } catch (error) {
                console.error(`Errore nell'aggiornamento di ${item.name}:`, error);
            }
        }
    }
}

export class SpellConcentrationFixer {
    static async updateActorSpells(actorName) {
        let actor = game.actors.getName(actorName);
        if (!actor) {
            ui.notifications.error(`Personaggio "${actorName}" non trovato.`);
            return;
        }

        await this.updateSpells(actor.items);
        ui.notifications.info(`${actor.name}: Spell aggiornate correttamente!`);
    }

    static async updateCompendiumSpells(compendiumName) {
        const pack = game.packs.get(compendiumName);
        if (!pack) {
            ui.notifications.error(`Compendio "${compendiumName}" non trovato.`);
            return;
        }

        if (pack.locked) {
            await pack.configure({ locked: false });
        }

        const items = await pack.getDocuments();

        for (let item of items) {
            if (item.type === "character") {
                await this.updateSpells(item.items);
            } else if (item.type === "spell") {
                await this.updateSingleSpell(item);
            }
        }
        ui.notifications.info(`Compendio "${compendiumName}" aggiornato correttamente!`);
    }

    static async updateSpells(items) {
        for (let item of items) {
            if (item.type === "spell" && item.flags?.dnd5e?.migratedProperties?.includes("concentration") && !item.system.duration.concentration) {
                let properties = Array.isArray(item.system.properties) ? item.system.properties : [];

                if (!properties.includes("concentration")) {
                    const updateData = {
                        "flags.midiProperties.concentration": true,
                        "system.duration.concentration": true,
                        "system.properties": [...properties, "concentration"]
                    };

                    console.log(`Aggiornamento concentrazione spell ${item.name}:`, updateData);
                    try {
                        await item.update(updateData);
                        console.log(`Concentrazione spell ${item.name} aggiornata con successo`);
                    } catch (error) {
                        console.error(`Errore nell'aggiornamento della concentrazione di ${item.name}:`, error);
                    }
                }
            }
        }
    }

    static async updateSingleSpell(item) {
        if (item.type === "spell" && item.flags?.dnd5e?.migratedProperties?.includes("concentration") && !item.system.duration.concentration) {
            let properties = Array.isArray(item.system.properties) ? item.system.properties : [];

            if (!properties.includes("concentration")) {
                const updateData = {
                    "flags.midiProperties.concentration": true,
                    "system.duration.concentration": true,
                    "system.properties": [...properties, "concentration"]
                };

                console.log(`Aggiornamento concentrazione spell compendio ${item.name}:`, updateData);
                try {
                    await item.update(updateData);
                    console.log(`Concentrazione spell compendio ${item.name} aggiornata con successo`);
                } catch (error) {
                    console.error(`Errore nell'aggiornamento della concentrazione di ${item.name}:`, error);
                }
            }
        }
    }
}
