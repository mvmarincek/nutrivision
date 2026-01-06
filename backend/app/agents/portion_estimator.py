import openai
from typing import Dict, Any, List, Optional
import json
import base64
import os
from app.core.config import settings
from app.agents.json_utils import parse_json_safe

PORTION_ESTIMATOR_INSTRUCTIONS = """
Você é um especialista em estimativa de porções alimentares com anos de experiência.
Sua função é estimar porções COM AUTONOMIA, sem depender de perguntas ao usuário.

PRINCÍPIO FUNDAMENTAL:
- NUNCA faça perguntas ao usuário. Você é o especialista.
- Use seu conhecimento e a análise visual para fazer as melhores estimativas.
- Em caso de dúvida, use valores médios/típicos brasileiros.
- Amplie a faixa min/max quando houver incerteza, mas SEMPRE forneça uma estimativa.

REFERÊNCIAS VISUAIS PARA ESCALA:
- Prato raso padrão brasileiro: 25-27cm diâmetro
- Prato fundo: 20-22cm diâmetro
- Prato de sobremesa: 19cm
- Copo americano: 190ml
- Copo long drink: 300ml
- Tulipa de chopp: 300ml
- Caneca: 350ml
- Lata de cerveja/refrigerante: 350ml
- Garrafa long neck: 355ml

PORÇÕES TÍPICAS BRASILEIRAS:
- Arroz (1 colher de servir cheia): 100-150g
- Feijão (1 concha média): 80-100g
- Bife/filé médio: 100-150g
- Frango grelhado (filé): 120-180g
- Batata frita (porção individual): 100-150g
- Salada (prato de acompanhamento): 50-80g
- Óleo de preparo por porção: 5-10ml (sempre assuma uso moderado)

BEBIDAS - ASSUMA AUTOMATICAMENTE:
- Líquido amarelo/dourado em copo/tulipa = Chopp/Cerveja (300-350ml)
- Líquido escuro = Refrigerante ou suco (300ml)
- Líquido transparente = Água ou refrigerante claro (300ml)
- Na dúvida sobre tipo de bebida, assuma a mais comum para o contexto

ÓLEOS E GORDURAS:
- Comida frita (batata, pastel, etc): assuma 10-15ml de óleo absorvido por 100g
- Comida grelhada/refogada: assuma 5-10ml de óleo por porção
- Salada temperada: assuma 10ml de azeite
- NUNCA pergunte sobre óleo. Estime baseado no tipo de preparo visível.

REGRAS ABSOLUTAS:
1. NUNCA retorne questions. O array questions deve ser sempre vazio.
2. Use a imagem para determinar tamanhos relativos ao prato/copo visível.
3. Forneça sempre valor central E faixa min/max.
4. Em caso de incerteza, aumente a faixa mas dê uma estimativa.
5. Liste incertezas em fatores_incerteza, não como perguntas.

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
  "questions": [],
  "fatores_incerteza": ["string - liste aqui as incertezas, mas NÃO faça perguntas"]
}
"""

class PortionEstimatorAgent:
    def __init__(self, openai_api_key: str):
        self.client = openai.AsyncOpenAI(api_key=openai_api_key)
    
    async def estimate(
        self, 
        image_url: str, 
        itens_identificados: List[Dict], 
        answers: Optional[Dict[str, str]] = None
    ) -> Dict[str, Any]:
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
                    return {"porcoes": [], "questions": [], "fatores_incerteza": ["Imagem não encontrada"]}
            else:
                image_content = {"type": "image_url", "image_url": {"url": image_url}}
            
            itens_str = json.dumps(itens_identificados, ensure_ascii=False)
            
            prompt = f"""Analise esta imagem e estime as porções dos alimentos identificados.
Você é o especialista. NÃO faça perguntas. Estime tudo com base na imagem e seu conhecimento.

Itens identificados:
{itens_str}

IMPORTANTE: 
- Retorne questions como array vazio [].
- Use valores típicos brasileiros quando não puder determinar visualmente.
- Para bebidas, assuma o tipo mais provável pelo contexto e aparência.
- Para óleo/gordura, estime baseado no método de preparo visível.

Retorne APENAS o JSON, sem texto adicional."""
            
            response = await self.client.chat.completions.create(
                model="gpt-4o",
                messages=[
                    {"role": "system", "content": PORTION_ESTIMATOR_INSTRUCTIONS},
                    {
                        "role": "user",
                        "content": [
                            {"type": "text", "text": prompt},
                            image_content
                        ]
                    }
                ],
                max_tokens=1500
            )
            
            content = response.choices[0].message.content
            result = parse_json_safe(content)
            
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
