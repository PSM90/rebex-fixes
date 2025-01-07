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

    // Fix Feet to Meters per un singolo attore
    static async fixFeetToMetersActor(actorName) {
        let actor = game.actors.getName(actorName);
        if (!actor) {
            ui.notifications.error(`Personaggio "${actorName}" non trovato.`);
            return;
        }

        const updateData = {};
        await this.convertFeetToMeters(actor, updateData);

        if (Object.keys(updateData).length > 0) {
            await actor.update(updateData);
            ui.notifications.info(`${actor.name}: Conversione piedi a metri completata!`);
        } else {
            ui.notifications.info(`${actor.name}: Nessuna conversione necessaria.`);
        }
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
            const updateData = {};
            await this.convertFeetToMeters(doc, updateData);

            if (Object.keys(updateData).length > 0) {
                await doc.update(updateData);
                console.log(`"${doc.name}" aggiornato da piedi a metri.`);
            }
        }

        ui.notifications.info(`Compendio "${compendiumName}" aggiornato da piedi a metri!`);
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
