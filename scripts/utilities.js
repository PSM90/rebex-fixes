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

        const items = await pack.getDocuments();

        for (let item of items) {
            // Ignora le cartelle
            if (item.type === "folder") {
                console.log(`Ignorata cartella: ${item.name}`);
                continue;
            }

            // Aggiorna oggetti o gestisci le schede personaggio
            if (item.type === "character") {
                console.log(`Aggiornamento oggetti di: ${item.name}`);
                await this.updateItems(item.items);
            } else {
                console.log(`Aggiornamento oggetto singolo: ${item.name}`);
                await this.updateSingleItem(item);
            }
        }
        ui.notifications.info(`Compendio "${compendiumName}" aggiornato correttamente!`);
    }

    // Funzione generica per aggiornare una lista di oggetti
    static async updateItems(items) {
        for (let item of items) {
            // Controlla se l'item è un incantesimo o un oggetto
            if (item.type === "spell") {
                console.log(`Aggiornamento incantesimo: ${item.name}`);
                await this.updateSpell(item);
            } else {
                console.log(`Aggiornamento oggetto: ${item.name}`);
                await this.updateSingleItem(item);
            }
        }
    }

    // Aggiorna un singolo incantesimo
    static async updateSpell(spell) {
        try {
            // Aggiorna separatamente le attività dell'incantesimo
            const activities = spell.system.activities ? {...spell.system.activities} : {};
            // Modifica le proprietà delle attività qui come necessario
            await spell.update({ "system.activities": activities });
            console.log(`Activities aggiornate per: ${spell.name}`);
        } catch (error) {
            console.error(`Errore nell'aggiornamento delle activities di ${spell.name}:`, error);
        }

        // Continua con altri aggiornamenti specifici per l'incantesimo
        await this.updateSingleItem(spell);
    }

    // Funzione per aggiornare un singolo oggetto
    static async updateSingleItem(item) {
        if (item.system.uses && (item.system.uses.max === 0 || item.system.uses.max === "") && item.system.uses.spent === 0) {
            const updateData = {
                "system.uses.max": "",
                "system.uses.spent": 0
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
