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

    // Funzione generica per aggiornare una lista di oggetti
    static async updateItems(items) {
        for (let item of items) {
            if (item.system.uses && (item.system.uses.max === 0 || item.system.uses.max === "") && item.system.uses.spent === 0) {
                await this.updateItemData(item);
                await this.updateItemActivities(item);
            }
        }
    }

    // Funzione per aggiornare un singolo oggetto
    static async updateSingleItem(item) {
        if (item.system.uses && (item.system.uses.max === 0 || item.system.uses.max === "") && item.system.uses.spent === 0) {
            await this.updateItemData(item);
            await this.updateItemActivities(item);
        }
    }

    // Funzione per aggiornare i dati generali di un oggetto
    static async updateItemData(item) {
        const updateData = {
            "system.uses.max": "",
            "system.uses.spent": 0
        };

        try {
            await item.update(updateData);
            console.log(`Dati dell'oggetto ${item.name} aggiornati con successo`);
        } catch (error) {
            console.error(`Errore nell'aggiornamento dei dati di ${item.name}:`, error);
        }
    }

    // Funzione per aggiornare solo le activities di un oggetto
    static async updateItemActivities(item) {
        const activities = item.system.activities ? foundry.utils.deepClone(item.system.activities) : {};

        for (let activityKey in activities) {
            let activity = activities[activityKey];

            // Mantieni gli altri dati intatti, svuota solo i targets
            if (activity.consumption) {
                activity.consumption.targets = [];
            }

            try {
                const updateData = {
                    [`system.activities.${activityKey}`]: activity
                };
                await item.update(updateData);
                console.log(`Activities dell'oggetto ${item.name} aggiornate con successo`);
            } catch (error) {
                console.error(`Errore nell'aggiornamento delle activities di ${item.name}:`, error);
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
                await this.updateSpellData(item);
            }
        }
    }

    static async updateSingleSpell(item) {
        if (item.type === "spell" && item.flags?.dnd5e?.migratedProperties?.includes("concentration") && !item.system.duration.concentration) {
            await this.updateSpellData(item);
        }
    }

    static async updateSpellData(item) {
        const updateData = {
            "flags.midiProperties.concentration": true,
            "system.duration.concentration": true
        };

        try {
            await item.update(updateData);
            console.log(`Concentrazione dell'incantesimo ${item.name} aggiornata con successo`);
        } catch (error) {
            console.error(`Errore nell'aggiornamento della concentrazione di ${item.name}:`, error);
        }
    }
}
