// scripts/utilities.js

export class CompendiumUtilities {
    // Funzione per aggiornare gli oggetti di un attore
    static async updateActorItems(actorName) {
        const actor = game.actors.getName(actorName);
        if (!actor) {
            ui.notifications.error(`Personaggio "${actorName}" non trovato.`);
            return;
        }

        for (let item of actor.items) {
            if (item.system.uses && item.system.uses.max === 0 && item.system.uses.spent === 0) {
                const updateData = {
                    "system.uses.max": "",
                    "system.uses.spent": 0,
                    "system.activities": {
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
                    }
                };

                try {
                    await item.update(updateData);
                    console.log(`Item ${item.name} aggiornato con successo`);
                } catch (error) {
                    console.error(`Errore nell'aggiornamento di ${item.name}:`, error);
                }
            }
        }

        ui.notifications.info(`${actor.name}: Oggetti aggiornati correttamente!`);
    }

    // Funzione per aggiornare gli oggetti di un compendio
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
            if (item.system.uses && item.system.uses.max === 0 && item.system.uses.spent === 0) {
                const updateData = {
                    "system.uses.max": "",
                    "system.uses.spent": 0,
                    "system.activities": {
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
                    }
                };

                try {
                    await item.update(updateData);
                    console.log(`Item compendio ${item.name} aggiornato con successo`);
                } catch (error) {
                    console.error(`Errore nell'aggiornamento di ${item.name}:`, error);
                }
            }
        }

        ui.notifications.info(`Compendio "${compendiumName}" aggiornato correttamente!`);
    }
}

export class SpellConcentrationFixer {
    static async fixConcentration(compendiumName) {
        const pack = game.packs.get(compendiumName);
        if (!pack) {
            ui.notifications.error(`Compendio "${compendiumName}" non trovato.`);
            return;
        }

        const items = await pack.getDocuments();
        for (let item of items) {
            if (item.type === "spell" && item.system.duration && item.system.duration.concentration) {
                try {
                    await item.update({ "system.duration.concentration": true });
                    console.log(`Concentrazione aggiornata per ${item.name}`);
                } catch (error) {
                    console.error(`Errore nell'aggiornamento della concentrazione di ${item.name}:`, error);
                }
            }
        }

        ui.notifications.info(`Correzione della concentrazione completata per il compendio "${compendiumName}"`);
    }
}
