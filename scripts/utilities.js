// utilities.js

export class CompendiumUtilities {
    // Funzione per aggiornare gli oggetti di una scheda personaggio se 0/0
    static async updateActorItems(actorName) {
        let actor = game.actors.getName(actorName);
        if (!actor) {
            ui.notifications.error(`Personaggio "${actorName}" non trovato.`);
            return;
        }

        for (let item of actor.items) {
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
        ui.notifications.info(`${actor.name}: Oggetti aggiornati correttamente!`);
    }

    // Funzione per aggiornare tutti gli oggetti in un compendio, comprese le schede PG con oggetti 0/0
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

        for (let doc of documents) {
            // Se il documento è una scheda PG, aggiorna i suoi oggetti
            if (doc.type === "character" || doc.type === "npc") {
                for (let item of doc.items) {
                    await this.updateItemUses(item);
                }
            } else {
                // Se il documento è un oggetto (incantesimo, arma, ecc.), aggiornalo direttamente
                await this.updateItemUses(doc);
            }
        }
        ui.notifications.info(`Compendio "${compendiumName}" aggiornato correttamente!`);
    }

    // Funzione di supporto per aggiornare gli oggetti con usi 0/0
    static async updateItemUses(item) {
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

export class SpellConcentrationFixer {
    // Funzione per aggiornare la concentrazione delle spell di un attore
    static async updateActorSpells(actorName) {
        let actor = game.actors.getName(actorName);
        if (!actor) {
            ui.notifications.error(`Personaggio "${actorName}" non trovato.`);
            return;
        }

        for (let item of actor.items) {
            // Controlla se l'oggetto è un incantesimo e richiede concentrazione secondo i suoi dati
            if (item.type === "spell" && item.system.duration?.units === "hour") {
                let properties = Array.isArray(item.system.properties) ? item.system.properties : [];

                if (!properties.includes("concentration")) {
                    const updateData = {
                        "flags.midiProperties.concentration": true,
                        "system.activities.dnd5eactivity000.duration.concentration": true,
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
        ui.notifications.info(`${actor.name}: Spell aggiornate correttamente!`);
    }

    // Funzione per aggiornare la concentrazione delle spell in un compendio
    static async updateCompendiumSpells(compendiumName) {
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
            // Se il documento è una scheda PG, aggiorna le sue spell
            if (doc.type === "character" || doc.type === "npc") {
                for (let item of doc.items) {
                    await this.updateSpellConcentration(item);
                }
            } else {
                // Se il documento è un incantesimo, aggiornalo direttamente
                await this.updateSpellConcentration(doc);
            }
        }
        ui.notifications.info(`Compendio "${compendiumName}" aggiornato correttamente!`);
    }

    // Funzione di supporto per aggiornare la concentrazione delle spell
    static async updateSpellConcentration(item) {
        if (item.type === "spell" && item.system.duration?.units === "hour") {
            let properties = Array.isArray(item.system.properties) ? item.system.properties : [];

            if (!properties.includes("concentration")) {
                const updateData = {
                    "flags.midiProperties.concentration": true,
                    "system.activities.dnd5eactivity000.duration.concentration": true,
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
