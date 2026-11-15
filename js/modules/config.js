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
    // 1. my movie
    // 2. her movies
    // 3. rewatches (added from both of us)
    rotation: [
        {
            id: 'mine',
            label: 'My Movie',
            shortLabel: 'My Pick',
            owner: 'Me',
            icon: 'fa-user-astronaut',
            color: 'amber',
            badgeClass: 'bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300 border-amber-300 dark:border-amber-800',
            accentColor: '#f59e0b',
            description: 'Movie picked by you'
        },
        {
            id: 'hers',
            label: 'Her Movie',
            shortLabel: 'Her Pick',
            owner: 'Her',
            icon: 'fa-heart',
            color: 'rose',
            badgeClass: 'bg-rose-100 text-rose-800 dark:bg-rose-950/80 dark:text-rose-300 border-rose-300 dark:border-rose-800',
            accentColor: '#f43f5e',
            description: 'Movie picked by her'
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

    // Default starter movies if localStorage and Supabase are empty
    defaultMovies: [
        { id: '1', title: 'Blade Runner 2049', category: 'mine', genre: 'Sci-Fi', watched: false },
        { id: '2', title: 'Arrival', category: 'mine', genre: 'Sci-Fi', watched: false },
        { id: '3', title: 'The Prestige', category: 'mine', genre: 'Mystery', watched: false },
        { id: '4', title: 'La La Land', category: 'hers', genre: 'Romance', watched: false },
        { id: '5', title: 'Little Women', category: 'hers', genre: 'Drama', watched: false },
        { id: '6', title: 'Pride & Prejudice', category: 'hers', genre: 'Romance', watched: false },
        { id: '7', title: 'Spirited Away', category: 'rewatch', genre: 'Animation', watched: false },
        { id: '8', title: 'The Grand Budapest Hotel', category: 'rewatch', genre: 'Comedy', watched: false },
        { id: '9', title: 'Parasite', category: 'rewatch', genre: 'Thriller', watched: false }
    ]
};
