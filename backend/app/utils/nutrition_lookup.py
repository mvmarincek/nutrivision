import json
from pathlib import Path
from typing import Optional, List, Dict, Any

class NutritionLookup:
    def __init__(self):
        db_path = Path(__file__).parent / "nutrition_database.json"
        with open(db_path, "r", encoding="utf-8") as f:
            data = json.load(f)
        self.alimentos = data["alimentos"]
        self.categorias_fallback = data["categorias_fallback"]
        self._build_index()
    
    def _build_index(self):
        self.nome_index = {}
        self.sinonimo_index = {}
        for alimento in self.alimentos:
            nome_lower = alimento["nome"].lower()
            self.nome_index[nome_lower] = alimento
            for sinonimo in alimento.get("sinonimos", []):
                self.sinonimo_index[sinonimo.lower()] = alimento
    
    def lookup(self, nome: str) -> Optional[Dict[str, Any]]:
        nome_lower = nome.lower().strip()
        if nome_lower in self.nome_index:
            return self.nome_index[nome_lower]
        if nome_lower in self.sinonimo_index:
            return self.sinonimo_index[nome_lower]
        for key in self.sinonimo_index:
            if key in nome_lower or nome_lower in key:
                return self.sinonimo_index[key]
        for key in self.nome_index:
            if key in nome_lower or nome_lower in key:
                return self.nome_index[key]
        return None
    
    def get_fallback(self, categoria: str) -> Optional[Dict[str, Any]]:
        return self.categorias_fallback.get(categoria.lower())
    
    def calculate_nutrition(self, alimento_id: str, peso_g: float) -> Dict[str, float]:
        alimento = None
        for a in self.alimentos:
            if a["id"] == alimento_id:
                alimento = a
                break
        if not alimento:
            return {"calorias": 0, "proteina": 0, "carboidrato": 0, "gordura": 0, "fibra": 0}
        
        por_100g = alimento["por_100g"]
        fator = peso_g / 100.0
        return {
            "calorias": round(por_100g["calorias"] * fator, 1),
            "proteina": round(por_100g["proteina"] * fator, 1),
            "carboidrato": round(por_100g["carboidrato"] * fator, 1),
            "gordura": round(por_100g["gordura"] * fator, 1),
            "fibra": round(por_100g.get("fibra", 0) * fator, 1)
        }
    
    def calculate_from_name(self, nome: str, peso_g: float) -> Dict[str, Any]:
        alimento = self.lookup(nome)
        if alimento:
            por_100g = alimento["por_100g"]
            fator = peso_g / 100.0
            return {
                "encontrado": True,
                "alimento_id": alimento["id"],
                "nome_canonico": alimento["nome"],
                "calorias": round(por_100g["calorias"] * fator, 1),
                "proteina": round(por_100g["proteina"] * fator, 1),
                "carboidrato": round(por_100g["carboidrato"] * fator, 1),
                "gordura": round(por_100g["gordura"] * fator, 1),
                "fibra": round(por_100g.get("fibra", 0) * fator, 1)
            }
        return {
            "encontrado": False,
            "alimento_id": None,
            "nome_canonico": nome,
            "calorias": 0,
            "proteina": 0,
            "carboidrato": 0,
            "gordura": 0,
            "fibra": 0
        }

nutrition_db = NutritionLookup()
