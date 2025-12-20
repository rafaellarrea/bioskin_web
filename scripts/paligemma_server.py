# Código del Servidor PaliGemma para Google Colab
# Copia y pega este código en una NUEVA celda en tu notebook de Colab, DEBAJO del script de configuración.
#
# ⚠️ IMPORTANTE: Si recibes un error "RuntimeError: Only a single TORCH_LIBRARY..."
# VE A: ENTORNO DE EJECUCIÓN > REINICIAR SESIÓN (Restart Session) y vuelve a ejecutar esta celda.

# 🛠️ CORRECCIÓN DE ERROR: Instalamos una versión específica de uvicorn compatible con Colab
!pip install uvicorn==0.29.0 starlette pyngrok nest_asyncio -q

import torch
from transformers import AutoProcessor, PaliGemmaForConditionalGeneration, AutoModelForCausalLM, AutoTokenizer
try:
    from transformers import BitsAndBytesConfig
except ImportError:
    BitsAndBytesConfig = None

from fastapi import FastAPI, UploadFile, File, HTTPException, Form
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from PIL import Image
import io
import uvicorn
from pyngrok import ngrok
import nest_asyncio
import os

# Configuración para depuración de errores CUDA
os.environ['CUDA_LAUNCH_BLOCKING'] = '1'

# 1. Configuración del Modelo
import os
HF_TOKEN = os.environ.get("HF_TOKEN")

# Variables globales
vision_model = None
vision_processor = None
text_model = None
text_tokenizer = None

def load_models():
    global vision_model, vision_processor, text_model, text_tokenizer
    
    # --- MODELO 1: VISIÓN (PaliGemma) ---
    vision_model_id = "google/paligemma-3b-mix-224"
    print(f"👁️ Cargando modelo de visión: {vision_model_id}...")
    
    device = "cuda" if torch.cuda.is_available() else "cpu"
    print(f"🖥️ Usando dispositivo: {device.upper()}")

    if device == "cuda":
        bnb_config = BitsAndBytesConfig(
            load_in_4bit=True,
            bnb_4bit_quant_type="nf4",
            bnb_4bit_use_double_quant=True,
            bnb_4bit_compute_dtype=torch.float16
        )
        model_kwargs = {"quantization_config": bnb_config, "device_map": "auto"}
    else:
        print("⚠️ MODO CPU DETECTADO: La carga será lenta y sin cuantización 4-bit.")
        model_kwargs = {"device_map": "cpu", "torch_dtype": torch.float32}

    try:
        vision_model = PaliGemmaForConditionalGeneration.from_pretrained(
            vision_model_id,
            token=HF_TOKEN,
            **model_kwargs
        )
        vision_processor = AutoProcessor.from_pretrained(vision_model_id, token=HF_TOKEN)
        print("✅ PaliGemma (Visión) cargado.")
    except Exception as e:
        print(f"❌ Error cargando PaliGemma: {e}")
        return False

    # --- MODELO 2: DIAGNÓSTICO (MedGemma/Gemma) ---
    text_model_id = "google/medgemma-4b-it" 
    print(f"🧠 Cargando modelo de diagnóstico: {text_model_id}...")

    try:
        text_model = AutoModelForCausalLM.from_pretrained(
            text_model_id,
            token=HF_TOKEN,
            **model_kwargs
        )
        text_tokenizer = AutoTokenizer.from_pretrained(text_model_id, token=HF_TOKEN)
        print("✅ MedGemma (Texto) cargado.")
    except Exception as e:
        print(f"⚠️ No se pudo cargar MedGemma ({e}).")
        print("   -> Se usará solo PaliGemma para el análisis.")
        text_model = None

    return True

# Cargar al inicio
load_models()

# 2. Definir la API con FastAPI
app = FastAPI()

# Configurar CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {
        "status": "online", 
        "vision_model": "PaliGemma-3b", 
        "text_model": "MedGemma-4b" if text_model else "None"
    }

@app.post("/analyze")
async def analyze_image(prompt: str = Form(...), file: UploadFile = File(...)):
    try:
        # 1. Leer imagen
        contents = await file.read()
        image = Image.open(io.BytesIO(contents)).convert("RGB")
        
        # 2. Análisis Visual con PaliGemma
        # Prompt para PaliGemma: Describir la imagen clínicamente
        vision_prompt = "describe the skin condition in this image detailedly"
        
        inputs = vision_processor(text=vision_prompt, images=image, return_tensors="pt").to(vision_model.device)
        input_len = inputs["input_ids"].shape[-1]
        
        with torch.inference_mode():
            generation = vision_model.generate(**inputs, max_new_tokens=100, do_sample=False)
            generation = generation[0][input_len:]
            visual_description = vision_processor.decode(generation, skip_special_tokens=True)
        
        print(f"👁️ Descripción Visual: {visual_description}")

        # 3. Generación de Diagnóstico con MedGemma (si está disponible)
        final_result = visual_description
        
        if text_model:
            # Construir prompt para el experto médico
            medical_prompt = f"""
            Act as a dermatologist. Based on the following visual description of a patient's skin, provide a preliminary diagnosis and recommendations.
            
            Visual Description: {visual_description}
            User Query: {prompt}
            
            Diagnosis (in Spanish):
            """
            
            text_inputs = text_tokenizer(medical_prompt, return_tensors="pt").to(text_model.device)
            
            with torch.inference_mode():
                text_gen = text_model.generate(**text_inputs, max_new_tokens=300, do_sample=True, temperature=0.7)
                # Decodificar solo la parte nueva
                final_result = text_tokenizer.decode(text_gen[0][text_inputs.input_ids.shape[1]:], skip_special_tokens=True)

        return {"result": final_result}
        
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
