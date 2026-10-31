import os
import sys
from flask import Flask, send_from_directory

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

app = Flask(__name__, static_folder=BASE_DIR, static_url_path='')


@app.route('/')
def index():
    return send_from_directory(BASE_DIR, 'index.html')


@app.route('/single')
def single_file():
    return send_from_directory(BASE_DIR, 'imu.html')


@app.route('/<path:filename>')
def serve_static(filename):
    return send_from_directory(BASE_DIR, filename)


if __name__ == '__main__':
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 8080
    print("==========================================")
    print("  JEE Main CBT Simulator - Flask Server")
    print(f"  Modular App : http://localhost:{port}/")
    print(f"  Single File : http://localhost:{port}/imu.html")
    print("==========================================")
    app.run(host='0.0.0.0', port=port, debug=False)