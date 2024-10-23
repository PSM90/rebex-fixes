// utilities.js

function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

export class CompendiumUtilities {
    static async updateCompendiumItems(compendiumName) {
        const pack = game.packs.get(compendiumName);
        if (!pack) {
            ui.notifications.error(`Compendio "${compendiumName}" non trovato.`);
            return;
        }

        if (pack.locked) {
            await pack.configure({ locked: false });
        }

        console.log(`Inizio aggiornamento oggetti nel compendio: ${compendiumName}`);
        const items = await pack.getDocuments();

        for (let i = 0; i < items.length; i++) {
            let item = items[i];
            console.log(`Aggiornamento oggetto ${i + 1}/${items.length}: ${item.name}`);

            if (item.type === "character") {
                await this.updateItems(item.items);
            } else {
                await this.updateSingleItem(item);
            }

            // Dopo ogni 20 oggetti aggiornati, esegui una pausa di 5 secondi
            if ((i + 1) % 20 === 0) {
                console.log(`Pausa di 5 secondi dopo l'aggiornamento di ${i + 1} oggetti`);
                await delay(5000);
            }
        }
        ui.notifications.info(`Compendio "${compendiumName}" aggiornato correttamente!`);
    }

    static async updateItems(items) {
        for (let i = 0; i < items.length; i++) {
            let item = items[i];
            console.log(`Aggiornamento item ${i + 1}/${items.length}: ${item.name}`);
            await this.updateSingleItem(item);
        }
    }

    static async updateSingleItem(item) {
        if (item.system.uses && (item.system.uses.max === 0 || item.system.uses.max === "") && item.system.uses.spent === 0) {
            const activities = item.system.activities ? Object.fromEntries(item.system.activities.entries()) : {};

            const updatedActivities = Object.fromEntries(
                Object.entries(activities).map(([key, activity]) => {
                    return [key, {
                        ...activity,
                        "consumption": {
                            ...activity.consumption,
                            "targets": [],
                            "scaling": {
                                ...activity.consumption.scaling,
                                "allowed": activity.consumption.scaling.allowed,
                                "max": activity.consumption.scaling.max
                            },
                            "spellSlot": activity.consumption.spellSlot
                        }
                    }];
                })
            );

            const updateData = {
                "system.uses.max": "",
                "system.uses.spent": 0,
                "system.activities": updatedActivities
            };

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

        console.log(`Inizio aggiornamento incantesimi nel compendio: ${compendiumName}`);
        const items = await pack.getDocuments();

        for (let i = 0; i < items.length; i++) {
            let item = items[i];
            console.log(`Aggiornamento incantesimo ${i + 1}/${items.length}: ${item.name}`);

            if (item.type === "character") {
                await this.updateSpells(item.items);
            } else if (item.type === "spell") {
                await this.updateSingleSpell(item);
            }

            // Dopo ogni 20 incantesimi aggiornati, esegui una pausa di 5 secondi
            if ((i + 1) % 20 === 0) {
                console.log(`Pausa di 5 secondi dopo l'aggiornamento di ${i + 1} incantesimi`);
                await delay(5000);
            }
        }
        ui.notifications.info(`Compendio "${compendiumName}" aggiornato correttamente!`);
    }

    static async updateSpells(items) {
        for (let i = 0; i < items.length; i++) {
            let item = items[i];
            console.log(`Aggiornamento spell ${i + 1}/${items.length}: ${item.name}`);
            await this.updateSingleSpell(item);
        }
    }

    static async updateSingleSpell(item) {
        if (item.type === "spell" && item.flags?.dnd5e?.migratedProperties?.includes("concentration") && !item.system.duration.concentration) {
            const updateData = {
                "flags.midiProperties.concentration": true,
                "system.duration.concentration": true
            };

            try {
                await item.update(updateData);
                console.log(`Concentrazione spell ${item.name} aggiornata con successo`);
            } catch (error) {
                console.error(`Errore nell'aggiornamento della concentrazione di ${item.name}:`, error);
            }
        }
    }
}
