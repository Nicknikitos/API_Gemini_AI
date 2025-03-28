import base64
import io
import os

from PIL import Image
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.responses import HTMLResponse
from fastapi.staticfiles import StaticFiles
from google import genai

from config import GOOGLE_API_KEY


if not GOOGLE_API_KEY:
    raise ValueError("GOOGLE_API_KEY не установлен в переменных окружения")

client = genai.Client(api_key=GOOGLE_API_KEY)

app = FastAPI()

app.mount("/static", StaticFiles(directory="static"), name="static")


chats = {}

GEMINI_MODEL = "gemini-2.0-flash"


@app.get("/", response_class=HTMLResponse)
async def get_html():
    with open("static/index.html") as f:
        return f.read()


@app.websocket("/chat")
async def websocket_chat(websocket: WebSocket):
    await websocket.accept()
    session_id = str(websocket.client)
    chat = client.chats.create(model=GEMINI_MODEL)
    chats[session_id] = {"chat": chat, "image": None}

    try:
        while True:
            message = await websocket.receive_text()

            if message.startswith("IMAGE:"):
                image_data = message.split("IMAGE:")[1]  # Get the base64 string
                try:
                    image_bytes = base64.b64decode(image_data)
                    image = Image.open(io.BytesIO(image_bytes))
                    image = image.convert("RGB")  # May be necessary for some image formats
                    chats[session_id]["image"] = image

                    await websocket.send_text("Image uploaded. Now you can ask questions.")
                except Exception as e:
                    await websocket.send_text(f"Error while processing image: {str(e)}")
                continue

            user_message = message.strip()
            if user_message.lower() == "exit":
                await websocket.send_text("The session is complete")
                break

            chat_instance = chats[session_id]["chat"]
            image = chats[session_id]["image"]

            chat_instance.send_message(user_message)
            history = chat_instance.get_history()

            if image:
                try:
                    print(f"Sending an image and text to Gemini")
                    response = client.models.generate_content(
                        model=GEMINI_MODEL,
                        contents=[image] + [message.parts[0].text for message in history]
                    )
                    print(f"Response from Gemini: {response.text}")
                    await websocket.send_text(response.text)
                except Exception as e:
                    await websocket.send_text(f"Error processing request: {str(e)}")
            else:
                response = client.models.generate_content(
                    model=GEMINI_MODEL,
                    contents=[user_message] + [message.parts[0].text for message in history]
                )
                await websocket.send_text(response.text)

    except WebSocketDisconnect:
        print(f"Client disconnected: {session_id}")
        chats.pop(session_id, None)

    except Exception as e:
        print(f"Error: {str(e)}")
        await websocket.send_text(f"Error: {str(e)}")

    finally:
        await websocket.close()