
import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

// Utilities to mimic dotenv since we can't assume it's installed
const loadEnv = () => {
    try {
        const envPath = path.resolve(process.cwd(), '.env');
        if (fs.existsSync(envPath)) {
            const envFile = fs.readFileSync(envPath, 'utf8');
            envFile.split('\n').forEach(line => {
                const [key, value] = line.split('=');
                if (key && value) {
                    process.env[key.trim()] = value.trim();
                }
            });
        }
    } catch (e) {
        console.warn('Could not load .env file manually.');
    }
};

loadEnv();

const MISTRAL_API_KEY = process.env.VITE_MISTRAL_API_KEY;
const TAVILY_API_KEY = process.env.VITE_TAVILY_API_KEY;

const OUTPUT_FILE = path.resolve(process.cwd(), 'public/data/pending_guides.json');
const GUIDES_FILE = path.resolve(process.cwd(), 'src/data/guides.json');

// --- TYPES ---
interface DraftGuide {
    id: string;
    title: string;
    problemDescription: string;
    keywords: string[];
    category: string;
    steps: any[];
    alternates: any[];
    meta: any;
    aiGenerationNotes?: string;
}

// --- CONFIGURATION ---
const SEARCH_TOPICS = ['iphone', 'android', 'windows 11', 'macbook', 'wifi', 'printer', 'bluetooth', 'chrome'];
const SOCIAL_SITES = [
    'reddit.com',
    'tiktok.com',
    'facebook.com',
    'discussions.apple.com',
    'answers.microsoft.com',
    'quora.com'
];
const BLOCKLIST = [
    'porn', 'xxx', 'sex', 'nude', 'nsfw', 'drug', 'gamble', 'casino', 'dating',
    'hack', 'crack', 'pirat', 'torrent', 'warez', 'bypass', 'activator', 'kms',
    'onlyfans', 'leak'
];

function isSafeContent(text: string): boolean {
    const lower = text.toLowerCase();
    return !BLOCKLIST.some(keyword => lower.includes(keyword));
}

function getFeedbackContext(): string {
    let notes: string[] = [];
    try {
        const files = [GUIDES_FILE, OUTPUT_FILE];
        files.forEach(file => {
            if (fs.existsSync(file)) {
                const data = JSON.parse(fs.readFileSync(file, 'utf8'));
                data.forEach((g: any) => {
                    if (g.aiGenerationNotes && g.aiGenerationNotes.trim().length > 0) {
                        notes.push(`- From human editor on "${g.title}": "${g.aiGenerationNotes}"`);
                    }
                });
            }
        });
    } catch (e) {
        console.log("No feedback context found.");
    }

    if (notes.length === 0) return "";
    const recentNotes = notes.slice(-10);
    return `\n\nCRITICAL - INCORPORATE THE FOLLOWING HUMAN FEEDBACK FROM PREVIOUS RUNS:\n${recentNotes.join('\n')}\n`;
}

// --- AI GENERATION ---
const BASE_SYSTEM_PROMPT = `
You remain "TechSteps Expert". 
Your task: Analyze the provided Content (Web Page, Video Transcript, or Forum Thread).
Output a JSON object for a Troubleshooting Guide.

Structure:
{
  "title": "Clear, short title (e.g. Fix Wi-Fi No Internet)",
  "problemDescription": "1-2 sentence summary of the issue.",
  "category": "wifi" | "windows" | "ios" | "android" | "browser" | "app-error" | "robotics",
  "difficulty": "Easy" | "Medium" | "Hard",
  "keywords": ["wifi", "internet", "connection"],
  "steps": [
    { "title": "Step Title", "content": "Actionable instruction." }
  ],
  "alternates": [
    {
      "title": "Method 2: ...",
      "type": "Community Workaround",
      "steps": [...]
    }
  ]
}

RULES:
1. Extract the BEST solution.
2. If there are other viable solutions, add them to "alternates".
3. Assign a "difficulty" based on the complexity.
4. JSON ONLY.
`;

async function generateGuideFromContent(title: string, body: string, url: string, feedbackContext: string): Promise<DraftGuide | null> {
    if (!MISTRAL_API_KEY) return null;

    const userContent = `
    SOURCE: ${title}
    URL: ${url}
    CONTENT (Summary/Excerpt):
    ${body.substring(0, 5000)}
    `;

    try {
        const response = await fetch('https://api.mistral.ai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${MISTRAL_API_KEY}`
            },
            body: JSON.stringify({
                model: 'mistral-small-latest',
                messages: [
                    { role: 'system', content: BASE_SYSTEM_PROMPT + feedbackContext },
                    { role: 'user', content: userContent }
                ],
                response_format: { type: "json_object" }
            })
        });

        if (!response.ok) throw new Error(response.statusText);
        const data = await response.json();
        const content = JSON.parse(data.choices[0].message.content);

        return {
            id: `draft-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
            ...content,
            meta: {
                created: new Date().toISOString(),
                updated: new Date().toISOString(),
                sourceUrl: url,
                confidenceScore: 0.85,
                priorityScore: 0.8,
                difficulty: content.difficulty || 'Medium'
            }
        };

    } catch (e) {
        console.error('AI Generation Failed:', e);
        return null;
    }
}

// --- TAVILY SEARCH ---
async function searchTavily(query: string) {
    if (!TAVILY_API_KEY) return null;
    try {
        const response = await fetch('https://api.tavily.com/search', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                api_key: TAVILY_API_KEY,
                query: query,
                search_depth: "advanced",
                include_answer: true,
                max_results: 5
            })
        });
        const data = await response.json();
        return data.results.map((r: any) => ({
            title: r.title,
            body: r.content, // Tavily gives us content directly!
            url: r.url
        }));
    } catch (e) {
        console.error("Tavily search error:", e);
        return null;
    }
}

// --- FALLBACKS ---
async function searchWebDuckDuckGo(query: string): Promise<string[]> {
    const browser = await chromium.launch({ headless: true });
    try {
        const context = await browser.newContext();
        const page = await context.newPage();
        await page.goto(`https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`, { waitUntil: 'domcontentloaded' });

        const links = await page.evaluate(() => {
            const anchors = Array.from(document.querySelectorAll('.result__a'));
            return anchors.map(a => (a as HTMLAnchorElement).href)
                .filter(href => !href.includes('duckduckgo') && !href.includes('google'));
        });
        return links.slice(0, 5);
    } catch (e) {
        return [];
    } finally {
        await browser.close();
    }
}

async function scrapePageContent(url: string): Promise<{ title: string, body: string } | null> {
    const browser = await chromium.launch({ headless: true });
    try {
        const page = await browser.newPage();
        await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 10000 });
        const data = await page.evaluate(() => {
            document.querySelectorAll('nav, footer, script, style').forEach(e => e.remove());
            return {
                title: document.title,
                body: document.body.innerText.substring(0, 3000)
            };
        });
        return data.body.length > 200 ? data : null;
    } catch {
        return null;
    } finally {
        await browser.close();
    }
}

// --- MAIN ---
async function run() {
    const isContinuous = process.argv.includes('--continuous');
    console.log(`keys: Mistral=${!!MISTRAL_API_KEY}, Tavily=${!!TAVILY_API_KEY}`);

    async function cycle() {
        console.log(`\n=== AUTOMATION CYCLE START: ${new Date().toISOString()} ===`);
        const feedback = getFeedbackContext();

        // 1. Build Query
        const topic = SEARCH_TOPICS[Math.floor(Math.random() * SEARCH_TOPICS.length)];
        const site = SOCIAL_SITES[Math.floor(Math.random() * SOCIAL_SITES.length)];
        const dork = `site:${site}`;
        const query = `how to fix ${topic} issue solved ${dork}`;

        console.log(`Running Query: "${query}"`);

        let sourceData: any[] = [];

        // 2. Try TAVILY (Primary)
        if (TAVILY_API_KEY) {
            console.log("Using Tavily API...");
            const tavilyResults = await searchTavily(query);
            if (tavilyResults && tavilyResults.length > 0) {
                console.log(`Tavily found ${tavilyResults.length} high-quality results.`);
                sourceData = tavilyResults;
            }
        }

        // 3. Fallback to DDG + Scraper
        if (sourceData.length === 0) {
            console.log("Using Basic Scraper Fallback...");
            const urls = await searchWebDuckDuckGo(query);
            for (const url of urls) {
                const data = await scrapePageContent(url);
                if (data && isSafeContent(data.title)) sourceData.push({ ...data, url });
            }
        }

        console.log(`Processing ${sourceData.length} sources...`);

        // 4. GENERATE
        const newGuides = [];
        for (const item of sourceData) {
            if (!isSafeContent(item.title) || !isSafeContent(item.body)) continue;

            console.log(`Generating AI Guide from: ${item.title.substring(0, 40)}...`);
            const guide = await generateGuideFromContent(item.title, item.body, item.url, feedback);
            if (guide) newGuides.push(guide);
        }

        // 5. SAVE
        if (newGuides.length > 0) {
            const current = fs.existsSync(OUTPUT_FILE) ? JSON.parse(fs.readFileSync(OUTPUT_FILE, 'utf8')) : [];
            fs.writeFileSync(OUTPUT_FILE, JSON.stringify([...current, ...newGuides], null, 2));
            console.log(`Saved ${newGuides.length} new guides.`);
        } else {
            console.log("No guides generated this cycle.");
        }
    }

    await cycle();

    if (isContinuous) {
        setInterval(cycle, 60 * 60 * 1000);
    }
}

run().catch(console.error);
