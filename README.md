# BugEdits - Photo Editing & Sharing Platform
BugEdits is a full-stack web application that allows users to upload, edit, manage, and share photos. It features a robust image editor with filtering, cropping, and doodling capabilities, along with a secure sharing system for collaboration.

Link to application: https://bugedits.site

## Features
-   **User Authentication**: Secure Login and Registration (JWT-based).
-   **Photo Management**: Upload, view, and organize photos into Albums.
-   **Advanced Image Editor**:
    -   **Adjust**: Brightness, Contrast, Saturation, Blur.
    -   **Crop & Rotate**: Custom aspect ratios and free transform.
    -   **Doodle**: Freehand drawing on images.
    -   **Text**: Add draggable, editable text overlays.
    -   **Undo/Redo**: Full history support for edits.
-   **Sharing System**:
    -   Share individual photos or entire albums.
    -   **Permissions**: Grant "View Only" or "Edit" access.
    -   **Redemption**: Secure redemption flow for shared content.
-   **Search**: Search through personal albums and photos.
## Technology Stack
### Backend
-   **Framework**: Django 5.0 + Django REST Framework
-   **Database**: SQLite (Dev) / PostgreSQL (Prod)
-   **Storage**: Local Filesystem (Dev) / AWS S3 (Prod)
-   **Image Processing**: Pillow (Python Imaging Library)
### Frontend
-   **Framework**: React 18 (Vite)
-   **Styling**: Tailwind CSS
-   **State Management**: React Context API
-   **Components**: Lucide React (Icons), React Image Crop
### DevOps
-   **Containerization**: Docker & Docker Compose
-   **Server**: Gunicorn (Backend), Nginx (Frontend)
---
## Getting Started
### Prerequisites
-   Docker & Docker Compose OR
-   Node.js (v18+) & Python (v3.12+)
### Option 1: Quick Start with Docker (Recommended)
1.  **Clone the repository**:
    ```bash
    git clone <repository-url>
    cd project-2-bug_dealers
    ```
2.  **Run with Docker Compose**:
    ```bash
    docker-compose up --build
    ```
    This will start both the Backend (Port 8000) and Frontend (Port 5173/80).
3.  **Access the App**:
    -   Frontend: `http://localhost:5173`
    -   Backend API: `http://localhost:8000`
### Option 2: Manual Setup
#### Backend
1.  Navigate to `backend/`:
    ```bash
    cd backend
    ```
2.  Create and activate virtual environment:
    ```bash
    python -m venv venv
    # Windows
    venv\Scripts\activate
    # Mac/Linux
    source venv/bin/activate
    ```
3.  Install dependencies:
    ```bash
    pip install -r requirements.txt
    ```
4.  Run migrations and start server:
    ```bash
    python manage.py migrate
    python manage.py runserver
    ```
#### Frontend
1.  Navigate to `frontend/`:
    ```bash
    cd frontend
    ```
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  Start development server:
    ```bash
    npm run dev
    ```
---
## Usage Guide
### Editing a Photo
1.  Upload a photo via the "Upload Photo" button on the Dashboard.
2.  Click on the photo thumbnail to enter the **Editor**.
3.  Use the tabs at the bottom to switch tools:
    -   **Adjust**: Use sliders to tweak the look.
    -   **Crop**: Select an aspect ratio and drag the handles.
    -   **Doodle**: Pick a color and draw.
4.  Click **Save** to overwrite or **Save Copy** to create a new version.
### Sharing
1.  Open a photo or find it in your dashboard.
2.  Click the **Share** icon.
3.  Enter the username of the person you want to share with.
4.  Toggle **"Allow Editing"** if you want them to be able to modify the photo.
5.  Send them the generated link.
---
## Deployment (AWS)
For production deployment on AWS (EC2/RDS/S3):
1.  **Environment Variables**: Ensure the following are set in your production environment:
    -   `SECRET_KEY`
    -   `DEBUG=False`
    -   `DATABASE_URL` (for RDS)
    -   `USE_S3=True` (plus AWS credentials)
2.  **Build Images**: Use the provided `Dockerfile`s in `backend/` and `frontend/`.
3.  **Orchestration**: Refer to the detailed `deployment_guide.md` (Artifact) for step-by-step instructions.
## 👥 Contributors
-   **Roshni Pai**
-   **Poulomi Sarkar**
