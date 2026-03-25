import { jest } from '@jest/globals';

// Set up JSDOM elements
document.body.innerHTML = `
  <div id="hp-bar"></div>
  <div id="hp-text"></div>
  <div id="energy-bar"></div>
  <div id="energy-text"></div>
  <div id="money-display"></div>
  <div class="level-text"></div>
  <div id="bounty-display"></div>
`;

window.updateSecondaryUI = jest.fn();
window.updateQuestUI = jest.fn();

// Now import updateUI and gameState
import { updateUI, gameState } from './script.js';

describe('updateUI', () => {
    beforeEach(() => {
        // Reset player state before each test
        gameState.player = {
            health: 100,
            maxHealth: 100,
            energy: 100,
            maxEnergy: 100,
            money: 0,
            level: 1,
            bounty: 0
        };

        // Reset DOM elements
        document.getElementById('hp-bar').style.width = '100%';
        document.getElementById('hp-text').innerText = 'Health 100/100';
        document.getElementById('energy-bar').style.width = '100%';
        document.getElementById('energy-text').innerText = 'Energy 100/100';
        document.getElementById('money-display').innerText = '$ 0';
        document.querySelector('.level-text').innerText = 'Lv. 1';
        document.getElementById('bounty-display').innerText = 'Bounty: 0';

        // Reset mocks
        window.updateSecondaryUI.mockClear();
        window.updateQuestUI.mockClear();
    });

    it('should update HP bar and text correctly', () => {
        gameState.player.health = 50;
        gameState.player.maxHealth = 100;
        updateUI();

        expect(document.getElementById('hp-bar').style.width).toBe('50%');
        expect(document.getElementById('hp-text').innerText).toBe('Health 50/100');
    });

    it('should update Energy bar and text correctly', () => {
        gameState.player.energy = 75;
        gameState.player.maxEnergy = 100;
        updateUI();

        expect(document.getElementById('energy-bar').style.width).toBe('75%');
        expect(document.getElementById('energy-text').innerText).toBe('Energy 75/100');
    });

    it('should update money display', () => {
        gameState.player.money = 1250;
        updateUI();
        expect(document.getElementById('money-display').innerText).toBe('$ 1250');
    });

    it('should update level display', () => {
        gameState.player.level = 15;
        updateUI();
        expect(document.querySelector('.level-text').innerText).toBe('Lv. 15');
    });

    it('should update bounty display', () => {
        gameState.player.bounty = 5000;
        updateUI();
        expect(document.getElementById('bounty-display').innerText).toBe('Bounty: 5000');
    });

    it('should handle missing bounty gracefully', () => {
        delete gameState.player.bounty;
        updateUI();
        expect(document.getElementById('bounty-display').innerText).toBe('Bounty: 0');
    });

    it('should call secondary UI updates', () => {
        updateUI();
        expect(window.updateSecondaryUI).toHaveBeenCalled();
        expect(window.updateQuestUI).toHaveBeenCalled();
    });

    it('should handle missing DOM elements without crashing', () => {
        document.body.innerHTML = ''; // Clear all elements

        // Should not throw
        expect(() => {
            updateUI();
        }).not.toThrow();

        // Restore elements for next tests
        document.body.innerHTML = `
            <div id="hp-bar"></div>
            <div id="hp-text"></div>
            <div id="energy-bar"></div>
            <div id="energy-text"></div>
            <div id="money-display"></div>
            <div class="level-text"></div>
            <div id="bounty-display"></div>
        `;
    });
});
