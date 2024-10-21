// utilities.js

export class CompendiumUtilities {
    static async updateActorItems(actorName) {
        let actor = game.actors.getName(actorName);
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

                console.log(`Aggiornamento item ${item.name}:`, updateData);
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

                console.log(`Aggiornamento item compendio ${item.name}:`, updateData);
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

    static listCompendiums() {
        game.packs.forEach(p => console.log(p.collection));
    }
}

export class SpellConcentrationFixer {
    static async fixActorConcentration(actorName) {
        const actor = game.actors.getName(actorName);
        if (!actor) {
            ui.notifications.error(`Personaggio "${actorName}" non trovato.`);
            return;
        }

        let spells = actor.items.filter(item => item.type === "spell");
        for (let spell of spells) {
            if (spell.system.components?.concentration) {
                try {
                    await spell.update({ "system.components.concentration": true });
                    console.log(`Concentrazione fissata per ${spell.name} di ${actorName}`);
                } catch (error) {
                    console.error(`Errore nella correzione di ${spell.name}:`, error);
                }
            }
        }

        ui.notifications.info(`Concentrazione fissata per tutte le spell di ${actorName}`);
    }

    static async fixConcentration(compendiumName) {
        const pack = game.packs.get(compendiumName);
        if (!pack) {
            ui.notifications.error(`Compendio "${compendiumName}" non trovato.`);
            return;
        }

        const items = await pack.getDocuments();
        for (let item of items) {
            if (item.type === "spell" && item.system.components?.concentration) {
                try {
                    await item.update({ "system.components.concentration": true });
                    console.log(`Concentrazione fissata per ${item.name}`);
                } catch (error) {
                    console.error(`Errore nella correzione di ${item.name}:`, error);
                }
            }
        }

        ui.notifications.info(`Concentrazione fissata per tutte le spell del compendio "${compendiumName}"`);
    }
}
