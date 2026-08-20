import express from "express";
import path from "path";
import http from "http";
import { WebSocketServer } from "ws";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type, Modality } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "25mb" }));

// Initialize Gemini SDK lazily to avoid crash if API Key is missing on boot
let aiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.warn("WARNING: GEMINI_API_KEY environment variable is not set. AI features might be disabled.");
    }
    aiClient = new GoogleGenAI({
      apiKey: apiKey || "MOCK_KEY_FOR_STANDALONE",
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiClient;
}

// 1. Gravity Analysis Endpoint (Lumina Gravity Lab)
app.post("/api/gemini/gravity-analysis", async (req, res) => {
  try {
    const { bodies = [], G = 0.5, collisionsCount = 0 } = req.body;
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === "MY_GEMINI_API_KEY") {
      return res.json({
        reply: `### Gravity Sandbox Diagnostic: Offline Mode\n\n**Telemetry Summary**:\n- Simulation detects **${bodies.length} active masses** orbiting in the coordinate matrix.\n- Universal Gravitation Constant ($G$) is set to **${G}**.\n- Collisions logged: **${collisionsCount}**.\n\nTo activate the real-time AI astrophysics oracle (powered by Gemini), please configure your **GEMINI_API_KEY** in AI Studio's Secrets panel. Once configured, Gemini will perform comprehensive orbital resonance and Keplerian stability analyses of your custom stellar architectures!`
      });
    }

    const ai = getGeminiClient();
    const systemInstruction = `You are a fictional Quantum Astrophysicist and Cosmic Oracle, operating the "COSMOS Core" onboard Lumina OS.
You analyze user-created star-system sandbox simulations. The user will provide a list of planetary/stellar bodies with coordinates, masses, and velocities, along with settings like G and collision count.
Analyze this system as if it were a real celestial constellation. Be creative, scientific, and stylized in rich Markdown, with a cyberpunk/astro-physics tone. Speak of Lagrange points, potential orbital decay, tidal forces, and the long-term cosmic fate of their star system. Recommend custom alterations (like adding a black hole, launching a rogue planet, or altering speed). Keep it under 250 words and highly engaging!`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: `Please analyze this planetary simulation system:
Gravitational Constant (G): ${G}
Collisions Logged: ${collisionsCount}
Stellar Bodies:
${bodies.map((b: any, i: number) => `- Body ${i+1} (${b.name || "Object"}): Mass=${b.mass}, Position=(${Math.round(b.x)}, ${Math.round(b.y)}), Velocity=(${b.vx.toFixed(2)}, ${b.vy.toFixed(2)}), Color=${b.color || "#ffffff"}`).join('\n')}`,
      config: {
        systemInstruction,
        temperature: 0.7,
      }
    });

    res.json({ reply: response?.text || "Diagnostic stream was empty." });
  } catch (error: any) {
    console.error("Gravity analysis API error:", error);
    res.status(500).json({ error: error.message || "Celestial analysis failed." });
  }
});

// 2. Image Creation & Editing Endpoint (gemini-3.1-flash-image)
app.post("/api/gemini/image", async (req, res) => {
  const { prompt, imageBase64, mimeType = "image/png" } = req.body;
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === "MY_GEMINI_API_KEY") {
      return res.status(401).json({
        error: "GEMINI_API_KEY is not configured or is a placeholder in Secrets.",
      });
    }

    const ai = getGeminiClient();
    let inputPayload: any;

    if (imageBase64) {
      // Image editing mode
      inputPayload = [
        {
          type: "image",
          data: imageBase64.replace(/^data:image\/\w+;base64,/, ""), // strip prefix if present
          mime_type: mimeType,
        },
        {
          type: "text",
          text: prompt,
        },
      ];
    } else {
      // New image creation mode
      inputPayload = prompt;
    }

    const interaction = await ai.interactions.create({
      model: "gemini-3.1-flash-image",
      input: inputPayload,
      response_modalities: ["image", "text"],
      generation_config: {
        image_config: {
          aspect_ratio: "1:1",
          image_size: "1K",
        },
      },
    });

    let imageResult = "";
    let textReply = "";

    for (const step of interaction.steps) {
      if (step.type === "model_output") {
        const imageContent = step.content?.find((c) => c.type === "image");
        if (imageContent && imageContent.data) {
          imageResult = `data:${imageContent.mime_type || "image/png"};base64,${imageContent.data}`;
        }
        const textContent = step.content?.find((c) => c.type === "text");
        if (textContent && textContent.text) {
          textReply = textContent.text;
        }
      }
    }

    res.json({ image: imageResult, reply: textReply });
  } catch (error: any) {
    console.warn("Photorealistic image generation failed, checking for free-tier or quota limit. Error:", error.message);
    const isQuotaError = error.message && (
      error.message.toLowerCase().includes("quota") ||
      error.message.toLowerCase().includes("limit") ||
      error.message.toLowerCase().includes("billing") ||
      error.message.toLowerCase().includes("429") ||
      error.message.toLowerCase().includes("too_many_requests")
    );

    if (isQuotaError) {
      try {
        console.log("Quota exceeded detected. Falling back to Gemini 3.5 Flash SVG Vector Art generator for prompt:", prompt);
        const ai = getGeminiClient();
        const systemInstruction = `You are a professional SVG/HTML5 Canvas Vector Artist.
The user wants you to generate a set of stylized 2D canvas instructions to draw: "${prompt}".
Canvas size is 800 width, 450 height.
Choose a beautiful, high-contrast palette matching the subject (e.g. pastel, neon, retro, elegant dark, gold/indigo).
Create a rich, beautiful, fully composed scene by outputting between 15 and 45 distinct vector shapes.
You must return a flat list of simple shapes that layer on top of each other to draw the composition.
Position elements carefully within the 800x450 boundary. Use fill:true for colored shapes to compose a beautiful graphic design.`;

        const response = await ai.models.generateContent({
          model: "gemini-3.5-flash",
          contents: `Please generate vector canvas drawing instructions for: "${prompt}"`,
          config: {
            systemInstruction,
            temperature: 0.6,
            responseMimeType: "application/json",
            responseSchema: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  type: {
                    type: Type.STRING,
                    description: "Type of vector shape: 'circle' | 'rect' | 'line' | 'text'"
                  },
                  color: {
                    type: Type.STRING,
                    description: "Hex color code starting with '#'"
                  },
                  x: { type: Type.NUMBER },
                  y: { type: Type.NUMBER },
                  r: { type: Type.NUMBER },
                  w: { type: Type.NUMBER },
                  h: { type: Type.NUMBER },
                  x2: { type: Type.NUMBER },
                  y2: { type: Type.NUMBER },
                  text: { type: Type.STRING },
                  fill: { type: Type.BOOLEAN }
                },
                required: ["type", "color", "x", "y"]
              }
            }
          }
        });

        if (response && response.text) {
          const shapes = JSON.parse(response.text.trim());
          
          // Render vector shapes list into a high-fidelity SVG string
          let svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 450" width="800" height="450">`;
          svgContent += `<rect width="800" height="450" fill="#0f172a" />`; // standard rich background

          for (const s of shapes) {
            const fill = s.fill !== false ? s.color : 'none';
            const stroke = s.fill === false ? s.color : 'none';
            const strokeWidth = s.w || 2;
            
            if (s.type === 'circle') {
              svgContent += `<circle cx="${s.x}" cy="${s.y}" r="${s.r || 10}" fill="${fill}" stroke="${stroke}" stroke-width="${s.fill === false ? strokeWidth : 0}" />`;
            } else if (s.type === 'rect') {
              svgContent += `<rect x="${s.x}" y="${s.y}" width="${s.w || 50}" height="${s.h || 50}" fill="${fill}" stroke="${stroke}" stroke-width="${s.fill === false ? strokeWidth : 0}" />`;
            } else if (s.type === 'line') {
              svgContent += `<line x1="${s.x}" y1="${s.y}" x2="${s.x2 || s.x}" y2="${s.y2 || s.y}" stroke="${s.color || '#ffffff'}" stroke-width="${strokeWidth}" stroke-linecap="round" />`;
            } else if (s.type === 'text') {
              // Strip potential XML-unsafe characters from text
              const safeText = (s.text || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
              svgContent += `<text x="${s.x}" y="${s.y}" fill="${s.color || '#ffffff'}" font-family="monospace" font-size="14" dominant-baseline="middle" text-anchor="middle">${safeText}</text>`;
            }
          }
          svgContent += `</svg>`;
          
          const imageResult = `data:image/svg+xml;base64,${Buffer.from(svgContent).toString('base64')}`;
          return res.json({
            image: imageResult,
            reply: `Synthesized vector-art layout matching "${prompt}" using the free-tier Gemini 3.5 Flash engine, as the billing quota limit was reached for photorealistic model.`
          });
        }
      } catch (fallbackError: any) {
        console.error("Vector fallback also failed:", fallbackError);
      }
    }

    console.error("Image Generation API error:", error);
    res.status(500).json({ error: error.message });
  }
});

// 2b. Vector shapes painting endpoint using structured JSON output
app.post("/api/gemini/paint", async (req, res) => {
  try {
    const { prompt } = req.body;
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === "MY_GEMINI_API_KEY" || apiKey === "MY_KEY_FOR_STANDALONE") {
      return res.status(401).json({
        error: "GEMINI_API_KEY is not configured or is a placeholder in Secrets.",
      });
    }

    const ai = getGeminiClient();
    const systemInstruction = `You are a professional SVG/HTML5 Canvas Vector Artist.
The user wants you to generate a set of stylized 2D canvas instructions to draw: "${prompt}".
Canvas size is 800 width, 450 height.
Choose a beautiful, high-contrast palette matching the subject (e.g. pastel, neon, retro, elegant dark, gold/indigo).
Create a rich, beautiful, fully composed scene by outputting between 15 and 45 distinct vector shapes.
You must return a flat list of simple shapes that layer on top of each other to draw the composition.
Position elements carefully within the 800x450 boundary. Use fill:true for colored shapes to compose a beautiful graphic design.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: `Please generate vector canvas drawing instructions for: "${prompt}"`,
      config: {
        systemInstruction,
        temperature: 0.6,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              type: {
                type: Type.STRING,
                description: "Type of vector shape: 'circle' | 'rect' | 'line' | 'text'"
              },
              color: {
                type: Type.STRING,
                description: "Hex color code starting with '#' (including transparency like '#ffffff88' if needed)"
              },
              x: { type: Type.NUMBER, description: "x coordinate (0 to 800)" },
              y: { type: Type.NUMBER, description: "y coordinate (0 to 450)" },
              r: { type: Type.NUMBER, description: "radius of circle" },
              w: { type: Type.NUMBER, description: "width of rectangle or line-width of line" },
              h: { type: Type.NUMBER, description: "height of rectangle" },
              x2: { type: Type.NUMBER, description: "end x coordinate for line" },
              y2: { type: Type.NUMBER, description: "end y coordinate for line" },
              text: { type: Type.STRING, description: "text content (for text shape)" },
              fill: { type: Type.BOOLEAN, description: "true to fill, false to stroke only" }
            },
            required: ["type", "color", "x", "y"]
          }
        }
      }
    });

    if (response && response.text) {
      const shapes = JSON.parse(response.text.trim());
      res.json({ shapes });
    } else {
      res.json({ shapes: [] });
    }
  } catch (error: any) {
    console.error("Vector Art API error:", error);
    res.status(500).json({ error: error.message });
  }
});

// OS Assistant Context-Aware Intelligent Endpoint
app.post("/api/gemini/command", async (req, res) => {
  try {
    const { prompt, fileSystem, openApps, currentPath, theme, history = [] } = req.body;

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === "MY_GEMINI_API_KEY") {
      // Graceful fallback for demo when API key is not yet set
      return res.json({
        reply: `Hello! The system-wide Lumina AI is running in offline demo mode. To activate the full live Gemini API power, please configure your **GEMINI_API_KEY** in the Secrets panel in AI Studio.

In the meantime, I can simulate desktop actions for you:
- Try opening apps (Notepad, Paint, Browser, Calculator, Terminal, File Explorer)
- Creating files
- Typing content into Notepad or Terminal!`,
        actions: simulateOfflineCommands(prompt, currentPath || "/"),
      });
    }

    const ai = getGeminiClient();

    // Prepare system instructions with rich OS interface definitions
    const systemInstruction = `You are the core system AI Assistant (Lumina AI) for a web-based, simulated Windows OS environment.
You have direct control over the user's interface, applications, and virtual file system.
Your job is to assist the user by answering questions, writing files, launching apps, or changing settings.

### Operating Environment Stat Definition:
- Current Path: "${currentPath || "/"}"
- System Theme: "${theme || "dark"}"
- Currently Open Applications: ${JSON.stringify(openApps || [])}
- Virtual File Directory: ${JSON.stringify(fileSystem || [])}

### Interaction Rules & Capabilities:
1. You can write files. If the user asks you to write something (like notes, code, lists), create or update the file in the workspace, and optionally open it.
2. You can launch apps: "explorer", "notepad", "paint", "browser", "calc", "settings", "terminal", "copilot", "music", "voice".
3. Always respond inside the JSON schema with a friendly, professional explanation in the 'reply' property, and an array of 'actions' if the request involves terminal/file operations, opening/changing apps, or updating system settings.
4. If asked to search or read websites, you can pretend to use the browser or search the web and respond with information, or initiate a search action.
5. Relative paths: Assume files are created relative to the Current Path unless specified as absolute.

### Action Options (You can issue multiple actions in sequence):
- { "type": "open_app", "appId": "notepad" | "explorer" | "paint" | "browser" | "calc" | "settings" | "terminal" | "copilot" | "music" | "voice", "args": { "path": string, "content": string, "url": string } }
- { "type": "close_app", "appId": string }
- { "type": "create_file", "path": string, "content": string }
- { "type": "delete_file", "path": string }
- { "type": "rename_file", "path": string, "newName": string }
- { "type": "set_wallpaper", "value": string }
- { "type": "set_theme", "value": "light" | "dark" | "glass" }
- { "type": "run_terminal", "content": string } (Runs a command in the user's terminal)
- { "type": "update_settings", "settings": { "brightness": number, "volume": number, "nightLight": boolean, "nightLightStrength": number, "scale": number, "wifiOn": boolean, "bluetoothOn": boolean, "vpnActive": boolean, "username": string, "wallpaper": string } }

Return a structured JSON matching the provided schema.`;

    // Incorporate chat history, ensuring the conversation starts with a user turn (Gemini protocol requirement)
    // Build strictly alternating conversation messages where the model's protocol dictates (user -> model -> user -> model...)
    const firstUserIndex = history.findIndex((msg: any) => msg.role === "user");
    const activeHistory = firstUserIndex !== -1 ? history.slice(firstUserIndex) : [];

    const conversationContents: any[] = [];
    let expectedRole = "user";

    for (const msg of activeHistory) {
      const currentRole = msg.role === "assistant" ? "model" : "user";
      if (currentRole === expectedRole) {
        conversationContents.push({
          role: currentRole,
          parts: [{ text: msg.content || "" }],
        });
        expectedRole = expectedRole === "user" ? "model" : "user";
      } else {
        // Handle unexpected duplicate roles gracefully by concatenating text content.
        if (currentRole === "user" && conversationContents.length > 0) {
          const lastIndex = conversationContents.length - 1;
          if (conversationContents[lastIndex].role === "user") {
            conversationContents[lastIndex].parts[0].text += "\n\n" + (msg.content || "");
          }
        } else if (currentRole === "model" && conversationContents.length > 0) {
          const lastIndex = conversationContents.length - 1;
          if (conversationContents[lastIndex].role === "model") {
            conversationContents[lastIndex].parts[0].text += "\n\n" + (msg.content || "");
          }
        }
      }
    }

    // Finally append the latest prompt turn as a user message
    if (conversationContents.length === 0 || conversationContents[conversationContents.length - 1].role === "model") {
      conversationContents.push({
        role: "user",
        parts: [{ text: prompt }],
      });
    } else {
      conversationContents[conversationContents.length - 1].parts[0].text += "\n\n" + prompt;
    }

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: conversationContents as any,
      config: {
        systemInstruction,
        temperature: 0.7,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            reply: {
              type: Type.STRING,
              description: "The verbal assistant response text to display to the user.",
            },
            actions: {
              type: Type.ARRAY,
              description: "List of digital actions to execute instantly on the simulated desktop.",
              items: {
                type: Type.OBJECT,
                properties: {
                  type: {
                    type: Type.STRING,
                    description: "Action type: 'open_app', 'close_app', 'create_file', 'delete_file', 'rename_file', 'set_wallpaper', 'set_theme', 'run_terminal'",
                  },
                  appId: {
                    type: Type.STRING,
                    description: "Target application identifier if launching/closing an app.",
                  },
                  path: {
                    type: Type.STRING,
                    description: "Target virtual filesystem path for file operations.",
                  },
                  newName: {
                    type: Type.STRING,
                    description: "Requested new name for renaming folder or file inside virtual filesystem.",
                  },
                  content: {
                    type: Type.STRING,
                    description: "Required text or data content for creating a file or running terminal commands.",
                  },
                  value: {
                    type: Type.STRING,
                    description: "Value parameter for themes ('light', 'dark', 'glass'), wallpaper urls, etc.",
                  },
                  settings: {
                    type: Type.OBJECT,
                    description: "Key-value pair settings mapping object for update_settings action.",
                    properties: {
                      brightness: { type: Type.NUMBER },
                      volume: { type: Type.NUMBER },
                      nightLight: { type: Type.BOOLEAN },
                      nightLightStrength: { type: Type.NUMBER },
                      scale: { type: Type.NUMBER },
                      wifiOn: { type: Type.BOOLEAN },
                      bluetoothOn: { type: Type.BOOLEAN },
                      vpnActive: { type: Type.BOOLEAN },
                      username: { type: Type.STRING },
                      wallpaper: { type: Type.STRING },
                    }
                  },
                  args: {
                    type: Type.OBJECT,
                    description: "Additional dynamic arguments for the application.",
                    properties: {
                      path: { type: Type.STRING },
                      content: { type: Type.STRING },
                      url: { type: Type.STRING },
                    },
                  },
                },
                required: ["type"],
              },
            },
          },
          required: ["reply"],
        },
      },
    });

    if (response && response.text) {
      const data = JSON.parse(response.text.trim());
      return res.json(data);
    } else {
      throw new Error("Empty response from AI model.");
    }
  } catch (error: any) {
    console.error("Gemini proxy error:", error);
    res.status(500).json({
      reply: "Oops, I encountered a system glitch while processing that request. " + error.message,
      actions: [],
    });
  }
});

// Demo Web Search API for our Simulated Browser search engine
app.post("/api/web/search", async (req, res) => {
  const { query } = req.body;
  try {
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey || apiKey === "MY_GEMINI_API_KEY") {
      return res.json({
        results: [
          { title: `${query} - Wikipedia`, snippet: `Simulated search result. Wikipedia article about ${query}. This operating system is running inside a beautiful, sandboxed client container...`, url: `https://en.wikipedia.org/wiki/${encodeURIComponent(query)}` },
          { title: `${query} Official Site`, snippet: `The primary resource and homepage for details regarding ${query}. Get the latest information, documentation, downloads, and developer guides.`, url: `https://www.example.com/${encodeURIComponent(query)}` },
          { title: `Latest News on ${query}`, snippet: `Recent updates and breaking headlines about ${query}. Markets react to recent development. Experts weigh in on standard implementation guidelines.`, url: `https://news.example.com/${encodeURIComponent(query)}` },
        ],
      });
    }

    const ai = getGeminiClient();
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: `Search the web for the latest and most accurate information about "${query}". Provide a beautiful summarized report with references/URLs so that the browser can display it. Return the content structured in raw JSON array of search results. Each result should have 'title', 'snippet', and 'url'.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              snippet: { type: Type.STRING },
              url: { type: Type.STRING },
            },
            required: ["title", "snippet", "url"],
          },
        },
        tools: [{ googleSearch: {} }],
      },
    });

    if (response && response.text) {
      const results = JSON.parse(response.text.trim());
      res.json({ results });
    } else {
      res.json({ results: [] });
    }
  } catch (error) {
    console.error("Browser search error:", error);
    res.json({
      results: [
        { title: `${query} - General Search`, snippet: `Result for query "${query}". Unable to connect to googleSearch live nodes, displaying local cache content.`, url: "#" },
      ],
    });
  }
});

// Offline command simulation generator when key is missing or empty
function simulateOfflineCommands(prompt: string, currentPath: string): any[] {
  const normalized = prompt.toLowerCase();
  const actions: any[] = [];

  if (normalized.includes("open") || normalized.includes("launch")) {
    if (normalized.includes("notepad")) actions.push({ type: "open_app", appId: "notepad" });
    else if (normalized.includes("calc") || normalized.includes("calculator")) actions.push({ type: "open_app", appId: "calc" });
    else if (normalized.includes("paint")) actions.push({ type: "open_app", appId: "paint" });
    else if (normalized.includes("explorer") || normalized.includes("file")) actions.push({ type: "open_app", appId: "explorer" });
    else if (normalized.includes("browser") || normalized.includes("web") || normalized.includes("internet")) actions.push({ type: "open_app", appId: "browser" });
    else if (normalized.includes("setting")) actions.push({ type: "open_app", appId: "settings" });
    else if (normalized.includes("terminal") || normalized.includes("cmd") || normalized.includes("prompt")) actions.push({ type: "open_app", appId: "terminal" });
    else if (normalized.includes("music") || normalized.includes("sound") || normalized.includes("song")) actions.push({ type: "open_app", appId: "music" });
    else if (normalized.includes("voice") || normalized.includes("talk") || normalized.includes("speak")) actions.push({ type: "open_app", appId: "voice" });
  }

  if (normalized.includes("file") || normalized.includes("create") || normalized.includes("write")) {
    const match = prompt.match(/(?:file|named|create)\s+([a-zA-Z0-9_\-\.]+)/i);
    const fileName = match ? match[1] : "notes.txt";
    const fullPath = currentPath === "/" ? `/${fileName}` : `${currentPath}/${fileName}`;

    actions.push({
      type: "create_file",
      path: fullPath,
      content: "Created by Lumina AI offline mode!\n\nUse this space for your notes.",
    });
    actions.push({
      type: "open_app",
      appId: "notepad",
      args: { path: fullPath, content: "Created by Lumina AI offline mode!\n\nUse this space for your notes." },
    });
  }

  if (normalized.includes("dark") || normalized.includes("theme")) {
    actions.push({ type: "set_theme", value: normalized.includes("light") ? "light" : "dark" });
  }

  return actions;
}

// OS Voice Assistant endpoint with authentic Gemini Neural Audio & Multimodal Screen Vision
app.post("/api/gemini/voice-chat", async (req, res) => {
  try {
    const { prompt, voice = "Zephyr", image, screenContext } = req.body;
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey || apiKey === "MY_GEMINI_API_KEY") {
      const activeAppDesc = screenContext?.activeApp ? ` with ${screenContext.activeApp}` : '';
      const fallbackResponses: Record<string, string> = {
        "hello": "Hello! I am Lumina AI. How can I help you today?",
        "what time is it": `The current system time is ${new Date().toLocaleTimeString()}.`,
        "who are you": "I am Lumina AI, your intelligent operating system companion.",
        "open notepad": "Opening Notepad for you right now.",
        "open paint": "Launching the Paint canvas app.",
        "open calculator": "Opening Calculator.",
      };

      const lower = (prompt || "").toLowerCase();
      let match = image 
        ? `I am observing your desktop screen${activeAppDesc}. To unlock real-time Gemini Multimodal Vision analysis and voice guidance, configure your GEMINI_API_KEY in the Secrets panel.`
        : `I heard you say: "${prompt || 'Hello'}". To unlock real-time Gemini neural voice responses, configure your GEMINI_API_KEY in the Secrets panel.`;

      for (const [k, v] of Object.entries(fallbackResponses)) {
        if (lower.includes(k)) {
          match = v;
          break;
        }
      }

      return res.json({ reply: match, audio: null });
    }

    const ai = getGeminiClient();
    
    // Customized system instructions based on whether screen sharing / visual frame is present
    let systemInstruction = `You are Lumina AI, a friendly, intelligent, proactive visual and voice assistant built directly into Lumina OS.
You are speaking directly to the user in a voice conversation while they interact with the desktop.
Keep your answers direct, intelligent, conversational, step-by-step, and concise (1 to 3 short sentences maximum), optimized for natural spoken playback.
Never output raw markdown formatting, asterisks, or bullet characters that sound awkward when read aloud by speech synthesis.`;

    if (image || screenContext) {
      systemInstruction += `
You are actively observing the user's shared desktop screen and open applications (e.g. Paint Studio, Notepad, Calculator, Terminal, File Explorer, Settings, Google Maps).
The user is speaking to you and asking for guidance or help on what to do next.
Carefully examine the visual interface in the screenshot:
- Identify which window is active, what buttons, menus, drawings, calculations, commands, or text are currently visible.
- Provide clear, actionable, step-by-step advice on what they should do, where to click, what tools to use, or what command to run.
- If they ask "What should I do?" or "How do I do this?", give specific, practical guidance based on what you see on the screen.`;
    }

    const parts: any[] = [];

    // Attach multimodal screen image part if provided
    if (image && typeof image === 'string') {
      let mimeType = "image/jpeg";
      let base64Data = image;
      if (image.startsWith("data:")) {
        const match = image.match(/^data:(image\/[a-zA-Z0-9\+\-\.]+);base64,(.+)$/);
        if (match) {
          mimeType = match[1];
          base64Data = match[2];
        }
      }
      parts.push({
        inlineData: {
          mimeType,
          data: base64Data,
        },
      });
    }

    // Attach user speech prompt & screen state context
    let fullPromptText = prompt || (image ? "I am sharing my desktop screen with you. What do you see, and what should I do next?" : "Hello Lumina AI");
    if (screenContext) {
      const activeApp = screenContext.activeApp || "Desktop";
      const openApps = Array.isArray(screenContext.openApps) ? screenContext.openApps.join(", ") : "None";
      fullPromptText += `\n[Desktop State: Active Window="${activeApp}", Open Applications=[${openApps}]]`;
    }
    parts.push({ text: fullPromptText });

    // 1. Generate text response with Gemini 3.7 Flash multimodal
    const response = await ai.models.generateContent({
      model: "gemini-3.7-flash",
      contents: [{ parts }],
      config: {
        systemInstruction,
        temperature: 0.7,
      },
    });

    const reply = response?.text?.trim() || "I can see your screen. How can I guide you?";

    // 2. Generate Gemini Neural Voice (TTS)
    let audioBase64: string | null = null;
    try {
      const validVoice = ["Puck", "Charon", "Kore", "Fenrir", "Zephyr"].includes(voice) ? voice : "Zephyr";
      const ttsResponse = await ai.models.generateContent({
        model: "gemini-3.1-flash-tts-preview",
        contents: [{ parts: [{ text: reply }] }],
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: validVoice },
            },
          },
        },
      });

      audioBase64 = ttsResponse.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data || null;
    } catch (ttsErr) {
      console.warn("Gemini Neural TTS warning (will fallback to browser audio):", ttsErr);
    }

    res.json({ reply, audio: audioBase64 });
  } catch (error: any) {
    console.error("Voice chat API error:", error);
    res.status(500).json({ error: error.message || "Failed to process voice request." });
  }
});

// Dedicated TTS endpoint
app.post("/api/gemini/tts", async (req, res) => {
  try {
    const { text, voice = "Zephyr" } = req.body;
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === "MY_GEMINI_API_KEY") {
      return res.json({ audio: null });
    }

    const ai = getGeminiClient();
    const validVoice = ["Puck", "Charon", "Kore", "Fenrir", "Zephyr"].includes(voice) ? voice : "Zephyr";
    const response = await ai.models.generateContent({
      model: "gemini-3.1-flash-tts-preview",
      contents: [{ parts: [{ text: text || "Hello" }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: validVoice },
          },
        },
      },
    });

    const audioBase64 = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data || null;
    res.json({ audio: audioBase64 });
  } catch (error: any) {
    console.error("TTS endpoint error:", error);
    res.status(500).json({ error: error.message || "Failed to synthesize speech." });
  }
});

// Http and WS setup
const server = http.createServer(app);
const wss = new WebSocketServer({ noServer: true });

// Handle WebSocket connections for standard Live voice API
wss.on("connection", async (clientWs, req) => {
  console.log("Live Voice WebSocket connection opened from", req?.url);
  let liveSession: any = null;

  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === "MY_GEMINI_API_KEY") {
      clientWs.send(JSON.stringify({ error: "No API Key configured on Server. Voice is in fallback mode." }));
      return;
    }

    const ai = getGeminiClient();
    liveSession = await ai.live.connect({
      model: "gemini-3.1-flash-live-preview",
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: { prebuiltVoiceConfig: { voiceName: "Zephyr" } },
        },
        systemInstruction: "You are Lumina AI, a fast real-time audio voice assistant for Lumina OS. Speak naturally, concisely, and directly in 1 to 2 sentences.",
      },
      callbacks: {
        onmessage: (message: any) => {
          const audio = message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
          if (audio) {
            clientWs.send(JSON.stringify({ audio }));
          }
          if (message.serverContent?.interrupted) {
            clientWs.send(JSON.stringify({ interrupted: true }));
          }
        },
        onerror: (err: any) => {
          console.error("Live session callback error:", err);
          try {
            clientWs.send(JSON.stringify({ error: err?.message || "Live session error" }));
          } catch (_) {}
        },
        onclose: () => {
          console.log("Live session closed from Google upstream");
        }
      },
    });

    clientWs.on("message", async (data) => {
      try {
        const payload = JSON.parse(data.toString());
        if (payload.audio && liveSession) {
          await liveSession.sendRealtimeInput({
            audio: { data: payload.audio, mimeType: "audio/pcm;rate=16000" },
          });
        }
      } catch (err) {
        console.error("Live input parse or send issue:", err);
      }
    });

    clientWs.on("close", () => {
      if (liveSession) {
        try {
          liveSession.close();
        } catch (e) {}
      }
    });
  } catch (err: any) {
    console.error("Error setting up Gemini Live Audio Link:", err);
    try {
      clientWs.send(JSON.stringify({ error: "Connection error: " + err.message }));
    } catch (_) {}
  }
});

// Bridge upgrade requests with safe pathname parsing
server.on("upgrade", (request, socket, head) => {
  try {
    const url = new URL(request.url || "", `http://${request.headers.host || "localhost"}`);
    if (url.pathname === "/api/live" || url.pathname === "/api/live/" || url.pathname === "/live" || url.pathname === "/live/") {
      wss.handleUpgrade(request, socket, head, (ws) => {
        wss.emit("connection", ws, request);
      });
      return;
    }
  } catch (e) {
    console.error("WebSocket upgrade parse error:", e);
  }
  socket.destroy();
});

// Vite middleware for development
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  server.listen(PORT, "0.0.0.0", () => {
    console.log(`Server listening on http://localhost:${PORT}`);
  });
}

startServer();
