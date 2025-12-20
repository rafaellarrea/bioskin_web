# Código del Servidor PaliGemma para Google Colab (V3.0)
# Copia y pega este código en una NUEVA celda en tu notebook de Colab.
#
# CAMBIOS V3.0:
# - Fix: Diagnóstico robusto incluso sin contexto.
# - New: Endpoint /ask-protocol para chat de protocolos médicos.

!pip install -U torch transformers accelerate bitsandbytes uvicorn==0.29.0 starlette pyngrok nest_asyncio -q

import torch
from transformers import AutoProcessor, PaliGemmaForConditionalGeneration, AutoModelForCausalLM, AutoTokenizer
try:
    from transformers import BitsAndBytesConfig
except ImportError:
    BitsAndBytesConfig = None

from fastapi import FastAPI, UploadFile, File, HTTPException, Form, Body
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

# Configuración
os.environ["CUDA_LAUNCH_BLOCKING"] = "1"
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
    
    device = "cuda" if torch.cuda.is_available() else "cpu"
    print(f" Usando dispositivo: {device.upper()}")

    # Configuración de Cuantización (solo GPU)
    if device == "cuda":
        bnb_config = BitsAndBytesConfig(
            load_in_4bit=True,
            bnb_4bit_quant_type="nf4",
            bnb_4bit_use_double_quant=True,
            bnb_4bit_compute_dtype=torch.float16
        )
        model_kwargs = {"quantization_config": bnb_config, "device_map": "auto"}
    else:
        model_kwargs = {"device_map": "cpu", "torch_dtype": torch.float32}

    # 1. PaliGemma (Visión)
    print(" Cargando PaliGemma...")
    try:
        vision_model = PaliGemmaForConditionalGeneration.from_pretrained(
            "google/paligemma-3b-mix-224",
            token=HF_TOKEN,
            **model_kwargs
        )
        vision_processor = AutoProcessor.from_pretrained("google/paligemma-3b-mix-224", token=HF_TOKEN)
    except Exception as e:
        print(f" Error PaliGemma: {e}")

    # 2. Gemma 2B IT (Texto/Protocolos)
    print(" Cargando Gemma 2B...")
    try:
        text_model = AutoModelForCausalLM.from_pretrained(
            "google/gemma-1.1-2b-it",
            token=HF_TOKEN,
            **model_kwargs
        )
        text_tokenizer = AutoTokenizer.from_pretrained("google/gemma-1.1-2b-it", token=HF_TOKEN)
    except Exception as e:
        print(f" Error Gemma: {e}")

    return True

load_models()

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {"status": "online", "version": "3.0"}

# --- ENDPOINT 1: DIAGNÓSTICO VISUAL ---
@app.post("/analyze")
async def analyze_image(
    prompt: str = Form(...), 
    context: Optional[str] = Form(None),
    files: List[UploadFile] = File(...)
):
    cleanup_memory()
    try:
        visual_descriptions = []
        
        # 1. Análisis Visual (PaliGemma)
        for idx, file in enumerate(files):
            contents = await file.read()
            image = Image.open(io.BytesIO(contents)).convert("RGB")
            
            # Prompt visual forzado para detalles médicos
            vision_prompt = "describe the skin condition, lesions, color and texture in this image detailedly."
            
            inputs = vision_processor(text=vision_prompt, images=image, return_tensors="pt").to(vision_model.device)
            input_len = inputs["input_ids"].shape[-1]
            
            with torch.inference_mode():
                generation = vision_model.generate(**inputs, max_new_tokens=150, do_sample=False)
                generation = generation[0][input_len:]
                desc = vision_processor.decode(generation, skip_special_tokens=True)
                visual_descriptions.append(f"Image {idx+1}: {desc}")

        combined_visual = "\n".join(visual_descriptions)
        print(f" Visual: {combined_visual}")

        # 2. Diagnóstico (Gemma)
        if text_model:
            # Lógica para manejar falta de contexto
            if not context or context.strip() == "" or context == "undefined":
                context_instruction = "NO clinical context provided. You MUST base your diagnosis EXCLUSIVELY on the VISUAL FINDINGS above. Do not ask for more info, just analyze what you see."
                patient_context = "Not provided."
            else:
                context_instruction = "Integrate the patient context with the visual findings."
                patient_context = context

            medical_prompt = f"""<start_of_turn>user
You are an expert dermatologist AI.
TASK: Provide a professional preliminary diagnosis based on the following data.

VISUAL ANALYSIS (from AI vision model):
{combined_visual}

PATIENT CONTEXT:
{patient_context}

INSTRUCTION:
{context_instruction}
{prompt}

Respond in Spanish. Structure:
1. Hallazgos Visuales
2. Posible Diagnóstico
3. Recomendaciones
<end_of_turn>
<start_of_turn>model
"""
            
            text_inputs = text_tokenizer(medical_prompt, return_tensors="pt").to(text_model.device)
            
            with torch.inference_mode():
                text_gen = text_model.generate(
                    **text_inputs, 
                    max_new_tokens=600, 
                    do_sample=True, 
                    temperature=0.6, # Menor temperatura para más precisión
                    top_p=0.9
                )
                final_result = text_tokenizer.decode(text_gen[0][text_inputs.input_ids.shape[1]:], skip_special_tokens=True)
        else:
            final_result = combined_visual

        return {"result": final_result}
        
    except Exception as e:
        print(f"Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# --- ENDPOINT 2: PROTOCOLOS MÉDICOS (NUEVO) ---
class ProtocolRequest(BaseModel):
    question: str

@app.post("/ask-protocol")
async def ask_protocol(request: ProtocolRequest):
    cleanup_memory()
    try:
        if not text_model:
            raise HTTPException(status_code=503, detail="Text model not loaded")

        protocol_prompt = f"""<start_of_turn>user
You are a Senior Clinical Specialist in Aesthetic Medicine and Medical Devices.
Your expertise covers: Nd:YAG, CO2 Fractional, IPL, HIFU, Radiofrequency, Diode Laser, etc.

USER QUESTION:
{request.question}

TASK:
Provide a detailed, professional, and safe protocol or answer.
Include parameters (Joules, ms, Hz) if applicable and general safety warnings.
Respond in Spanish.
<end_of_turn>
<start_of_turn>model
"""
        
        inputs = text_tokenizer(protocol_prompt, return_tensors="pt").to(text_model.device)
        
        with torch.inference_mode():
            outputs = text_model.generate(
                **inputs, 
                max_new_tokens=800, 
                do_sample=True, 
                temperature=0.5, # Precisión técnica
                top_p=0.9
            )
            response = text_tokenizer.decode(outputs[0][inputs.input_ids.shape[1]:], skip_special_tokens=True)

        return {"result": response}

    except Exception as e:
        print(f"Error Protocol: {e}")
        raise HTTPException(status_code=500, detail=str(e))

def start_server():
    ngrok.kill()
    auth_token = os.environ.get("NGROK_AUTHTOKEN")
    if auth_token: ngrok.set_auth_token(auth_token)
    
    public_url = ngrok.connect(8000).public_url
    print(f"\n API URL: {public_url}\n")
    nest_asyncio.apply()
    uvicorn.run(app, host="0.0.0.0", port=8000)

if __name__ == "__main__":
    start_server()

