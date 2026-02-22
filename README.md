# 🧠 Learning Box: Your AI-Powered Personal Tutor

**Learning Box** is a cutting-edge adaptive learning platform designed to revolutionize the way you study and retain knowledge. Using an AI engine based on the FSRS (Free Spaced Repetition System) algorithm and advanced language models, Learning Box personalizes your learning experience to maximize efficiency and material mastery.

## ✨ Key Features

- **🧠 Intelligent Content Atomization**: Automatically breaks down any study material (PDFs, URLs, or plain text) into digestible "knowledge atoms."
- **📈 Adaptive Study Plan**: Our strategic AI tutor (Learning Box Tutor) analyzes your performance, behavioral metrics (response time, aids used), and the FSRS algorithm to create dynamic and optimized study plans.
- **❓ Diverse Question Generation**: Automatically creates a variety of question types to keep study sessions engaging and effective:
  - Open-Ended Questions
  - Multiple Choice (with AI-generated distractors)
  - Ordering Questions
- **🕹️ Motivational Gamification**:
  - **Energy**: Limits sessions to promote spaced study and prevent burnout.
  - **Cognitive Credits**: Earn rewards for studying that can be redeemed in the store.
  - **Learner Ranks**: Progress through different levels as you demonstrate mastery.
- **☁️ Cloud Sync with Supabase**: Access your projects and progress from any device, at any time.
- **📱 Responsive Design**: A smooth and consistent user experience on desktop and mobile devices.
- **🔒 Secure Authentication**: Robust and secure user management through Supabase Auth, including Google sign-in.

## 🛠️ Technology Stack

- **Framework**: [Next.js 14](https://nextjs.org/) (App Router)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) with [Shadcn/UI](https://ui.shadcn.com/) for components.
- **Backend & Database**: [Supabase](https://supabase.com/) (PostgreSQL, Auth, Storage)
- **Artificial Intelligence**: [Google Gemini](https://gemini.google.com/) via the [Genkit](https://firebase.google.com/docs/genkit) framework.
- **Spaced Repetition Algorithm**: FSRS (Free Spaced Repetition System)

## 🚀 Quick Start Guide

Follow these steps to get an instance of Learning Box running on your local machine.

### 1. Prerequisites

- Node.js (v18 or higher)
- npm or yarn

### 2. Clone the Repository

```bash
git clone https://github.com/your-username/learning-box.git
cd learning-box
```

### 3. Install Dependencies

```bash
npm install
```

### 4. Configure Environment Variables

Create a `.env.local` file in the root of the project by copying the example:

```bash
cp .env.example .env.local
```

Now, edit `.env.local` with your own keys:

```env
# Your Supabase project keys
NEXT_PUBLIC_SUPABASE_URL="https://<project_ref>.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your_anon_key"
SUPABASE_SERVICE_ROLE_KEY="your_service_role_key"

# API Key for Google Gemini
GEMINI_API_KEY="your_gemini_api_key"
```

### 5. Database Setup

1.  Go to your project in [Supabase](https://supabase.com).
2.  Navigate to the **SQL Editor**.
3.  Open the `database/schema.sql` file from this repository, copy all its content, and paste it into the Supabase editor.
4.  Click **"RUN"** to execute the script and create all necessary tables and security policies.

### 6. Run the Project

```bash
npm run dev
```

Ready! Open [http://localhost:3000](http://localhost:3000) in your browser and start learning.

## 🏗️ Architecture and Data Flow

1.  **Registration**: The user creates an account, accepting the Terms and Conditions. Their preferences (e.g., newsletter) are saved in the metadata.
2.  **Project Creation**: The user provides study material (URL, PDF, text).
3.  **AI Processing (Genkit)**:
    - A Genkit flow extracts the content.
    - Another flow "atomizes" the content into knowledge units.
    - Questions are generated and everything is stored in Supabase.
4.  **Study Plan**: The AI "Strategic Tutor" analyzes the current state of the project and decides the most appropriate session type (e.g., "Introduction," "Reinforcement").
5.  **Study Session**:
    - The user answers the questions.
    - Performance (correct/incorrect), response time, and aids used are recorded (`performanceLog`).
6.  **Adaptation**: With each response, the system updates the atom's FSRS parameters, and the `performanceLog` is sent to the AI tutor, who can recalibrate the study plan in real-time.

## 📁 Project Structure

```
.
├── src/
│   ├── app/                # Routes (App Router)
│   │   ├── (app)/          # Protected routes (dashboard, projects, study)
│   │   ├── (auth)/         # Authentication routes (login, signup)
│   │   └── api/            # API routes
│   ├── ai/                 # AI flows with Genkit (flows)
│   ├── components/         # Reusable UI components (shadcn)
│   ├── contexts/           # React contexts (Auth, Project)
│   ├── lib/                # Auxiliary libraries and clients (Supabase, utils)
│   └── middleware.ts       # Next.js middleware for Supabase sessions
├── database/
│   └── schema.sql          # SQL schema for initial DB setup
└── ...
```

## 🚀 Deployment

The easiest way to deploy Learning Box is using **Vercel**.

1.  Fork this repository.
2.  Create a new project in Vercel and import it from your GitHub account.
3.  Configure the same environment variables you used in `.env.local` in the Vercel project settings.
4.  Deploy! Vercel will handle the rest.

## 🤝 Contributions

Contributions are welcome! If you want to improve Learning Box, please follow these steps:

1.  Fork the project.
2.  Create a new branch (`git checkout -b feature/AmazingFeature`).
3.  Make your changes and commit them (`git commit -m 'Add some AmazingFeature'`).
4.  Push to the branch (`git push origin feature/AmazingFeature`).
5.  Open a Pull Request.

## ⚖️ License

This project is distributed under the MIT License. See the `LICENSE` file for more information.
