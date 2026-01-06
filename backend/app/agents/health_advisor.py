from agno.agent import Agent
from agno.models.openai import OpenAIChat
from typing import Dict, Any, Optional
import json

HEALTH_ADVISOR_INSTRUCTIONS = """
Você é um consultor nutricional que analisa refeições e fornece orientações práticas.

Sua função é:
1. Analisar os valores nutricionais da refeição
2. Identificar benefícios (proteína adequada, fibras, micronutrientes prováveis)
3. Identificar pontos de atenção (açúcar alto, gordura alta, baixa fibra, etc.)
4. Sugerir 3 ações pequenas e realistas para melhorar a refeição

REGRAS IMPORTANTES:
- NUNCA fornecer aconselhamento médico
- NUNCA diagnosticar condições de saúde
- Sempre incluir aviso de que não substitui profissional
- Ser objetivo e prático
- Considerar as restrições e objetivo do usuário

Retorne SEMPRE um JSON válido no formato:
{
  "beneficios": ["string"],
  "pontos_de_atencao": ["string"],
  "recomendacoes_praticas": ["string"],
  "aviso": "string"
}
"""

class HealthAdvisorAgent:
    def __init__(self, openai_api_key: str):
        self.agent = Agent(
            name="HealthAdvisor",
            model=OpenAIChat(id="gpt-4o-mini", api_key=openai_api_key),
            instructions=HEALTH_ADVISOR_INSTRUCTIONS,
            markdown=False
        )
    
    async def analyze(
        self, 
        calorias: Dict[str, float],
        macros: Dict[str, float],
        perfil: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        perfil_str = json.dumps(perfil, ensure_ascii=False) if perfil else "Perfil não informado"
        
        prompt = f"""
Analise esta refeição e forneça orientações práticas.

DADOS NUTRICIONAIS:
- Calorias: {calorias['central']} kcal (faixa: {calorias['min']}-{calorias['max']} kcal)
- Proteína: {macros['proteina_g']}g
- Carboidratos: {macros['carbo_g']}g
- Gordura: {macros['gordura_g']}g
- Fibra: {macros.get('fibra_g', 0)}g

PERFIL DO USUÁRIO:
{perfil_str}

Forneça benefícios, pontos de atenção e 3 recomendações práticas.
Retorne APENAS o JSON, sem texto adicional.
"""
        try:
            response = self.agent.run(prompt)
            content = response.content
            if "```json" in content:
                content = content.split("```json")[1].split("```")[0]
            elif "```" in content:
                content = content.split("```")[1].split("```")[0]
            result = json.loads(content.strip())
            if "aviso" not in result:
                result["aviso"] = "Esta análise é apenas informativa e não substitui orientação de nutricionista ou médico."
            return result
        except Exception as e:
            return {
                "beneficios": [],
                "pontos_de_atencao": [],
                "recomendacoes_praticas": [],
                "aviso": "Esta análise é apenas informativa e não substitui orientação de nutricionista ou médico.",
                "erro": str(e)
            }
