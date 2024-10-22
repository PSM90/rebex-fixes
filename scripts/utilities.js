export class CompendiumUtilities {
    // Funzione per aggiornare gli oggetti e le spell di una scheda personaggio se 0/0 o per correggere la concentrazione
    static async updateActorItemsAndSpells(actorName) {
        let actor = game.actors.getName(actorName);
        if (!actor) {
            ui.notifications.error(`Personaggio "${actorName}" non trovato.`);
            return;
        }

        for (let item of actor.items) {
            await this.updateItem(item);
        }

        ui.notifications.info(`${actor.name}: Oggetti e incantesimi aggiornati correttamente!`);
    }

    // Funzione per aggiornare tutti gli oggetti e gli incantesimi in un compendio
    static async updateCompendiumItemsAndSpells(compendiumName) {
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
            // Controlla se è una scheda personaggio e aggiorna i suoi oggetti e spell
            if (item.type === "character") {
                for (let subItem of item.items) {
                    await this.updateItem(subItem);
                }
            } else {
                // Aggiorna direttamente l'oggetto normale nel compendio
                await this.updateItem(item);
            }
        }

        await pack.configure({ locked: true });
        ui.notifications.info(`Compendio "${compendiumName}" aggiornato correttamente!`);
    }

    // Funzione per aggiornare un singolo oggetto o spell
    static async updateItem(item) {
        let updateData = {};

        // Controllo 0/0 per oggetti normali e incantesimi
        if (item.system.uses && (item.system.uses.max === 0 || item.system.uses.max === "") && item.system.uses.spent === 0) {
            updateData["system.uses.max"] = "";
            updateData["system.uses.spent"] = 0;
            updateData["system.activities"] = item.system.activities ? {
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
            } : {};
        }

        // Controllo concentrazione per incantesimi
        if (item.type === "spell" && item.system.duration?.units && ["minute", "hour", "day"].includes(item.system.duration.units) && !item.system.duration.concentration) {
            let properties = Array.isArray(item.system.properties) ? item.system.properties : [];
            if (!properties.includes("concentration")) {
                updateData["flags.midiProperties.concentration"] = true;
                updateData["system.duration.concentration"] = true;
                updateData["system.properties"] = [...properties, "concentration"];
            }
        }

        // Se ci sono modifiche da applicare, esegui l'aggiornamento
        if (Object.keys(updateData).length > 0) {
            try {
                await item.update(updateData);
                console.log(`Item ${item.name} aggiornato con successo`, updateData);
            } catch (error) {
                console.error(`Errore nell'aggiornamento di ${item.name}:`, error);
            }
        }
    }
}
