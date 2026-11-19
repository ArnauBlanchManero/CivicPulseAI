from fastapi import FastAPI

app = FastAPI()

@app.get("/")
def home():
    return {"message": "CivicPulse AI API funcionando"}
