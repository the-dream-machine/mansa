#!/bin/bash

# Define the package name you want to install
package_name="chromadb"

# Check if 'pip3' is installed
if command -v pip3 >/dev/null 2>&1; then
    # Install the package using 'pip3'
    pip3 install $package_name
    echo "Installed $package_name using the system's Python 3 version."
elif command -v pip >/dev/null 2>&1; then
    # If 'pip3' is not available, try 'pip' as a fallback
    pip install $package_name
    echo "Installed $package_name using the system's Python version (Python 2 or Python 3)."
else
    echo "Error: 'pip' and 'pip3' are not installed. Please install Python and 'pip' on your system."
fi
