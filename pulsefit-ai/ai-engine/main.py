from fastapi import FastAPI
from pydantic import BaseModel
app = FastAPI(title="PulseFit optional AI-engine skeleton",version="0.1.0")
class ImageRequest(BaseModel):
    image_url: str
@app.post('/form-check')
def form_check(payload: ImageRequest):
    return {'implemented':False,'code':'not_implemented','message':'No ML model installed; use browser MediaPipe beta for heuristic reps.'}
@app.post('/macro-scan')
def macro_scan(payload: ImageRequest):
    return {'implemented':False,'code':'not_implemented','message':'Photo macro estimation is a stub, not an AI scan.'}
