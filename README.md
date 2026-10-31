# AI Incident Intelligence & Root Cause Assistant

**Live Demo:** [https://ai-incident-intelligence-khaki.vercel.app/](https://ai-incident-intelligence-khaki.vercel.app/)

An AI-powered incident management platform that analyzes technical incidents, identifies possible root causes, and recommends actions. It uses semantic search and Retrieval-Augmented Generation (RAG) to find relevant historical incidents and support investigation.

## Features

- Create and manage technical incidents.
- Generate AI-powered incident summaries and classifications.
- Identify possible root causes and recommended actions.
- Find similar historical incidents using semantic search.
- Review AI-generated analysis and request rework.
- Approve root-cause analysis through human review.
- Track incident activities and status updates.
- Generate final incident reports based on approved analysis.

## Tech Stack

- **Frontend:** React, JavaScript, Tailwind CSS
- **Backend:** Python, FastAPI, Pydantic
- **Database:** Supabase PostgreSQL, SQLAlchemy
- **AI/LLM:** Groq API
- **Embeddings & Vector Search:** Sentence Transformers, pgvector
- **Authentication:** Supabase Auth
- **Deployment:** Vercel, Render

## How to Run Locally

1. Clone the repository:

   ```bash
   git clone https://github.com/siddigari-kerthii-sri/ai-incident-intelligence.git
   ```

2. Navigate to the project directory:

   ```bash
   cd ai-incident-intelligence
   ```

3. Install backend dependencies:

   ```bash
   cd backend
   python -m venv venv
   ```

   Activate the virtual environment:

   **Windows**
   ```bash
   venv\Scripts\activate
   ```

   **macOS/Linux**
   ```bash
   source venv/bin/activate
   ```

4. Install Python dependencies:

   ```bash
   pip install -r requirements.txt
   ```

5. Configure the required backend environment variables in a `.env` file.

6. Start the backend:

   ```bash
   uvicorn main:app --reload
   ```

7. Open another terminal, navigate to the frontend directory, and install dependencies:

   ```bash
   cd frontend
   npm install
   ```

8. Configure the frontend environment variables and start the application:

   ```bash
   npm run dev
   ```

   Open the local URL provided by Vite, usually `http://localhost:5173`.

---

