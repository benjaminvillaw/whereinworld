/**
 * City Video Generation Script using Veo2 via Google AI Studio
 * 
 * Usage:
 *   GOOGLE_API_KEY="your-key" node scripts/generate-city-videos.js
 *   GOOGLE_API_KEY="your-key" node scripts/generate-city-videos.js --city "Boston"
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Cities to generate videos for
const CITIES = [
    { name: 'Boston', prompt: 'Cinematic aerial drone shot of Boston skyline at golden hour, Charles River visible, historic brownstones and modern skyscrapers, smooth camera pan, warm lighting' },
    { name: 'New York', prompt: 'Stunning aerial view of Manhattan skyline at sunset, Empire State Building prominent, city lights beginning to glow, smooth camera movement, cinematic' },
    { name: 'San Francisco', prompt: 'Beautiful aerial shot of Golden Gate Bridge at sunrise, fog rolling over the bay, San Francisco skyline in background, cinematic camera movement' },
    { name: 'Los Angeles', prompt: 'Aerial view of Los Angeles at sunset, palm trees lining streets, Hollywood sign visible in distance, warm golden light, smooth drone movement' },
    { name: 'Chicago', prompt: 'Stunning aerial view of Chicago skyline from Lake Michigan, Willis Tower prominent, beautiful blue water, smooth camera pan' },
];

const API_KEY = process.env.GOOGLE_API_KEY;
const OUTPUT_DIR = path.join(__dirname, '..', 'public', 'videos');

/**
 * Generate a video using Veo2 and download it
 */
async function generateAndDownloadVideo(city) {
    if (!API_KEY) {
        console.error('❌ GOOGLE_API_KEY environment variable not set');
        process.exit(1);
    }

    console.log(`\n🎬 Generating video for ${city.name}...`);
    console.log(`   Prompt: ${city.prompt}`);

    try {
        // Step 1: Start video generation
        const startResponse = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/veo-2.0-generate-001:predictLongRunning?key=${API_KEY}`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    instances: [{ prompt: city.prompt }],
                    parameters: { aspectRatio: '16:9', sampleCount: 1 }
                })
            }
        );

        if (!startResponse.ok) {
            const error = await startResponse.text();
            throw new Error(`Start failed: ${startResponse.status} - ${error}`);
        }

        const startResult = await startResponse.json();
        const operationName = startResult.name;
        console.log(`   ⏳ Operation started: ${operationName}`);

        // Step 2: Poll for completion
        let videoUri = null;
        for (let i = 0; i < 60; i++) { // Max 5 minutes
            await new Promise(resolve => setTimeout(resolve, 5000));
            process.stdout.write('.');

            const statusResponse = await fetch(
                `https://generativelanguage.googleapis.com/v1beta/${operationName}?key=${API_KEY}`
            );

            const status = await statusResponse.json();

            if (status.done) {
                if (status.response?.generateVideoResponse?.generatedSamples?.[0]?.video?.uri) {
                    videoUri = status.response.generateVideoResponse.generatedSamples[0].video.uri;
                    console.log(`\n   ✅ Video generated!`);
                    break;
                } else if (status.error) {
                    throw new Error(`Generation failed: ${status.error.message}`);
                }
            }
        }

        if (!videoUri) {
            throw new Error('Timeout waiting for video generation');
        }

        // Step 3: Download video immediately (files are temporary)
        console.log(`   📥 Downloading video...`);
        const fileName = city.name.toLowerCase().replace(/\s+/g, '-') + '.mp4';
        const filePath = path.join(OUTPUT_DIR, fileName);

        // Ensure output directory exists
        if (!fs.existsSync(OUTPUT_DIR)) {
            fs.mkdirSync(OUTPUT_DIR, { recursive: true });
        }

        // Download using curl with redirect following
        const downloadUrl = `${videoUri}&key=${API_KEY}`;
        execSync(`curl -L -s "${downloadUrl}" -o "${filePath}"`, { stdio: 'inherit' });

        const stats = fs.statSync(filePath);
        if (stats.size < 1000) {
            // File too small, likely an error
            const content = fs.readFileSync(filePath, 'utf8');
            console.log(`   ⚠️ Download issue: ${content.substring(0, 100)}`);
            return null;
        }

        console.log(`   ✅ Saved: ${filePath} (${(stats.size / 1024 / 1024).toFixed(2)} MB)`);
        return `/videos/${fileName}`;

    } catch (error) {
        console.error(`\n❌ Failed for ${city.name}:`, error.message);
        return null;
    }
}

/**
 * Generate videos for all cities
 */
async function generateAllVideos() {
    console.log('🌆 WhereInWorld City Video Generator (Veo 2.0)');
    console.log('===============================================\n');

    const results = {};

    for (const city of CITIES) {
        const videoPath = await generateAndDownloadVideo(city);
        if (videoPath) {
            results[city.name.toLowerCase()] = videoPath;
        }
    }

    // Output code for CityList.jsx
    console.log('\n\n📋 Add this to CITY_VIDEOS in CityList.jsx:\n');
    console.log('const CITY_VIDEOS = {');
    for (const [city, path] of Object.entries(results)) {
        console.log(`    '${city}': '${path}',`);
    }
    console.log('};');

    return results;
}

/**
 * Generate video for a single city
 */
async function generateSingleCity(cityName) {
    const city = CITIES.find(c => c.name.toLowerCase() === cityName.toLowerCase());

    if (!city) {
        console.error(`❌ City "${cityName}" not found`);
        console.log('Available:', CITIES.map(c => c.name).join(', '));
        process.exit(1);
    }

    const videoPath = await generateAndDownloadVideo(city);

    if (videoPath) {
        console.log(`\n📋 Add to CITY_VIDEOS: '${city.name.toLowerCase()}': '${videoPath}',`);
    }

    return videoPath;
}

// CLI handling
const args = process.argv.slice(2);
const cityIndex = args.indexOf('--city');

if (cityIndex !== -1 && args[cityIndex + 1]) {
    generateSingleCity(args[cityIndex + 1]);
} else {
    generateAllVideos();
}
