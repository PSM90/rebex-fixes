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

    // Fix Feet to Meters per singolo attore (sensi + movimento + oggetti)
    static async fixFeetToMetersActor(actorName) {
        let actor = game.actors.getName(actorName);
        if (!actor) {
            ui.notifications.error(`Personaggio "${actorName}" non trovato.`);
            return;
        }

        // Aggiornamento sensi e movimento
        await this.convertActorAttributesToMeters(actor);

        // Aggiornamento oggetti e attacchi
        await this.convertItemsToMeters(actor.items);

        ui.notifications.info(`${actor.name}: Conversione piedi a metri completata!`);
    }

    // Fix Feet to Meters per un intero compendio
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
            // Aggiorna attore (movimento e sensi)
            await this.convertActorAttributesToMeters(doc);

            // Aggiorna gli oggetti, spell, attacchi, ecc.
            await this.convertItemsToMeters(doc.items);
        }

        ui.notifications.info(`Compendio "${compendiumName}" aggiornato per piedi in metri!`);
    }


    static convertActorAttributesToMeters(actor) {
        const FEET_TO_METERS = 1.5 / 5;
        let updateData = {};

        // Aggiornamento del movimento (es: walk, fly, swim)
        if (actor.system.attributes.movement?.units === "ft") {
            const movementKeys = ["walk", "fly", "swim", "climb", "burrow"];

            movementKeys.forEach(key => {
                let value = actor.system.attributes.movement[key];

                if (typeof value === 'number' && value > 0) {
                    let convertedValue = (value * FEET_TO_METERS).toFixed(1);
                    actor.system.attributes.movement[key] = convertedValue.endsWith('.0')
                        ? parseFloat(convertedValue)
                        : parseFloat(convertedValue);
                }
            });

            actor.system.attributes.movement.units = "m";
            updateData["system.attributes.movement"] = actor.system.attributes.movement;
        }

        // Aggiornamento dei sensi (es: darkvision, truesight)
        if (actor.system.attributes.senses?.units === "ft") {
            const sensesKeys = ["darkvision", "blindsight", "tremorsense", "truesight"];

            sensesKeys.forEach(key => {
                let value = actor.system.attributes.senses[key];

                if (typeof value === 'number' && value > 0) {
                    let convertedSense = (value * FEET_TO_METERS).toFixed(1);
                    actor.system.attributes.senses[key] = convertedSense.endsWith('.0')
                        ? parseFloat(convertedSense)
                        : parseFloat(convertedSense);
                }
            });

            actor.system.attributes.senses.units = "m";
            updateData["system.attributes.senses"] = actor.system.attributes.senses;
        }

        return updateData;
    }



    static async convertItemsToMeters(items) {
        const FEET_TO_METERS = 1.5 / 5;

        for (let item of items) {
            let updateData = {};

            // Raggio d'azione e portata (range e reach)
            if (item.system.range && item.system.range.units === "ft") {
                if (item.system.range.value > 0) {
                    let convertedValue = (item.system.range.value * FEET_TO_METERS).toFixed(1);
                    updateData["system.range.value"] = convertedValue.endsWith('.0')
                        ? parseFloat(convertedValue)  // Rimuove il decimale .0 mantenendo il punto
                        : parseFloat(convertedValue);
                }
                if (item.system.range.reach === "") {
                    updateData["system.range.reach"] = 1.5;
                } else if (item.system.range.reach > 0) {
                    let convertedReach = (item.system.range.reach * FEET_TO_METERS).toFixed(1);
                    updateData["system.range.reach"] = convertedReach.endsWith('.0')
                        ? parseFloat(convertedReach)
                        : parseFloat(convertedReach);
                }
                item.system.range.units = "m";
                updateData["system.range.units"] = "m";
            }

            // Area di effetto (cone, sphere, cube, ecc.)
            if (item.system.target?.template && item.system.target.template.units === "ft") {
                const templateKeys = ["width", "height", "size"];
                templateKeys.forEach(key => {
                    if (item.system.target.template[key] > 0) {
                        let convertedSize = (item.system.target.template[key] * FEET_TO_METERS).toFixed(1);
                        item.system.target.template[key] = convertedSize.endsWith('.0')
                            ? parseFloat(convertedSize)  // Mantiene il formato numerico
                            : parseFloat(convertedSize);
                    }
                });

                item.system.target.template.units = "m";
                updateData["system.target.template"] = item.system.target.template;
            }

            // Se ci sono aggiornamenti, esegui l'update
            if (Object.keys(updateData).length > 0) {
                try {
                    await item.update(updateData);
                    console.log(`Oggetto "${item.name}" aggiornato con successo.`);
                } catch (error) {
                    console.error(`Errore nell'aggiornamento di "${item.name}":`, error);
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
