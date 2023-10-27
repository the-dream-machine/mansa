#!/bin/bash

# Define an array of folders to ignore
ignore_folders=("folder1" "folder2" "folder3")

# Initialize the exclude condition
exclude_condition=""

# Loop through the array and construct the exclude condition
for folder in "${ignore_folders[@]}"; do
    exclude_condition="$exclude_condition -o -path \"./$folder*\""
done

# Remove the leading "-o" from the condition
exclude_condition=${exclude_condition#-o}

# Run the find command with the constructed condition
find . -not \( -path "./.*" $exclude_condition -type d -prune \) -type f | sort -V
