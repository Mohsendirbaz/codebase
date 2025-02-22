import os
import shutil
import logging

# Define the source and destination paths
source = "C:/Users/Mohse/OneDrive/Documents/GitHub/TeaSpace/backend/Original"
destination = "C:/Users/Mohse/OneDrive/Documents/GitHub/TeaSpace/public/Original"

# Remove existing public/Original folder and clone the new one
if os.path.exists(destination):
    shutil.rmtree(destination)  # Remove the existing folder
    logging.info(f"Deleted existing folder: {destination}")

shutil.copytree(source, destination)  # Clone the folder
logging.info(f"Cloned Original folder to public directory: {destination}")
