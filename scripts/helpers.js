// helpers.js

import { CompendiumUtilities, SpellConcentrationFixer } from './utilities.js';

// Funzione per mostrare la finestra di dialogo di selezione
export async function showFixSelectionDialog() {
    const htmlContent = await renderTemplate('modules/rebex-fixes/templates/rebex-fixes.html');

    new Dialog({
        title: "Rebex Fixes",
        content: htmlContent,
        buttons: {
            apply: {
                icon: '<i class="fas fa-check"></i>',
                label: "Applica",
                callback: async (html) => {
                    const fixTarget = html.find('select[name="fixTarget"]').val();
                    const actorName = html.find('input[name="actorName"]').val();
                    const compendiumName = html.find('input[name="compendiumName"]').val();
                    const fixType = html.find('select[name="fixType"]').val();

                    if (fixTarget === "actor" && actorName) {
                        // Aggiorna la scheda del personaggio
                        if (fixType === "items") {
                            await CompendiumUtilities.updateActorItems(actorName);
                        } else if (fixType === "spells") {
                            await SpellConcentrationFixer.updateActorSpells(actorName);
                        }
                    } else if (fixTarget === "compendium" && compendiumName) {
                        // Aggiorna il compendio
                        if (fixType === "items") {
                            await CompendiumUtilities.updateCompendiumItems(compendiumName);
                        } else if (fixType === "spells") {
                            await SpellConcentrationFixer.updateCompendiumSpells(compendiumName);
                        }
                    } else {
                        ui.notifications.warn("Devi selezionare una scheda o un compendio valido.");
                    }
                }
            },
            cancel: {
                icon: '<i class="fas fa-times"></i>',
                label: "Annulla"
            }
        },
        default: "apply"
    }).render(true);
}
