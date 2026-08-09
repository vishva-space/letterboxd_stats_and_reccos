from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware
import os
from pathlib import Path
from zipfile import ZipFile

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

    return {"detail": "ZIP uploaded and extracted successfully."}

@app.get("/")
async def root():
    return FileResponse(os.path.join(frontend_path, "index.html"))
