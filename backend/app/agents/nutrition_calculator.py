from typing import Dict, Any, List
from app.utils.nutrition_lookup import nutrition_db

class NutritionCalculatorAgent:
    def __init__(self):
        self.db = nutrition_db
    
    async def calculate(self, porcoes: List[Dict]) -> Dict[str, Any]:
        total_calorias = 0
        total_calorias_min = 0
        total_calorias_max = 0
        total_proteina = 0
        total_carbo = 0
        total_gordura = 0
        total_fibra = 0
        
        detalhamento = []
        fontes_de_erro = []
        confiancas = []
        
        for porcao in porcoes:
            item_nome = porcao.get("item", "")
            peso_central = porcao.get("peso_g_ml_central", 0)
            peso_min = porcao.get("faixa_min", peso_central * 0.8)
            peso_max = porcao.get("faixa_max", peso_central * 1.2)
            confianca = porcao.get("confianca", "medio")
            confiancas.append(confianca)
            
            resultado = self.db.calculate_from_name(item_nome, peso_central)
            resultado_min = self.db.calculate_from_name(item_nome, peso_min)
            resultado_max = self.db.calculate_from_name(item_nome, peso_max)
            
            if not resultado["encontrado"]:
                fontes_de_erro.append(f"Alimento '{item_nome}' não encontrado na base - usando estimativa genérica")
                resultado = {
                    "calorias": peso_central * 1.5,
                    "proteina": peso_central * 0.08,
                    "carboidrato": peso_central * 0.2,
                    "gordura": peso_central * 0.05,
                    "fibra": peso_central * 0.02
                }
                resultado_min = {k: v * 0.7 for k, v in resultado.items()}
                resultado_max = {k: v * 1.3 for k, v in resultado.items()}
            
            total_calorias += resultado["calorias"]
            total_calorias_min += resultado_min["calorias"]
            total_calorias_max += resultado_max["calorias"]
            total_proteina += resultado["proteina"]
            total_carbo += resultado["carboidrato"]
            total_gordura += resultado["gordura"]
            total_fibra += resultado.get("fibra", 0)
            
            detalhamento.append({
                "item": item_nome,
                "peso_g": peso_central,
                "calorias": round(resultado["calorias"], 1),
                "proteina_g": round(resultado["proteina"], 1),
                "carbo_g": round(resultado["carboidrato"], 1),
                "gordura_g": round(resultado["gordura"], 1),
                "fibra_g": round(resultado.get("fibra", 0), 1)
            })
        
        baixo_count = confiancas.count("baixo")
        alto_count = confiancas.count("alto")
        if baixo_count > len(confiancas) / 2:
            confianca_total = "baixo"
        elif alto_count > len(confiancas) / 2:
            confianca_total = "alto"
        else:
            confianca_total = "medio"
        
        return {
            "calorias": {
                "central": round(total_calorias, 0),
                "min": round(total_calorias_min, 0),
                "max": round(total_calorias_max, 0)
            },
            "macros": {
                "proteina_g": round(total_proteina, 1),
                "carbo_g": round(total_carbo, 1),
                "gordura_g": round(total_gordura, 1),
                "fibra_g": round(total_fibra, 1)
            },
            "detalhamento_por_item": detalhamento,
            "confianca_total": confianca_total,
            "principais_fontes_de_erro": fontes_de_erro
        }
