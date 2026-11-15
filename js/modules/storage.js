/**
 * Storage & Supabase Sync Layer
 * Manages movies in Supabase REST API always, with transparent caching
 * and automatic synchronization of locally added movies to Supabase.
 */

import { CONFIG } from './config.js';

const STORAGE_KEY_MOVIES = 'movie_jar_movies_cache';
const STORAGE_KEY_HISTORY = 'movie_jar_history';

export class MovieStorage {
    constructor() {
        this.supabaseUrl = (window.__ENV?.SUPABASE_URL) || CONFIG.supabase.url;
        this.supabaseAnonKey = (window.__ENV?.SUPABASE_ANON_KEY) || localStorage.getItem(CONFIG.supabase.storageKeyAnon) || '';
        this.tableName = CONFIG.supabase.defaultTable;
        this.hasAttemptedVercelEnv = false;
        this.hasSyncedLocalToRemote = false;
    }

    /**
     * Resolves the Supabase Anon Key from:
     * 1. window.__ENV (from env.js)
     * 2. Vercel serverless /api/config endpoint
     * 3. localStorage cache
     */
    async ensureCredentials() {
        if (this.supabaseAnonKey && this.supabaseAnonKey.trim().length > 0) {
            return true;
        }

        // Try window.__ENV
        if (window.__ENV?.SUPABASE_ANON_KEY) {
            this.supabaseAnonKey = window.__ENV.SUPABASE_ANON_KEY.trim();
            if (this.supabaseAnonKey) {
                localStorage.setItem(CONFIG.supabase.storageKeyAnon, this.supabaseAnonKey);
                return true;
            }
        }

        // Try Vercel Serverless Function /api/config
        if (!this.hasAttemptedVercelEnv) {
            this.hasAttemptedVercelEnv = true;
            try {
                const res = await fetch('/api/config');
                if (res.ok) {
                    const data = await res.json();
                    if (data.supabaseAnonKey && data.supabaseAnonKey.trim()) {
                        this.supabaseAnonKey = data.supabaseAnonKey.trim();
                        if (data.supabaseUrl) {
                            this.supabaseUrl = data.supabaseUrl.trim().replace(/\/+$/, '');
                        }
                        localStorage.setItem(CONFIG.supabase.storageKeyAnon, this.supabaseAnonKey);
                        return true;
                    }
                }
            } catch (e) {
                // Not running in Vercel or /api not available
            }
        }

        return Boolean(this.supabaseAnonKey && this.supabaseAnonKey.trim().length > 0);
    }

    hasSupabaseCredentials() {
        return Boolean(this.supabaseAnonKey && this.supabaseAnonKey.trim().length > 0);
    }

    /**
     * Normalize movie object fields across Supabase schema variants
     */
    normalizeMovie(raw) {
        return {
            id: String(raw.id || raw._id || ('loc-' + Date.now() + Math.random().toString(36).substr(2, 5))),
            title: (raw.title || raw.name || raw.movie || 'Untitled Movie').trim(),
            genre: Array.isArray(raw.genre) ? raw.genre.join(', ') : (raw.genre || raw.genres || 'Other'),
            category: (raw.category || raw.owner || raw.type || 'rewatch').toLowerCase(),
            watched: Boolean(raw.watched || raw.is_watched || false),
            created_at: raw.created_at || new Date().toISOString()
        };
    }

    /**
     * Fetch all movies from Supabase.
     * Automatically uploads any existing local movies to Supabase so nothing is lost!
     */
    async getMovies() {
        await this.ensureCredentials();

        if (this.hasSupabaseCredentials()) {
            try {
                const endpoint = `${this.supabaseUrl}/rest/v1/${this.tableName}?select=*&order=created_at.desc`;
                const res = await fetch(endpoint, {
                    headers: {
                        'apikey': this.supabaseAnonKey,
                        'Authorization': `Bearer ${this.supabaseAnonKey}`,
                        'Accept': 'application/json'
                    }
                });

                if (res.ok) {
                    const remoteData = await res.json();
                    if (Array.isArray(remoteData)) {
                        const normalizedRemote = remoteData.map(m => this.normalizeMovie(m));

                        // Auto-sync: If user added movies locally, push them to Supabase
                        if (!this.hasSyncedLocalToRemote) {
                            this.hasSyncedLocalToRemote = true;
                            await this.syncLocalMoviesToSupabase(normalizedRemote);
                            // Re-fetch after syncing
                            const refreshedRes = await fetch(endpoint, {
                                headers: {
                                    'apikey': this.supabaseAnonKey,
                                    'Authorization': `Bearer ${this.supabaseAnonKey}`,
                                    'Accept': 'application/json'
                                }
                            });
                            if (refreshedRes.ok) {
                                const refreshedData = await refreshedRes.json();
                                const refreshedNormalized = refreshedData.map(m => this.normalizeMovie(m));
                                this.saveLocalCache(refreshedNormalized);
                                return refreshedNormalized;
                            }
                        }

                        this.saveLocalCache(normalizedRemote);
                        return normalizedRemote;
                    }
                } else {
                    console.warn(`Supabase returned status ${res.status}. Using cache.`);
                }
            } catch (err) {
                console.warn('Supabase fetch failed, using local cache:', err);
            }
        }

        return this.getLocalCache();
    }

    /**
     * Ensures any movies currently in local storage are safely uploaded to Supabase
     */
    async syncLocalMoviesToSupabase(remoteMovies) {
        const local = this.getLocalCache();
        const remoteTitles = new Set(remoteMovies.map(m => m.title.toLowerCase().trim()));

        const missingInRemote = local.filter(m => !remoteTitles.has(m.title.toLowerCase().trim()));

        for (const item of missingInRemote) {
            try {
                const endpoint = `${this.supabaseUrl}/rest/v1/${this.tableName}`;
                await fetch(endpoint, {
                    method: 'POST',
                    headers: {
                        'apikey': this.supabaseAnonKey,
                        'Authorization': `Bearer ${this.supabaseAnonKey}`,
                        'Content-Type': 'application/json',
                        'Prefer': 'return=representation'
                    },
                    body: JSON.stringify({
                        title: item.title,
                        genre: item.genre,
                        category: item.category,
                        watched: item.watched
                    })
                });
            } catch (e) {
                console.warn('Auto-sync item failed:', item.title, e);
            }
        }
    }

    /**
     * Add a new movie directly to Supabase and update local cache
     */
    async addMovie(movie) {
        const item = this.normalizeMovie(movie);
        await this.ensureCredentials();

        if (this.hasSupabaseCredentials()) {
            try {
                const endpoint = `${this.supabaseUrl}/rest/v1/${this.tableName}`;
                const res = await fetch(endpoint, {
                    method: 'POST',
                    headers: {
                        'apikey': this.supabaseAnonKey,
                        'Authorization': `Bearer ${this.supabaseAnonKey}`,
                        'Content-Type': 'application/json',
                        'Prefer': 'return=representation'
                    },
                    body: JSON.stringify({
                        title: item.title,
                        genre: item.genre,
                        category: item.category,
                        watched: item.watched
                    })
                });

                if (res.ok) {
                    const returned = await res.json();
                    if (Array.isArray(returned) && returned[0]) {
                        item.id = String(returned[0].id || item.id);
                    }
                }
            } catch (err) {
                console.warn('Could not post to Supabase, saving to local cache:', err);
            }
        }

        const local = this.getLocalCache();
        local.unshift(item);
        this.saveLocalCache(local);
        return item;
    }

    /**
     * Delete a movie by ID
     */
    async deleteMovie(id) {
        await this.ensureCredentials();

        if (this.hasSupabaseCredentials()) {
            try {
                const endpoint = `${this.supabaseUrl}/rest/v1/${this.tableName}?id=eq.${id}`;
                await fetch(endpoint, {
                    method: 'DELETE',
                    headers: {
                        'apikey': this.supabaseAnonKey,
                        'Authorization': `Bearer ${this.supabaseAnonKey}`
                    }
                });
            } catch (err) {
                console.warn('Failed deleting from Supabase:', err);
            }
        }

        const local = this.getLocalCache().filter(m => m.id !== String(id));
        this.saveLocalCache(local);
        return local;
    }

    /**
     * Mark movie as watched
     */
    async markWatched(id, watched = true) {
        await this.ensureCredentials();

        if (this.hasSupabaseCredentials()) {
            try {
                const endpoint = `${this.supabaseUrl}/rest/v1/${this.tableName}?id=eq.${id}`;
                await fetch(endpoint, {
                    method: 'PATCH',
                    headers: {
                        'apikey': this.supabaseAnonKey,
                        'Authorization': `Bearer ${this.supabaseAnonKey}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ watched: Boolean(watched) })
                });
            } catch (err) {
                console.warn('Failed patching watched status in Supabase:', err);
            }
        }

        const local = this.getLocalCache().map(m => {
            if (m.id === String(id)) {
                return { ...m, watched: Boolean(watched) };
            }
            return m;
        });
        this.saveLocalCache(local);
        return local;
    }

    /**
     * Local storage cache methods
     */
    getLocalCache() {
        const saved = localStorage.getItem(STORAGE_KEY_MOVIES);
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                if (Array.isArray(parsed) && parsed.length > 0) {
                    return parsed;
                }
            } catch (e) {
                console.error(e);
            }
        }
        // Initialize with default movies (which contains the user's added movies!)
        const initial = CONFIG.defaultMovies.map(m => this.normalizeMovie(m));
        this.saveLocalCache(initial);
        return initial;
    }

    saveLocalCache(movies) {
        localStorage.setItem(STORAGE_KEY_MOVIES, JSON.stringify(movies));
    }

    /**
     * History methods
     */
    getHistory() {
        const saved = localStorage.getItem(STORAGE_KEY_HISTORY);
        return saved ? JSON.parse(saved) : [];
    }

    addHistory(drawnItem) {
        const history = this.getHistory();
        history.unshift({
            title: drawnItem.title,
            category: drawnItem.category,
            genre: drawnItem.genre,
            drawnAt: new Date().toISOString()
        });
        localStorage.setItem(STORAGE_KEY_HISTORY, JSON.stringify(history.slice(0, 30)));
    }

    clearHistory() {
        localStorage.setItem(STORAGE_KEY_HISTORY, JSON.stringify([]));
    }
}
