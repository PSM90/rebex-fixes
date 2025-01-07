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
                    "system.uses.spent": 0
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

    // Fix Feet in Metri per attore
    static async fixFeetToMetersActor(actorName) {
        let actor = game.actors.getName(actorName);
        if (!actor) {
            ui.notifications.error(`Personaggio "${actorName}" non trovato.`);
            return;
        }
        await this.convertFeetToMeters(actor.items);
        ui.notifications.info(`${actor.name}: Conversione piedi a metri completata!`);
    }

    // Fix Feet in Metri per compendio
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

            // Converti velocità e movimento
            if (item.system.attributes?.movement && item.system.attributes.movement.units === "ft") {
                for (const key of Object.keys(item.system.attributes.movement)) {
                    if (typeof item.system.attributes.movement[key] === 'number' && item.system.attributes.movement[key] > 0) {
                        item.system.attributes.movement[key] = (item.system.attributes.movement[key] * FEET_TO_METERS).toFixed(1);
                    }
                }
                item.system.attributes.movement.units = "m";
                updateData["system.attributes.movement"] = item.system.attributes.movement;
            }

            // Converti sensi (es: darkvision, truesight)
            if (item.system.attributes?.senses && item.system.attributes.senses.units === "ft") {
                for (const key of Object.keys(item.system.attributes.senses)) {
                    if (typeof item.system.attributes.senses[key] === 'number' && item.system.attributes.senses[key] > 0) {
                        item.system.attributes.senses[key] = (item.system.attributes.senses[key] * FEET_TO_METERS).toFixed(1);
                    }
                }
                item.system.attributes.senses.units = "m";
                updateData["system.attributes.senses"] = item.system.attributes.senses;
            }

            // Converti attacchi (range e reach)
            if (item.system.range) {
                if (item.system.range.units === "ft") {
                    item.system.range.value = (item.system.range.value * FEET_TO_METERS).toFixed(1);
                    item.system.range.reach = item.system.range.reach === "" ? 1.5 : (item.system.range.reach * FEET_TO_METERS).toFixed(1);
                    item.system.range.units = "m";
                    updateData["system.range"] = item.system.range;
                }
            }
            if (Object.keys(updateData).length > 0) {
                await item.update(updateData);
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
