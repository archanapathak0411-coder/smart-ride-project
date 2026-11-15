# JC Smart Ride — start it yourself on a new computer

This is the college carpool project for J.C. Bose University of Science and Technology, YMCA, Faridabad. Students offer empty seats. Other students search and see the best ride first, with a match score.

You need the website for a professor demo. The phone app is optional.

Keep two terminal windows open at the end: one for the API, one for the website. Closing a window stops that part.

## 1. Install these programs once

Install them from their official websites if `python3 --version` or `node --version` fails.

- Python 3.9 or newer. During Windows setup, tick "Add python.exe to PATH".
- Node.js 18 or newer. This also installs npm.
- A browser such as Chrome.

Docker Desktop is optional. It runs MySQL, which is the database named in the project report. If Docker is confusing or will not start, skip it. The steps below then use a single file database called SQLite. The website looks the same either way.

Check in a terminal:

```bash
python3 --version
node --version
npm --version
```

On Windows, `python --version` is fine if `python3` is not found. Use `python` in the later commands wherever this guide says `python3`.

## 2. Open the project folder

Copy the whole project folder onto the new computer. Open a terminal in that folder. You should see these names when you list files:

- `backend`
- `web`
- `JcSmartRide`
- `docker-compose.yml`

Every command that says "project root" means this folder.

## 3. Create the password file

The API will not start correctly until this file exists.

**Linux or macOS**, from the project root:

```bash
cp backend/.env.example backend/.env
```

**Windows**, from the project root:

```powershell
copy backend\.env.example backend\.env
```

Open `backend/.env` in a text editor. It should contain:

```text
DATABASE_URL=mysql+pymysql://jcsmart:jcsmart@127.0.0.1:3306/jc_smart_ride?charset=utf8mb4
JWT_SECRET_KEY=change-this-dev-secret
ADMIN_EMAIL=admin@jcsmart.local
ADMIN_PASSWORD=Admin@12345
```

Leave the email and password lines as they are. Those become the admin login.

### Choice A — MySQL with Docker

Use this when Docker Desktop is installed and running.

From the project root:

```bash
docker compose up -d
```

Wait about 30 seconds. The database name is `jc_smart_ride`. The database user is `jcsmart` and the password is `jcsmart`. You do not type these into the website. They are only for the API.

Leave `DATABASE_URL` as the MySQL line already in `.env`.

### Choice B — no Docker

Use this when Docker is not available. Replace the `DATABASE_URL` line only.

Linux or macOS, using your real project path:

```text
DATABASE_URL=sqlite:////home/YOURNAME/clgPj/backend/jcsmart.sqlite
```

Windows:

```text
DATABASE_URL=sqlite:///C:/Users/YOURNAME/clgPj/backend/jcsmart.sqlite
```

Use forward slashes on Windows. Save the file.

## 4. Install the API and create the demo logins

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
```

Windows PowerShell:

```powershell
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
python -m app.seed
```

`pip install` can take a few minutes. It downloads Flask and the matching libraries.

`python -m app.seed` creates the tables, the places around Faridabad, and these logins:

| Who | Email | Password | What to show |
| --- | --- | --- | --- |
| Admin | admin@jcsmart.local | Admin@12345 | Student verification |
| Driver (Rahul) | driver@jcsmart.local | Student@123 | Accept a seat request |
| Passenger (Ananya) | passenger@jcsmart.local | Student@123 | Search and match score |
| Not approved yet | pending@jcsmart.local | Student@123 | Offer ride is blocked |

You do not create these accounts by hand. The seed command creates them. Running seed again will not create duplicates.

The same command adds today's demo rides:

- Sector 16 to JC Bose University (Campus) at 08:31, three seats, Rs 40, driver Rahul
- A women-only ride from Sector 21 at 08:45
- A far ride from Badarpur Border to Ballabhgarh at 18:00, so the ranking has a weak match to compare

## 5. Start the API and leave it running

Still inside `backend`, with the virtual environment active (your prompt shows `(.venv)`):

```bash
python run.py
```

Leave this window open. When it is ready you will see a line like `Running on http://127.0.0.1:5000` or "Running on all addresses".

Open this address in the browser:

http://127.0.0.1:5000/api/health

You should see:

```text
{"name":"JC Smart Ride","status":"ok"}
```

That page is the API, not the website. The website is the next step.

## 6. Start the website

Open a second terminal. Go to the project root, then:

```bash
cd web
npm install
npm run dev
```

Leave this window open too. It will print a local address, normally:

http://127.0.0.1:5173

Open that address. You should see "Share the ride to campus" and a search form with places such as Sector 15 and JC Bose University (Campus).

No Google Maps key is required. The dropdown is enough.

## 7. What to click for the professor

Do this in order. Use today's date. The time box should say 08:30.

### A. Show the idea

On the home page, read the three cards: smart match, campus verification, and money saved.

### B. Passenger finds the best ride

1. Click Login.
2. Email `passenger@jcsmart.local`, password `Student@123`.
3. Click Find Ride.
4. Pickup: Sector 15.
5. Drop: JC Bose University (Campus).
6. Date: today. Time: 08:30.
7. Leave "Show women-only rides only" unticked.
8. Click Find rides.

The first card must be Sector 16 to campus at 08:31, with a high score (around 90). The Badarpur ride must be lower (around 11). The page should say the list used the match score and the KNN recommendation. Point at the reasons: nearby pickup, same destination, about 1 minute apart.

Click Request seat. The green line says the request was sent.

### C. Driver accepts

1. Click Log out.
2. Log in as `driver@jcsmart.local` / `Student@123`.
3. Open My Rides.
4. Under the Sector 16 ride, Ananya's request is pending. Click Accept.

Seats go from 3 to 2. That is the booking working.

If the clock on the computer is already after 08:31, you can also click Mark completed. Then log back in as the passenger, open My Rides, choose the completed tab, and rate the ride. The savings box uses Rs 120 as the usual solo fare, so a Rs 40 share shows Rs 80 saved.

If it is still before 08:31, skip "Mark completed" and tell the professor the app allows completion only after the departure time.

### D. Admin verifies a student

1. Log out.
2. Log in as `admin@jcsmart.local` / `Admin@12345`.
3. Open Admin.
4. Show the student list. Pending Student (`pending@jcsmart.local`) is waiting.
5. Click Verify on that row.

Then log in as `pending@jcsmart.local` / `Student@123` and open Offer Ride. Before verification the offer button stays blocked. After verification, the student can offer a ride.

### E. Women-only ride, if the professor asks

Log in as the passenger again. Tick "Show women-only rides only" and search the same route at 08:30. The Sector 16 ride disappears. Neha's Sector 21 ride at 08:45 is the one that remains. Untick the box to see the normal rides again.

## 8. Phone app, only if you want it in the demo

This needs Android Studio and a phone or emulator. Skip it if the website demo is enough.

```bash
cd JcSmartRide
npm install
npx react-native run-android
```

The emulator talks to the API at `http://10.0.2.2:5000`. That address is already in `JcSmartRide/src/config.ts`.

On a real phone, edit `API_URL` in that file to your computer's Wi-Fi address, for example `http://192.168.1.20:5000`. The phone and the computer must be on the same Wi-Fi. Find the address with `ip addr` on Linux or `ipconfig` on Windows.

The place list works with no Google Maps key.

## 9. Start it again tomorrow

You do not install again. You only start the two programs.

If you use Docker, from the project root:

```bash
docker compose up -d
```

Terminal 1:

```bash
cd backend
source .venv/bin/activate
python -m app.seed
python run.py
```

On Windows, activate with `.\.venv\Scripts\Activate.ps1` instead of `source`.

Run seed again so today's Sector 16 ride exists. Yesterday's ride will not match a search for today.

Terminal 2:

```bash
cd web
npm run dev
```

Open http://127.0.0.1:5173 and use the same logins.

## 10. If something goes wrong

**The health page does not open.** The first terminal is not running `python run.py`, or it showed an error. Read the last lines in that window.

**Website opens but the place list says it cannot connect.** The API window was closed. Start `python run.py` again.

**Login says the email or password is wrong.** From `backend`, with `(.venv)` active, run `python -m app.seed` again. Then use the table in section 4. Passwords are case sensitive.

**MySQL connection refused.** Docker is not running, or you chose SQLite but `.env` still has the `mysql+pymysql` line. Either run `docker compose up -d` or switch to the SQLite line in section 3, then run seed again.

**Find rides shows nothing.** The date is not the day you last ran seed. Run `python -m app.seed` again and search with today's date.

**Port already in use.** An old copy is still running. Close the old terminal, or restart the computer, then start from section 9.

**pip or npm fails with a network error.** The computer cannot download packages. Connect to a normal network, or ask the lab admin to allow pypi.org and registry.npmjs.org, then repeat the install command.
