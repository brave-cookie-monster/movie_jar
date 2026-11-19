/**
 * Configuration & Defaults for Movie Jar
 */

export const CONFIG = {
    // Supabase REST endpoint configuration
    supabase: {
        url: 'https://odpguhxozwwivaaandpw.supabase.co',
        defaultTable: 'Movies',
        storageKeyAnon: 'movie_jar_supabase_anon_key',
        storageKeyUrl: 'movie_jar_supabase_url',
        storageKeyTable: 'movie_jar_supabase_table',
    },

    // Rotation steps agreed upon:
    // 1. King Ali
    // 2. Queen Dana
    // 3. rewatches (added from both of us)
    rotation: [
        {
            id: 'mine',
            label: 'King Ali',
            shortLabel: 'King Ali',
            owner: 'King Ali',
            icon: 'fa-crown',
            color: 'amber',
            badgeClass: 'bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300 border-amber-300 dark:border-amber-800',
            accentColor: '#f59e0b',
            description: 'Movie picked by King Ali'
        },
        {
            id: 'hers',
            label: 'Queen Dana',
            shortLabel: 'Queen Dana',
            owner: 'Queen Dana',
            icon: 'fa-crown',
            color: 'rose',
            badgeClass: 'bg-rose-100 text-rose-800 dark:bg-rose-950/80 dark:text-rose-300 border-rose-300 dark:border-rose-800',
            accentColor: '#f43f5e',
            description: 'Movie picked by Queen Dana'
        },
        {
            id: 'rewatch',
            label: 'Rewatches',
            shortLabel: 'Rewatch',
            owner: 'Both',
            icon: 'fa-rotate-right',
            color: 'indigo',
            badgeClass: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950/80 dark:text-indigo-300 border-indigo-300 dark:border-indigo-800',
            accentColor: '#6366f1',
            description: 'Rewatch favorites added by both of us'
        }
    ],

    // Standard movie genres
    genres: [
        'Action',
        'Adventure',
        'Animation',
        'Comedy',
        'Crime',
        'Documentary',
        'Drama',
        'Fantasy',
        'Horror',
        'Mystery',
        'Romance',
        'Sci-Fi',
        'Thriller'
    ],

    // Default starter movies, including all the user's rewatch picks from their session
    defaultMovies: [
        // User's added rewatches
        { id: 'rw-1', title: 'The love trilogy', category: 'rewatch', genre: 'Drama', watched: false },
        { id: 'rw-2', title: 'In the mood for love', category: 'rewatch', genre: 'Drama', watched: false },
        { id: 'rw-3', title: 'The Odyssey', category: 'rewatch', genre: 'Drama', watched: false },
        { id: 'rw-4', title: '2001: A Space Odessey', category: 'rewatch', genre: 'Sci-Fi', watched: false },
        { id: 'rw-5', title: 'Intouchables', category: 'rewatch', genre: 'Drama', watched: false },
        { id: 'rw-6', title: 'Good will hunting', category: 'rewatch', genre: 'Drama', watched: false },
        { id: 'rw-7', title: 'Your Name <3', category: 'rewatch', genre: 'Animation', watched: false },
        { id: 'rw-8', title: 'Arrival', category: 'rewatch', genre: 'Sci-Fi', watched: false },
    ]
};
