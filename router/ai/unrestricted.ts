import express, { Request, Response } from 'express';
import axios from 'axios';
import fs from 'fs';
import path from 'path';

// ======= CLASS UNRESTRICTED AI =======
class UnrestrictedAIScraper {
    private baseURL = 'https://unrestrictedaiimagegenerator.com';
    private headers = {
        'authority': 'unrestrictedaiimagegenerator.com',
        'accept': '*/*',
        'accept-encoding': 'gzip, deflate, br, zstd',
        'accept-language': 'id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7',
        'content-type': 'application/x-www-form-urlencoded; charset=UTF-8',
        'origin': 'https://unrestrictedaiimagegenerator.com',
        'referer': 'https://unrestrictedaiimagegenerator.com/',
        'user-agent': 'Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Mobile Safari/537.36',
        'x-requested-with': 'XMLHttpRequest'
    };

    private cookie: string;
    private session: any;

    constructor() {
        this.cookie = this.generateCookies();
        this.headers['cookie'] = this.cookie;
        this.session = axios.create({ baseURL: this.baseURL, headers: this.headers, withCredentials: true });
    }

    private generateCookies() {
        const timestamp = Math.floor(Date.now() / 1000);
        const ga1 = `GA1.1.${Math.floor(Math.random() * 1000000000)}.${timestamp}`;
        const ga2 = `GS2.1.s${timestamp}$o1$g1$t${timestamp}$j40$l0$h0`;
        return `_ga=${ga1}; _ga_J4MEF7G6YX=${ga2}`;
    }

    private async getNonce() {
        const response = await this.session.get('/');
        const match = response.data.match(/name="_wpnonce" value="([^"]+)"/);
        return match ? match[1] : '218155152c';
    }

    public async generateImage(prompt: string, style = 'photorealistic') {
        const nonce = await this.getNonce();
        const payload = new URLSearchParams({
            'generate_image': 'true',
            'image_description': prompt,
            'image_style': style,
            '_wpnonce': nonce
        }).toString();

        const response = await this.session.post('/', payload, {
            headers: { ...this.headers, 'content-length': Buffer.byteLength(payload), 'cookie': this.cookie }
        });

        const imageUrl = this.extractImageUrl(response.data);
        return {
            success: !!imageUrl,
            imageUrl,
            prompt,
            style,
            nonce
        };
    }

    private extractImageUrl(html: string) {
        const match = html.match(/src="([^"]*\/ai-images\/[^"]*\.(?:png|jpg|jpeg|webp))"/i);
        return match ? match[1] : null;
    }
}

// ======= HANDLER =======
async function unrestrictedAIHandler(req: Request, res: Response) {
    const prompt = (req.query.prompt || req.body.prompt) as string;
    const style = (req.query.style || req.body.style) as string;

    if (!prompt || prompt.trim().length === 0) {
        return res.status(400).json({ status: false, message: "Parameter 'prompt' diperlukan" });
    }

    try {
        const scraper = new UnrestrictedAIScraper();
        const data = await scraper.generateImage(prompt, style || 'photorealistic');
        res.json(data);
    } catch (err: any) {
        res.status(500).json({ status: false, message: err.message });
    }
}

// ======= SERVER =======
const app = express();
app.use(express.json());

app.get('/api/ai/unrestricted', unrestrictedAIHandler);
app.post('/api/ai/unrestricted', unrestrictedAIHandler);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server jalan di http://localhost:${PORT}`));