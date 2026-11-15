# JC Smart Ride — give this file to an AI

Paste this whole file into Cursor, Claude, or Antigravity and say: "Follow this file and start the project on this computer."

You are setting up an existing college project. Do not redesign it. Do not change passwords. Do not delete the demo rides. Your job is to install what is missing, start the database and the API and the website, load the demo accounts, and prove the website opens.

The project folder contains three parts:

- `backend` — the Python Flask API and the database
- `web` — the React website
- `JcSmartRide` — the optional Android app

The website is enough for a professor demo. Start the phone app only if Android Studio is already installed.

## Demo accounts the seed command creates

Do not invent new passwords. These are the accounts:

- Admin: `admin@jcsmart.local` / `Admin@12345`
- Driver: `driver@jcsmart.local` / `Student@123`
- Passenger: `passenger@jcsmart.local` / `Student@123`
- Student waiting for approval: `pending@jcsmart.local` / `Student@123`

After seeding, today's demo ride is Sector 16 to JC Bose University (Campus) at 08:31, offered by the driver. A search from Sector 15 to campus at 08:30 must rank that ride first.

## What "done" looks like

1. `http://127.0.0.1:5000/api/health` returns `{"status":"ok","name":"JC Smart Ride"}`.
2. `http://127.0.0.1:5173` shows the JC Smart Ride home page with a place dropdown.
3. Logging in as the passenger and searching Sector 15 to campus at 08:30 shows the Sector 16 ride above the Badarpur ride, with a match score.
4. Tell the user the two URLs and the four logins above.

## Step 1. Find the project folder

Work in the folder that contains `backend`, `web`, `JcSmartRide`, and `docker-compose.yml`. Call that folder the project root. All commands below assume you `cd` there first.

## Step 2. Check the computer

You need:

- Python 3.9 or newer (`python3 --version`)
- Node.js 18 or newer (`node --version`) and npm
- pip

If Python or Node is missing, install it with the machine's normal installer and then continue. Do not switch the project to another language.

Docker is optional. Use it when `docker compose version` works and the Docker daemon is running. If Docker is missing, blocked, or cannot pull `mysql:8.4`, use SQLite instead. The app already supports both.

## Step 3. Create `backend/.env`

If `backend/.env` is missing, copy `backend/.env.example` to `backend/.env`.

Prefer MySQL when Docker works. The file should then contain:

```text
DATABASE_URL=mysql+pymysql://jcsmart:jcsmart@127.0.0.1:3306/jc_smart_ride?charset=utf8mb4
JWT_SECRET_KEY=change-this-dev-secret
ADMIN_EMAIL=admin@jcsmart.local
ADMIN_PASSWORD=Admin@12345
```

MySQL login inside Docker, only if you need it:

- database name: `jc_smart_ride`
- user: `jcsmart`
- password: `jcsmart`
- root password: `root`
- port: `3306`

If Docker cannot run, replace only `DATABASE_URL` with a SQLite file inside this project. Use the real absolute path of this computer, not an example path from another machine:

```text
DATABASE_URL=sqlite:////ABSOLUTE/PATH/TO/PROJECT/backend/jcsmart.sqlite
```

On Windows the SQLite URL looks like:

```text
DATABASE_URL=sqlite:///C:/Users/NAME/clgPj/backend/jcsmart.sqlite
```

Keep `ADMIN_EMAIL` and `ADMIN_PASSWORD` exactly as shown. If an old `.env` points at another computer's SQLite path, replace that path.

## Step 4. Start MySQL only when using Docker

From the project root:

```bash
docker compose up -d
```

Wait until the MySQL container is healthy (about 30 seconds). If the pull or the daemon fails, stop and switch `DATABASE_URL` to SQLite as in Step 3. Do not spend a long time fighting Docker.

## Step 5. Install and start the API

From the project root:

```bash
cd backend
python3 -m venv .venv
```

Linux or macOS:

```bash
source .venv/bin/activate
pip install -r requirements.txt
python -m app.seed
python run.py
```

Windows PowerShell:

```powershell
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
python -m app.seed
python run.py
```

Leave this terminal running. The API must listen on port 5000.

`python -m app.seed` creates the tables and the demo accounts. It is safe to run again. It will not duplicate those accounts.

If `pip install` fails because the network blocks PyPI, say so clearly. Do not pretend the API is installed. On a normal home or college network, pip should work.

Check with a second terminal:

```bash
curl http://127.0.0.1:5000/api/health
```

Expected body: `{"status":"ok","name":"JC Smart Ride"}`.

## Step 6. Start the website

In a new terminal, from the project root:

```bash
cd web
npm install
npm run dev
```

Leave this terminal running. Open `http://127.0.0.1:5173`.

Do not set a Google Maps key. The place list works without one. Matching uses saved coordinates.

## Step 7. Prove the demo

Using the website or the API, do all of this:

1. Log in as `passenger@jcsmart.local` / `Student@123`.
2. Find a ride: pickup Sector 15, drop JC Bose University (Campus), today's date, time 08:30. Leave "women-only" unticked.
3. Confirm the Sector 16 ride at 08:31 is first and has a higher score than the Badarpur ride.
4. Click Request seat. My Rides must show that request as pending.
5. Log out. Log in as `driver@jcsmart.local` / `Student@123`. My Rides must show the passenger request with Accept and Reject.
6. Log out. Log in as `admin@jcsmart.local` / `Admin@12345`. The Admin page must list students, including the pending student, with Verify and Reject buttons.

If the search date is not today, seed again. The demo rides are created for the day you run `python -m app.seed`.

## Phone app, only if asked

Do not block the website demo on the phone app.

```bash
cd JcSmartRide
npm install
npx react-native run-android
```

`JcSmartRide/src/config.ts` uses `http://10.0.2.2:5000` for the Android emulator. On a real phone, change `API_URL` to this computer's LAN address, for example `http://192.168.1.20:5000`. The API in `backend/run.py` already listens on all addresses.

## If something fails

- Port 5000 or 5173 already in use: stop the old process, or say which program is using it. Do not silently change the website proxy.
- MySQL connection refused: Docker is not up, or `.env` still points at MySQL. Either start Docker or switch to SQLite and run seed again.
- Login says the email or password is wrong: run `python -m app.seed` again from `backend` with the virtual environment active.
- Website loads but places are empty: the API is not running, or seed did not run.
- `pip` or `npm` is blocked by a proxy: try once, then tell the user the exact error. Do not delete the project.

When you finish, reply with the website URL, the API health URL, and the four demo logins. Say whether you used MySQL or SQLite.
