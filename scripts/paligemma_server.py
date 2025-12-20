# C�digo del Servidor PaliGemma para Google Colab
# Copia y pega este c�digo en una NUEVA celda en tu notebook de Colab, DEBAJO del script de configuraci�n.
#
#  IMPORTANTE: Si recibes un error "RuntimeError: Only a single TORCH_LIBRARY..." o "CUDA error"
# VE A: ENTORNO DE EJECUCI�N > REINICIAR SESI�N (Restart Session) y vuelve a ejecutar esta celda.

#  ACTUALIZACI�N CR�TICA: Instalamos librer�as actualizadas para evitar errores CUDA
!pip install -U torch transformers accelerate bitsandbytes uvicorn==0.29.0 starlette pyngrok nest_asyncio -q

import torch
from transformers import AutoProcessor, PaliGemmaForConditionalGeneration, AutoModelForCausalLM, AutoTokenizer
try:
    from transformers import BitsAndBytesConfig
except ImportError:
    BitsAndBytesConfig = None

from fastapi import FastAPI, UploadFile, File, HTTPException, Form
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
from PIL import Image
import io
import uvicorn
from pyngrok import ngrok
import nest_asyncio
import os
import gc

# Configuraci�n para depuraci�n de errores CUDA
os.environ["CUDA_LAUNCH_BLOCKING"] = "1"

# 1. Configuraci�n del Modelo
HF_TOKEN = os.environ.get("HF_TOKEN")

# Variables globales
vision_model = None
vision_processor = None
text_model = None
text_tokenizer = None

def cleanup_memory():
    gc.collect()
    if torch.cuda.is_available():
        torch.cuda.empty_cache()

def load_models():
    global vision_model, vision_processor, text_model, text_tokenizer
    
    cleanup_memory()
    
    # --- MODELO 1: VISI�N (PaliGemma) ---
    vision_model_id = "google/paligemma-3b-mix-224"
    print(f" Cargando modelo de visi�n: {vision_model_id}...")
    
    device = "cuda" if torch.cuda.is_available() else "cpu"
    print(f" Usando dispositivo: {device.upper()}")

    if device == "cuda":
        bnb_config = BitsAndBytesConfig(
            load_in_4bit=True,
            bnb_4bit_quant_type="nf4",
            bnb_4bit_use_double_quant=True,
            bnb_4bit_compute_dtype=torch.float16
        )
        model_kwargs = {"quantization_config": bnb_config, "device_map": "auto"}
    else:
        print(" MODO CPU DETECTADO: La carga ser� lenta y sin cuantizaci�n 4-bit.")
        model_kwargs = {"device_map": "cpu", "torch_dtype": torch.float32}

    try:
        vision_model = PaliGemmaForConditionalGeneration.from_pretrained(
            vision_model_id,
            token=HF_TOKEN,
            **model_kwargs
        )
        vision_processor = AutoProcessor.from_pretrained(vision_model_id, token=HF_TOKEN)
        print(" PaliGemma (Visi�n) cargado.")
    except Exception as e:
        print(f" Error cargando PaliGemma: {e}")
        return False

    # --- MODELO 2: DIAGN�STICO (Gemma 2B - M�s estable) ---
    # Cambiamos a Gemma 2B oficial para evitar errores de compatibilidad
    text_model_id = "google/gemma-1.1-2b-it" 
    print(f" Cargando modelo de diagn�stico: {text_model_id}...")

    try:
        text_model = AutoModelForCausalLM.from_pretrained(
            text_model_id,
            token=HF_TOKEN,
            **model_kwargs
        )
        text_tokenizer = AutoTokenizer.from_pretrained(text_model_id, token=HF_TOKEN)
        print(" Modelo de Texto cargado.")
    except Exception as e:
        print(f" No se pudo cargar el modelo de texto ({e}).")
        print("   -> Se usar� solo PaliGemma para el an�lisis.")
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
        "text_model": "Gemma-2b" if text_model else "None"
    }

@app.post("/analyze")
async def analyze_image(
    prompt: str = Form(...), 
    context: Optional[str] = Form(None),
    files: List[UploadFile] = File(...)
):
    cleanup_memory()
    try:
        visual_descriptions = []
        
        # 1. Procesar cada imagen
        for idx, file in enumerate(files):
            contents = await file.read()
            image = Image.open(io.BytesIO(contents)).convert("RGB")
            
            # An�lisis Visual con PaliGemma
            vision_prompt = "describe the skin condition in this image detailedly, focusing on texture, color, and lesions."
            
            inputs = vision_processor(text=vision_prompt, images=image, return_tensors="pt").to(vision_model.device)
            input_len = inputs["input_ids"].shape[-1]
            
            with torch.inference_mode():
                generation = vision_model.generate(**inputs, max_new_tokens=150, do_sample=False)
                generation = generation[0][input_len:]
                desc = vision_processor.decode(generation, skip_special_tokens=True)
                visual_descriptions.append(f"Image {idx+1} Analysis: {desc}")

        combined_visual_description = "\n".join(visual_descriptions)
        print(f" Descripci�n Visual Combinada:\n{combined_visual_description}")

        # 2. Generaci�n de Diagn�stico
        final_result = combined_visual_description
        
        if text_model:
            # Construir prompt enriquecido para el experto m�dico
            medical_prompt = f"""
            You are an expert dermatologist. Analyze the following patient case.
            
            PATIENT CONTEXT (Symptoms/History):
            {context if context else "No context provided."}
            
            VISUAL FINDINGS (from AI analysis of images):
            {combined_visual_description}
            
            USER QUERY:
            {prompt}
            
            TASK:
            Provide a detailed preliminary diagnosis, potential causes, and recommended next steps.
            Respond in Spanish. Be professional but clear.
            
            DIAGNOSIS (in Spanish):
            """
            
            text_inputs = text_tokenizer(medical_prompt, return_tensors="pt").to(text_model.device)
            
            with torch.inference_mode():
                text_gen = text_model.generate(**text_inputs, max_new_tokens=500, do_sample=True, temperature=0.7, top_p=0.9)
                final_result = text_tokenizer.decode(text_gen[0][text_inputs.input_ids.shape[1]:], skip_special_tokens=True)

        return {"result": final_result}
        
    except Exception as e:
        print(f"Error en an�lisis: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# 3. Iniciar Servidor y T�nel Ngrok
def start_server():
    port = 8000
    ngrok.kill()
    
    auth_token = os.environ.get("NGROK_AUTHTOKEN")
    if auth_token:
        ngrok.set_auth_token(auth_token)
    
    public_url = ngrok.connect(port).public_url
    print(f"\n API P�blica Ngrok ACTIVA: {public_url}")
    print(f" COPIA esta URL para usarla en tu aplicaci�n.\n")
    
    nest_asyncio.apply()
    uvicorn.run(app, host="0.0.0.0", port=port)

if __name__ == "__main__":
    start_server()

