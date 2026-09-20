# DecoyShield

DecoyShield is a standalone, proactive ransomware early-warning system designed to detect suspicious behavior before real files are encrypted. It uses harmless canary files and hash-based monitoring to flag unusual changes, deletions, and ransomware-like file extensions.

This project includes both a backend monitoring service and a simple frontend dashboard.

## Features

- Decoy/canary file creation
- SHA-256 integrity checks
- File modification and deletion detection
- Rapid-change detection
- Suspicious file-extension alerting
- Live file monitoring
- API endpoints for status and streaming alerts
- Responsive dashboard UI

## Run locally

```bash
npm install
npm start
```

Then open the frontend dashboard in a browser:

```text
http://localhost:5000
```

Since the frontend is served through the API, you can also just open the HTML file in a browser if you are using a static server, but the easiest setup is to run the Node API.

## Project structure

```text
decoyshield/
├── DecoyShield.js
├── README.md
├── package.json
├── backend/
│   └── server.js
├── frontend/
│   ├── index.html
│   ├── app.js
│   └── style.css
├── decoys/
└── .gitignore
```

## API endpoints

- `GET /api/health`
- `GET /api/decoyshield/status`
- `GET /api/decoyshield/events`
- `GET /api/decoyshield/stream`
- `POST /api/decoyshield/scan`
- `POST /api/decoyshield/start`
- `POST /api/decoyshield/stop`

## Security note

This system is designed as an early-warning and monitoring tool. It does not disable or block ransomware, and it should be used with endpoint protection, backup systems, and incident response procedures.
