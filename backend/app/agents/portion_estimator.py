from agno.agent import Agent
from agno.models.openai import OpenAIChat
from typing import Dict, Any, List, Optional
import json

PORTION_ESTIMATOR_INSTRUCTIONS = """
Você é um especialista em estimativa de porções alimentares. Sua função é:

1. Estimar o peso/volume de cada alimento identificado
2. Usar referências visuais (prato, copo, talheres) para escala
3. Gerar intervalos min/max para cada estimativa
4. Identificar quando a incerteza é alta e gerar perguntas

REFERÊNCIAS DE TAMANHO:
- Prato raso padrão: 25-27cm diâmetro
- Prato fundo: 20-22cm diâmetro
- Copo americano: 190ml
- Copo long drink: 300ml
- Colher de sopa: 15ml/15g
- Colher de chá: 5ml/5g
- Porção de arroz (concha): 100-150g
- Porção de feijão (concha): 80-100g
- Filé de frango médio: 100-150g
- Bife médio: 100-120g

REGRAS:
- Sempre forneça valor central E faixa
- Se confiança baixa, gere perguntas focadas no maior erro calórico
- Máximo de 4 perguntas
- Seja conservador nas estimativas

Retorne SEMPRE um JSON válido no formato:
{
  "porcoes": [
    {
      "item": "string",
      "peso_g_ml_central": number,
      "faixa_min": number,
      "faixa_max": number,
      "confianca": "baixo|medio|alto"
    }
  ],
  "questions": [
    {"id": "string", "question": "string", "options": ["string"]}
  ],
  "fatores_incerteza": ["string"]
}
"""

class PortionEstimatorAgent:
    def __init__(self, openai_api_key: str):
        self.agent = Agent(
            name="PortionEstimator",
            model=OpenAIChat(id="gpt-4o", api_key=openai_api_key),
            instructions=PORTION_ESTIMATOR_INSTRUCTIONS,
            markdown=False
        )
    
    async def estimate(
        self, 
        image_url: str, 
        itens_identificados: List[Dict], 
        answers: Optional[Dict[str, str]] = None
    ) -> Dict[str, Any]:
        itens_str = json.dumps(itens_identificados, ensure_ascii=False)
        answers_str = json.dumps(answers, ensure_ascii=False) if answers else "Nenhuma resposta fornecida"
        
        prompt = f"""
Analise esta imagem e estime as porções dos alimentos identificados.

URL da imagem: {image_url}

Itens identificados:
{itens_str}

Respostas do usuário (se houver):
{answers_str}

Estime o peso/volume de cada item e gere perguntas SE necessário para reduzir incerteza.
Retorne APENAS o JSON, sem texto adicional.
"""
        try:
            response = self.agent.run(prompt, images=[image_url])
            content = response.content
            if "```json" in content:
                content = content.split("```json")[1].split("```")[0]
            elif "```" in content:
                content = content.split("```")[1].split("```")[0]
            result = json.loads(content.strip())
            if "questions" not in result:
                result["questions"] = []
            if "fatores_incerteza" not in result:
                result["fatores_incerteza"] = []
            return result
        except Exception as e:
            return {
                "porcoes": [],
                "questions": [],
                "fatores_incerteza": [f"Erro na estimativa: {str(e)}"],
                "erro": str(e)
            }
