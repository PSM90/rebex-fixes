// scripts/main.js

import { CompendiumUtilities, SpellConcentrationFixer } from './utilities.js';

Hooks.once('init', () => {
    console.log('Rebex Fixes | Inizializzazione del modulo di fix');
});

Hooks.once('ready', () => {
    if (game.user.isGM) {
        console.log('Rebex Fixes | Modulo pronto per l\'utilizzo');
    }
});
