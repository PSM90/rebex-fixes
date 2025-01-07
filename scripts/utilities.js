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


    // Conversione da Feet a Meters
    static convertFeetToMeters(document, updateData) {
        const FEET_TO_METERS = 1.5 / 5;

        // Aggiornamento Velocità (Movement)
        if (document.system.movement && document.system.movement.units === "ft") {
            for (const [key, value] of Object.entries(document.system.movement)) {
                if (typeof value === 'number' && value > 0) {
                    document.system.movement[key] = parseFloat((value * FEET_TO_METERS).toFixed(1));
                }
            }
            document.system.movement.units = "m";
            updateData["system.movement"] = document.system.movement;
        }

        // Aggiornamento Sensi (Senses)
        if (document.system.senses && document.system.senses.units === "ft") {
            for (const [key, value] of Object.entries(document.system.senses)) {
                if (typeof value === 'number' && value > 0) {
                    document.system.senses[key] = parseFloat((value * FEET_TO_METERS).toFixed(1));
                }
            }
            document.system.senses.units = "m";
            updateData["system.senses"] = document.system.senses;
        }

        // Aggiornamento Raggio d'azione e Reach
        if (document.system.range && document.system.range.units === "ft") {
            if (document.system.range.value) {
                document.system.range.value = parseFloat((document.system.range.value * FEET_TO_METERS).toFixed(1));
            }
            if (document.system.range.reach === "") {
                document.system.range.reach = 1.5;
            } else if (document.system.range.reach > 0) {
                document.system.range.reach = parseFloat((document.system.range.reach * FEET_TO_METERS).toFixed(1));
            }
            document.system.range.units = "m";
            updateData["system.range"] = document.system.range;
        }

        // Aggiornamento Area di Effetto (Area)
        if (document.system.target?.template && document.system.target.template.units === "ft") {
            if (document.system.target.template.width > 0) {
                document.system.target.template.width = parseFloat((document.system.target.template.width * FEET_TO_METERS).toFixed(1));
            }
            if (document.system.target.template.height > 0) {
                document.system.target.template.height = parseFloat((document.system.target.template.height * FEET_TO_METERS).toFixed(1));
            }
            if (document.system.target.template.size > 0) {
                document.system.target.template.size = parseFloat((document.system.target.template.size * FEET_TO_METERS).toFixed(1));
            }
            document.system.target.template.units = "m";
            updateData["system.target.template"] = document.system.target.template;
        }
    }

    static async convertActorAttributesToMeters(actor) {
        const FEET_TO_METERS = 1.5 / 5;
        let updateData = {};

        // Velocità e movimento (es: walk, fly, swim)
        if (actor.system.attributes?.movement && actor.system.attributes.movement.units === "ft") {
            for (const key of Object.keys(actor.system.attributes.movement)) {
                if (typeof actor.system.attributes.movement[key] === 'number' && actor.system.attributes.movement[key] > 0) {
                    let convertedMovement = (actor.system.attributes.movement[key] * FEET_TO_METERS).toFixed(1);
                    actor.system.attributes.movement[key] = convertedMovement.endsWith('.0')
                        ? convertedMovement.replace('.0', '')
                        : convertedMovement.replace('.', ',');
                }
            }
            actor.system.attributes.movement.units = "m";
            updateData["system.attributes.movement"] = actor.system.attributes.movement;
        }

        // Sensi (es: darkvision, truesight)
        if (actor.system.attributes?.senses && actor.system.attributes.senses.units === "ft") {
            for (const key of Object.keys(actor.system.attributes.senses)) {
                if (typeof actor.system.attributes.senses[key] === 'number' && actor.system.attributes.senses[key] > 0) {
                    let convertedSenses = (actor.system.attributes.senses[key] * FEET_TO_METERS).toFixed(1);
                    actor.system.attributes.senses[key] = convertedSenses.endsWith('.0')
                        ? convertedSenses.replace('.0', '')
                        : convertedSenses.replace('.', ',');
                }
            }
            actor.system.attributes.senses.units = "m";
            updateData["system.attributes.senses"] = actor.system.attributes.senses;
        }

        // Applica aggiornamenti solo se ci sono cambiamenti
        if (Object.keys(updateData).length > 0) {
            try {
                await actor.update(updateData);
                console.log(`Movimento e sensi di "${actor.name}" aggiornati con successo.`);
            } catch (error) {
                console.error(`Errore nell'aggiornamento di movimento/sensi per "${actor.name}":`, error);
            }
        }
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
                        ? convertedValue.replace('.0', '')
                        : convertedValue.replace('.', ',');
                }
                if (item.system.range.reach === "") {
                    updateData["system.range.reach"] = 1.5;
                } else if (item.system.range.reach > 0) {
                    let convertedReach = (item.system.range.reach * FEET_TO_METERS).toFixed(1);
                    updateData["system.range.reach"] = convertedReach.endsWith('.0')
                        ? convertedReach.replace('.0', '')
                        : convertedReach.replace('.', ',');
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
                            ? convertedSize.replace('.0', '')
                            : convertedSize.replace('.', ',');
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
