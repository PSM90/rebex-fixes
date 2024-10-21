import { CompendiumUtilities, SpellConcentrationFixer } from './utilities.js';

Hooks.once('init', () => {
  console.log('Rebex Fixes | Inizializzazione del modulo di fix');

  // Registra i menu per entrambi i form
  game.settings.registerMenu("rebex-fixes", "fix-actor-menu", {
    name: "Fix Schede",
    label: "Apri Menu Fix Schede",
    hint: "Esegui fix sulle schede degli attori",
    type: FixActorMenu,
    restricted: true
  });

  game.settings.registerMenu("rebex-fixes", "fix-compendium-menu", {
    name: "Fix Compendio",
    label: "Apri Menu Fix Compendio",
    hint: "Esegui fix sui compendi",
    type: FixCompendiumMenu,
    restricted: true
  });

  game.settings.register("rebex-fixes", "fix-actor-menu", {
    name: "Fix Actor Menu",
    scope: "world",
    config: false,
    type: Boolean,
    default: false
  });

  game.settings.register("rebex-fixes", "fix-compendium-menu", {
    name: "Fix Compendium Menu",
    scope: "world",
    config: false,
    type: Boolean,
    default: false
  });
});

// Classe per il menu di fix delle schede degli attori
class FixActorMenu extends FormApplication {
  constructor(...args) {
    super(...args);
    this.cu = new CompendiumUtilities();
    this.scf = new SpellConcentrationFixer();
  }

  static get defaultOptions() {
    return mergeObject(super.defaultOptions, {
      id: "fix-actor-menu",
      title: "Rebex Fixes - Schede",
      template: "modules/rebex-fixes/templates/fix-actor.html",
      width: 400
    });
  }

  getData() {
    // Fornisce l'elenco degli attori
    const actors = game.actors.contents.map(actor => actor.name);
    return { actors };
  }

  activateListeners(html) {
    super.activateListeners(html);
    html.find('#fix-actor').click(async () => {
      const actorName = html.find('#actor-select').val();
      if (actorName) {
        await this.scf.updateActorSpells(actorName);
        await this.cu.updateActorItems(actorName);
        ui.notifications.info(`Fix completati per l'attore: ${actorName}`);
      }
    });
  }
}

// Classe per il menu di fix dei compendi
class FixCompendiumMenu extends FormApplication {
  constructor(...args) {
    super(...args);
    this.cu = new CompendiumUtilities();
    this.scf = new SpellConcentrationFixer();
  }

  static get defaultOptions() {
    return mergeObject(super.defaultOptions, {
      id: "fix-compendium-menu",
      title: "Rebex Fixes - Compendio",
      template: "modules/rebex-fixes/templates/fix-compendium.html",
      width: 400
    });
  }

  getData() {
    // Fornisce l'elenco dei compendi
    const compendiums = game.packs.map(pack => pack.collection);
    return { compendiums };
  }

  activateListeners(html) {
    super.activateListeners(html);
    html.find('#fix-compendium').click(async () => {
      const compendiumName = html.find('#compendium-select').val();
      if (compendiumName) {
        await this.scf.updateCompendiumSpells(compendiumName);
        await this.cu.updateCompendiumItems(compendiumName);
        ui.notifications.info(`Fix completati per il compendio: ${compendiumName}`);
      }
    });
  }
}

// Aggiunge le opzioni per aprire i menu tramite la console
Hooks.once('ready', () => {
  if (game.user.isGM) {
    new FixActorMenu().render(true);
    new FixCompendiumMenu().render(true);
  }
});