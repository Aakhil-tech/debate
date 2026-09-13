<img width="1280" height="640" alt="git (1)" src="https://github.com/user-attachments/assets/8920b256-2ba8-4988-b824-5351134eb4bd" />



Debate and win


## Basic Details
### Team Name: Aakhil


### Team Members
- Team Lead: Mohamemd Aakhil E - Cochin University Of Science and Technology

### Project Description
How to win against a women

Debate & Win is an AI-powered conversation co-pilot that analyzes screenshots of conversations and tells users what just happened, what it means, and what to do next.

📸 Screenshot → 🧠 Understand → 🎯 Next Move → 💬 Reply → 📸 New Screenshot → Repeat

Product Link:
https://debate-and-win.onrender.com/fumble

### The Problem (that doesn't exist)
Communication Problem between men and wonen

### The Solution (that nobody asked for)
To try use AI to understand women

Technical Details
Technologies/Components Used
For Software

Languages:

Python
TypeScript / JavaScript
HTML / CSS

Frameworks:

React 19
FastAPI
Vite
Tailwind CSS v4

Libraries / Tools:

Groq API
openai/gpt-oss-120b — text analysis
qwen/qwen3.8-27b — vision analysis
JWT Authentication
PostgreSQL
Supabase
Docker
Uvicorn
For Hardware

No dedicated hardware required.

The project runs through a web browser and cloud-based AI infrastructure.

### Implementation
For Software
Installation
git clone <this-repo>
cd debate-win-backend

python -m venv venv
source venv/bin/activate

Install dependencies:

pip install -r requirements.txt

Configure environment variables:

cp .env.example .env

Add:

GROQ_API_KEY=your_key
SECRET_KEY=your_secret
SUPABASE_URL=your_url
SUPABASE_SERVICE_KEY=your_key
Run
uvicorn app.main:app --reload --port 8000

Or using Docker:

docker-compose up --build
### Project Documentation
For Software:

<img width="1656" height="841" alt="Screenshot 2026-09-13 160122" src="https://github.com/user-attachments/assets/d1c49baa-bd92-4ff0-adb4-7f19156c6af8" />
<img width="1656" height="841" alt="Screenshot 2026-09-13 160122" src="https://github.com/user-attachments/assets/7ec56051-bfab-48e3-a2ff-836a48436a50" />
<img width="1606" height="922" alt="Screenshot 2026-09-13 165131" src="https://github.com/user-attachments/assets/50b7d6f2-9b8c-41ff-8a0e-c7f5013aa09b" />


## How It Works

<img width="568" height="832" alt="WhatsApp Image 2026-09-13 at 16 28 42 (1)" src="https://github.com/user-attachments/assets/7e7a6385-eb30-468d-9258-6bc0e9b04bd4" />

## Endpoints


POST   /auth/register
POST   /auth/login
GET    /auth/me

GET    /credits/balance
POST   /credits/add
GET    /credits/costs

POST   /receipts/upload         (multipart image, costs 3 credits)
POST   /receipts/analyze        (text paste, costs 3 credits)
GET    /receipts/               (list past cases)
GET    /receipts/{id}           (get single case)

POST   /fumble/analyze          (costs 1 credit)

POST   /sparring/start
POST   /sparring/{id}/message   (costs 1 credit/turn)
GET    /sparring/{id}
POST   /sparring/{id}/verdict

GET    /war-room/stats
GET    /war-room/active-case


Full interactive docs at http://localhost:8000/docs



### Project Demo
# Video

https://debate-and-win.onrender.com/fumble


## Team Contributions
Mohammed Aakhil E
---
Made with ❤️ at TinkerHub Useless Projects 

![Static Badge](https://img.shields.io/badge/TinkerHub-24?color=%23000000&link=https%3A%2F%2Fwww.tinkerhub.org%2F)
![Static Badge](https://img.shields.io/badge/UselessProjects--26-26?link=https%3A%2F%2Ftinkerhub.org%2Fevents%2F1M8ORET9A1%2Fuseless-projects-3.0)



