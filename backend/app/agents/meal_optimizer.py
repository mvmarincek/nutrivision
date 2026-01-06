from agno.agent import Agent
from agno.models.openai import OpenAIChat
from typing import Dict, Any, List, Optional
import json

MEAL_OPTIMIZER_INSTRUCTIONS = """
Você é um especialista em otimização de refeições. Sua função é:

1. Analisar a refeição atual e criar uma versão mais balanceada
2. Manter a "cara" do prato original (não mudar completamente)
3. Fazer ajustes realistas e práticos
4. Estimar calorias e macros da versão otimizada
5. Gerar um prompt de imagem para visualização

PRINCÍPIOS DE OTIMIZAÇÃO:
- Aumentar proteína se baixa
- Aumentar fibra/vegetais
- Reduzir gordura saturada se alta
- Reduzir açúcares simples
- Manter sabor e praticidade
- Respeitar restrições alimentares

Retorne SEMPRE um JSON válido no formato:
{
  "sugestao_melhorada_texto": "string (descrição do prato otimizado)",
  "mudancas_sugeridas": ["string"],
  "calorias_nova_versao": {"central": number, "min": number, "max": number},
  "macros_nova_versao": {"proteina_g": number, "carbo_g": number, "gordura_g": number, "fibra_g": number},
  "prompt_para_imagem": "string (prompt em inglês para gerar imagem do prato otimizado)"
}
"""

class MealOptimizerAgent:
    def __init__(self, openai_api_key: str):
        self.agent = Agent(
            name="MealOptimizer",
            model=OpenAIChat(id="gpt-4o-mini", api_key=openai_api_key),
            instructions=MEAL_OPTIMIZER_INSTRUCTIONS,
            markdown=False
        )
    
    async def optimize(
        self,
        itens: List[Dict],
        porcoes: List[Dict],
        calorias: Dict[str, float],
        macros: Dict[str, float],
        perfil: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        perfil_str = json.dumps(perfil, ensure_ascii=False) if perfil else "Perfil não informado"
        itens_str = json.dumps(itens, ensure_ascii=False)
        porcoes_str = json.dumps(porcoes, ensure_ascii=False)
        
        prompt = f"""
Crie uma versão otimizada desta refeição.

ITENS ATUAIS:
{itens_str}

PORÇÕES ATUAIS:
{porcoes_str}

VALORES ATUAIS:
- Calorias: {calorias['central']} kcal
- Proteína: {macros['proteina_g']}g
- Carboidratos: {macros['carbo_g']}g
- Gordura: {macros['gordura_g']}g
- Fibra: {macros.get('fibra_g', 0)}g

PERFIL DO USUÁRIO:
{perfil_str}

Sugira uma versão melhorada mantendo a essência do prato.
Retorne APENAS o JSON, sem texto adicional.
"""
        try:
            response = self.agent.run(prompt)
            content = response.content
            if "```json" in content:
                content = content.split("```json")[1].split("```")[0]
            elif "```" in content:
                content = content.split("```")[1].split("```")[0]
            return json.loads(content.strip())
        except Exception as e:
            return {
                "sugestao_melhorada_texto": "Não foi possível gerar sugestão",
                "mudancas_sugeridas": [],
                "calorias_nova_versao": calorias,
                "macros_nova_versao": macros,
                "prompt_para_imagem": "",
                "erro": str(e)
            }
