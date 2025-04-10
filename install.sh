#!/bin/bash

# Text colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}✨ Installing Mindbridge MCP Server...${NC}\n"

# Check for Node.js
if ! command -v node &> /dev/null; then
    echo -e "${RED}Error: Node.js is not installed${NC}"
    echo -e "Please install Node.js v18 or higher from https://nodejs.org"
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -d 'v' -f 2)
if ! echo "${NODE_VERSION}" | grep -qE '^1[89]|[2-9][0-9]'; then
    echo -e "${RED}Error: Node.js version 18 or higher is required${NC}"
    echo -e "Current version: ${NODE_VERSION}"
    exit 1
fi

# Check for npm
if ! command -v npm &> /dev/null; then
    echo -e "${RED}Error: npm is not installed${NC}"
    echo -e "Please install npm package manager"
    exit 1
fi

echo -e "${GREEN}✓${NC} Node.js version ${NODE_VERSION} detected"

# Install dependencies
echo -e "\n${YELLOW}Installing dependencies...${NC}"
npm install

if [ $? -ne 0 ]; then
    echo -e "${RED}Error: Failed to install dependencies${NC}"
    exit 1
fi

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
    echo -e "\n${YELLOW}Creating .env file from template...${NC}"
    cp .env.example .env
    echo -e "${GREEN}✓${NC} Created .env file"
    echo -e "${YELLOW}Please edit .env and add your API keys${NC}"
fi

# Build the project
echo -e "\n${YELLOW}Building project...${NC}"
npm run build

if [ $? -ne 0 ]; then
    echo -e "${RED}Error: Build failed${NC}"
    exit 1
fi

echo -e "\n${GREEN}✨ Installation complete!${NC}"
echo -e "\nTo start the server:"
echo -e "  Development mode: ${YELLOW}npm run dev${NC}"
echo -e "  Production mode: ${YELLOW}npm start${NC}"
echo -e "\nMade with ❤️  by Pink Pixel"