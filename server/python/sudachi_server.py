from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import sudachipy
from sudachipy import tokenizer
from sudachipy import dictionary

app = FastAPI()

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, replace with your frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize Sudachi tokenizer
tokenizer_obj = dictionary.Dictionary().create()
mode = tokenizer.Tokenizer.SplitMode.A

class AnalyzeRequest(BaseModel):
    text: str
    mode: Optional[str] = "A"

class Token(BaseModel):
    surface: str
    dictionary_form: str
    reading: str
    part_of_speech: str

@app.get("/health")
async def health_check():
    return {"status": "ok"}

@app.post("/analyze")
async def analyze(request: AnalyzeRequest):
    try:
        # Set mode based on request
        selected_mode = {
            "A": tokenizer.Tokenizer.SplitMode.A,
            "B": tokenizer.Tokenizer.SplitMode.B,
            "C": tokenizer.Tokenizer.SplitMode.C
        }.get(request.mode, tokenizer.Tokenizer.SplitMode.A)

        # Tokenize text
        tokens = tokenizer_obj.tokenize(request.text, selected_mode)
        
        # Convert to response format
        result = []
        for token in tokens:
            result.append({
                "surface": token.surface(),
                "dictionary_form": token.dictionary_form(),
                "reading": token.reading_form(),
                "part_of_speech": token.part_of_speech()[0]
            })
        
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    print("Starting Sudachi server on http://localhost:5000")
    uvicorn.run(app, host="0.0.0.0", port=5000) 