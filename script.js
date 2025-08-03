// DOM Elements
const playlistUrlInput = document.getElementById('playlistUrl');
const apiKeyInput = document.getElementById('apiKey');
const analyzeBtn = document.getElementById('analyzeBtn');
const clearUrlBtn = document.getElementById('clearUrlBtn');
const clearKeyBtn = document.getElementById('clearKeyBtn');
const clearAllBtn = document.getElementById('clearAllBtn');
const loader = document.getElementById('loader');
const messageBox = document.getElementById('messageBox');
const resultsSection = document.getElementById('results');
const videoListBody = document.getElementById('videoList');
const generateSummaryBtn = document.getElementById('generateSummaryBtn');
const generateLearningPathBtn = document.getElementById('generateLearningPathBtn');
const generateFaqBtn = document.getElementById('generateFaqBtn');
const calculateBingeBtn = document.getElementById('calculateBingeBtn');

// Global state
let fullVideoData = [];
let fullPlaylistDetails = null;
let totalPlaylistSeconds = 0;
let lengthChartInstance = null;

// Event Listeners
analyzeBtn.addEventListener('click', handleAnalysis);
clearUrlBtn.addEventListener('click', () => { playlistUrlInput.value = ''; });
clearKeyBtn.addEventListener('click', () => { apiKeyInput.value = ''; });
clearAllBtn.addEventListener('click', () => handleClearAll(false));
generateSummaryBtn.addEventListener('click', handleGenerateSummary);
generateLearningPathBtn.addEventListener('click', handleGenerateLearningPath);
generateFaqBtn.addEventListener('click', handleGenerateFaqs);
calculateBingeBtn.addEventListener('click', handleBingeCalculation);

/** Main analysis function */
async function handleAnalysis() {
    handleClearAll(true);
    const playlistUrl = playlistUrlInput.value.trim();
    const apiKey = apiKeyInput.value.trim();
    if (!playlistUrl || !apiKey) {
        showMessage('Please provide both a playlist URL and a Google Cloud API key.', 'error');
        return;
    }
    const playlistId = extractPlaylistId(playlistUrl);
    if (!playlistId) {
        showMessage('Invalid YouTube playlist URL. Please check the format.', 'error');
        return;
    }
    loader.classList.remove('hidden');
    resultsSection.classList.add('hidden');
    try {
        fullPlaylistDetails = await fetchPlaylistDetails(playlistId, apiKey);
        const videoItems = await fetchPlaylistItems(playlistId, apiKey);
        if (videoItems.length === 0) {
            showMessage('This playlist is empty or private.', 'info');
            loader.classList.add('hidden');
            return;
        }
        fullVideoData = await fetchVideoDetails(videoItems.map(v => v.contentDetails.videoId), apiKey);
        processAndDisplayResults(fullVideoData);
    } catch (error) {
        console.error('Analysis Error:', error);
        showMessage(`An error occurred: ${error.message}. Check the console for details.`, 'error');
    } finally {
        loader.classList.add('hidden');
    }
}

/** Extracts playlist ID from URL */
function extractPlaylistId(url) {
    const regex = /(?:list=)([\w-]+)/;
    const match = url.match(regex);
    return match ? match[1] : null;
}

/** Fetches playlist details */
async function fetchPlaylistDetails(playlistId, apiKey) {
    const baseUrl = 'https://www.googleapis.com/youtube/v3/playlists';
    const params = new URLSearchParams({ part: 'snippet', id: playlistId, key: apiKey });
    const response = await fetch(`${baseUrl}?${params}`);
    const data = await response.json();
    if (data.error) throw new Error(data.error.message);
    return data.items && data.items.length > 0 ? data.items[0].snippet : null;
}

/** Fetches all items from a playlist, handling pagination */
async function fetchPlaylistItems(playlistId, apiKey) {
    let allItems = [], nextPageToken = '';
    const baseUrl = 'https://www.googleapis.com/youtube/v3/playlistItems';
    do {
        const params = new URLSearchParams({
            part: 'contentDetails', playlistId, maxResults: 50, key: apiKey, pageToken: nextPageToken,
        });
        const response = await fetch(`${baseUrl}?${params}`);
        const data = await response.json();
        if (data.error) throw new Error(data.error.message);
        allItems = allItems.concat(data.items);
        nextPageToken = data.nextPageToken;
    } while (nextPageToken);
    return allItems;
}

/** Fetches detailed information for a list of video IDs */
async function fetchVideoDetails(videoIds, apiKey) {
    let allDetails = [];
    const baseUrl = 'https://www.googleapis.com/youtube/v3/videos';
    for (let i = 0; i < videoIds.length; i += 50) {
        const chunk = videoIds.slice(i, i + 50);
        const params = new URLSearchParams({
            part: 'contentDetails,snippet,statistics', id: chunk.join(','), key: apiKey,
        });
        const response = await fetch(`${baseUrl}?${params}`);
        const data = await response.json();
        if (data.error) throw new Error(data.error.message);
        allDetails = allDetails.concat(data.items);
    }
    return allDetails;
}

/** Processes fetched data and updates the UI */
function processAndDisplayResults(videos) {
    if (!videos || videos.length === 0) {
        showMessage('Could not retrieve video details.', 'info');
        return;
    }

    totalPlaylistSeconds = 0;
    let longestVideo = { duration: 0, video: null };
    let shortestVideo = { duration: Infinity, video: null };
    let mostPopularVideo = { views: -1, video: null };
    let mostLikedVideo = { likes: -1, video: null };

    videos.forEach(video => {
        const durationSeconds = parseISO8601Duration(video.contentDetails.duration);
        totalPlaylistSeconds += durationSeconds;

        if (durationSeconds > longestVideo.duration) longestVideo = { duration: durationSeconds, video };
        if (durationSeconds < shortestVideo.duration) shortestVideo = { duration: durationSeconds, video };

        const viewCount = parseInt(video.statistics.viewCount, 10);
        if (viewCount > mostPopularVideo.views) mostPopularVideo = { views: viewCount, video };

        const likeCount = parseInt(video.statistics.likeCount, 10);
        if (likeCount > mostLikedVideo.likes) mostLikedVideo = { likes: likeCount, video };
    });

    document.getElementById('summaryStats').innerHTML = `
                <div class="card p-5 text-center"><h3 class="text-lg font-semibold text-gray-700 mb-2">Total Watch Time</h3><p class="text-4xl font-bold text-gray-800">${formatTime(totalPlaylistSeconds)}</p></div>
                <div class="card p-5 text-center"><h3 class="text-lg font-semibold text-gray-700 mb-2">Total Videos</h3><p class="text-4xl font-bold text-gray-800">${videos.length}</p></div>
                <div class="card p-5 text-center"><h3 class="text-lg font-semibold text-gray-700 mb-2">Average Length</h3><p class="text-4xl font-bold text-gray-800">${formatTime(Math.round(totalPlaylistSeconds / videos.length))}</p></div>`;

    displayInsightCard('longestVideo', 'fas fa-clock', 'Longest Video', longestVideo.video, formatTime(longestVideo.duration));
    displayInsightCard('shortestVideo', 'fas fa-stopwatch', 'Shortest Video', shortestVideo.video, formatTime(shortestVideo.duration));
    displayInsightCard('mostPopularVideo', 'fas fa-fire', 'Most Popular', mostPopularVideo.video, `${Number(mostPopularVideo.views).toLocaleString()} views`);
    displayInsightCard('mostLikedVideo', 'fas fa-thumbs-up', 'Most Liked', mostLikedVideo.video, `${Number(mostLikedVideo.likes).toLocaleString()} likes`);

    createLengthDistributionChart(videos);

    videoListBody.innerHTML = '';
    videos.forEach((video, index) => {
        const row = document.createElement('tr');
        row.className = "transition-colors duration-200";
        row.innerHTML = `<td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${index + 1}</td><td class="px-6 py-4 whitespace-nowrap"><div class="flex items-center"><div class="flex-shrink-0 h-10 w-10"><img class="h-10 w-10 rounded-md object-cover" src="${video.snippet.thumbnails.default.url}" alt=""></div><div class="ml-4"><div class="text-sm font-medium text-gray-900 truncate max-w-xs md:max-w-md">${video.snippet.title}</div></div></div></td><td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${formatTime(parseISO8601Duration(video.contentDetails.duration))}</td>`;
        videoListBody.appendChild(row);
    });
    resultsSection.classList.remove('hidden');
}

/** Handles Binge-Watch Calculation */
function handleBingeCalculation() {
    const hours = parseInt(document.getElementById('watchHours').value) || 0;
    const minutes = parseInt(document.getElementById('watchMinutes').value) || 0;
    const dailyWatchSeconds = (hours * 3600) + (minutes * 60);
    const resultDiv = document.getElementById('bingeResult');

    if (dailyWatchSeconds <= 0) {
        resultDiv.textContent = 'Please enter a valid watch time.';
        resultDiv.classList.remove('hidden');
        return;
    }

    const totalDays = Math.ceil(totalPlaylistSeconds / dailyWatchSeconds);
    resultDiv.textContent = `It will take you approx. ${totalDays} day(s) to finish.`;
    resultDiv.classList.remove('hidden');
}

/** Creates the video length distribution chart */
function createLengthDistributionChart(videos) {
    const buckets = { '0-5m': 0, '5-15m': 0, '15-30m': 0, '30-60m': 0, '60m+': 0 };
    videos.forEach(video => {
        const durationMinutes = parseISO8601Duration(video.contentDetails.duration) / 60;
        if (durationMinutes < 5) buckets['0-5m']++;
        else if (durationMinutes < 15) buckets['5-15m']++;
        else if (durationMinutes < 30) buckets['15-30m']++;
        else if (durationMinutes < 60) buckets['30-60m']++;
        else buckets['60m+']++;
    });

    const ctx = document.getElementById('lengthDistributionChart').getContext('2d');
    if (lengthChartInstance) {
        lengthChartInstance.destroy();
    }
    lengthChartInstance = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: Object.keys(buckets),
            datasets: [{
                label: '# of Videos',
                data: Object.values(buckets),
                backgroundColor: 'rgba(59, 130, 246, 0.5)',
                borderColor: 'rgba(59, 130, 246, 1)',
                borderWidth: 1
            }]
        },
        options: {
            scales: { y: { beginAtZero: true, ticks: { precision: 0 } } },
            plugins: { legend: { display: false } }
        }
    });
}

/** Generic Gemini API call handler */
async function callGemini(prompt, apiKey, button, loader, output) {
    loader.classList.remove('hidden');
    output.classList.add('hidden');
    button.disabled = true;
    button.classList.add('opacity-50', 'cursor-not-allowed');

    try {
        const payload = { contents: [{ role: "user", parts: [{ text: prompt }] }] };
        const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error?.message || `HTTP error! status: ${response.status}`);
        }
        const result = await response.json();
        if (result.candidates?.[0]?.content?.parts?.[0]?.text) {
            const text = result.candidates[0].content.parts[0].text;
            const formattedText = text
                .replace(/### (.*?)\n/g, '<h4>$1</h4>')
                .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                .replace(/^\* (.*$)/gm, '<li>$1</li>')
                .replace(/(\r\n|\n|\r)/g, '<br>')
                .replace(/<br><li/g, '<li').replace(/<\/li><br>/g, '</li>')
                .replace(/(<li>.*<\/li>)/g, '<ul>$1</ul>')
                .replace(/<\/ul><br><ul>/g, '');

            output.innerHTML = formattedText;
            output.classList.remove('hidden', 'text-red-700', 'bg-red-100', 'border-red-200');
        } else {
            throw new Error("The AI returned an empty or invalid response.");
        }
    } catch (error) {
        console.error("Gemini API Error:", error);
        output.innerHTML = `Sorry, the AI feature could not be executed. <br><b>Error:</b> ${error.message}`;
        output.classList.remove('hidden');
        output.classList.add('text-red-700', 'bg-red-100', 'border-red-200');
    } finally {
        loader.classList.add('hidden');
        button.disabled = false;
        button.classList.remove('opacity-50', 'cursor-not-allowed');
    }
}

/** Handles AI summary generation */
async function handleGenerateSummary() {
    const apiKey = apiKeyInput.value.trim();
    if (!apiKey) {
        showMessage('Please provide a Google Cloud API key to use AI features.', 'error');
        return;
    }
    const playlistTitle = fullPlaylistDetails ? fullPlaylistDetails.title : "this playlist";
    const videoTitles = fullVideoData.map(v => `- "${v.snippet.title}"`).join('\n');
    const prompt = `You are a helpful YouTube expert. Generate a concise summary of a playlist based on its title and video titles.\n\nPlaylist Title: "${playlistTitle}"\n\nVideo Titles:\n${videoTitles}\n\nPlease provide:\n1. A one-paragraph summary.\n2. The likely target audience.\n3. A bulleted list of 3-5 key topics.\n\nFormat your response clearly using Markdown.`;
    callGemini(prompt, apiKey, generateSummaryBtn, document.getElementById('summaryLoader'), document.getElementById('aiSummaryOutput'));
}

/** Handles AI learning path generation */
async function handleGenerateLearningPath() {
    const apiKey = apiKeyInput.value.trim();
    if (!apiKey) {
        showMessage('Please provide a Google Cloud API key to use AI features.', 'error');
        return;
    }
    const playlistTitle = fullPlaylistDetails ? fullPlaylistDetails.title : "this playlist";
    const videoTitles = fullVideoData.map(v => `- "${v.snippet.title}"`).join('\n');
    const prompt = `You are an expert curriculum designer. Analyze the following list of video titles from a YouTube playlist and organize them into a logical learning path.\n\nPlaylist Title: "${playlistTitle}"\n\nVideo Titles:\n${videoTitles}\n\nPlease:\n1. Group videos into logical sections with clear headings (use ### for headings).\n2. List relevant video titles in a sensible order within each section.\n3. Provide a brief (1-2 sentence) explanation for your structure.\n\nFormat your response clearly using Markdown.`;
    callGemini(prompt, apiKey, generateLearningPathBtn, document.getElementById('learningPathLoader'), document.getElementById('aiLearningPathOutput'));
}

/** Handles AI FAQ generation */
async function handleGenerateFaqs() {
    const apiKey = apiKeyInput.value.trim();
    if (!apiKey) {
        showMessage('Please provide a Google Cloud API key to use AI features.', 'error');
        return;
    }
    const playlistTitle = fullPlaylistDetails ? fullPlaylistDetails.title : "this playlist";
    const videoTitles = fullVideoData.map(v => `- "${v.snippet.title}"`).join('\n');
    const prompt = `You are a helpful content analyst. Based on the title and video titles of the following YouTube playlist, generate a list of 3-5 frequently asked questions (FAQs) that a potential viewer might have. For each question, provide a concise, one-sentence answer that could be inferred from the titles.\n\nPlaylist Title: "${playlistTitle}"\n\nVideo Titles:\n${videoTitles}\n\nFormat the output as a list where each item starts with "**Q:**" followed by the question, and the next line starts with "A:" followed by the answer.`;
    callGemini(prompt, apiKey, generateFaqBtn, document.getElementById('faqLoader'), document.getElementById('aiFaqOutput'));
}

/** Creates and displays an insight card */
function displayInsightCard(elementId, iconClass, title, video, stat) {
    const container = document.getElementById(elementId);
    if (!video) {
        container.innerHTML = `<h3 class="text-lg font-bold text-gray-800 mb-4 flex items-center"><i class="${iconClass} mr-3 text-gray-400"></i>${title}</h3><p class="text-gray-500">Not available</p>`;
        return;
    }
    container.innerHTML = `<h3 class="text-lg font-bold text-gray-800 mb-4 flex items-center"><i class="${iconClass} mr-3 text-blue-500"></i>${title}</h3><div class="flex items-start space-x-3"><a href="https://www.youtube.com/watch?v=${video.id}" target="_blank" class="flex-shrink-0"><img src="${video.snippet.thumbnails.default.url}" alt="Thumbnail" class="w-24 h-14 rounded-md object-cover hover:opacity-80 transition shadow-md"></a><div><a href="https://www.youtube.com/watch?v=${video.id}" target="_blank" class="font-semibold text-sm text-gray-800 hover:text-blue-600 transition line-clamp-2">${video.snippet.title}</a><p class="text-md font-bold text-gray-800 mt-1">${stat}</p></div></div>`;
}

/** Parses ISO 8601 duration into seconds */
function parseISO8601Duration(duration) {
    const regex = /P(?:(\d+)D)?T(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/;
    const matches = duration.match(regex);
    return (parseInt(matches[1] || 0) * 86400) + (parseInt(matches[2] || 0) * 3600) + (parseInt(matches[3] || 0) * 60) + (parseInt(matches[4] || 0));
}

/** Formats seconds into HH:MM:SS */
function formatTime(totalSeconds) {
    if (isNaN(totalSeconds)) return "00:00:00";
    const h = Math.floor(totalSeconds / 3600), m = Math.floor((totalSeconds % 3600) / 60), s = Math.round(totalSeconds % 60);
    return [h, m, s].map(v => v.toString().padStart(2, '0')).join(':');
}

/** Displays a message to the user */
function showMessage(text, type) {
    messageBox.textContent = text;
    messageBox.className = 'text-center my-6 p-4 rounded-md shadow-lg';
    const typeClasses = { error: 'bg-red-100 text-red-700', success: 'bg-green-100 text-green-700', info: 'bg-blue-100 text-blue-700' };
    messageBox.classList.add(...(typeClasses[type] || typeClasses.info).split(' '));
}

/** Clears all results and messages */
function handleClearAll(keepInputs = false) {
    resultsSection.classList.add('hidden');
    messageBox.classList.add('hidden');
    videoListBody.innerHTML = '';
    ['longestVideo', 'shortestVideo', 'mostPopularVideo', 'mostLikedVideo', 'aiSummaryOutput', 'aiLearningPathOutput', 'aiFaqOutput'].forEach(id => document.getElementById(id).innerHTML = '');
    ['aiSummaryOutput', 'aiLearningPathOutput', 'aiFaqOutput', 'summaryLoader', 'learningPathLoader', 'faqLoader'].forEach(id => document.getElementById(id).classList.add('hidden'));
    document.getElementById('bingeResult').classList.add('hidden');
    document.getElementById('watchHours').value = '';
    document.getElementById('watchMinutes').value = '';
    if (lengthChartInstance) {
        lengthChartInstance.destroy();
        lengthChartInstance = null;
    }
    if (!keepInputs) {
        playlistUrlInput.value = '';
        apiKeyInput.value = '';
    }
}