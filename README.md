# WhatsApp Chatbot

This project implements a WhatsApp chatbot using Node.js and various libraries. It's designed to be deployed on a Ubuntu server using Docker.

## Tech Stack

* **Node.js:** The fundamental runtime environment for the chatbot application.
* **whatsapp-web.js:** ([pedroslopez/whatsapp-web.js](https://github.com/pedroslopez/whatsapp-web.js)) Enables interaction with WhatsApp Web within your Node.js application.
* **wwebjs-mongo:** ([jtouris/wwebjs-mongo](https://github.com/jtouris/wwebjs-mongo)) Provides a seamless integration between `whatsapp-web.js` and MongoDB for data persistence.
* **qrcode-terminal:** ([gtanner/qrcode-terminal](https://github.com/gtanner/qrcode-terminal)) Facilitates the display of the QR code in a user-friendly terminal format during the initial setup.
* **Ollama (ollama-js):** ([ollama/ollama-js](https://github.com/ollama/ollama-js)) An optional component that can be leveraged for advanced natural language processing (NLP) capabilities in your chatbot, enabling it to understand and respond to user queries more effectively.
* **Mongoose:** ([mongoosejs](https://mongoosejs.com/)) An Object Data Modeling (ODM) library for MongoDB. It simplifies the interaction with the database by providing an intuitive object-oriented interface.
* **Docker:** ([docs.docker](https://docs.docker.com/)) A containerization platform used to package and deploy the chatbot application in a self-contained and consistent manner on your Ubuntu server.

## Prerequisites

* VPS (Virtual Private Server) running Ubuntu (18.04).
* Docker installed on your VPS.
* MongoDB instance.

## Installation

##### 1. **Clone the Repository:**
   ```bash
   git clone https://github.com/vedri45/whatsapp-bot
   cd whatsapp-chatbot
   ```

##### 2. **Install Dependencies:**
   ```bash
   npm install
   ```

##### 3. **Configure Environment Variables:**
   Create a `.env` file in the project root directory and add the following environment variables, replacing placeholders with your actual values:

   ```
   MONGODB_URI=mongodb://your_mongodb_host:port/your_database_name
   OLLAMA_HOST=your_ollama_host
   OLLAMA_MODEL=your_ollama_model
   BOT_NUMBER=your_bot_number
   ```

   * `MONGODB_URI`: The connection string for your MongoDB instance.
   * `OLLAMA_HOST`: A host name to identify your Ollama host.
   * `OLLAMA_MODEL`: A model name to identify your Ollama model.
   * `BOT_NUMBER`: A whatsapp number for your bot.

## Deployment with Docker

##### 1. **Build the Docker Image:**
   ```bash
   docker build -t whatsapp-chatbot .
   ```

##### 2. **Run the Docker Container:**
   ```bash
   docker run -d -p 3000:3000 --name chatbot whatsapp-chatbot
   ```

   * `-p 3000:3000`: Maps the container's port 3000 to the host's port 3000, making the application accessible from your server.
   * `--name chatbot`: Create container with the name chatbot

## Running the Chatbot

##### 1. **Scan the QR Code:**
   Start the Docker container using the command above. The application will display a QR code in the terminal using `qrcode-terminal`.
   On your phone, open WhatsApp Web and scan the QR code with your camera.

##### 2. **Interact with the Chatbot:**
   Once connected, you can start interacting with your WhatsApp chatbot through WhatsApp Web.

## Note on Ollama

If you choose to integrate Ollama for NLP capabilities, you may need to follow additional setup steps specific to Ollama. Refer to its documentation for detailed instructions.

## Additional Notes

* This README provides a general guide. You might need to adapt the steps based on your specific project structure and dependencies.
* Consider incorporating detailed instructions for configuring the chatbot's behavior (e.g., setting up intents, entities, responses).
* Explore adding documentation on testing your chatbot to ensure its functionality.
* Remember to replace placeholders with your actual values throughout the configuration process.