import os
import shutil
import logging

# Define the source and destination paths
source = "C:/Users/md8w7/OneDrive University of Missouri/Desktop/ImportantFiles/Milestone4/backend/Original"
destination = "C:/Users/md8w7/OneDrive University of Missouri/Desktop/ImportantFiles/Milestone4/public/Original"

# Remove existing public/Original folder and clone the new one
if os.path.exists(destination):
    shutil.rmtree(destination)  # Remove the existing folder
    logging.info(f"Deleted existing folder: {destination}")

shutil.copytree(source, destination)  # Clone the folder
logging.info(f"Cloned Original folder to public directory: {destination}")
