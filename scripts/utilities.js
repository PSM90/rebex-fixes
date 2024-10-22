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
            // Se l'elemento è una scheda personaggio, iteriamo sugli oggetti al suo interno
            if (item.type === "character") {
                for (let charItem of item.items) {
                    if (charItem.system.uses && (charItem.system.uses.max === 0 || charItem.system.uses.max === "") && charItem.system.uses.spent === 0) {
                        const updateData = {
                            "system.uses.max": "",
                            "system.uses.spent": 0,
                            "system.activities": charItem.system.activities ? {
                                ...charItem.system.activities,
                                "dnd5eactivity000": {
                                    ...charItem.system.activities.dnd5eactivity000,
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

                        try {
                            await charItem.update(updateData);
                            console.log(`Oggetto ${charItem.name} nella scheda ${item.name} aggiornato con successo`);
                        } catch (error) {
                            console.error(`Errore nell'aggiornamento dell'oggetto ${charItem.name} nella scheda ${item.name}:`, error);
                        }
                    }
                }
            }
            // Altrimenti, trattiamo l'elemento come un oggetto normale
            else if (item.system.uses && (item.system.uses.max === 0 || item.system.uses.max === "") && item.system.uses.spent === 0) {
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

                try {
                    await item.update(updateData);
                    console.log(`Oggetto ${item.name} aggiornato con successo`);
                } catch (error) {
                    console.error(`Errore nell'aggiornamento dell'oggetto ${item.name}:`, error);
                }
            }
        }
        ui.notifications.info(`Compendio "${compendiumName}" aggiornato correttamente!`);
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
            if (item.type === "spell" && item.system.duration?.units && item.system.components?.concentration) {
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

        const items = await pack.getDocuments();

        for (let item of items) {
            // Se l'elemento è una scheda personaggio, iteriamo sugli oggetti al suo interno
            if (item.type === "character") {
                for (let charItem of item.items) {
                    if (charItem.type === "spell" && charItem.system.duration?.units && charItem.system.components?.concentration) {
                        let properties = Array.isArray(charItem.system.properties) ? charItem.system.properties : [];

                        if (!properties.includes("concentration")) {
                            const updateData = {
                                "flags.midiProperties.concentration": true,
                                "system.activities.dnd5eactivity000.duration.concentration": true,
                                "system.properties": [...properties, "concentration"]
                            };

                            try {
                                await charItem.update(updateData);
                                console.log(`Concentrazione spell ${charItem.name} nella scheda ${item.name} aggiornata con successo`);
                            } catch (error) {
                                console.error(`Errore nell'aggiornamento della concentrazione della spell ${charItem.name} nella scheda ${item.name}:`, error);
                            }
                        }
                    }
                }
            }
            // Altrimenti, trattiamo l'elemento come un oggetto normale
            else if (item.type === "spell" && item.system.duration?.units && item.system.components?.concentration) {
                let properties = Array.isArray(item.system.properties) ? item.system.properties : [];

                if (!properties.includes("concentration")) {
                    const updateData = {
                        "flags.midiProperties.concentration": true,
                        "system.activities.dnd5eactivity000.duration.concentration": true,
                        "system.properties": [...properties, "concentration"]
                    };

                    try {
                        await item.update(updateData);
                        console.log(`Concentrazione spell ${item.name} aggiornata con successo`);
                    } catch (error) {
                        console.error(`Errore nell'aggiornamento della concentrazione della spell ${item.name}:`, error);
                    }
                }
            }
        }
        ui.notifications.info(`Compendio "${compendiumName}" aggiornato correttamente!`);
    }
}
