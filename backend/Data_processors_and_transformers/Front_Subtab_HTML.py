"""Flask service (port:8009) - Serves HTML files from batch results"""
from flask import Flask, jsonify
from flask_cors import CORS
import os, logging, logging.config
from file_utils import find_versions, find_files

app = Flask(__name__)
CORS(app)

BASE_PATH = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "public", "Original")
'''
logging.config.dictConfig({'version':1, 'disable_existing_loggers':False,
    'formatters':{'standard':{'format':'%(asctime)s %(levelname)s %(message)s'}},
    'handlers':{'file':{'level':'DEBUG', 'formatter':'standard', 'class':'logging.FileHandler',
    'filename':os.path.join(os.getcwd(),'DirectoryInventoryhtml.log'), 'mode':'w'}},
    'root':{'handlers':['file'], 'level':'DEBUG'}})
'''
@app.route('/api/album_html/<version>')
def get_html_files(version: str):
    # API: Returns all HTML files for specified version
    logging.info(f"Processing request for version: {version}")
    return jsonify(find_files(BASE_PATH, version, '.html'))

if __name__ == '__main__':
    [find_files(BASE_PATH, v, '.html') for v in find_versions(BASE_PATH)]
    app.run(port=8009)
