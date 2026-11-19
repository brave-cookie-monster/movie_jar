/**
 * Main Application Orchestrator
 * Connects the Jar renderer, Supabase storage, Rotation manager, and UI.
 */

import { CONFIG } from './modules/config.js';
import { Jar } from './modules/jar.js';
import { SoundFX } from './modules/audio.js';
import { MovieStorage } from './modules/storage.js';
import { RotationManager } from './modules/rotation.js';

class MovieJarApp {
    constructor() {
        this.storage = new MovieStorage();
        this.rotation = new RotationManager();
        this.sfx = new SoundFX();
        this.jar = null;

        // UI state
        this.movies = [];
        this.selectedCategoryFilter = 'rotation'; // 'rotation' | 'all' | 'mine' | 'hers' | 'rewatch'
        this.selectedGenreFilter = 'all';
        this.searchQuery = '';
        this.hideWatched = true;
        this.theme = localStorage.getItem('movie_jar_theme') || 'dark';

        // Currently drawn movie
        this.currentDrawnMovie = null;
    }

    async init() {
        this.initTheme();
        this.initAudioState();
        this.initJar();
        this.setupEventListeners();
        await this.loadMovies();
        this.renderAll();
    }

    initTheme() {
        if (this.theme === 'dark' || (!localStorage.getItem('movie_jar_theme') && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
            document.documentElement.classList.add('dark');
            this.theme = 'dark';
        } else {
            document.documentElement.classList.remove('dark');
            this.theme = 'light';
        }
        this.updateThemeIcon();
    }

    updateThemeIcon() {
        const icon = document.getElementById('themeIcon');
        if (!icon) return;
        icon.className = this.theme === 'dark' ? 'fa-solid fa-sun text-amber-400 text-lg' : 'fa-solid fa-moon text-slate-600 text-lg';
    }

    toggleTheme() {
        this.theme = this.theme === 'dark' ? 'light' : 'dark';
        localStorage.setItem('movie_jar_theme', this.theme);
        this.initTheme();
    }

    initAudioState() {
        const saved = localStorage.getItem('movie_jar_sound');
        const enabled = saved !== null ? JSON.parse(saved) : true;
        this.sfx.setEnabled(enabled);
        this.updateSoundIcon();
    }

    updateSoundIcon() {
        const icon = document.getElementById('soundIcon');
        if (!icon) return;
        icon.className = this.sfx.enabled ? 'fa-solid fa-volume-high text-amber-500 text-lg' : 'fa-solid fa-volume-xmark text-slate-400 text-lg';
    }

    toggleSound() {
        const newState = !this.sfx.enabled;
        this.sfx.setEnabled(newState);
        localStorage.setItem('movie_jar_sound', JSON.stringify(newState));
        this.updateSoundIcon();
    }

    initJar() {
        this.jar = new Jar('jarCanvas', {
            onShake: () => {
                this.sfx.playRustle();
            }
        });
    }

    async loadMovies() {
        this.movies = await this.storage.getMovies();
        this.populateGenreDropdown();
    }

    /**
     * Get active movies filtered by current UI filters (Rotation, Category, Genre, Watched status)
     */
    getFilteredMovies() {
        const currentStep = this.rotation.getCurrentStep();

        return this.movies.filter(movie => {
            // Watched filter
            if (this.hideWatched && movie.watched) return false;

            // Search query filter
            if (this.searchQuery && !movie.title.toLowerCase().includes(this.searchQuery.toLowerCase())) {
                return false;
            }

            // Genre filter
            if (this.selectedGenreFilter !== 'all') {
                if (!movie.genre || !movie.genre.toLowerCase().includes(this.selectedGenreFilter.toLowerCase())) {
                    return false;
                }
            }

            // Category filter
            if (this.selectedCategoryFilter === 'rotation') {
                return movie.category === currentStep.id;
            } else if (this.selectedCategoryFilter !== 'all') {
                return movie.category === this.selectedCategoryFilter;
            }

            return true;
        });
    }

    /**
     * Refresh Jar Canvas items
     */
    updateJarItems() {
        const filtered = this.getFilteredMovies();
        this.jar.setItems(filtered);

        const badge = document.getElementById('jarCountBadge');
        if (badge) badge.innerText = filtered.length;

        const subText = document.getElementById('jarSubtext');
        if (subText) {
            const step = this.rotation.getCurrentStep();
            if (this.selectedCategoryFilter === 'rotation') {
                subText.innerText = `Following Rotation: ${step.label} (${filtered.length} in jar)`;
            } else if (this.selectedCategoryFilter === 'all') {
                subText.innerText = `All Categories (${filtered.length} in jar)`;
            } else {
                const catObj = CONFIG.rotation.find(r => r.id === this.selectedCategoryFilter);
                subText.innerText = `${catObj ? catObj.label : 'Filtered'} (${filtered.length} in jar)`;
            }
        }
    }

    renderAll() {
        this.renderRotationBar();
        this.renderCategoryTabs();
        this.renderMoviesList();
        this.renderHistory();
        this.updateJarItems();
    }

    /**
     * Render the 3-step rotation tracker:
     * 1. King Ali -> 2. Queen Dana -> 3. Rewatches
     */
    renderRotationBar() {
        const container = document.getElementById('rotationStepsContainer');
        if (!container) return;

        const currentStep = this.rotation.getCurrentStep();
        const activeIdx = this.rotation.getCurrentStepIndex();

        container.innerHTML = CONFIG.rotation.map((step, idx) => {
            const isActive = idx === activeIdx;
            const count = this.movies.filter(m => m.category === step.id && !m.watched).length;

            return `
                <div class="flex-1 cursor-pointer transition-all duration-200 p-2.5 sm:p-3 rounded-xl border ${
                    isActive 
                        ? 'bg-amber-500/10 border-amber-500/80 shadow-md ring-2 ring-amber-500/30 dark:bg-amber-500/15' 
                        : 'bg-white/50 dark:bg-slate-800/40 border-slate-200/80 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                }" data-step-index="${idx}">
                    <div class="flex items-center justify-between">
                        <span class="text-[10px] sm:text-xs font-bold uppercase tracking-wider ${isActive ? 'text-amber-600 dark:text-amber-400' : 'text-slate-400'}">
                            Turn ${idx + 1}
                        </span>
                        ${isActive ? '<span class="inline-flex items-center px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-amber-500 text-white animate-pulse">Active</span>' : ''}
                    </div>
                    <div class="flex items-center gap-1.5 mt-1">
                        <i class="fa-solid ${step.icon} text-sm ${isActive ? 'text-amber-500' : 'text-slate-400'}"></i>
                        <span class="text-xs sm:text-sm font-semibold truncate ${isActive ? 'text-slate-900 dark:text-white font-bold' : 'text-slate-600 dark:text-slate-400'}">
                            ${step.label}
                        </span>
                    </div>
                    <div class="text-[11px] text-slate-500 dark:text-slate-400 mt-1 flex items-center justify-between">
                        <span>${count} unwatched</span>
                    </div>
                </div>
            `;
        }).join('');

        // Attach click listeners to jump turns
        container.querySelectorAll('[data-step-index]').forEach(el => {
            el.addEventListener('click', () => {
                const idx = parseInt(el.getAttribute('data-step-index'), 10);
                this.rotation.setStep(idx);
                this.renderAll();
                this.jar.shake(12);
            });
        });

        // Current turn banner
        const turnBadge = document.getElementById('currentTurnBadge');
        if (turnBadge) {
            turnBadge.innerHTML = `
                <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${currentStep.badgeClass}">
                    <i class="fa-solid ${currentStep.icon}"></i>
                    <span>Turn: ${currentStep.label}</span>
                </span>
            `;
        }
    }

    renderCategoryTabs() {
        const container = document.getElementById('categoryTabsContainer');
        if (!container) return;

        const currentStep = this.rotation.getCurrentStep();
        const options = [
            { id: 'rotation', label: `Follow Rotation (${currentStep.shortLabel})`, icon: 'fa-arrows-rotate' },
            { id: 'all', label: 'All Movies', icon: 'fa-layer-group' },
            ...CONFIG.rotation.map(r => ({ id: r.id, label: r.label, icon: r.icon }))
        ];

        container.innerHTML = options.map(opt => {
            const isSelected = this.selectedCategoryFilter === opt.id;
            return `
                <button type="button" class="category-tab-btn px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition flex items-center gap-1.5 ${
                    isSelected 
                        ? 'bg-amber-500 text-white shadow-sm' 
                        : 'bg-white/60 dark:bg-slate-800/60 text-slate-600 dark:text-slate-300 hover:bg-amber-50 dark:hover:bg-slate-800'
                }" data-cat="${opt.id}">
                    <i class="fa-solid ${opt.icon}"></i>
                    <span>${opt.label}</span>
                </button>
            `;
        }).join('');

        container.querySelectorAll('[data-cat]').forEach(btn => {
            btn.addEventListener('click', () => {
                this.selectedCategoryFilter = btn.getAttribute('data-cat');
                this.renderCategoryTabs();
                this.renderMoviesList();
                this.updateJarItems();
                this.jar.shake(10);
            });
        });
    }

    renderMoviesList() {
        const list = document.getElementById('moviesList');
        if (!list) return;

        const filtered = this.getFilteredMovies();
        const totalCountEl = document.getElementById('totalMoviesCount');
        if (totalCountEl) totalCountEl.innerText = filtered.length;

        if (filtered.length === 0) {
            list.innerHTML = `
                <div class="text-xs text-slate-400 italic text-center py-6 flex flex-col items-center justify-center gap-2">
                    <i class="fa-solid fa-film text-2xl text-slate-300 dark:text-slate-700"></i>
                    <span>No movies found matching current filters. Add some below!</span>
                </div>
            `;
            return;
        }

        list.innerHTML = filtered.map(movie => {
            const catObj = CONFIG.rotation.find(r => r.id === movie.category) || CONFIG.rotation[0];
            return `
                <div class="flex items-center justify-between px-3 py-2.5 rounded-xl bg-white/70 dark:bg-slate-900/60 border border-slate-200/70 dark:border-slate-800/80 hover:border-amber-400/50 transition group ${
                    movie.watched ? 'opacity-50' : ''
                }">
                    <div class="flex items-center gap-2.5 min-w-0 flex-1">
                        <button class="toggle-watch-btn text-slate-400 hover:text-amber-500 transition shrink-0" data-id="${movie.id}" title="${movie.watched ? 'Mark as unwatched' : 'Mark as watched'}">
                            <i class="fa-${movie.watched ? 'solid fa-circle-check text-emerald-500' : 'regular fa-circle text-slate-400'}"></i>
                        </button>
                        <div class="min-w-0 flex-1">
                            <h4 class="text-xs sm:text-sm font-semibold truncate ${movie.watched ? 'line-through text-slate-400 dark:text-slate-500' : 'text-slate-800 dark:text-slate-200'}">
                                ${this.escapeHtml(movie.title)}
                            </h4>
                            <div class="flex items-center gap-1.5 mt-0.5">
                                <span class="text-[10px] px-1.5 py-0.2 rounded font-medium border ${catObj.badgeClass}">
                                    <i class="fa-solid ${catObj.icon} text-[9px] mr-0.5"></i> ${catObj.shortLabel}
                                </span>
                                ${movie.genre ? `
                                    <span class="text-[10px] px-1.5 py-0.2 rounded font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                                        ${this.escapeHtml(movie.genre)}
                                    </span>
                                ` : ''}
                            </div>
                        </div>
                    </div>
                    <div class="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition">
                        <button class="delete-movie-btn text-slate-400 hover:text-rose-500 p-1.5 rounded transition" data-id="${movie.id}" title="Delete movie">
                            <i class="fa-solid fa-trash-can text-xs"></i>
                        </button>
                    </div>
                </div>
            `;
        }).join('');

        // Attach event listeners for delete and watch toggles
        list.querySelectorAll('.toggle-watch-btn').forEach(btn => {
            btn.addEventListener('click', async () => {
                const id = btn.getAttribute('data-id');
                const movie = this.movies.find(m => m.id === id);
                if (movie) {
                    await this.storage.markWatched(id, !movie.watched);
                    await this.loadMovies();
                    this.renderAll();
                }
            });
        });

        list.querySelectorAll('.delete-movie-btn').forEach(btn => {
            btn.addEventListener('click', async () => {
                const id = btn.getAttribute('data-id');
                await this.storage.deleteMovie(id);
                await this.loadMovies();
                this.renderAll();
            });
        });
    }

    renderHistory() {
        const container = document.getElementById('historyList');
        if (!container) return;

        const history = this.storage.getHistory();
        if (history.length === 0) {
            container.innerHTML = `<span class="text-xs text-slate-400 italic">No movies drawn yet.</span>`;
            return;
        }

        container.innerHTML = history.slice(0, 8).map(item => {
            const catObj = CONFIG.rotation.find(r => r.id === item.category);
            return `
                <span class="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-md font-medium border ${
                    catObj ? catObj.badgeClass : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                }">
                    <i class="fa-solid fa-film text-[9px]"></i>
                    <span class="truncate max-w-[130px]">${this.escapeHtml(item.title)}</span>
                </span>
            `;
        }).join('');
    }

    populateGenreDropdown() {
        const genreSet = new Set(CONFIG.genres);
        this.movies.forEach(m => {
            if (m.genre) {
                m.genre.split(',').forEach(g => {
                    const trimmed = g.trim();
                    if (trimmed) genreSet.add(trimmed);
                });
            }
        });

        const sortedGenres = Array.from(genreSet).sort();

        // Populate Add Form Genre select
        const formGenreSelect = document.getElementById('movieGenreSelect');
        if (formGenreSelect) {
            formGenreSelect.innerHTML = sortedGenres.map(g => `<option value="${g}">${g}</option>`).join('');
        }

        // Populate Filter Genre select
        const filterGenreSelect = document.getElementById('genreFilterSelect');
        if (filterGenreSelect) {
            const currentVal = this.selectedGenreFilter;
            filterGenreSelect.innerHTML = `
                <option value="all">All Genres</option>
                ${sortedGenres.map(g => `<option value="${g}" ${g.toLowerCase() === currentVal.toLowerCase() ? 'selected' : ''}>${g}</option>`).join('')}
            `;
        }
    }

    /**
     * Draw random movie with full physics & sound effect
     */
    drawMovie() {
        const available = this.getFilteredMovies();
        if (available.length === 0) {
            this.showResultModal({
                title: 'No Movies Available!',
                category: this.rotation.getCurrentStep().id,
                genre: 'Tip',
                isEmptyNotice: true
            });
            return;
        }

        this.jar.shake(22);
        this.sfx.playRustle();

        const randomIndex = Math.floor(Math.random() * available.length);
        const chosen = available[randomIndex];
        this.currentDrawnMovie = chosen;

        setTimeout(() => {
            this.sfx.playPop();
            this.sfx.playChime();
            this.showResultModal(chosen);
            this.storage.addHistory(chosen);
            this.renderHistory();
        }, 400);
    }

    showResultModal(movie) {
        const modal = document.getElementById('resultModal');
        const card = document.getElementById('modalCard');
        if (!modal || !card) return;

        const catObj = CONFIG.rotation.find(r => r.id === movie.category) || CONFIG.rotation[0];

        document.getElementById('resultMovieTitle').innerText = movie.title;
        document.getElementById('resultCategoryBadge').innerHTML = `
            <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${catObj.badgeClass}">
                <i class="fa-solid ${catObj.icon}"></i>
                <span>${catObj.label}</span>
            </span>
        `;
        document.getElementById('resultGenreBadge').innerText = movie.genre || 'Movie Night';

        const watchBtn = document.getElementById('confirmWatchBtn');
        if (watchBtn) {
            watchBtn.style.display = movie.isEmptyNotice ? 'none' : 'inline-flex';
        }

        modal.classList.remove('opacity-0', 'pointer-events-none');
        card.classList.add('animate-ticket-unfold');
    }

    closeResultModal() {
        const modal = document.getElementById('resultModal');
        const card = document.getElementById('modalCard');
        if (!modal || !card) return;

        modal.classList.add('opacity-0', 'pointer-events-none');
        card.classList.remove('animate-ticket-unfold');
    }

    async confirmWatchAndAdvance() {
        if (this.currentDrawnMovie && this.currentDrawnMovie.id) {
            await this.storage.markWatched(this.currentDrawnMovie.id, true);
        }
        // Advance to next rotation step
        this.rotation.advance();
        this.closeResultModal();
        await this.loadMovies();
        this.renderAll();
        this.jar.shake(14);
    }

    setupEventListeners() {
        // Draw triggers
        document.getElementById('drawBtn')?.addEventListener('click', () => this.drawMovie());
        document.getElementById('jarClickArea')?.addEventListener('click', () => this.drawMovie());
        document.getElementById('shakeBtn')?.addEventListener('click', () => this.jar.shake(20));

        // Advance rotation manually
        document.getElementById('advanceRotationBtn')?.addEventListener('click', () => {
            this.rotation.advance();
            this.renderAll();
            this.jar.shake(12);
        });

        // Add Movie Form
        document.getElementById('addMovieForm')?.addEventListener('submit', async (e) => {
            e.preventDefault();
            const titleInput = document.getElementById('movieTitleInput');
            const catSelect = document.getElementById('movieCategorySelect');
            const genreSelect = document.getElementById('movieGenreSelect');
            const customGenreInput = document.getElementById('customGenreInput');

            const title = titleInput.value.trim();
            if (!title) return;

            const category = catSelect.value;
            const genre = (customGenreInput.value.trim()) || genreSelect.value;

            await this.storage.addMovie({
                title,
                category,
                genre,
                watched: false
            });

            titleInput.value = '';
            customGenreInput.value = '';

            await this.loadMovies();
            this.renderAll();
            this.jar.shake(15);
            this.sfx.playRustle();
        });

        // Bulk Add toggle & handler
        document.getElementById('toggleBulkBtn')?.addEventListener('click', () => {
            document.getElementById('bulkContainer')?.classList.toggle('hidden');
        });

        document.getElementById('addBulkBtn')?.addEventListener('click', async () => {
            const textarea = document.getElementById('bulkInput');
            const catSelect = document.getElementById('bulkCategorySelect');
            const genreSelect = document.getElementById('bulkGenreSelect');

            const lines = textarea.value.split('\n').map(l => l.trim()).filter(l => l.length > 0);
            if (lines.length > 0) {
                for (const line of lines) {
                    await this.storage.addMovie({
                        title: line,
                        category: catSelect.value,
                        genre: genreSelect.value,
                        watched: false
                    });
                }
                textarea.value = '';
                document.getElementById('bulkContainer')?.classList.add('hidden');
                await this.loadMovies();
                this.renderAll();
                this.jar.shake(18);
            }
        });

        // Filter events
        document.getElementById('genreFilterSelect')?.addEventListener('change', (e) => {
            this.selectedGenreFilter = e.target.value;
            this.renderMoviesList();
            this.updateJarItems();
            this.jar.shake(8);
        });

        document.getElementById('searchInput')?.addEventListener('input', (e) => {
            this.searchQuery = e.target.value;
            this.renderMoviesList();
            this.updateJarItems();
        });

        document.getElementById('hideWatchedCheckbox')?.addEventListener('change', (e) => {
            this.hideWatched = e.target.checked;
            this.renderMoviesList();
            this.updateJarItems();
        });

        // Clear History
        document.getElementById('clearHistoryBtn')?.addEventListener('click', () => {
            this.storage.clearHistory();
            this.renderHistory();
        });

        // Audio & Theme toggles
        document.getElementById('soundToggleBtn')?.addEventListener('click', () => this.toggleSound());
        document.getElementById('themeToggleBtn')?.addEventListener('click', () => this.toggleTheme());

        // Result Modal actions
        document.getElementById('closeModalBtn')?.addEventListener('click', () => this.closeResultModal());
        document.getElementById('confirmWatchBtn')?.addEventListener('click', () => this.confirmWatchAndAdvance());
        document.getElementById('drawAgainBtn')?.addEventListener('click', () => {
            this.closeResultModal();
            setTimeout(() => this.drawMovie(), 300);
        });
        document.getElementById('resultModal')?.addEventListener('click', (e) => {
            if (e.target.id === 'resultModal') this.closeResultModal();
        });

        // Phone shake motion detector
        if (window.DeviceMotionEvent) {
            let lastX = 0, lastY = 0, lastZ = 0, lastTime = 0;
            window.addEventListener('devicemotion', (e) => {
                const acc = e.accelerationIncludingGravity;
                if (!acc) return;
                const now = Date.now();
                if ((now - lastTime) > 120) {
                    const diff = now - lastTime;
                    lastTime = now;
                    const speed = Math.abs(acc.x + acc.y + acc.z - lastX - lastY - lastZ) / diff * 10000;
                    if (speed > 850) {
                        this.jar.shake(20);
                    }
                    lastX = acc.x; lastY = acc.y; lastZ = acc.z;
                }
            }, false);
        }
    }

    escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.innerText = text;
        return div.innerHTML;
    }
}

// Start application
document.addEventListener('DOMContentLoaded', () => {
    const app = new MovieJarApp();
    app.init();
});
