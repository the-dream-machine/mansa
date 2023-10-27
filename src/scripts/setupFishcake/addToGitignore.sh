#!/bin/bash

# Define the word you want to add to .gitignore
word_to_add=".fishcake"

# Check if .gitignore exists
if [ -f .gitignore ]; then
    # Check if the word is already in .gitignore
    if grep -q "$word_to_add" .gitignore; then
        echo "$word_to_add is already in .gitignore."
    else
        # If the word is not in .gitignore, add it to the file
        echo "$word_to_add" >> .gitignore
        echo "Added $word_to_add to .gitignore."
    fi
else
    # If .gitignore doesn't exist, create it and add the word
    echo "$word_to_add" > .gitignore
    echo ".gitignore created with $word_to_add."
fi
