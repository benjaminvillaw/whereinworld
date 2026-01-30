/**
 * City Video Generation Script using Google Veo3 via Gemini API
 * 
 * This script generates short looping city videos for the WhereInWorld app.
 * Videos are generated using Google's Veo 3.1 model.
 * 
 * Prerequisites:
 * 1. Google Cloud Project with Vertex AI enabled
 * 2. GOOGLE_API_KEY environment variable set
 * 3. npm install @google/generative-ai
 * 
 * Usage:
 *   node scripts/generate-city-videos.js
 *   node scripts/generate-city-videos.js --city "Boston"
 */

const fs = require('fs');
const path = require('path');

// Cities to generate videos for
const CITIES = [
    { name: 'Boston', prompt: 'Cinematic aerial drone shot of Boston skyline at golden hour, Charles River visible, historic brownstones and modern skyscrapers, smooth camera pan, warm lighting' },
    { name: 'New York', prompt: 'Stunning aerial view of Manhattan skyline at sunset, Empire State Building prominent, city lights beginning to glow, smooth camera movement, cinematic' },
    { name: 'San Francisco', prompt: 'Beautiful aerial shot of Golden Gate Bridge at sunrise, fog rolling over the bay, San Francisco skyline in background, cinematic camera movement' },
    { name: 'Los Angeles', prompt: 'Aerial view of Los Angeles at sunset, palm trees lining streets, Hollywood sign visible in distance, warm golden light, smooth drone movement' },
    { name: 'Chicago', prompt: 'Stunning aerial view of Chicago skyline from Lake Michigan, Willis Tower prominent, beautiful blue water, smooth camera pan' },
    { name: 'Miami', prompt: 'Aerial drone shot of Miami Beach at sunset, Art Deco buildings, turquoise water, palm trees, vibrant colors, smooth camera movement' },
    { name: 'Seattle', prompt: 'Aerial view of Seattle skyline with Space Needle, Mount Rainier in background, Puget Sound visible, moody Pacific Northwest lighting' },
    { name: 'Denver', prompt: 'Aerial view of Denver skyline with Rocky Mountains in background, clear blue sky, modern downtown, smooth camera movement' },
    { name: 'Austin', prompt: 'Aerial drone shot of Austin skyline at dusk, Congress Avenue Bridge, Colorado River, warm Texas sunset, smooth camera pan' },
    { name: 'Nashville', prompt: 'Aerial view of Nashville skyline at night, Broadway lights glowing, Batman Building prominent, warm evening ambiance' },
    { name: 'Portland', prompt: 'Aerial view of Portland with Mount Hood in background, Willamette River, lush green surroundings, Pacific Northwest aesthetic' },
    { name: 'Atlanta', prompt: 'Aerial drone shot of Atlanta skyline, modern skyscrapers, lush green trees, smooth camera movement, warm southern light' },
    { name: 'Philadelphia', prompt: 'Aerial view of Philadelphia skyline, historic buildings mixed with modern towers, Philly skyline at golden hour' },
    { name: 'Washington', prompt: 'Stunning aerial view of Washington DC at sunset, Capitol Building and Washington Monument visible, National Mall, cinematic' },
    { name: 'San Diego', prompt: 'Aerial shot of San Diego harbor and skyline, beautiful beaches, Coronado Bridge, perfect California weather, smooth movement' },
    { name: 'Las Vegas', prompt: 'Aerial view of Las Vegas Strip at night, neon lights glowing, casino resorts, dramatic desert mountains in background' },
    { name: 'Phoenix', prompt: 'Aerial drone shot of Phoenix skyline at sunset, desert mountains visible, dramatic southwestern sky colors' },
    { name: 'Toronto', prompt: 'Aerial view of Toronto skyline, CN Tower prominent, Lake Ontario shoreline, modern cosmopolitan city, smooth camera pan' },
    { name: 'Vancouver', prompt: 'Stunning aerial shot of Vancouver skyline, mountains and ocean, Stanley Park visible, Pacific Northwest beauty' },
    { name: 'London', prompt: 'Cinematic aerial view of London at sunset, Tower Bridge and Thames River, historic architecture, warm evening light' },
    { name: 'Paris', prompt: 'Aerial drone shot of Paris with Eiffel Tower, Seine River, Parisian rooftops, romantic golden hour lighting' },
    { name: 'Tokyo', prompt: 'Aerial view of Tokyo skyline at night, neon lights, Shibuya crossing area, modern and traditional mix, cinematic' },
    { name: 'Sydney', prompt: 'Stunning aerial shot of Sydney Harbour, Opera House and Harbour Bridge, beautiful Australian sky, smooth camera movement' },
    { name: 'Dubai', prompt: 'Aerial view of Dubai skyline at sunset, Burj Khalifa prominent, modern architecture, golden desert light' },
    { name: 'Singapore', prompt: 'Aerial drone shot of Singapore skyline, Marina Bay Sands, Gardens by the Bay, futuristic city at twilight' },
    { name: 'Amsterdam', prompt: 'Aerial view of Amsterdam canal houses at golden hour, historic architecture, boats on canals, European charm' },
    { name: 'Barcelona', prompt: 'Aerial shot of Barcelona with Sagrada Familia visible, Mediterranean coast, beautiful Spanish architecture' },
    { name: 'Rome', prompt: 'Cinematic aerial view of Rome at sunset, Colosseum visible, ancient and modern architecture, warm Italian light' },
    { name: 'Hong Kong', prompt: 'Stunning aerial view of Hong Kong skyline at night, Victoria Harbour, dramatic lighting, dense urban landscape' },
];

// Video generation config
const VIDEO_CONFIG = {
    duration: 8, // seconds
    resolution: '1080p',
    aspectRatio: '16:9',
    model: 'veo-3.1-generate-001'
};

/**
 * Generate a video using Veo3 API
 * Note: This requires the Gemini API with Veo access
 */
async function generateVideo(city, prompt) {
    const apiKey = process.env.GOOGLE_API_KEY;

    if (!apiKey) {
        console.error('❌ GOOGLE_API_KEY environment variable not set');
        console.log('\nTo set up:');
        console.log('1. Go to https://aistudio.google.com/apikey');
        console.log('2. Create an API key');
        console.log('3. Run: export GOOGLE_API_KEY="your-key-here"');
        process.exit(1);
    }

    console.log(`\n🎬 Generating video for ${city.name}...`);
    console.log(`   Prompt: ${prompt}`);

    try {
        // Veo3 API endpoint
        const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${VIDEO_CONFIG.model}:generateContent`;

        const response = await fetch(endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-goog-api-key': apiKey
            },
            body: JSON.stringify({
                contents: [{
                    parts: [{
                        text: prompt
                    }]
                }],
                generationConfig: {
                    videoDuration: VIDEO_CONFIG.duration,
                    aspectRatio: VIDEO_CONFIG.aspectRatio,
                    resolution: VIDEO_CONFIG.resolution
                }
            })
        });

        if (!response.ok) {
            const error = await response.text();
            throw new Error(`API Error: ${response.status} - ${error}`);
        }

        const result = await response.json();

        // Extract video URL or base64 from response
        if (result.candidates?.[0]?.content?.parts?.[0]?.videoMetadata) {
            const videoUrl = result.candidates[0].content.parts[0].videoMetadata.url;
            console.log(`✅ Video generated for ${city.name}: ${videoUrl}`);
            return videoUrl;
        }

        return result;
    } catch (error) {
        console.error(`❌ Failed to generate video for ${city.name}:`, error.message);
        return null;
    }
}

/**
 * Generate videos for all cities and save URLs
 */
async function generateAllVideos() {
    console.log('🌆 WhereInWorld City Video Generator');
    console.log('=====================================\n');
    console.log(`Generating videos for ${CITIES.length} cities...`);

    const results = {};

    for (const city of CITIES) {
        const videoUrl = await generateVideo(city, city.prompt);
        if (videoUrl) {
            results[city.name.toLowerCase()] = videoUrl;
        }

        // Rate limiting - wait between requests
        await new Promise(resolve => setTimeout(resolve, 5000));
    }

    // Save results
    const outputPath = path.join(__dirname, 'city-videos.json');
    fs.writeFileSync(outputPath, JSON.stringify(results, null, 2));
    console.log(`\n✅ Video URLs saved to ${outputPath}`);

    return results;
}

/**
 * Generate video for a single city
 */
async function generateSingleCity(cityName) {
    const city = CITIES.find(c => c.name.toLowerCase() === cityName.toLowerCase());

    if (!city) {
        console.error(`❌ City "${cityName}" not found in list`);
        console.log('Available cities:', CITIES.map(c => c.name).join(', '));
        process.exit(1);
    }

    const videoUrl = await generateVideo(city, city.prompt);
    return videoUrl;
}

// CLI handling
const args = process.argv.slice(2);
const cityIndex = args.indexOf('--city');

if (cityIndex !== -1 && args[cityIndex + 1]) {
    generateSingleCity(args[cityIndex + 1]);
} else {
    generateAllVideos();
}
