from agno.agent import Agent
from agno.models.openai import OpenAIChat
from typing import Dict, Any, List
import json

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
        self.agent = Agent(
            name="FoodRecognizer",
            model=OpenAIChat(id="gpt-4o", api_key=openai_api_key),
            instructions=FOOD_RECOGNIZER_INSTRUCTIONS,
            markdown=False
        )
    
    async def identify(self, image_url: str, meal_type: str = "prato") -> Dict[str, Any]:
        prompt = f"""
Analise esta imagem de um(a) {meal_type}.
Identifique todos os alimentos visíveis.
URL da imagem: {image_url}

Retorne APENAS o JSON, sem texto adicional.
"""
        try:
            response = self.agent.run(prompt, images=[image_url])
            content = response.content
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
