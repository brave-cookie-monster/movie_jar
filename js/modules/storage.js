/**
 * Storage & Supabase Sync Layer
 * Manages movies in Supabase REST API with transparent LocalStorage fallback.
 */

import { CONFIG } from './config.js';

const STORAGE_KEY_MOVIES = 'movie_jar_movies_cache';
const STORAGE_KEY_HISTORY = 'movie_jar_history';

export class MovieStorage {
    constructor() {
        this.supabaseUrl = localStorage.getItem(CONFIG.supabase.storageKeyUrl) || CONFIG.supabase.url;
        this.supabaseAnonKey = localStorage.getItem(CONFIG.supabase.storageKeyAnon) || '';
        this.tableName = localStorage.getItem(CONFIG.supabase.storageKeyTable) || CONFIG.supabase.defaultTable;
        this.isSupabaseActive = Boolean(this.supabaseAnonKey && this.supabaseAnonKey.trim().length > 0);
    }

    /**
     * Check if Supabase credentials are configured
     */
    hasSupabaseCredentials() {
        return Boolean(this.supabaseAnonKey && this.supabaseAnonKey.trim().length > 0);
    }

    /**
     * Update Supabase connection credentials
     */
    updateSupabaseConfig(anonKey, customUrl, customTable) {
        if (typeof anonKey === 'string') {
            this.supabaseAnonKey = anonKey.trim();
            localStorage.setItem(CONFIG.supabase.storageKeyAnon, this.supabaseAnonKey);
        }
        if (typeof customUrl === 'string' && customUrl.trim()) {
            this.supabaseUrl = customUrl.trim().replace(/\/+$/, '');
            localStorage.setItem(CONFIG.supabase.storageKeyUrl, this.supabaseUrl);
        }
        if (typeof customTable === 'string' && customTable.trim()) {
            this.tableName = customTable.trim();
            localStorage.setItem(CONFIG.supabase.storageKeyTable, this.tableName);
        }
        this.isSupabaseActive = Boolean(this.supabaseAnonKey && this.supabaseAnonKey.length > 0);
    }

    /**
     * Normalize movie object fields across Supabase schema variants
     */
    normalizeMovie(raw) {
        return {
            id: String(raw.id || raw._id || Date.now() + Math.random().toString(36).substr(2, 5)),
            title: raw.title || raw.name || raw.movie || 'Untitled Movie',
            genre: Array.isArray(raw.genre) ? raw.genre.join(', ') : (raw.genre || raw.genres || 'Other'),
            category: (raw.category || raw.owner || raw.type || 'mine').toLowerCase(),
            watched: Boolean(raw.watched || raw.is_watched || false),
            created_at: raw.created_at || new Date().toISOString()
        };
    }

    /**
     * Fetch all movies from Supabase or LocalStorage fallback
     */
    async getMovies() {
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
                    const data = await res.json();
                    if (Array.isArray(data)) {
                        const normalized = data.map(m => this.normalizeMovie(m));
                        this.saveLocalCache(normalized);
                        return normalized;
                    }
                } else {
                    console.warn(`Supabase returned status ${res.status}. Falling back to cache.`);
                }
            } catch (err) {
                console.warn('Supabase fetch failed, using local storage cache:', err);
            }
        }

        return this.getLocalCache();
    }

    /**
     * Add a new movie
     */
    async addMovie(movie) {
        const item = this.normalizeMovie(movie);

        // Try Supabase first if active
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
                console.warn('Could not post to Supabase, saving locally:', err);
            }
        }

        // Always update local cache
        const local = this.getLocalCache();
        local.unshift(item);
        this.saveLocalCache(local);
        return item;
    }

    /**
     * Delete a movie by ID
     */
    async deleteMovie(id) {
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
     * Test Supabase connection
     */
    async testConnection(anonKey, url, table) {
        const testUrl = (url || this.supabaseUrl).replace(/\/+$/, '');
        const testKey = anonKey || this.supabaseAnonKey;
        const testTable = table || this.tableName;

        try {
            const endpoint = `${testUrl}/rest/v1/${testTable}?select=*&limit=1`;
            const res = await fetch(endpoint, {
                headers: {
                    'apikey': testKey,
                    'Authorization': `Bearer ${testKey}`
                }
            });
            return {
                ok: res.ok,
                status: res.status,
                message: res.ok ? 'Connected successfully to Supabase!' : `Server responded with HTTP ${res.status}`
            };
        } catch (err) {
            return {
                ok: false,
                status: 0,
                message: `Network error: ${err.message}`
            };
        }
    }

    /**
     * LocalStorage helpers
     */
    getLocalCache() {
        const saved = localStorage.getItem(STORAGE_KEY_MOVIES);
        if (saved) {
            try {
                return JSON.parse(saved);
            } catch (e) {
                console.error(e);
            }
        }
        // Initialize with default movies if completely empty
        const initial = CONFIG.defaultMovies.map(m => this.normalizeMovie(m));
        this.saveLocalCache(initial);
        return initial;
    }

    saveLocalCache(movies) {
        localStorage.setItem(STORAGE_KEY_MOVIES, JSON.stringify(movies));
    }

    /**
     * Draw history management
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
