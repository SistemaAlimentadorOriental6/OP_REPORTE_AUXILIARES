from flask import Flask, request, jsonify
from flask_cors import CORS
import mysql.connector
from datetime import datetime
import os
import logging
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)

logging.basicConfig(level=logging.DEBUG)

@app.after_request
def apply_cors(response):
    response.headers["Access-Control-Allow-Origin"] = "*"
    response.headers["Access-Control-Allow-Methods"] = "GET, POST, OPTIONS"
    response.headers["Access-Control-Allow-Headers"] = "Content-Type,Authorization"
    return response

CORS(app, resources={r"/*": {"origins": "localhost:5173"}}, supports_credentials=True)

db_config = {
    "host": os.getenv("DB_HOST"),
    "user": os.getenv("DB_USER"),
    "password": os.getenv("DB_PASSWORD"),
    "database": os.getenv("DB_NAME"),
    "port": int(os.getenv("DB_PORT", 3306)) 
}
print(f"DB_HOST: {os.getenv('DB_HOST')}, DB_USER: {os.getenv('DB_USER')}, DB_PASSWORD: {os.getenv('DB_PASSWORD')}")

def get_db_connection():
    try:
        connection = mysql.connector.connect(**db_config)
        print("Conexión exitosa a la base de datos")
        return connection
    except mysql.connector.Error as err:
        print(f"Error al conectar a la base de datos: {err}")
        raise

@app.route("/", methods=["GET"])
def home():
    return "Bienvenido a la API de GPSs"

@app.route("/", methods=["POST"])
def root_post():
    return jsonify({"message": "Solicitud POST recibida en la raíz"}), 200

@app.route("/verificar-cedula", methods=["POST"])
def verificar_cedula():
    try:
        data = request.get_json()
        cedula = data.get("cedula")
        
        if not cedula:
            app.logger.error("Cédula no proporcionada")
            return jsonify({"error": "Cédula es requerida"}), 400

        # Conexión con la base de datos
        connection = get_db_connection()
        cursor = connection.cursor(dictionary=True)
        query = "SELECT * FROM auxiliares WHERE cedula = %s"
        cursor.execute(query, (cedula,))
        results = cursor.fetchall()

        cursor.close()
        connection.close()

        if results:
            user = results[0]
            return jsonify({"success": True, "cedula": user["cedula"]})
        else:
            app.logger.error("Cédula no encontrada: %s", cedula)
            return jsonify({"success": False, "message": "Cédula no encontrada"}), 404

    except Exception as e:
        app.logger.error(f"Error al verificar cédula: {e}")
        return jsonify({"error": "Error al verificar la cédula"}), 500
@app.route("/obtener-registros", methods=["GET"])
def obtener_registros():
    try:
        connection = get_db_connection()
        cursor = connection.cursor(dictionary=True)
        query = "SELECT * FROM registros"
        cursor.execute(query)
        results = cursor.fetchall()
        cursor.close()
        connection.close()
        return jsonify(results)
    except mysql.connector.Error as err:
        print(f"Error en la consulta a la base de datos: {err}")
        return jsonify({"error": f"Error en la consulta a la base de datos: {err}"}), 500
    
@app.route("/guardar-nuevo-registro", methods=["POST"])
def guardar_nuevo_registro():
    data = request.get_json()
    nombre = data.get("nombre")
    cedula = data.get("cedula")

    if not all([nombre, cedula]):
        return jsonify({"error": "Nombre y cédula son obligatorios"}), 400

    try:
        connection = get_db_connection()
        cursor = connection.cursor()
        query = "INSERT INTO auxiliares (nombre, cedula) VALUES (%s, %s)"
        cursor.execute(query, (nombre, cedula))
        connection.commit()
        cursor.close()
        connection.close()
        return jsonify({"success": True, "message": "Registro guardado exitosamente"})
    except mysql.connector.Error as err:
        print(f"Error insertando datos: {err}")
        return jsonify({"success": False, "message": f"Error guardando los datos: {err}"}), 500

@app.route("/obtener-datos", methods=["GET"])
def obtener_datos():
    fecha = request.args.get('fecha')
    if not fecha:
        return jsonify({"error": "Se requiere el parámetro 'fecha'"}), 400

    try:
        fecha_obj = datetime.strptime(fecha, '%Y-%m-%d')
        connection = get_db_connection()
        cursor = connection.cursor(dictionary=True)
        query = """
        SELECT cedula, nombre, entradasalida, lugar, latitud, longitud, ip, tiempo
        FROM registros
        WHERE DATE(tiempo) = %s
        """
        cursor.execute(query, (fecha_obj.date(),))
        results = cursor.fetchall()
        cursor.close()
        connection.close()
        return jsonify(results)
    except Exception as e:
        print(f"Error en la consulta a la base de datos: {e}")
        return jsonify({"error": f"Error en la consulta a la base de datos: {e}"}), 500
    
@app.route("/guardar-registro", methods=["OPTIONS", "POST"])
def guardar_registro():
    if request.method == "OPTIONS":
        return jsonify({"ok": True}), 200

    data = request.get_json()
    cedula = data.get("cedula")
    opcion = data.get("opcion")
    lugar = data.get("lugar")
    latitud = data.get("latitud")
    longitud = data.get("longitud")
    ip = request.remote_addr

    if not all([cedula, opcion, lugar, latitud, longitud]):
        return jsonify({"error": "Todos los campos son obligatorios"}), 400

    print("Datos recibidos en el backend:", {
        "cedula": cedula,
        "opcion": opcion,
        "lugar": lugar,
        "latitud": latitud,
        "longitud": longitud,
        "ip": ip
    })

    try:
        connection = get_db_connection()
        cursor = connection.cursor(dictionary=True)

        cursor.execute("SELECT nombre FROM auxiliares WHERE cedula = %s", (cedula,))
        result = cursor.fetchone()

        if not result:
            return jsonify({"error": "Cédula no encontrada en la base de datos"}), 404

        nombre = result["nombre"]

        query = "INSERT INTO registros (cedula, nombre, entradasalida, lugar, latitud, longitud, ip) VALUES (%s, %s, %s, %s, %s, %s, %s)"
        cursor.execute(query, (cedula, nombre, opcion, lugar, latitud, longitud, ip))
        connection.commit()

        cursor.close()
        connection.close()

        return jsonify({"success": True, "message": "Registro guardado exitosamente"})

    except mysql.connector.Error as err:
        print(f"Error insertando datos: {err}")
        return jsonify({"success": False, "message": f"Error guardando los datos: {err}"}), 500

if __name__ == "__main__":
    port = int(os.getenv("PORT", 10000))
    app.run(host="0.0.0.0", port=port)
