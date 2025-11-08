# flowdesk-kanban

Ein schlankes, modernes Fullstack-Kanban-Board – gebaut mit **Django REST** (Backend) und **React + TypeScript + Tailwind** (Frontend).

Du bekommst:

- Drag & Drop Kanban Board
- Prioritäten & Status
- Soft-Delete mit Papierkorb & Wiederherstellen
- Light/Dark/System Theme (automatisch nach Tageszeit)
- Saubere API-Struktur für eigene Erweiterungen

---

## Features

- 🎯 **Kanban-Spalten**: `To Do`, `In Progress`, `In Review`, `Done`
- 🏷️ **Prioritäten**: `low`, `medium`, `high`, `critical`
- 🗂️ **Projekte**: Standardboard via `default_project_key: "BOARD"`
- 📝 **Task-Details**:
  - Titel, Beschreibung, Due Date, Priority, Status, Order
- 🖱️ **Drag & Drop**:
  - Tasks zwischen Spalten verschieben
  - Reihenfolge innerhalb einer Spalte anpassen
- 🗑️ **Soft Delete & Papierkorb**:
  - Löschen verschiebt in den Papierkorb (`is_deleted = true`)
  - Wiederherstellen aus dem Papierkorb
  - Endgültiges Löschen nur aus Papierkorb
- 🌗 **Theming**:
  - `light` / `dark` / `system`
  - Systemmodus: tagsüber hell, abends dunkel
- 🔍 **Filter & Suche**:
  - Nach Status, Priorität, Text
  - Separate Ansicht für aktive Tasks vs. Papierkorb

---

## Tech Stack

**Backend**

- Python 3.x
- Django
- Django REST Framework
- django-filter
- CORS Headers
- SQLite (Default)

**Frontend**

- React + TypeScript
- Tailwind CSS
- Axios

---

## Projektstruktur

```bash
flowdesk-kanban/
├─ backend/
│  ├─ backend/          # Django Projekt (Settings, URLs, WSGI)
│  ├─ todos/            # App: Project + Task Modelle & API
│  ├─ manage.py
│  └─ db.sqlite3        # (lokal, nicht für Produktion)
│
├─ todo-frontend/
│  ├─ src/
│  │  ├─ components/
│  │  │  ├─ kanban/     # KanbanBoard, TrashBoard
│  │  │  ├─ layout/     # AppShell, BoardSidebar
│  │  │  └─ common/     # ConfirmDialog, etc.
│  │  ├─ lib/           # API-Client
│  │  └─ types/         # Kanban Typdefinitionen
│  ├─ package.json
│  └─ ...
│
├─ README.md
└─ .gitignore
