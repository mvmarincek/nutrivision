import openai
from typing import Optional

class ImageGenerationManager:
    def __init__(self, openai_api_key: str):
        self.client = openai.AsyncOpenAI(api_key=openai_api_key)
    
    async def generate(self, prompt: str) -> Optional[str]:
        if not prompt:
            return None
        
        try:
            full_prompt = f"""Create a SQUARE image (1:1 aspect ratio) of appetizing food photography showing: {prompt}

Style: Professional food photography, natural lighting, shallow depth of field, 
white or wooden table background, top-down or 45-degree angle view, 
realistic and appetizing presentation. The image MUST be perfectly square."""

            response = await self.client.images.generate(
                model="dall-e-3",
                prompt=full_prompt,
                size="1024x1024",
                quality="standard",
                n=1
            )
            return response.data[0].url
        except Exception as e:
            print(f"Erro ao gerar imagem: {e}")
            return None
