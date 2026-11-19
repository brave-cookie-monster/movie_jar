# 🎬 Movie Jar - Decision Picker & Rotation System

A modern, cinematic web application for picking movie night selections adhering to an agreed 3-step rotation.

## 🌟 Key Features

1. **Movie Focused**: Designed specifically for film selections with genres, movie tickets, and cinephile aesthetics.
2. **Agreed 3-Step Rotation**:
   - **Turn 1: King Ali**
   - **Turn 2: Queen Dana**
   - **Turn 3: Rewatches** (Added by both)
   - Automatic advancement upon drawing/watching, plus manual turn switcher.
3. **Database Always Integrated**:
   - Directly wired to Supabase REST endpoint: `https://odpguhxozwwivaaandpw.supabase.co/rest/v1/Movies`.
   - **No Database UI**: Clean interface with zero database modals or credentials exposed in the UI.
   - **Zero Data Loss**: Automatically syncs any movies in local storage up to Supabase.

---

## 🔑 How to Add Your Supabase Key

You have two convenient ways to set your key (choose whichever you prefer):

### Option A: In Vercel (Recommended)
1. Go to your **Vercel Dashboard** -> select your `movie_jar` project.
2. Go to **Settings** -> **Environment Variables**.
3. Add a new variable:
   * **Key**: `SUPABASE_ANON_KEY`
   * **Value**: *(paste your Supabase anon public key here)*
4. Click **Save** and redeploy. The built-in `/api/config` serverless function will automatically provide it to your app.

### Option B: In `env.js` or `.env`
Open [`env.js`](env.js) and paste your key:
```javascript
window.__ENV = {
    SUPABASE_URL: "https://odpguhxozwwivaaandpw.supabase.co",
    SUPABASE_ANON_KEY: "PASTE_YOUR_KEY_HERE"
};
```

---

## 🏺 How to Customize the Jar (Single File Edit)

All jar visuals (dimensions, cork lid, glass gradients, reflections, slip colors, physics) are located in:

👉 **[`js/modules/jar.js`](js/modules/jar.js)**

Edit the `JAR_STYLE` configuration object at the top of the file to modify any appearance settings.
