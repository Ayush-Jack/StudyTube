// Mock data for StudyTube

export interface Channel {
  id: string;
  name: string;
  handle: string;
  avatar: string;
  subscribers: string;
  videoCount: number;
  domain: string[];
  verified: boolean;
  status: "active" | "syncing" | "disabled" | "error";
}

export interface Video {
  id: string;
  title: string;
  channelId: string;
  channelName: string;
  channelAvatar: string;
  thumbnail: string;
  duration: string;
  views: string;
  uploadedAt: string;
  domain: string;
  description: string;
  watchProgress?: number; // 0-100
}

export interface Domain {
  id: string;
  label: string;
  icon: string;
  description: string;
  videoCount: number;
  color: string;
}

// ─── Channels ────────────────────────────────────────────────────────────────

export const CHANNELS: Channel[] = [
  {
    id: "pw",
    name: "PhysicsWallah",
    handle: "@PhysicsWallah",
    avatar: "https://api.dicebear.com/7.x/initials/svg?seed=PW&backgroundColor=ff9800&fontFamily=Arial&fontSize=40",
    subscribers: "8.2M",
    videoCount: 3421,
    domain: ["Engineering", "JEE/NEET"],
    verified: true,
    status: "active",
  },
  {
    id: "cwh",
    name: "CodeWithHarry",
    handle: "@CodeWithHarry",
    avatar: "https://api.dicebear.com/7.x/initials/svg?seed=CWH&backgroundColor=4caf50&fontFamily=Arial&fontSize=40",
    subscribers: "4.2M",
    videoCount: 1234,
    domain: ["Programming"],
    verified: true,
    status: "active",
  },
  {
    id: "khan",
    name: "Khan Academy",
    handle: "@KhanAcademy",
    avatar: "https://api.dicebear.com/7.x/initials/svg?seed=KA&backgroundColor=3ea6ff&fontFamily=Arial&fontSize=40",
    subscribers: "9.1M",
    videoCount: 8742,
    domain: ["Mathematics", "Science"],
    verified: true,
    status: "active",
  },
  {
    id: "unacademy",
    name: "Unacademy",
    handle: "@UnacademyIndia",
    avatar: "https://api.dicebear.com/7.x/initials/svg?seed=UN&backgroundColor=9c27b0&fontFamily=Arial&fontSize=40",
    subscribers: "6.5M",
    videoCount: 5632,
    domain: ["UPSC", "Medical"],
    verified: true,
    status: "syncing",
  },
  {
    id: "biomastery",
    name: "BioMastery",
    handle: "@BioMasteryYT",
    avatar: "https://api.dicebear.com/7.x/initials/svg?seed=BM&backgroundColor=cc0000&fontFamily=Arial&fontSize=40",
    subscribers: "234K",
    videoCount: 234,
    domain: ["Medical"],
    verified: false,
    status: "disabled",
  },
  {
    id: "legaleagles",
    name: "LegalEagles",
    handle: "@LegalEaglesIndia",
    avatar: "https://api.dicebear.com/7.x/initials/svg?seed=LE&backgroundColor=607d8b&fontFamily=Arial&fontSize=40",
    subscribers: "89K",
    videoCount: 89,
    domain: ["Law"],
    verified: false,
    status: "error",
  },
];

// ─── Videos ──────────────────────────────────────────────────────────────────

export const VIDEOS: Video[] = [
  {
    id: "v1",
    title: "Complete Physics for JEE 2025 | Mechanics - Full Course",
    channelId: "pw",
    channelName: "PhysicsWallah",
    channelAvatar: "https://api.dicebear.com/7.x/initials/svg?seed=PW&backgroundColor=ff9800&fontFamily=Arial&fontSize=40",
    thumbnail: "https://picsum.photos/seed/physics1/640/360",
    duration: "45:23",
    views: "1.2M",
    uploadedAt: "2 days ago",
    domain: "Engineering",
    description: "Complete JEE 2025 Physics preparation covering Mechanics, Laws of Motion, and Work-Energy theorem with practice problems.",
  },
  {
    id: "v2",
    title: "Data Structures & Algorithms in Python - Complete Course 2025",
    channelId: "cwh",
    channelName: "CodeWithHarry",
    channelAvatar: "https://api.dicebear.com/7.x/initials/svg?seed=CWH&backgroundColor=4caf50&fontFamily=Arial&fontSize=40",
    thumbnail: "https://picsum.photos/seed/dsa1/640/360",
    duration: "6:32:10",
    views: "850K",
    uploadedAt: "1 week ago",
    domain: "Programming",
    description: "Complete DSA course covering Arrays, Linked Lists, Trees, Graphs, and Dynamic Programming with Python implementations.",
    watchProgress: 40,
  },
  {
    id: "v3",
    title: "UPSC CSE 2025 - Indian Polity Complete | Constitution of India",
    channelId: "unacademy",
    channelName: "Unacademy",
    channelAvatar: "https://api.dicebear.com/7.x/initials/svg?seed=UN&backgroundColor=9c27b0&fontFamily=Arial&fontSize=40",
    thumbnail: "https://picsum.photos/seed/upsc1/640/360",
    duration: "1:23:45",
    views: "420K",
    uploadedAt: "5 days ago",
    domain: "UPSC",
    description: "Complete Indian Polity lecture for UPSC CSE 2025 aspirants covering Constitution fundamentals.",
  },
  {
    id: "v4",
    title: "Organic Chemistry Reactions Explained | NEET & JEE",
    channelId: "khan",
    channelName: "Khan Academy",
    channelAvatar: "https://api.dicebear.com/7.x/initials/svg?seed=KA&backgroundColor=3ea6ff&fontFamily=Arial&fontSize=40",
    thumbnail: "https://picsum.photos/seed/chem1/640/360",
    duration: "38:12",
    views: "2.1M",
    uploadedAt: "1 month ago",
    domain: "Science",
    description: "Complete organic chemistry reactions for NEET and JEE — substitution, addition, elimination reactions with examples.",
  },
  {
    id: "v5",
    title: "Calculus Full Course for Beginners | Integration & Differentiation",
    channelId: "khan",
    channelName: "Khan Academy",
    channelAvatar: "https://api.dicebear.com/7.x/initials/svg?seed=KA&backgroundColor=3ea6ff&fontFamily=Arial&fontSize=40",
    thumbnail: "https://picsum.photos/seed/calc1/640/360",
    duration: "2:14:33",
    views: "900K",
    uploadedAt: "3 months ago",
    domain: "Mathematics",
    description: "Full calculus course from basics to advanced — limits, derivatives, integrals with visual explanations.",
    watchProgress: 65,
  },
  {
    id: "v6",
    title: "Human Anatomy - Complete MBBS Guide | 1st Year",
    channelId: "biomastery",
    channelName: "BioMastery",
    channelAvatar: "https://api.dicebear.com/7.x/initials/svg?seed=BM&backgroundColor=cc0000&fontFamily=Arial&fontSize=40",
    thumbnail: "https://picsum.photos/seed/anat1/640/360",
    duration: "55:19",
    views: "150K",
    uploadedAt: "1 week ago",
    domain: "Medical",
    description: "Complete human anatomy for MBBS 1st year — musculoskeletal system, organ systems with diagrams.",
  },
  {
    id: "v7",
    title: "Constitutional Law Basics - LLB Notes | Law Entrance",
    channelId: "legaleagles",
    channelName: "LegalEagles",
    channelAvatar: "https://api.dicebear.com/7.x/initials/svg?seed=LE&backgroundColor=607d8b&fontFamily=Arial&fontSize=40",
    thumbnail: "https://picsum.photos/seed/law1/640/360",
    duration: "41:07",
    views: "85K",
    uploadedAt: "4 days ago",
    domain: "Law",
    description: "Constitutional law fundamentals for LLB aspirants — fundamental rights, DPSP, constitutional amendments.",
  },
  {
    id: "v8",
    title: "Thermodynamics Engineering - GATE 2025 | Laws & Applications",
    channelId: "pw",
    channelName: "PhysicsWallah",
    channelAvatar: "https://api.dicebear.com/7.x/initials/svg?seed=PW&backgroundColor=ff9800&fontFamily=Arial&fontSize=40",
    thumbnail: "https://picsum.photos/seed/thermo1/640/360",
    duration: "1:08:44",
    views: "300K",
    uploadedAt: "2 weeks ago",
    domain: "Engineering",
    description: "GATE 2025 Thermodynamics — laws, heat engines, entropy with solved previous year questions.",
  },
  {
    id: "v9",
    title: "English Grammar Masterclass | All Tenses & Rules",
    channelId: "khan",
    channelName: "Khan Academy",
    channelAvatar: "https://api.dicebear.com/7.x/initials/svg?seed=KA&backgroundColor=3ea6ff&fontFamily=Arial&fontSize=40",
    thumbnail: "https://picsum.photos/seed/eng1/640/360",
    duration: "29:55",
    views: "670K",
    uploadedAt: "6 days ago",
    domain: "Science",
    description: "Complete English grammar with all tenses, active/passive voice, and sentence structure rules.",
  },
  {
    id: "v10",
    title: "Microeconomics Full Course | Commerce & Economics Honors",
    channelId: "unacademy",
    channelName: "Unacademy",
    channelAvatar: "https://api.dicebear.com/7.x/initials/svg?seed=UN&backgroundColor=9c27b0&fontFamily=Arial&fontSize=40",
    thumbnail: "https://picsum.photos/seed/eco1/640/360",
    duration: "1:44:22",
    views: "110K",
    uploadedAt: "1 month ago",
    domain: "Mathematics",
    description: "Complete microeconomics — demand, supply, market structures, consumer theory for Commerce students.",
  },
  {
    id: "v11",
    title: "Machine Learning for Beginners - Complete Python Course",
    channelId: "cwh",
    channelName: "CodeWithHarry",
    channelAvatar: "https://api.dicebear.com/7.x/initials/svg?seed=CWH&backgroundColor=4caf50&fontFamily=Arial&fontSize=40",
    thumbnail: "https://picsum.photos/seed/ml1/640/360",
    duration: "3:22:11",
    views: "1.5M",
    uploadedAt: "2 weeks ago",
    domain: "Programming",
    description: "Machine learning from scratch using Python — regression, classification, clustering, neural networks.",
  },
  {
    id: "v12",
    title: "NEET Biology - Cell Division Complete | Mitosis & Meiosis",
    channelId: "biomastery",
    channelName: "BioMastery",
    channelAvatar: "https://api.dicebear.com/7.x/initials/svg?seed=BM&backgroundColor=cc0000&fontFamily=Arial&fontSize=40",
    thumbnail: "https://picsum.photos/seed/bio1/640/360",
    duration: "52:34",
    views: "920K",
    uploadedAt: "3 days ago",
    domain: "Medical",
    description: "Complete cell division for NEET — mitosis, meiosis, cell cycle with high-yield MCQs.",
    watchProgress: 25,
  },
];

// ─── Domains ─────────────────────────────────────────────────────────────────

export const DOMAINS: Domain[] = [
  { id: "engineering", label: "Engineering", icon: "⚙️", description: "JEE, GATE, B.Tech subjects", videoCount: 1240, color: "#ff9800" },
  { id: "medical", label: "Medical", icon: "🏥", description: "NEET, MBBS, Nursing", videoCount: 890, color: "#f44336" },
  { id: "law", label: "Law", icon: "⚖️", description: "LLB, CLAT, Bar exams", videoCount: 320, color: "#9c27b0" },
  { id: "science", label: "Science", icon: "🔬", description: "Physics, Chemistry, Biology", videoCount: 2100, color: "#03a9f4" },
  { id: "mathematics", label: "Mathematics", icon: "📐", description: "Calculus, Algebra, Statistics", videoCount: 780, color: "#3ea6ff" },
  { id: "commerce", label: "Commerce", icon: "💼", description: "Economics, Accounts, Business", videoCount: 450, color: "#4caf50" },
  { id: "upsc", label: "UPSC", icon: "🏛️", description: "Civil Services preparation", videoCount: 1050, color: "#795548" },
  { id: "programming", label: "Programming", icon: "💻", description: "DSA, Web Dev, ML, AI", videoCount: 1890, color: "#607d8b" },
];

export const CATEGORY_CHIPS = ["All", "Engineering", "Medical", "Law", "Science", "Mathematics", "Commerce", "UPSC", "JEE/NEET", "Programming"];

// ─── Mock Auth User ───────────────────────────────────────────────────────────

export const MOCK_USER = {
  id: "user_1",
  name: "Ayush Srivastava",
  email: "ayush@studytube.in",
  avatar: "https://api.dicebear.com/7.x/initials/svg?seed=AS&backgroundColor=3ea6ff&fontFamily=Arial&fontSize=40",
  role: "admin" as "admin" | "user",
  domains: ["Engineering", "Programming", "Mathematics"],
  joinedAt: "Jan 2025",
};

// ─── Sync History (Admin) ─────────────────────────────────────────────────────

export const SYNC_HISTORY = [
  { channel: "PhysicsWallah", trigger: "auto", videosAdded: 42, duration: "1m 23s", status: "success", timestamp: "2 mins ago" },
  { channel: "CodeWithHarry", trigger: "auto", videosAdded: 18, duration: "45s", status: "success", timestamp: "5 mins ago" },
  { channel: "Khan Academy", trigger: "manual", videosAdded: 156, duration: "3m 12s", status: "success", timestamp: "1 hour ago" },
  { channel: "Unacademy", trigger: "auto", videosAdded: 0, duration: "—", status: "syncing", timestamp: "Syncing now..." },
  { channel: "LegalEagles", trigger: "auto", videosAdded: 0, duration: "30s", status: "error", timestamp: "2 days ago", error: "API quota exceeded. Retry in 24h." },
  { channel: "BioMastery", trigger: "disabled", videosAdded: 0, duration: "—", status: "skipped", timestamp: "3 days ago" },
];
