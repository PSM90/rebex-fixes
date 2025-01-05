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

        const documents = await pack.getDocuments();
        console.log(`Trovati ${documents.length} personaggi nel compendio "${compendiumName}".`);

        async function updateActor(actor) {
            console.log(`Iniziando aggiornamento per: "${actor.name}"`);

            const updatedItems = [];

            for (let item of actor.items) {
                const updateData = {};

                // Fix 0/0 sugli oggetti
                if (
                    item.system.uses &&
                    (item.system.uses.max === 0 || item.system.uses.max === "") &&
                    item.system.uses.spent === 0
                ) {
                    updateData["system.uses.max"] = "";
                    updateData["system.uses.spent"] = 0;
                }

                // Fix concentrazione se manca
                if (
                    item.type === "spell" &&
                    item.flags?.dnd5e?.migratedProperties?.includes("concentration") &&
                    !item.system.duration.concentration
                ) {
                    updateData["system.duration.concentration"] = true;
                }

                if (item.system.activities) {
                    updateData["system.activities"] = {
                        ...item.system.activities,
                        dnd5eactivity000: {
                            ...item.system.activities.dnd5eactivity000,
                            consumption: {
                                targets: [],
                                scaling: { ...item.system.activities?.dnd5eactivity000?.consumption?.scaling },
                                spellSlot: item.system.activities?.dnd5eactivity000?.consumption?.spellSlot
                            }
                        }
                    };
                }

                if (Object.keys(updateData).length > 0) {
                    updatedItems.push({ _id: item._id, ...updateData });
                }
            }

            if (updatedItems.length > 0) {
                try {
                    await actor.update({ items: updatedItems });
                    console.log(`Attore "${actor.name}" aggiornato con successo nel compendio.`);
                } catch (error) {
                    console.error(`Errore durante il salvataggio dell'attore "${actor.name}":`, error);
                }
            } else {
                console.log(`Nessun aggiornamento necessario per l'attore "${actor.name}".`);
            }
        }

        async function processActors(documents, delay) {
            for (let actor of documents) {
                await updateActor(actor);
                console.log(`Attesa di ${delay / 1000} secondi prima del prossimo aggiornamento...`);
                await new Promise(resolve => setTimeout(resolve, delay));
            }
            console.log(`Fix 0/0 e concentrazione completato per tutti i personaggi nel compendio "${compendiumName}".`);
        }

        processActors(documents, 2000);
    }

    // Funzione per aggiornare oggetti singoli 0/0
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
                                targets: [],
                                scaling: { ...item.system.activities?.dnd5eactivity000?.consumption?.scaling },
                                spellSlot: item.system.activities?.dnd5eactivity000?.consumption?.spellSlot
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

    // Fix Feet in Metri per singolo attore
    static async fixFeetToMetersActor(actorName) {
        let actor = game.actors.getName(actorName);
        if (!actor) {
            ui.notifications.error(`Personaggio "${actorName}" non trovato.`);
            return;
        }
        await this.convertFeetToMeters(actor.items);
        ui.notifications.info(`${actor.name}: Conversione piedi a metri completata!`);
    }

    // Fix Feet in Metri per compendio intero
    static async fixFeetToMetersCompendium(compendiumName) {
        const pack = game.packs.get(compendiumName);
        if (!pack) {
            ui.notifications.error(`Compendio "${compendiumName}" non trovato.`);
            return;
        }

        if (pack.locked) {
            await pack.configure({ locked: false });
        }

        const documents = await pack.getDocuments();

        for (let doc of documents) {
            await this.convertFeetToMeters(doc.items);
        }

        ui.notifications.info(`Compendio "${compendiumName}" aggiornato per piedi in metri!`);
    }

    // Conversione piedi in metri (formula: 1,5m = 5ft)
    static async convertFeetToMeters(items) {
        const FEET_TO_METERS = 1.5 / 5;

        for (let item of items) {
            const updateData = {};

            // Converti velocità e sensi
            if (item.system.attributes?.speed) {
                let speed = item.system.attributes.speed;
                if (speed.units === "ft") {
                    speed.value = (speed.value * FEET_TO_METERS).toFixed(1);
                    speed.units = "m";
                    updateData["system.attributes.speed"] = speed;
                }
            }

            // Converti attacchi (normal, reach) e distanze varie
            if (item.system.range) {
                if (item.system.range.units === "ft") {
                    item.system.range.value = (item.system.range.value * FEET_TO_METERS).toFixed(1);
                    item.system.range.long = item.system.range.long ? (item.system.range.long * FEET_TO_METERS).toFixed(1) : 0;
                    item.system.range.units = "m";
                    updateData["system.range"] = item.system.range;
                }
            }

            // Converti area (template)
            if (item.system.target?.template) {
                let template = item.system.target.template;
                if (template.units === "ft") {
                    template.width = template.width ? (template.width * FEET_TO_METERS).toFixed(1) : null;
                    template.height = template.height ? (template.height * FEET_TO_METERS).toFixed(1) : null;
                    template.size = template.size ? (template.size * FEET_TO_METERS).toFixed(1) : null;
                    template.units = "m";
                    updateData["system.target.template"] = template;
                }
            }

            // Esegui l'aggiornamento se ci sono modifiche
            if (Object.keys(updateData).length > 0) {
                try {
                    await item.update(updateData);
                    console.log(`Item ${item.name} convertito da piedi a metri con successo.`);
                } catch (error) {
                    console.error(`Errore nella conversione piedi a metri per ${item.name}:`, error);
                }
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
                const updateData = {
                    "system.duration.concentration": true
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
