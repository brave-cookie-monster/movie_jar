# 🎬 Movie Jar - Decision Picker & Rotation System

A modern, cinematic web application for picking movie night selections adhering to an agreed 3-step rotation.

## 🌟 Key Features

1. **Movie Focused**: Designed specifically for film selections with genres, movie tickets, and cinephile aesthetics.
2. **Agreed 3-Step Rotation**:
   - **Turn 1: My Movie** (User's pick)
   - **Turn 2: Her Movie** (Friend's pick)
   - **Turn 3: Rewatches** (Added by both)
   - Includes automatic advancement upon drawing or marking a movie as watched, plus manual turn switcher.
3. **Genre Management & Filtering**:
   - Supports all standard genres (Sci-Fi, Romance, Drama, Comedy, Horror, Thriller, Animation, etc.) plus custom genres.
   - Dynamic genre filter to narrow down selections before drawing.
4. **Supabase Cloud Sync + LocalStorage Fallback**:
   - Connected to Supabase REST endpoint: `https://odpguhxozwwivaaandpw.supabase.co/rest/v1/Movies`.
   - Works immediately out of the box with offline `localStorage` fallback.
   - Built-in settings modal to enter Supabase Anon Key and test live connection.
5. **Completely Modular Architecture**:
   - Adheres to clean ES Module best practices.

---

## 🏺 How to Customize the Jar (Single File Edit)

As requested, all visual elements, dimensions, glass styling, cork lid, and paper slip physics of the jar are completely isolated in one single module:

👉 **[`js/modules/jar.js`](js/modules/jar.js)**

To change how the jar looks, open `js/modules/jar.js` and edit the `JAR_STYLE` configuration object at the top:

```javascript
export const JAR_STYLE = {
    dimensions: {
        bodyWidthRatio: 0.64,    // Adjust jar width
        bodyHeightRatio: 0.64,   // Adjust jar height
        cornerRadius: 32,        // Curvature of jar corners
    },
    cork: {
        color: '#b45309',        // Cork lid color
        accentLineColor: '#92400e',
    },
    glass: {
        strokeColor: 'rgba(255, 255, 255, 0.65)',
        gradientStops: [ ... ],  // Transparency & reflections
    },
    slips: {
        categoryColors: {
            mine: '#FBBF24',      // My Movie slip color
            hers: '#FB7185',      // Her Movie slip color
            rewatch: '#818CF8',   // Rewatches slip color
        }
    },
    physics: { ... }
};
```

---

## 📂 Project Structure

```
movie_jar/
├── index.html               # Main semantic HTML structure
├── css/
│   └── styles.css           # Glassmorphism, ticket unfolding animations, cinema theme
├── js/
│   ├── app.js               # Application coordinator and UI event handlers
│   └── modules/
│       ├── jar.js           # 🏺 THE JAR MODULE (Visuals, physics, canvas rendering)
│       ├── audio.js         # Web Audio synthesizer (rustling, ticket pop, fanfares)
│       ├── config.js        # Rotation definition, default genres, and starter data
│       ├── rotation.js      # 3-step rotation tracker & state machine
│       └── storage.js       # Supabase REST client + LocalStorage synchronization
└── README.md                # Documentation & customization guide
```

---

## 🚀 Deployment (Vercel)

This application is built with standard native ES Modules and HTML/CSS. It has zero build dependencies and deploys directly to Vercel upon pushing to `main`:

```bash
git add .
git commit -m "Refactor to modular movie jar with rotation and genre support"
git push origin main
```
