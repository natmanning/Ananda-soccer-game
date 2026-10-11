# Ananda FC ⚽

A football quiz career game for Ananda. Climb from **Youth Academy** to the **Ballon d'Or** by answering questions about players, clubs, tactics, rules, skills and records. Live stats from Europe's top leagues are mixed in.

## What's in it

- **Career ladder:** 6 levels with 3 matches each. Each question is a chance on goal: get it right and you score, get it wrong and the other team scores. Win 5–3 or better for 1 star, 6 or 7 goals for 2, and 8–0 for 3. Getting 5 stars in a level unlocks the next one.
- **This Season (live):** league tables, top scorers and headlines for the Premier League, La Liga, Bundesliga, Serie A, Ligue 1 and the Champions League. These turn into quiz questions like "Who is top of La Liga right now?"
- **Daily Challenge:** 5 questions a day, double coins.
- **Penalty Shootout:** "Real or Fake?" statements. Each right answer is a goal.
- **Training Ground:** 3 real drills a day to do outside (toe taps, weak-foot passes, Cruyff turns…). Each is worth 15 coins.
- **Sticker Album:** spend coins on packs and collect 40 legends and stars.
- **Trophy Cabinet:** 20 achievements, such as hat-tricks, day streaks and a full album.
- **Coach's tips:** many answers come with a tip he can use on the pitch.

Progress is saved on the phone (in the browser's local storage).

## Deploy (one time, about 2 minutes)

1. On GitHub, open this repo, then **Settings → Pages**.
2. Under **Build and deployment → Source**, choose **GitHub Actions**.
3. Go to the **Actions** tab, open **Update stats and deploy**, and click **Run workflow**. If a run already failed because Pages wasn't turned on yet, re-run it.
4. When it finishes, the game is live at **https://natmanning.github.io/Ananda-soccer-game/**

### Put it on the phone's home screen

- **iPhone (Safari):** open the link, tap **Share → Add to Home Screen**.
- **Android (Chrome):** open the link, tap **⋮ → Add to Home screen**.

It opens full-screen like an app, with its own icon.

## How the live stats work

`.github/workflows/deploy.yml` runs twice a day. It calls `scripts/fetch-live.mjs`, which downloads tables, top scorers and headlines from ESPN's public JSON feeds, writes `site/data/live.json`, and redeploys the site. If ESPN is down, the game still works with its built-in questions.

GitHub pauses scheduled workflows after 60 days without any commits. If the "updated" date in the game stops changing, open **Actions** and click **Enable workflow**, or push any small change.

## Adding questions

Edit `site/questions.js`. Each line looks like:

```js
q(2, 'clubs', 'Which club plays at Anfield?', 'Liverpool', ['Everton', 'Arsenal', 'Chelsea'], 'Fun fact shown after answering.', 'Optional coach tip.'),
```

Difficulty is 1 (easy) to 3 (hard). Push to `main` and the site redeploys automatically.

## Run locally

```sh
cd site && python3 -m http.server 8000   # then open http://localhost:8000
node --test scripts/fetch-live.test.mjs  # parser tests
node scripts/fetch-live.mjs              # fetch real live data into site/data/live.json
```
