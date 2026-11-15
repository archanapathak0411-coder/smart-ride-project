# JC Smart Ride

Campus carpool app for J.C. Bose University of Science and Technology, YMCA, Faridabad.
Students offer a ride or search for one. The API ranks rides with a match score, then with a KNN step when at least two rides are open.

Three parts share one API:

- `backend` — Flask
- `web` — React website
- `JcSmartRide` — React Native app

## Demo logins

| Who | Email | Password |
| --- | --- | --- |
| Admin | admin@jcsmart.local | Admin@12345 |
| Driver | driver@jcsmart.local | Student@123 |
| Passenger | passenger@jcsmart.local | Student@123 |
| Waiting for verification | pending@jcsmart.local | Student@123 |

The driver has a Sector 16 to campus ride at 08:31 today. Search as the passenger from Sector 15 to campus at 08:30. That ride should rank first.

## 1. Database

MySQL is the database the project is written for.

```bash
docker compose up -d
cp backend/.env.example backend/.env
```

`backend/.env.example` points at MySQL:

`mysql+pymysql://jcsmart:jcsmart@127.0.0.1:3306/jc_smart_ride?charset=utf8mb4`

If Docker cannot start on this machine, use a SQLite file instead so you can still run the app:

```text
DATABASE_URL=sqlite:////absolute/path/to/clgPj/backend/jcsmart.sqlite
```

## 2. API

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python3 -m app.seed
python3 run.py
```

The API listens on port 5000. Open http://127.0.0.1:5000/api/health and you should see `{"status":"ok"}`.

`requirements.txt` asks for Flask, Flask-SQLAlchemy, Flask-JWT-Extended, Flask-Cors and scikit-learn. When those packages are installed, the app uses them. If scikit-learn is missing, `backend/app/matching/simple_neighbors.py` does the same two jobs (scale the numbers, then find the nearest rides) so matching still runs.

Seed is safe to run again. It will not duplicate the demo accounts.

## 3. Website

```bash
cd web
npm install
npm run dev
```

Open http://127.0.0.1:5173 . The dev server forwards `/api` to Flask.

Optional Google map: put a browser key in `web/.env`:

```text
VITE_GOOGLE_MAPS_API_KEY=your-key
```

Without a key, the place dropdown still works and matching still uses the saved coordinates.

## 4. Phone app

```bash
cd JcSmartRide
npm install
npx react-native run-android
```

`src/config.ts` sets the API address. The Android emulator uses `http://10.0.2.2:5000`. On a real phone, change it to your computer's address, for example `http://192.168.1.20:5000`.

The app is allowed to call that address over plain HTTP. A map is drawn only when `GOOGLE_MAPS_API_KEY` in `src/config.ts` is filled in. Then add this inside the `<application>` tag in `android/app/src/main/AndroidManifest.xml`:

```xml
<meta-data
  android:name="com.google.android.geo.API_KEY"
  android:value="your-android-maps-key" />
```

Booking does not need the map. Pick a place from the list.

## What the match score does

Hard filters run first: same date, a free seat, not your own ride, and women-only rides stay in their own list.

The score is out of 100:

- pickup closeness 25%
- drop closeness 25%
- time gap 20%
- cost 10%
- driver rating 10%
- free seats 5%
- a past completed trip with that driver 5%

When two or more rides remain, scikit-learn `NearestNeighbors` ranks them against an ideal trip (no distance, no time gap). The list you see is 60% the score above and 40% that closeness.

## Tests

```bash
cd backend
python3 -m pytest
```

```bash
cd JcSmartRide
npx jest
```
