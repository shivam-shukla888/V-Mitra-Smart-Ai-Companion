# V-Mitra: Smart AI Business Companion

## 📖 Introduction
**V-Mitra** is a cutting-edge **AI-powered Business Operating System** designed specifically for Indian merchants. It bridges the gap between traditional bookkeeping and modern digital management by allowing users to manage their entire business using natural language voice commands in **Hinglish** (Hindi + English).

Whether it's recording a sale ("Ek kilo cheeni bechi"), checking stock ("Doodh khatam ho gaya kya?"), or analyzing profits ("Aaj kitna munafa hua?"), V-Mitra acts as a smart companion that simplifies complex business operations.

---

## 🚀 Key Features

- **🗣️ Voice-First Interface:** Interact with your business data using natural voice commands powered by Google Gemini AI.
- **📦 Smart Inventory Management:** Real-time tracking of stock levels with automatic alerts for low inventory.
- **💰 Sales & Transaction Recording:** Seamlessly record sales and expenses without manual data entry.
- **📊 Business Insights:** Instant access to daily revenue, profit margins, and sales trends via an intuitive dashboard.
- **🇮🇳 Localized for India:** Built to understand the unique linguistic blend of Indian merchants.

---

## 🛠 Technology Stack

### **Frontend (User Interface)**
- **Framework:** [React 19](https://react.dev/)
- **Build Tool:** [Vite](https://vitejs.dev/)
- **Language:** [TypeScript](https://www.typescriptlang.org/)
- **Styling:** [Tailwind CSS](https://tailwindcss.com/)
- **State Management:** React Hooks
- **AI Integration:** Google Gemini API (`@google/genai`)
- **Visualizations:** [Recharts](https://recharts.org/) & [Lucide React](https://lucide.dev/) (Icons)

### **Backend (Business Logic)**
- **Framework:** [Spring Boot 3.2.2](https://spring.io/projects/spring-boot)
- **Language:** [Java 17](https://www.java.com/)
- **Build Tool:** [Maven](https://maven.apache.org/)
- **Database:** H2 Database (In-Memory/File-Based for development)
- **Architecture:** RESTful API with Controller-Service-Repository pattern

---

## 📂 Project Structure

The project follows a standard structure combining a modern frontend with a robust enterprise-grade backend.



1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
`npm run dev`

4.bash
mvn clean package -DskipTests
bash
java -jar target/backend-0.0.1-SNAPSHOT.jar
