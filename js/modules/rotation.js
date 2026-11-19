/**
 * Rotation Manager
 * Handles the 3-step movie rotation agreed between the user and friend:
 * 1. King Ali (mine)
 * 2. Queen Dana (hers)
 * 3. Rewatches (rewatch - added from both)
 */

import { CONFIG } from './config.js';

const STORAGE_KEY_ROTATION = 'movie_jar_rotation_step';

export class RotationManager {
    constructor() {
        this.steps = CONFIG.rotation;
        this.currentIndex = this.loadCurrentIndex();
        this.listeners = [];
    }

    loadCurrentIndex() {
        const saved = localStorage.getItem(STORAGE_KEY_ROTATION);
        const idx = saved !== null ? parseInt(saved, 10) : 0;
        return (isNaN(idx) || idx < 0 || idx >= this.steps.length) ? 0 : idx;
    }

    saveCurrentIndex() {
        localStorage.setItem(STORAGE_KEY_ROTATION, this.currentIndex.toString());
        this.notify();
    }

    getCurrentStep() {
        return this.steps[this.currentIndex];
    }

    getCurrentStepIndex() {
        return this.currentIndex;
    }

    /**
     * Advance to the next rotation step (1 -> 2 -> 3 -> 1...)
     */
    advance() {
        this.currentIndex = (this.currentIndex + 1) % this.steps.length;
        this.saveCurrentIndex();
        return this.getCurrentStep();
    }

    /**
     * Set specific rotation step by index or id
     */
    setStep(identifier) {
        if (typeof identifier === 'number') {
            if (identifier >= 0 && identifier < this.steps.length) {
                this.currentIndex = identifier;
                this.saveCurrentIndex();
            }
        } else if (typeof identifier === 'string') {
            const idx = this.steps.findIndex(s => s.id === identifier);
            if (idx !== -1) {
                this.currentIndex = idx;
                this.saveCurrentIndex();
            }
        }
        return this.getCurrentStep();
    }

    /**
     * Subscribe to rotation changes
     */
    onChange(callback) {
        this.listeners.push(callback);
    }

    notify() {
        const current = this.getCurrentStep();
        this.listeners.forEach(cb => {
            try {
                cb(current, this.currentIndex);
            } catch (err) {
                console.error('Error in rotation listener', err);
            }
        });
    }
}
