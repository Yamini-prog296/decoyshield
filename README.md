# DecoyShield

DecoyShield is a standalone, proactive ransomware early-warning system designed to detect suspicious behavior before real files are encrypted. It uses harmless canary files and hash-based monitoring to flag unusual changes, deletions, and ransomware-like file extensions.

This project is intentionally defensive and safe by design:
- It only watches a dedicated decoy directory
- It never encrypts user data
- It never deletes or modifies production files
- It raises early warnings for investigation and response

## Why DecoyShield?

Ransomware often follows a predictable pattern:
- rapid file modifications
- unexpected deletions
- suspicious extension changes
- mass file encryption behavior

DecoyShield creates decoy files that look valuable but are non-critical. If a ransomware process touches them, it triggers an alert early enough to warn security teams, administrators, or users before the real data is affected.

## Features

- Decoy/canary file creation
- SHA-256 integrity checks
- File modification and deletion detection
- Rapid-change detection
- Suspicious file-extension alerting
- Real-time directory monitoring
- Console-based alerts
- Lightweight, dependency-free implementation

## Supported suspicious extensions

DecoyShield flags common ransomware-style extensions such as:
- .locked
- .encrypted
- .enc
- .crypt
- .ryk
- .wncry
- .wannacry
- .lockbit
- .conti
- .revil
- .akira
- .blackcat
- .ransom

## Project structure

```text
decoyshield/
├── DecoyShield.js
├── README.md
├── decoys/        # created automatically
└── .gitignore
```

## Installation

```bash
git clone https://github.com/Yamini-prog296/decoyshield.git
cd decoyshield
node DecoyShield.js
```

## Configuration

By default, the tool monitors a local folder named `decoys` in the project root.

You can override the directory with:

```bash
DECOY_DIR=/path/to/monitoring-folder node DecoyShield.js
```

## Example output

```text
DecoyShield monitoring /home/user/decoyshield/decoys
[DecoyShield CRITICAL] {"id":"...","timestamp":"2026-09-20T10:00:00.000Z","file":"client-contracts.txt","action":"modified","score":85,"severity":"critical","reason":"A protected decoy changed unexpectedly"}
```

## How it works

1. Creates safe decoy files in a watch directory
2. Calculates and stores their hash values
3. Monitors the folder for file changes
4. Compares hashes and detects suspicious behavior
5. Raises alerts when modification patterns match ransomware behavior

## Security note

This is an early-warning tool, not a complete ransomware prevention system. It should be used alongside:
- endpoint protection
- access controls
- offline backups
- security monitoring
- incident response plans

## License

MIT License

## Author

Yamini V
