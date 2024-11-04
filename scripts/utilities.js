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

        // Sblocco temporaneo del compendio
        const wasLocked = pack.locked;
        if (wasLocked) {
            await pack.configure({ locked: false });
        }

        await pack.getIndex();
        const documents = await pack.getDocuments();

        for (let doc of documents) {
            if (doc.type === "spell") {
                await this.updateSpellWithActivities(doc);
            } else {
                await this.updateSingleItem(doc);
            }
        }

        // Riblocca il compendio se era bloccato
        if (wasLocked) {
            await pack.configure({ locked: true });
        }

        ui.notifications.info(`Compendio "${compendiumName}" aggiornato correttamente!`);
    }

    // Funzione generica per aggiornare una lista di oggetti
    static async updateItems(items) {
        for (let item of items) {
            if (item.system.uses && (item.system.uses.max === 0 || item.system.uses.max === "") && item.system.uses.spent === 0) {
                const updateData = {
                    "system.uses.max": "",
                    "system.uses.spent": 0,
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
                "system.uses.spent": 0
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

    // Funzione per aggiornare una spell mantenendo intatte le activities
    static async updateSpellWithActivities(spell) {
        // Verifica se è necessario l'aggiornamento
        if (spell.system.uses && (spell.system.uses.max === 0 || spell.system.uses.max === "") && spell.system.uses.spent === 0) {
            // Clona le activities senza usare toObject() per evitare problemi di perdita di dati
            const currentActivities = duplicate(spell.system.activities);

            // Crea i dati di aggiornamento necessari, includendo sempre le activities
            const updateData = foundry.utils.mergeObject({
                "system.uses.max": "",
                "system.uses.spent": 0
            }, { "system.activities": currentActivities }, { overwrite: true, inplace: false });

            try {
                await spell.update(updateData, { noHook: true });
                console.log(`Spell ${spell.name} aggiornata con successo`);
            } catch (error) {
                console.error(`Errore nell'aggiornamento della spell ${spell.name}:`, error);
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

        // Sblocco temporaneo del compendio
        const wasLocked = pack.locked;
        if (wasLocked) {
            await pack.configure({ locked: false });
        }

        await pack.getIndex();
        const documents = await pack.getDocuments();

        for (let doc of documents) {
            if (doc.type === "spell") {
                await this.updateSingleSpell(doc);
            }
        }

        // Riblocca il compendio se era bloccato
        if (wasLocked) {
            await pack.configure({ locked: true });
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
                    await item.update(updateData, { noHook: true });
                    console.log(`Concentrazione spell compendio ${item.name} aggiornata con successo`);
                } catch (error) {
                    console.error(`Errore nell'aggiornamento della concentrazione di ${item.name}:`, error);
                }
            }
        }
    }
}
