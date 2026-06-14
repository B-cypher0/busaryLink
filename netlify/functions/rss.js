// netlify/functions/rss.js
// Proxies RSS feeds server-side to avoid CORS issues
// Called from frontend as: /api/rss?feed=bursaries

const FEEDS = {
  bursaries: [
    'https://www.nsfas.org.za/content/news/rss.xml',
    'https://feeds.feedburner.com/SaBursaries',
  ],
  university: [
    'https://www.ukzn.ac.za/feed/',
    'https://www.uct.ac.za/rss.xml',
    'https://www.wits.ac.za/news/rss/',
  ],
  sport: [
    'https://www.supersport.com/rss/news',
    'https://www.sport24.co.za/rss/',
  ],
  career: [
    'https://www.careers24.com/rss/',
    'https://www.graduateplacements.co.za/feed',
  ],
  research: [
    'https://www.nrf.ac.za/feed/',
    'https://researchmatters.ac.za/feed/',
  ],
  technology: [
    'https://techcentral.co.za/feed',
    'https://mybroadband.co.za/news/feed',
  ],
};

// Fallback mock data when RSS feeds are unavailable
const MOCK_DATA = {
  bursaries: [
    { title: 'NSFAS Applications Open for 2025 Academic Year', link: 'https://www.nsfas.org.za', pubDate: new Date().toISOString(), description: 'NSFAS has opened applications for the 2025 academic year. Students from households earning below R350,000 per year are encouraged to apply early.', source: 'NSFAS' },
    { title: 'Eskom Bursary Programme — Engineering & IT', link: 'https://www.eskom.co.za', pubDate: new Date(Date.now() - 86400000).toISOString(), description: 'Eskom is offering bursaries for students in Engineering, IT and Finance. Minimum 65% average required.', source: 'Eskom' },
    { title: 'Sasol Bursary 2025 Applications Now Open', link: 'https://www.sasol.com', pubDate: new Date(Date.now() - 172800000).toISOString(), description: 'Sasol bursaries available for Chemical Engineering, Mechanical Engineering and Commerce students.', source: 'Sasol' },
    { title: 'Anglo American Zimele Bursary Programme', link: 'https://www.angloamerican.com', pubDate: new Date(Date.now() - 259200000).toISOString(), description: 'Anglo American is offering bursaries to students from mining communities pursuing engineering and sciences.', source: 'Anglo American' },
  ],
  university: [
    { title: 'UKZN Ranks Among Top African Universities 2024', link: 'https://www.ukzn.ac.za', pubDate: new Date().toISOString(), description: 'UKZN has maintained its position in the top 5 African universities according to the QS World University Rankings.', source: 'UKZN' },
    { title: 'New STEM Faculty Building Opens at DUT', link: 'https://www.dut.ac.za', pubDate: new Date(Date.now() - 86400000).toISOString(), description: 'Durban University of Technology officially opened its new R120 million STEM faculty building this week.', source: 'DUT' },
    { title: 'Wits University Research Breakthrough in Energy Storage', link: 'https://www.wits.ac.za', pubDate: new Date(Date.now() - 172800000).toISOString(), description: 'Wits researchers have developed a new battery technology using locally sourced materials that could revolutionise energy storage.', source: 'Wits' },
  ],
  sport: [
    { title: 'UKZN Rugby Team Advances to Varsity Cup Finals', link: '#', pubDate: new Date().toISOString(), description: 'UKZN Impi rugby team has beaten UCT 28–14 to advance to the Varsity Cup finals scheduled for next month.', source: 'Varsity Sports' },
    { title: 'SA Student Athletics Championships Results', link: '#', pubDate: new Date(Date.now() - 86400000).toISOString(), description: 'Results from the 2024 SA Student Athletics Championships held in Pretoria. UKZN took home 7 gold medals.', source: 'USSA' },
    { title: 'Cricket SA Announces University Development Programme', link: '#', pubDate: new Date(Date.now() - 172800000).toISOString(), description: 'Cricket SA has launched a new university cricket development programme targeting talented student athletes.', source: 'Cricket SA' },
  ],
  career: [
    { title: 'Top 10 In-Demand Careers in South Africa 2025', link: '#', pubDate: new Date().toISOString(), description: 'Data Science, Cybersecurity and Renewable Energy Engineering top the list of most in-demand careers for 2025 in South Africa.', source: 'Careers24' },
    { title: 'Graduate Programme Applications Open at Standard Bank', link: '#', pubDate: new Date(Date.now() - 86400000).toISOString(), description: 'Standard Bank is recruiting graduates across Engineering, Finance, IT and Data Science for their 2025 graduate programme.', source: 'Standard Bank' },
    { title: 'NTT DATA SA Graduate Intake 2025', link: '#', pubDate: new Date(Date.now() - 172800000).toISOString(), description: 'NTT DATA South Africa is accepting applications for their graduate intake focusing on AI, cloud infrastructure and cybersecurity.', source: 'NTT DATA' },
  ],
  research: [
    { title: 'NRF Funding R2bn in South African Research for 2025', link: 'https://www.nrf.ac.za', pubDate: new Date().toISOString(), description: 'The National Research Foundation has announced R2 billion in research funding available across all disciplines for 2025.', source: 'NRF' },
    { title: 'SA Scientists Develop Affordable Solar Tech for Rural Areas', link: '#', pubDate: new Date(Date.now() - 86400000).toISOString(), description: 'A team from the University of Cape Town has developed a low-cost solar panel solution suited for South African rural conditions.', source: 'UCT Research' },
    { title: 'UKZN Research into Coastal Climate Patterns Published', link: '#', pubDate: new Date(Date.now() - 172800000).toISOString(), description: 'UKZN researchers have published findings on shifting coastal climate patterns along the KwaZulu-Natal coastline.', source: 'UKZN Research' },
  ],
  technology: [
    { title: 'South Africa Launches Digital Skills Initiative for Youth', link: '#', pubDate: new Date().toISOString(), description: 'Government has partnered with Microsoft and Google to launch a digital skills programme targeting 500,000 young South Africans.', source: 'MyBroadband' },
    { title: 'Fibre Rollout Reaches 70% of SA Universities', link: '#', pubDate: new Date(Date.now() - 86400000).toISOString(), description: 'High-speed fibre internet has now reached 70% of South African university campuses, improving student connectivity.', source: 'TechCentral' },
    { title: 'SA Startups Raise Record R8bn in 2024', link: '#', pubDate: new Date(Date.now() - 172800000).toISOString(), description: 'South African technology startups raised a record R8 billion in venture capital funding during 2024, led by fintech and cleantech.', source: 'TechCentral' },
  ],
};

async function fetchRSS(url) {
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'BursaryLink/1.0' },
      signal: AbortSignal.timeout(4000),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const xml = await res.text();
    const items = [];
    const itemRegex = /<item>([\s\S]*?)<\/item>/g;
    let match;
    while ((match = itemRegex.exec(xml)) !== null) {
      const block = match[1];
      const get = (tag) => {
        const m = block.match(new RegExp(`<${tag}[^>]*>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/${tag}>`, 'i'));
        return m ? m[1].trim() : '';
      };
      items.push({
        title: get('title'),
        link: get('link'),
        pubDate: get('pubDate') || new Date().toISOString(),
        description: get('description').replace(/<[^>]+>/g, '').substring(0, 200),
        source: new URL(url).hostname,
      });
    }
    return items.slice(0, 5);
  } catch {
    return [];
  }
}

exports.handler = async (event) => {
  const category = event.queryStringParameters?.feed || 'bursaries';
  const urls = FEEDS[category] || FEEDS.bursaries;

  const results = await Promise.all(urls.map(fetchRSS));
  let items = results.flat().sort((a, b) => new Date(b.pubDate) - new Date(a.pubDate));

  // Fall back to mock data if no real items fetched
  if (items.length === 0) {
    items = MOCK_DATA[category] || MOCK_DATA.bursaries;
  }

  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': 'public, max-age=900', // 15 min cache
    },
    body: JSON.stringify(items.slice(0, 12)),
  };
};
