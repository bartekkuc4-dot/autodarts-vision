# AutoDarts Vision – Backend

Minimalistyczny backend FastAPI obsługujący detekcję lotek modelem YOLOv8.

## Struktura plików

```
backend/
├── main.py           ← serwer FastAPI (ten plik)
├── requirements.txt  ← zależności Pythona
└── best.pt           ← wagi modelu (skopiuj tutaj po wytrenowaniu)
```

## Szybki start

### 1. Utwórz i aktywuj wirtualne środowisko

```powershell
python -m venv .venv
.venv\Scripts\Activate.ps1
```

### 2. Zainstaluj zależności

```powershell
pip install -r requirements.txt
```

### 3. (Opcjonalnie) Skopiuj wagi modelu

```powershell
# jeśli masz już wytrenowany plik best.pt
copy <ścieżka_do_pliku>\best.pt .\best.pt
```

Jeśli plik `best.pt` **nie istnieje**, serwer uruchamia się w **trybie MOCK**
i zwraca przykładową odpowiedź (T20 + S20 = 80 pkt). Dzięki temu frontend
można rozwijać bez gotowego modelu.

### 4. Uruchom serwer

```powershell
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

Serwer będzie dostępny pod: `http://localhost:8000`
Swagger UI: `http://localhost:8000/docs`

---

## Endpointy

| Metoda | Ścieżka    | Opis                                        |
|--------|------------|---------------------------------------------|
| POST   | `/predict` | Detekcja – przyjmuje obraz Base64           |
| GET    | `/health`  | Sprawdzenie statusu serwera i trybu działania |

### Przykładowe żądanie `/predict`

```json
{
  "image": "data:image/jpeg;base64,/9j/4AAQSkZJRgAB..."
}
```

### Przykładowa odpowiedź

```json
{
  "status": "success",
  "data": {
    "predictions": [
      { "class": "T20", "score": 60, "confidence": 0.923 },
      { "class": "D10", "score": 20, "confidence": 0.811 }
    ],
    "total_score": 80
  }
}
```

---

## Mapa klas (SCORE_MAP)

| Prefiks | Przykład | Punkty              |
|---------|----------|---------------------|
| `b`     | `b`      | 50 (bullseye)       |
| `sb`    | `sb`     | 25 (single bull)    |
| `i`     | `i20`    | n (inner single)    |
| `o`     | `o20`    | n (outer single)    |
| `d`     | `d20`    | n × 2 (double)      |
| `t`     | `t20`    | n × 3 (triple)      |
