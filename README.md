# Kontakte-CRM

Einfaches, dunkles CRM für Networking-Kontakte: Name, Kategorie (Musik,
Business, Bar/Event, Radio/TV, frei erweiterbar), wo getroffen, Notizen,
Status und Follow-up-Termine mit eigenem "Fällig"-Tab.

Läuft komplett lokal im Browser (Daten liegen in `localStorage` deines
Geräts) und lässt sich als App auf dem Homescreen installieren.

## Deploy (gleicher Ablauf wie beim Trainings-Tracker)

1. Neues GitHub-Repo anlegen (z. B. `kontakte-crm`)
2. Alle Dateien aus diesem Ordner hochladen (Datei-für-Datei über
   "uploading an existing file", falls Ordner-Upload nicht geht)
3. In Vercel: "Add New" → "Project" → "Import Git Repository" → das
   neue Repo auswählen → Deploy
4. Fertige URL auf dem Handy öffnen → "Zum Home-Bildschirm hinzufügen"

## Lokal testen

```bash
npm install
npm run dev
```
