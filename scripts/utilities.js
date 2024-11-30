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

    // Funzione per aggiornare una lista di oggetti
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
                                "scaling": { ...item.system.activities?.dnd5eactivity000?.consumption?.scaling },
                                "spellSlot": item.system.activities?.dnd5eactivity000?.consumption?.spellSlot
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
                "system.activities": item.system.activities
                    ? {
                          ...item.system.activities, // Mantiene gli _id originali delle activities
                          dnd5eactivity000: {
                              ...item.system.activities.dnd5eactivity000,
                              consumption: {
                                  targets: [],
                                  scaling: { ...item.system.activities?.dnd5eactivity000?.consumption?.scaling },
                                  spellSlot: item.system.activities?.dnd5eactivity000?.consumption?.spellSlot
                              }
                          }
                      }
                    : {}
            };

            console.log(`Aggiornamento item compendio ${item.name}:`, updateData);

            try {
                await item.update(updateData);
                console.log(`Item compendio ${item.name} aggiornato con successo.`);
            } catch (error) {
                console.error(`Errore nell'aggiornamento di "${item.name}":`, error);
            }
        }
    }

    // Funzione per fixare un compendio di spell
    static async fixSpellCompendium(compendiumName) {
        const pack = game.packs.get(compendiumName);
        if (!pack) {
            ui.notifications.error(`Compendio "${compendiumName}" non trovato.`);
            return;
        }

        const wasLocked = pack.locked;
        if (wasLocked) await pack.configure({ locked: false });

        const documents = await pack.getDocuments();

        for (let doc of documents) {
            let updatedActivities = {};

            // for (const [activityKey, activity] of Object.entries(doc.system.activities || {})) {
            //     const newId = `dnd5eactivity-${doc.id}-${Math.floor(Math.random() * 100000)}`;
            //
            //     if (activity._id === "dnd5eactivity000") {
            //         activity._id = newId;
            //         console.log(`Aggiornato ID activity per "${doc.name}": ${newId}`);
            //     }
            //     updatedActivities[activityKey] = activity;
            // }

            for (const [activityKey, activity] of Object.entries(doc.system.activities || {})) {
                updatedActivities[activityKey] = {
                    ...activity,
                    consumption: activity.consumption || {}
                };
            }

            await doc.update({ "system.activities": updatedActivities });
        }

        if (wasLocked) await pack.configure({ locked: true });
        ui.notifications.info(`Compendio di incantesimi "${compendiumName}" aggiornato correttamente!`);
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
