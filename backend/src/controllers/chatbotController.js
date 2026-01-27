import axios from 'axios';

export const userChat = async (req, res) => {

    console.log("entered------------------------");
    

    try {
        const userMessage = req.body.message;

        // 1. Forward request to Python Microservice
        const response = await axios({
            method: 'post',
            url: 'http://localhost:8000/stream_chat', // The Python Server URL
            data: { message: userMessage },
            responseType: 'stream' // <--- CRITICAL: Tells Axios to handle this as a stream
        });

        // 2. Set headers to keep connection open for streaming
        res.setHeader('Content-Type', 'text/plain');
        res.setHeader('Transfer-Encoding', 'chunked');

        // 3. Pipe the Python stream directly to the Client
        response.data.pipe(res);

    } catch (error) {
        console.error("AI Service Error:", error.message);
        res.status(500).json({ error: "Failed to connect to AI service" });
    }
}