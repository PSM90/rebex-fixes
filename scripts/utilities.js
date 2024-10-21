class CompendiumUtilities {
  // Funzione per aggiornare gli oggetti di un attore se 0/0
  async updateActorItems(actorName) {
    let actor = game.actors.getName(actorName);
    if (!actor) {
      ui.notifications.error(`Personaggio "${actorName}" non trovato.`);
      return;
    }

    for (let item of actor.items) {
      if (item.system.uses && item.system.uses.max === 0 && item.system.uses.spent === 0) {
        const updateData = {
          "system.uses.max": "",
          "system.uses.spent": 0,
          "system.activities": {
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
          }
        };

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
  async updateCompendiumItems(compendiumName) {
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
      if (item.system.uses && item.system.uses.max === 0 && item.system.uses.spent === 0) {
        const updateData = {
          "system.uses.max": "",
          "system.uses.spent": 0,
          "system.activities": {
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
          }
        };

        try {
          await item.update(updateData);
          console.log(`Item compendio ${item.name} aggiornato con successo`);
        } catch (error) {
          console.error(`Errore nell'aggiornamento di ${item.name}:`, error);
        }
      }
    }
    ui.notifications.info(`Compendio "${compendiumName}" aggiornato correttamente!`);
  }

  listCompendiums() {
    game.packs.forEach(p => console.log(p.collection));
  }
}

class SpellConcentrationFixer {
  // Funzione per aggiornare le spell di un attore
  async updateActorSpells(actorName) {
    let actor = game.actors.getName(actorName);
    if (!actor) {
      ui.notifications.error(`Personaggio "${actorName}" non trovato.`);
      return;
    }

    for (let item of actor.items) {
      if (item.type === "spell" && item.system.duration?.units === "hour") {
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
            console.error(`Errore nell'aggiornamento della concentrazione di ${item.name}:`, error);
          }
        }
      }
    }
    ui.notifications.info(`${actor.name}: Spell aggiornate correttamente!`);
  }

  // Funzione per aggiornare le spell in un compendio
  async updateCompendiumSpells(compendiumName) {
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
      if (item.type === "spell" && item.system.duration?.units === "hour") {
        let properties = Array.isArray(item.system.properties) ? item.system.properties : [];

        if (!properties.includes("concentration")) {
          const updateData = {
            "flags.midiProperties.concentration": true,
            "system.activities.dnd5eactivity000.duration.concentration": true,
            "system.properties": [...properties, "concentration"]
          };

          try {
            await item.update(updateData);
            console.log(`Concentrazione spell compendio ${item.name} aggiornata con successo`);
          } catch (error) {
            console.error(`Errore nell'aggiornamento della concentrazione di ${item.name}:`, error);
          }
        }
      }
    }
    ui.notifications.info(`Compendio "${compendiumName}" aggiornato correttamente!`);
  }
}

export { CompendiumUtilities, SpellConcentrationFixer };
