# Script de configuración para Google Colab - PaliGemma
# Copia y pega este código en una celda de tu notebook de Google Colab

import os
import sys
from google.colab import userdata

def setup_environment():
    print("🚀 Iniciando configuración del entorno para PaliGemma...")

    # 1. Instalar dependencias
    print("📦 Instalando bibliotecas necesarias...")
    os.system("pip install -q torch transformers accelerate bitsandbytes fastapi uvicorn python-multipart pyngrok nest_asyncio")
    print("✅ Bibliotecas instaladas.")

    # 2. Configurar secretos
    print("🔑 Configurando credenciales...")
    try:
        # Leer secretos de Google Colab
        # Asegúrate de haber añadido 'HF_TOKEN' y 'NGROK_TOKEN' en la sección de secretos de Colab (icono de llave)
        hf_token = userdata.get('HF_TOKEN')
        ngrok_token = userdata.get('NGROK_TOKEN')

        if not hf_token or not ngrok_token:
            raise ValueError("No se encontraron los secretos HF_TOKEN o NGROK_TOKEN")

        # Establecer variables de entorno
        os.environ['HF_TOKEN'] = hf_token
        os.environ['NGROK_AUTHTOKEN'] = ngrok_token
        
        # Autenticación explícita para pyngrok
        from pyngrok import ngrok
        ngrok.set_auth_token(ngrok_token)
        
        print("✅ Credenciales configuradas correctamente.")
        
    except Exception as e:
        print(f"❌ Error al configurar credenciales: {e}")
        print("⚠️ Por favor, asegúrate de añadir los secretos 'HF_TOKEN' y 'NGROK_TOKEN' en Google Colab.")
        return

    # 3. Importar librerías para verificar instalación
    try:
        import torch
        import transformers
        import nest_asyncio
        
        # Aplicar nest_asyncio para permitir bucles de eventos anidados (necesario para uvicorn en Colab)
        nest_asyncio.apply()
        
        print(f"✅ Entorno listo. PyTorch versión: {torch.__version__}")
        
    except ImportError as e:
        print(f"❌ Error al importar librerías: {e}")

if __name__ == "__main__":
    setup_environment()
