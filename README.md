# how to run this challenge locally
CyberMaze V25: Continue Y/N Challenge

This repository contains the "Continue Y/N" web challenge from CyberMaze V25, a realistic multi-step exploitation scenario that chains several common web vulnerabilities.
🎯 Challenge Description

Continue Y/N is a web application that allows users to register, login, upload files, and download them. The challenge guides participants through discovering and exploiting a chain of vulnerabilities leading to full system compromise.
🏗️ Vulnerabilities Explored

    Local File Read (LFR) via path traversal with filter bypass

    JWT Forgery using hardcoded secrets for privilege escalation

    Server-Side Request Forgery (SSRF) to access internal services

    SQL Command Execution through whitelist bypass

🚀 Quick Start
Prerequisites

    Docker

    Docker Compose

Installation & Setup
bash

# Clone the repository
git clone https://github.com/L3benn/CyberMaze-V25-Continue-Y-N-Writeup.git

# Navigate to the challenge directory
cd CyberMaze-V25-Continue-Y-N-Writeup/ContinueYorN/Challenge/

# Make the build script executable
chmod +x build-docker.sh

# Build and run the challenge
./build-docker.sh

Access the Challenge

Once the containers are running, access the challenge at:

    Web Application: http://localhost:4002

    Admin Panel: http://localhost:4002/admin (after authentication)

📁 Project Structure
text

ContinueYorN/
├── Challenge/
│   ├── app/
│   │   ├── routes/
│   │   ├── middleware/
│   │   ├── helpers/
│   │   └── main.js
│   ├── Dockerfile
│   ├── docker-compose.yml
│   ├── build-docker.sh
│   └── README.md
└── Writeup/
    └── Continue_Y_N_Writeup.pdf
