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
    static async fixFeetToMetersActor(actorName, actionType) {
        let actor = game.actors.getName(actorName);
        if (!actor) {
            ui.notifications.error(`Personaggio "${actorName}" non trovato.`);
            return;
        }

        // Aggiornamento sensi e movimento
        if(actionType === 'pg'){
            await this.convertActorAttributesToMeters(actor);
            ui.notifications.info(`${actor.name}: Conversione piedi a metri (attributi) completata!`);
        }
        // Aggiornamento oggetti e attacchi
        if(actionType === 'items'){
            await this.convertItemsToMeters(actor.items);
            ui.notifications.info(`${actor.name}: Conversione piedi a metri (attacchi) completata!`);
        }


    }

    // Fix Feet to Meters per un intero compendio
    static async fixFeetToMetersCompendium(compendiumName, actionType) {
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
            if (actionType === 'pg') {
                await this.convertActorAttributesToMeters(doc);
            }
            if (actionType === 'items') {
                await this.convertItemsToMeters(doc.items);
            }
        }

        if(actionType === 'pg'){
            ui.notifications.info(`Compendio "${compendiumName}" aggiornato per piedi in metri (attributi)!`);
        }
        if(actionType === 'items'){
            ui.notifications.info(`Compendio "${compendiumName}" aggiornato per piedi in metri (attacchi)!`);
        }
    }

    static async convertActorAttributesToMeters(actor) {
        const FEET_TO_METERS = 1.5 / 5;
        let updateData = {};

        if (actor.system.attributes.movement) {
            let movement = actor.system.attributes.movement;

            if (movement.units === "ft") {
                const movementKeys = ["walk", "fly", "swim", "climb", "burrow"];

                movementKeys.forEach(key => {
                    if (movement[key] !== null && movement[key] !== undefined && movement[key] > 0) {
                        let convertedValue = (movement[key] * FEET_TO_METERS).toFixed(1);
                        movement[key] = convertedValue.endsWith('.0')
                            ? parseFloat(convertedValue)
                            : parseFloat(convertedValue);
                    }
                });

                movement.units = "m";
                updateData["system.attributes.movement"] = movement;
            }
        }

        if (actor.system.attributes.senses) {
            let senses = actor.system.attributes.senses;

            if (senses.units === "ft") {
                const sensesKeys = ["darkvision", "blindsight", "tremorsense", "truesight"];

                sensesKeys.forEach(key => {
                    if (senses[key] !== null && senses[key] !== undefined && senses[key] > 0) {
                        let convertedSense = (senses[key] * FEET_TO_METERS).toFixed(1);
                        senses[key] = convertedSense.endsWith('.0')
                            ? parseFloat(convertedSense)
                            : parseFloat(convertedSense);
                    }
                });

                senses.units = "m";
                updateData["system.attributes.senses"] = senses;
            }
        }

        // Aggiornamento effettivo dell'attore
        if (Object.keys(updateData).length > 0) {
            await actor.update(updateData);
            console.log(`Aggiornato ${actor.name}:`, updateData);
        } else {
            console.log(`Nessuna conversione necessaria per ${actor.name}`);
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

    // Funzione per aggiornare visione e detection modes per una singola scheda personaggio
    static async updateVisionForActor(actorName) {
        const actor = game.actors.getName(actorName);
        if (!actor) {
            ui.notifications.error(`Personaggio "${actorName}" non trovato.`);
            return;
        }

        const updates = this.transformVision(actor);
        try {
            await actor.update(updates);
            ui.notifications.info(`${actor.name}: Visione e detection modes aggiornati correttamente.`);
        } catch (err) {
            console.error(`Errore nell'aggiornamento della visione per ${actor.name}:`, err);
            ui.notifications.error(`Errore nell'aggiornamento della visione per ${actor.name}.`);
        }
    }

    // Funzione per aggiornare visione e detection modes per tutte le schede in un compendio
    static async updateVisionForCompendium(compendiumName) {
        const pack = game.packs.get(compendiumName);
        if (!pack) {
            ui.notifications.error(`Compendio "${compendiumName}" non trovato.`);
            return;
        }

        if (pack.locked) {
            await pack.configure({ locked: false });
        }

        const documents = await pack.getDocuments();

        ui.notifications.notify(`Aggiornamento visione per ${documents.length} attori nel compendio "${compendiumName}".`);

        const delay = 2000; // Pausa di 2 secondi tra gli aggiornamenti

        for (const [index, actor] of documents.entries()) {
            const updates = this.transformVision(actor);
            try {
                await actor.update(updates);
                console.log(`${index + 1}/${documents.length}: ${actor.name} - Visione aggiornata.`);
            } catch (err) {
                console.error(`Errore nell'aggiornamento della visione per ${actor.name}:`, err);
            }

            // Pausa prima di passare alla prossima scheda
            if (index < documents.length - 1) {
                await new Promise((resolve) => setTimeout(resolve, delay));
            }
        }

        ui.notifications.info(`Visione aggiornata per tutti gli attori nel compendio "${compendiumName}".`);
    }

    // Trasformazione visione e detection modes
    static transformVision(actor) {
        const senses = actor.system.attributes.senses;
        const token = actor.prototypeToken;

        // Prima parte: visione standard
        let range = 0,
            type = 'basic';

        if (senses.darkvision) {
            range = senses.darkvision;
            type = 'darkvision';
        }
        if (!range && senses.blindsight) {
            range = senses.blindsight;
            type = 'blindsight';
        }
        if (!range && senses.tremorsense) {
            range = senses.tremorsense;
            type = 'tremorsense';
        }

        if (senses.truesight > range) range = senses.truesight;

        token.sight.enabled = true;
        token.sight.range = range;
        foundry.utils.mergeObject(token.sight, this.getVisionConfig(type));

        // Seconda parte: detection modes
        const detectionModes = [];
        Object.entries(senses).forEach(([sense, range]) => {
            if (range && this.getDetectionMode(sense)) {
                detectionModes.push(this.getDetectionMode(sense, range));
            }
        });

        detectionModes.push({ id: 'basicSight', enabled: true, range });

        token.detectionModes = detectionModes;

        // Restituisce gli aggiornamenti per la scheda
        return {
            'prototypeToken.sight': token.sight,
            'prototypeToken.detectionModes': token.detectionModes,
        };
    }

    // Configurazione visione
    static getVisionConfig(type) {
        const vision = {
            blindsight: {
                enabled: true,
                angle: 360,
                visionMode: 'tremorsense',
                color: null,
                attenuation: 0,
                brightness: 1,
                saturation: -0.3,
                contrast: 0.2,
            },
            darkvision: {
                angle: 360,
                visionMode: 'darkvision',
                color: null,
                attenuation: 0,
                brightness: 0,
                saturation: -1,
                contrast: 0,
            },
            basic: {
                angle: 360,
                visionMode: 'basic',
                color: null,
                attenuation: 0,
                brightness: 0,
                saturation: 0,
                contrast: 0,
            },
            tremorsense: {
                enabled: true,
                angle: 360,
                visionMode: 'tremorsense',
                color: null,
                attenuation: 0,
                brightness: 1,
                saturation: -0.3,
                contrast: 0.2,
            },
        };
        return vision[type] || vision.basic;
    }

    // Configurazione detection modes
    static getDetectionMode(sense, range) {
        const detection = {
            blindsight: (range) => ({ id: 'senseInvisibility', enabled: true, range }),
            tremorsense: (range) => ({ id: 'feelTremor', enabled: true, range }),
            truesight: (range) => ({ id: 'seeAll', enabled: true, range }),
        };
        return detection[sense]?.(range);
    }

     /** Ottieni il path più ricorrente nel compendio */
    static async getMostCommonPath(compendiumName) {
        const pack = game.packs.get(compendiumName);
        if (!pack) {
            ui.notifications.error(`Compendio "${compendiumName}" non trovato.`);
            return null;
        }

        const documents = await pack.getDocuments();
        const paths = documents.map((doc) => {
            const tokenPath = doc.prototypeToken.texture.src;
            return tokenPath.substring(0, tokenPath.lastIndexOf('/') + 1); // Rimuovi il nome del file
        });

        // Trova il path più ricorrente
        const pathFrequency = paths.reduce((acc, path) => {
            acc[path] = (acc[path] || 0) + 1;
            return acc;
        }, {});
        const mostCommonPath = Object.keys(pathFrequency).reduce((a, b) =>
            pathFrequency[a] > pathFrequency[b] ? a : b
        );

        return mostCommonPath;
    }

    /** Modifica i percorsi dei token nel compendio */
    static async fixTokenPaths(compendiumName, newPath, updateToken = true, updatePortrait = true) {
        const pack = game.packs.get(compendiumName);
        if (!pack) {
            ui.notifications.error(`Compendio "${compendiumName}" non trovato.`);
            return;
        }

        if (pack.locked) {
            await pack.configure({ locked: false });
        }

        const documents = await pack.getDocuments();
        const totalDocs = documents.length;

        // Creazione della finestra di avanzamento
        const progress = new Application({
            title: "Aggiornamento Percorsi Token",
            content: `
                <div class="form-group">
                    <label id="progress-label">Aggiornamento token: 0/${totalDocs}</label>
                    <progress id="progress-bar" value="0" max="${totalDocs}" style="width: 100%;"></progress>
                </div>
            `,
            buttons: {},
            close: () => null,
        });
        progress.render(true);

        const notFoundFiles = new Set(); // Set per tracciare i file non trovati

        async function fileExists(filePath) {
            // Rimuovi il prefisso "/" se presente, per evitare problemi con il percorso assoluto
            const sanitizedPath = filePath.startsWith("/") ? filePath.substring(1) : filePath;

            // Ottieni la directory e il nome del file
            const dirPath = sanitizedPath.substring(0, sanitizedPath.lastIndexOf("/") + 1);
            const fileName = sanitizedPath.split("/").pop();

            try {
                const result = await FilePicker.browse("data", dirPath);

                // Verifica se il file esiste nella lista restituita
                return result.files.some(file => file.endsWith(fileName));
            } catch (error) {
                console.error(`Errore durante la verifica del file: ${filePath}`, error);
                return false;
            }
        }


        for (let i = 0; i < totalDocs; i++) {
            const actor = documents[i];
            const updates = {};

            // Aggiorna il percorso del token
            if (updateToken && actor.prototypeToken?.texture?.src) {
                const tokenPath = actor.prototypeToken.texture.src;
                if (tokenPath) {
                    const tokenFileName = tokenPath.split("/").pop(); // Nome file con estensione
                    const updatedTokenPath = `${newPath}${tokenFileName}`;

                    // Verifica se il file esiste
                    const tokenExists = await fileExists(updatedTokenPath);
                    if (tokenExists) {
                        updates['prototypeToken.texture.src'] = updatedTokenPath;
                    } else if (!notFoundFiles.has(updatedTokenPath)) {
                        console.error(`Non trovato: ${updatedTokenPath}`);
                        ui.notifications.error(`Non trovato: ${updatedTokenPath}`);
                        notFoundFiles.add(updatedTokenPath);
                    }
                }
            }

            // Aggiorna il percorso del ritratto
            if (updatePortrait && actor.img) {
                const portraitPath = actor.img;
                if (portraitPath) {
                    const portraitFileName = portraitPath.split("/").pop(); // Nome file con estensione
                    const updatedPortraitPath = `${newPath}${portraitFileName}`;

                    // Verifica se il file esiste
                    const portraitExists = await fileExists(updatedPortraitPath);
                    if (portraitExists) {
                        updates['img'] = updatedPortraitPath;
                    } else if (!notFoundFiles.has(updatedPortraitPath)) {
                        console.error(`Non trovato: ${updatedPortraitPath}`);
                        ui.notifications.error(`Non trovato: ${updatedPortraitPath}`);
                        notFoundFiles.add(updatedPortraitPath);
                    }
                }
            }

            try {
                if (Object.keys(updates).length > 0) {
                    await actor.update(updates);
                }
            } catch (error) {
                console.error(`Errore aggiornando "${actor.name}":`, error);
            }

            // Aggiorna la barra di avanzamento
            const progressBar = document.getElementById("progress-bar");
            const progressLabel = document.getElementById("progress-label");
            if (progressBar && progressLabel) {
                progressBar.value = i + 1;
                progressLabel.textContent = `Aggiornamento token: ${i + 1}/${totalDocs}`;
            }

            await new Promise((resolve) => setTimeout(resolve, 500)); // Pausa per evitare sovraccarico
        }

        ui.notifications.info("Aggiornamento completato!");
        progress.close();
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
