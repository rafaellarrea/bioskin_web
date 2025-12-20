# Código del Servidor PaliGemma para Google Colab
# Copia y pega este código en una NUEVA celda en tu notebook de Colab, DEBAJO del script de configuración.

import torch
from transformers import AutoProcessor, PaliGemmaForConditionalGeneration, BitsAndBytesConfig
from fastapi import FastAPI, UploadFile, File, HTTPException, Form
from pydantic import BaseModel
from PIL import Image
import io
import uvicorn
from pyngrok import ngrok
import nest_asyncio
import os

# 1. Configuración del Modelo
import os
HF_TOKEN = os.environ.get("HF_TOKEN")

# Variable global para el modelo y procesador
model = None
processor = None

def load_medgemma_model():
    global model, processor
    
    # ID del modelo (Cambiar a "google/paligemma-3b-mix-224" si no hay acceso a MedGemma)
    # Nota: "google/medgemma-4b-it" es el ID sugerido por el usuario. 
    # Si este modelo no existe, usar "google/paligemma-3b-mix-224"
    model_id = "google/medgemma-4b-it" 
    
    # Configuración de Cuantización
    # NF4 es teóricamente óptimo para pesos distribuidos normalmente (como en redes neuronales)
    bnb_config = BitsAndBytesConfig(
        load_in_4bit=True,
        bnb_4bit_quant_type="nf4",
        bnb_4bit_use_double_quant=True,
        bnb_4bit_compute_dtype=torch.bfloat16
    )

    print(f"🔄 Cargando {model_id} con cuantización 4-bit...")
    
    try:
        model = PaliGemmaForConditionalGeneration.from_pretrained(
            model_id,
            quantization_config=bnb_config,
            device_map="auto",
            token=HF_TOKEN
        )
        
        # Intentar cargar con PaliGemmaProcessor, si falla usar AutoProcessor
        try:
            from transformers import PaliGemmaProcessor
            processor = PaliGemmaProcessor.from_pretrained(model_id, token=HF_TOKEN)
        except ImportError:
            processor = AutoProcessor.from_pretrained(model_id, token=HF_TOKEN)
            
        print("✅ Modelo cargado en GPU.")
        return True
    except Exception as e:
        print(f"❌ Error crítico cargando el modelo: {e}")
        print("⚠️ Si el modelo 'medgemma' no existe, intenta cambiar model_id a 'google/paligemma-3b-mix-224'")
        return False

# Cargar al inicio
load_medgemma_model()

# 2. Definir la API con FastAPI
app = FastAPI()

@app.get("/")
def read_root():
    return {"status": "online", "model": "PaliGemma-3b-mix-224"}

@app.post("/analyze")
async def analyze_image(prompt: str = Form(...), file: UploadFile = File(...)):
    try:
        # Leer imagen
        contents = await file.read()
        image = Image.open(io.BytesIO(contents)).convert("RGB")
        
        # Preprocesar
        inputs = processor(text=prompt, images=image, return_tensors="pt").to(model.device)
        input_len = inputs["input_ids"].shape[-1]
        
        # Generar
        with torch.inference_mode():
            generation = model.generate(**inputs, max_new_tokens=100, do_sample=False)
            generation = generation[0][input_len:]
            decoded = processor.decode(generation, skip_special_tokens=True)
            
        return {"result": decoded}
        
    except Exception as e:
        print(f"Error en análisis: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# 3. Iniciar Servidor y Túnel Ngrok
def start_server():
    # Configurar túnel Ngrok
    port = 8000
    # Matar túneles anteriores si existen
    ngrok.kill()
    
    # Leer token de variable de entorno (configurada en el paso anterior)
    auth_token = os.environ.get("NGROK_AUTHTOKEN")
    if auth_token:
        ngrok.set_auth_token(auth_token)
    
    public_url = ngrok.connect(port).public_url
    print(f"\n🚀 API Pública Ngrok ACTIVA: {public_url}")
    print(f"📋 COPIA esta URL para usarla en tu aplicación.\n")
    
    # Iniciar Uvicorn
    nest_asyncio.apply()
    uvicorn.run(app, host="0.0.0.0", port=port)

if __name__ == "__main__":
    start_server()
