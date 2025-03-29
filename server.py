from flask import Flask, render_template, request, jsonify, send_from_directory
from flask_cors import CORS
import json
import os
import random
from threading import Timer

app = Flask(__name__)
CORS(app)

# Archivos de datos
BASE_DIR = os.path.dirname(__file__)
DATA_FILE = os.path.join(BASE_DIR, 'data.json')
FRASES_FILE = os.path.join(BASE_DIR, 'frases.json')

# Datos iniciales por defecto
DEFAULT_DATA = {
    "categories": ["Inteligencia Artificial", "Desarrollo Web", "Ciberseguridad"],
    "links": {
        "Inteligencia Artificial": [
            {"name": "ChatGPT", "description": "IA conversacional de OpenAI", "url": "https://chat.openai.com"},
            {"name": "DeepSeek", "description": "Modelo avanzado de razonamiento", "url": "https://deepseek.com"}
        ],
        "Desarrollo Web": [
            {"name": "HTML", "description": "Lenguaje de marcado web", "url": "https://developer.mozilla.org/es/docs/Web/HTML"},
            {"name": "CSS", "description": "Estilos para páginas web", "url": "https://developer.mozilla.org/es/docs/Web/CSS"}
        ],
        "Ciberseguridad": []
    }
}

DEFAULT_FRASES = [
    {"frase": "La persistencia es el camino al éxito", "autor": "Charles Chaplin"},
    {"frase": "El único modo de hacer un gran trabajo es amar lo que haces", "autor": "Steve Jobs"}
]

# Función para asegurar que los archivos JSON existen
def ensure_json_file(file_path, default_data):
    if not os.path.exists(file_path):
        with open(file_path, 'w', encoding='utf-8') as f:
            json.dump(default_data, f, indent=2, ensure_ascii=False)

ensure_json_file(DATA_FILE, DEFAULT_DATA)
ensure_json_file(FRASES_FILE, DEFAULT_FRASES)

# Función para cargar JSON
def load_json(file_path, default_data):
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            return json.load(f)
    except Exception as e:
        print(f"Error al cargar {file_path}: {e}")
        return default_data

def save_json(file_path, data):
    try:
        with open(file_path, 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=2, ensure_ascii=False)
        return True
    except Exception as e:
        print(f"Error al guardar {file_path}: {e}")
        return False

# Cargar frases y seleccionar una aleatoria
frases = load_json(FRASES_FILE, DEFAULT_FRASES)
frase_actual = random.choice(frases)

# Actualizar frase cada 5 minutos
def actualizar_frase():
    global frase_actual, frases
    frases = load_json(FRASES_FILE, DEFAULT_FRASES)
    frase_actual = random.choice(frases)
    print(f"Frase actualizada: {frase_actual['frase']}")
    Timer(300, actualizar_frase).start()

actualizar_frase()

# Rutas estáticas
@app.route('/')
def home():
    return render_template("index.html")

@app.route('/static/<path:path>')
def send_static(path):
    return send_from_directory('static', path)

# API de frases
@app.route('/api/frase', methods=['GET'])
def get_frase():
    return jsonify(frase_actual)

@app.route('/api/frases', methods=['GET', 'POST'])
def handle_frases():
    global frases, frase_actual
    if request.method == 'GET':
        return jsonify(frases)
    
    if request.method == 'POST':
        nueva_frase = request.json
        if not nueva_frase.get('frase') or not nueva_frase.get('autor'):
            return jsonify({"success": False, "message": "Frase y autor son requeridos"}), 400
        
        frases.append(nueva_frase)
        if save_json(FRASES_FILE, frases):
            frase_actual = random.choice(frases)
            return jsonify({"success": True, "message": "Frase agregada correctamente"}), 201
        
        return jsonify({"success": False, "message": "Error al guardar la frase"}), 500

# API de datos
@app.route('/api/data', methods=['GET'])
def get_all_data():
    return jsonify(load_json(DATA_FILE, DEFAULT_DATA))

@app.route('/api/categories', methods=['GET', 'POST'])
def handle_categories():
    data = load_json(DATA_FILE, DEFAULT_DATA)
    
    if request.method == 'POST':
        new_category = request.json.get('name')
        if not new_category:
            return jsonify({"success": False, "message": "Nombre de categoría requerido"}), 400
        
        if new_category in data['categories']:
            return jsonify({"success": False, "message": "La categoría ya existe"}), 400
        
        data['categories'].append(new_category)
        data['links'][new_category] = []
        
        if save_json(DATA_FILE, data):
            return jsonify({"success": True, "message": "Categoría agregada"}), 201
        return jsonify({"success": False, "message": "Error al guardar"}), 500
    
    return jsonify(data['categories'])

@app.route('/api/links', methods=['POST'])
def add_new_link():
    data = load_json(DATA_FILE, DEFAULT_DATA)
    link_data = request.json
    
    required_fields = ['category', 'name', 'description', 'url']
    if not all(field in link_data for field in required_fields):
        return jsonify({"success": False, "message": "Datos incompletos"}), 400
    
    if link_data['category'] not in data['categories']:
        return jsonify({"success": False, "message": "Categoría no existe"}), 404
    
    data['links'][link_data['category']].append({
        "name": link_data['name'],
        "description": link_data['description'],
        "url": link_data['url']
    })
    
    if save_json(DATA_FILE, data):
        return jsonify({"success": True, "message": "Enlace agregado"}), 201
    return jsonify({"success": False, "message": "Error al guardar"}), 500

# Servir archivo JSON de frases
@app.route('/frases.json')
def serve_frases_json():
    return send_from_directory(BASE_DIR, 'frases.json')

if __name__ == '__main__':
    app.run(port=3000, debug=True)
