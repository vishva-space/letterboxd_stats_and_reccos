import csv
import json
import os
from datetime import datetime
from pathlib import Path
from zipfile import ZipFile

from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Serve the React build
frontend_path = os.path.join(os.path.dirname(__file__), "../frontend/build")
# app.mount("/static", StaticFiles(directory=os.path.join(frontend_path, "static")), name="static")


def get_years_from_diary(target_dir: Path):
    diary_path = target_dir / "diary.csv"
    if not diary_path.exists():
        return []

    years = []
    try:
        with diary_path.open("r", encoding="utf-8-sig", newline="") as csv_file:
            reader = csv.DictReader(csv_file)
            for row in reader:
                date_value = (row.get("Date") or "").strip()
                if date_value and len(date_value) >= 4:
                    candidate = date_value[:4]
                else:
                    candidate = (row.get("Year") or "").strip()

                if candidate.isdigit() and len(candidate) == 4:
                    years.append(int(candidate))
    except Exception:
        return []

    if not years:
        return []

    current_year = datetime.now().year
    earliest_year = min(years)
    latest_year = max(current_year, earliest_year)
    return list(range(latest_year, earliest_year - 1, -1))


def build_normalized_record(source_name: str, row: dict):
    date_value = (row.get("Date") or "").strip()
    year_value = (row.get("Year") or "").strip()
    if date_value and len(date_value) >= 4:
        year = date_value[:4]
    else:
        year = year_value

    return {
        "source": source_name,
        "date": date_value,
        "year": year if year.isdigit() and len(year) == 4 else "",
        "title": (row.get("Name") or "").strip(),
        "letterboxd_uri": (row.get("Letterboxd URI") or "").strip(),
        "rating": (row.get("Rating") or "").strip(),
        "rewatch": (row.get("Rewatch") or "").strip(),
        "review": (row.get("Review") or "").strip(),
        "tags": (row.get("Tags") or "").strip(),
        "watched_date": (row.get("Watched Date") or "").strip(),
        "content": (row.get("Content") or "").strip(),
        "comment": (row.get("Comment") or "").strip(),
    }


def get_yearly_count_for_csv(file_path: Path):
    if not file_path.exists():
        return {}

    counts = {}
    with file_path.open("r", encoding="utf-8-sig", newline="") as csv_file:
        reader = csv.DictReader(csv_file)
        for row in reader:
            date_value = (row.get("Date") or "").strip()
            year = date_value[:4] if date_value and len(date_value) >= 4 else (row.get("Year") or "").strip()
            if year.isdigit() and len(year) == 4:
                counts[int(year)] = counts.get(int(year), 0) + 1
    return counts


def get_yearly_rewatch_count_for_diary(target_dir: Path, year: int):
    diary_path = target_dir / "diary.csv"
    if not diary_path.exists():
        return 0

    count = 0
    with diary_path.open("r", encoding="utf-8-sig", newline="") as csv_file:
        reader = csv.DictReader(csv_file)
        for row in reader:
            date_value = (row.get("Date") or "").strip()
            entry_year = date_value[:4] if date_value and len(date_value) >= 4 else (row.get("Year") or "").strip()
            if entry_year.isdigit() and len(entry_year) == 4 and int(entry_year) == year:
                rewatch_value = (row.get("Rewatch") or "").strip()
                if rewatch_value:
                    count += 1
    return count


def get_yearly_rating_count_for_csv(file_path: Path, year: int):
    if not file_path.exists():
        return 0

    count = 0
    with file_path.open("r", encoding="utf-8-sig", newline="") as csv_file:
        reader = csv.DictReader(csv_file)
        for row in reader:
            date_value = (row.get("Date") or "").strip()
            entry_year = date_value[:4] if date_value and len(date_value) >= 4 else (row.get("Year") or "").strip()
            if entry_year.isdigit() and len(entry_year) == 4 and int(entry_year) == year:
                count += 1
    return count


def get_profile_name(target_dir: Path):
    profile_path = target_dir / "profile.csv"
    if not profile_path.exists():
        return "Your"

    try:
        with profile_path.open("r", encoding="utf-8-sig", newline="") as csv_file:
            reader = csv.DictReader(csv_file)
            for row in reader:
                name = (row.get("Given Name") or "").strip() or (row.get("Username") or "").strip()
                if name:
                    return name
    except Exception:
        return "Your"

    return "Your"


def get_top_rated_films_for_year(target_dir: Path, year: int, limit: int = 5):
    ratings_path = target_dir / "ratings.csv"
    if not ratings_path.exists():
        return []

    ratings_by_title = {}
    with ratings_path.open("r", encoding="utf-8-sig", newline="") as csv_file:
        reader = csv.DictReader(csv_file)
        for row in reader:
            film_name = (row.get("Name") or "").strip()
            if not film_name:
                continue
            date_value = (row.get("Date") or "").strip()
            row_year = date_value[:4] if date_value and len(date_value) >= 4 else (row.get("Year") or "").strip()
            if row_year and row_year.isdigit() and int(row_year) != year:
                continue

            rating_value = (row.get("Rating") or "").strip()
            try:
                rating = float(rating_value)
            except (TypeError, ValueError):
                continue

            entry = ratings_by_title.setdefault(
                film_name,
                {"title": film_name, "total": 0.0, "count": 0, "letterboxd_uri": ""},
            )
            entry["total"] += rating
            entry["count"] += 1
            if not entry["letterboxd_uri"]:
                entry["letterboxd_uri"] = (row.get("Letterboxd URI") or "").strip()

    ranked = []
    for film_name, entry in ratings_by_title.items():
        avg_rating = entry["total"] / entry["count"]
        ranked.append({
            "title": film_name,
            "average_rating": round(avg_rating, 2),
            "letterboxd_uri": entry.get("letterboxd_uri") or "",
            "poster_url": None,
            "runtime_minutes": 0,
            "year": year,
        })

    ranked.sort(key=lambda item: (-item["average_rating"], item["title"]))
    return ranked[:limit]


def get_total_watched_hours_for_year(target_dir: Path, year: int):
    diary_path = target_dir / "diary.csv"
    if not diary_path.exists():
        return 0

    seen_titles = set()
    total_hours = 0
    with diary_path.open("r", encoding="utf-8-sig", newline="") as csv_file:
        reader = csv.DictReader(csv_file)
        for row in reader:
            film_name = (row.get("Name") or "").strip()
            if not film_name:
                continue
            date_value = (row.get("Date") or "").strip()
            row_year = date_value[:4] if date_value and len(date_value) >= 4 else (row.get("Year") or "").strip()
            if not row_year or not row_year.isdigit() or int(row_year) != year:
                continue
            if film_name.lower() in seen_titles:
                continue
            seen_titles.add(film_name.lower())
            total_hours += 1

    return total_hours


def build_combined_activity(target_dir: Path):
    combined_records = []

    for source_name, filename in [("diary", "diary.csv"), ("ratings", "ratings.csv"), ("reviews", "reviews.csv")]:
        file_path = target_dir / filename
        if not file_path.exists():
            continue

        with file_path.open("r", encoding="utf-8-sig", newline="") as csv_file:
            reader = csv.DictReader(csv_file)
            for row in reader:
                record = build_normalized_record(source_name, row)
                if record["year"]:
                    combined_records.append(record)

    combined_records.sort(key=lambda item: (item.get("year") or "", item.get("date") or ""))

    json_output = target_dir / "combined_activity.json"
    json_output.write_text(json.dumps(combined_records, ensure_ascii=False, indent=2), encoding="utf-8")

    return combined_records


@app.post("/analyze-zip")
async def analyze_zip(file: UploadFile = File(...)):
    if not file.filename.lower().endswith(".zip"):
        raise HTTPException(status_code=400, detail="Only ZIP files are accepted.")

    root_dir = Path(__file__).resolve().parent.parent
    target_dir = root_dir / "files"
    target_dir.mkdir(parents=True, exist_ok=True)
    target_dir_resolved = target_dir.resolve()

    try:
        with ZipFile(file.file) as zip_file:
            for member in zip_file.namelist():
                member_path = (target_dir / member).resolve()
                if not member_path.is_relative_to(target_dir_resolved):
                    raise HTTPException(status_code=400, detail="Invalid ZIP entry path.")
            zip_file.extractall(path=target_dir)
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=400, detail=f"Failed to unzip file: {exc}")

    years = get_years_from_diary(target_dir)
    combined_data = build_combined_activity(target_dir)
    profile_name = get_profile_name(target_dir)
    return {
        "detail": "ZIP uploaded and extracted successfully.",
        "years": years,
        "combined_data": combined_data,
        "profile_name": profile_name,
    }


@app.get("/combined-data")
async def combined_data_endpoint():
    root_dir = Path(__file__).resolve().parent.parent
    target_dir = root_dir / "files"
    combined_data = build_combined_activity(target_dir)
    return {
        "count": len(combined_data),
        "data": combined_data,
    }


@app.get("/year-data")
async def year_data_endpoint(year: int):
    root_dir = Path(__file__).resolve().parent.parent
    target_dir = root_dir / "files"
    combined_data = build_combined_activity(target_dir)
    filtered_data = [record for record in combined_data if str(record.get("year")) == str(year)]

    diary_counts = get_yearly_count_for_csv(target_dir / "diary.csv")
    reviews_counts = get_yearly_count_for_csv(target_dir / "reviews.csv")
    ratings_counts = get_yearly_count_for_csv(target_dir / "ratings.csv")
    rewatches_count = get_yearly_rewatch_count_for_diary(target_dir, year)
    profile_name = get_profile_name(target_dir)
    top_rated = get_top_rated_films_for_year(target_dir, year, limit=5)
    watched_hours = get_total_watched_hours_for_year(target_dir, year)

    return {
        "year": year,
        "count": len(filtered_data),
        "diary_count": diary_counts.get(year, 0),
        "reviews_count": reviews_counts.get(year, 0),
        "ratings_count": ratings_counts.get(year, 0),
        "rewatches_count": rewatches_count,
        "profile_name": profile_name,
        "watched_hours": watched_hours,
        "top_rated": top_rated,
        "data": filtered_data,
    }


@app.get("/")
async def root():
    return FileResponse(os.path.join(frontend_path, "index.html"))
