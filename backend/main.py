from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import httpx
import csv
import io

app = FastAPI()

# Permitir peticiones desde tu frontend en Vite
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Pega aquí la URL exacta que copiaste de la pestaña "Descargas"
MADRID_AIR_CSV_URL = "https://datos.madrid.es/dataset/212531-0-calidad-aire-tiempo-real/resource/212531-2-calidad-aire-tiempo-real/download/212531-2-calidad-aire-tiempo-real.csv"

# @app.get("/api/calidad-aire")
@app.get("/")
async def get_calidad_aire():
    async with httpx.AsyncClient(follow_redirects=True) as client:
        response = await client.get(MADRID_AIR_CSV_URL)
        if response.status_code != 200:
            raise HTTPException(status_code=502, detail="Error al obtener datos de Madrid")

    # Los CSV del Ayuntamiento de Madrid suelen venir separados por punto y coma (;)
    contenido = response.content.decode("utf-8", errors="replace")
    lector = csv.DictReader(io.StringIO(contenido), delimiter=";")
    
    datos = [fila for fila in lector]
    return {"total": len(datos), "registros": datos}
