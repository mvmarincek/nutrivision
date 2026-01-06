import openai
from typing import Dict, Any
import json
import base64
import os
from app.core.config import settings

FOOD_RECOGNIZER_INSTRUCTIONS = """
Você é um especialista em identificação de alimentos em imagens. Sua função é:

1. Analisar a imagem e identificar TODOS os alimentos visíveis
2. Para cada alimento:
   - Fornecer o nome canônico (nome padrão em português)
   - Listar alternativas plausíveis se houver incerteza
   - Atribuir um nível de confiança (baixo/medio/alto)
3. Sinalizar itens que mais afetam calorias (óleo, queijo, molhos, açúcar)
4. Incluir observações visuais relevantes

REGRAS IMPORTANTES:
- Nunca inventar alimentos que não aparecem na imagem
- Se incerto, liste alternativas e marque incerteza
- Seja objetivo e preciso
- Não faça suposições sem base visual

Retorne SEMPRE um JSON válido no formato:
{
  "itens_identificados": [
    {"nome": "string", "alternativas": ["string"], "confianca": "baixo|medio|alto"}
  ],
  "itens_caloricos_incertos": ["string"],
  "observacoes_visuais": ["string"]
}
"""

class FoodRecognizerAgent:
    def __init__(self, openai_api_key: str):
        self.client = openai.AsyncOpenAI(api_key=openai_api_key)
    
    async def identify(self, image_url: str, meal_type: str = "prato") -> Dict[str, Any]:
        try:
            if image_url.startswith("/uploads/"):
                file_path = os.path.join(settings.UPLOAD_DIR, image_url.replace("/uploads/", ""))
                if os.path.exists(file_path):
                    with open(file_path, "rb") as f:
                        image_data = base64.b64encode(f.read()).decode("utf-8")
                    ext = file_path.split(".")[-1].lower()
                    mime_type = "image/jpeg" if ext in ["jpg", "jpeg"] else "image/png"
                    image_content = {
                        "type": "image_url",
                        "image_url": {"url": f"data:{mime_type};base64,{image_data}"}
                    }
                else:
                    return {"itens_identificados": [], "erro": "Imagem não encontrada"}
            else:
                image_content = {"type": "image_url", "image_url": {"url": image_url}}
            
            response = await self.client.chat.completions.create(
                model="gpt-4o",
                messages=[
                    {"role": "system", "content": FOOD_RECOGNIZER_INSTRUCTIONS},
                    {
                        "role": "user",
                        "content": [
                            {"type": "text", "text": f"Analise esta imagem de um(a) {meal_type}. Identifique todos os alimentos visíveis. Retorne APENAS o JSON, sem texto adicional."},
                            image_content
                        ]
                    }
                ],
                max_tokens=1000
            )
            
            content = response.choices[0].message.content
            if "```json" in content:
                content = content.split("```json")[1].split("```")[0]
            elif "```" in content:
                content = content.split("```")[1].split("```")[0]
            return json.loads(content.strip())
        except Exception as e:
            return {
                "itens_identificados": [],
                "itens_caloricos_incertos": [],
                "observacoes_visuais": [f"Erro na análise: {str(e)}"],
                "erro": str(e)
            }
