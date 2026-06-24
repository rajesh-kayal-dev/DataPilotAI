import "dotenv/config";
import { z } from "zod";

// ---------------------------------------------------------------------------
// Schema
// ---------------------------------------------------------------------------

const envSchema = z.object({
  // Runtime
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),
  PORT: z.string().default("5000"),
  FRONTEND_URL: z.string().default("http://localhost:5173"),

  // Auth
  JWT_SECRET: z.string().min(1),
  JWT_EXPIRES_IN: z.string().default("7d"),
  GOOGLE_CLIENT_ID: z.string().optional(),

  // Database
  MONGODB_URI: z.string().min(1),
  REDIS_URL: z.string().optional(),

  // Upstash
  UPSTASH_REDIS_REST_URL: z.string().optional(),
  UPSTASH_REDIS_REST_TOKEN: z.string().optional(),

  // Qdrant
  QDRANT_URL: z.string().min(1),
  QDRANT_API_KEY: z.string().optional(),
  QDRANT_COLLECTION: z.string().default("documents"),

  // AWS / S3
  AWS_REGION: z.string().min(1),
  AWS_ACCESS_KEY_ID: z.string().min(1),
  AWS_SECRET_ACCESS_KEY: z.string().min(1),
  AWS_BUCKET: z.string().min(1),

  // LLM — Primary (required)
  GROQ_API_KEY: z.string().min(1),
  GROQ_BASE_URL: z.string().default("https://api.groq.com/openai/v1"),

  // LLM — Optional providers
  PRIMARY_LLM_PROVIDER: z
    .enum(["groq", "openrouter", "gemini"])
    .default("groq"),
  OPENROUTER_API_KEY: z.string().optional(),
  OPENROUTER_BASE_URL: z.string().default("https://openrouter.ai/api/v1"),
  GEMINI_API_KEY: z.string().optional(),
  GEMINI_BASE_URL: z
    .string()
    .default("https://generativelanguage.googleapis.com"),
  FREEMODEL_API_KEY: z.string().optional(),
  FREEMODEL_BASE_URL: z.string().default("https://cc.freemodel.dev"),

  // LLM tuning
  LLM_TIMEOUT: z.string().default("20000"),
  MAX_RETRIES: z.string().default("3"),
  MAX_TOKENS: z.string().default("500"),
  TEMPERATURE: z.string().default("0.1"),
  TOP_P: z.string().default("0.2"),

  // Embeddings
  JINA_API_KEY: z.string().min(1),

  // Web search
  TAVILY_API_KEY: z.string().optional(),

  // Payment
  RAZORPAY_KEY_ID: z.string().optional(),
  RAZORPAY_KEY_SECRET: z.string().optional(),

  // Email
  EMAIL_USER: z.string().optional(),
  EMAIL_PASS: z.string().optional(),

  // LangSmith observability
  // LANGCHAIN_* env vars are the standard names LangChain reads automatically.
  LANGSMITH_API_KEY: z.string().optional(),
  LANGCHAIN_PROJECT: z.string().default("DataPilotAI"),
  LANGCHAIN_TRACING_V2: z.string().default("false"),
  LANGCHAIN_ENDPOINT: z.string().default("https://api.smith.langchain.com"),

  // RAG tuning
  RAG_MODE: z.string().default("strict"),
  RAG_THRESHOLD: z.string().default("0.5"),
  RAG_ALIGNMENT_THRESHOLD: z.string().default("0.35"),
  RAG_TOP_K: z.string().default("5"),

  // Rate limiting
  RATE_LIMIT_WINDOW: z.string().default("60"),
  RATE_LIMIT_MAX: z.string().default("30"),
  DAILY_QUOTA: z.string().default("200"),
});

// ---------------------------------------------------------------------------
// Validation — fail fast on missing required vars
// ---------------------------------------------------------------------------

let _env: z.infer<typeof envSchema>;

try {
  _env = envSchema.parse(process.env);
} catch (err) {
  if (err instanceof z.ZodError) {
    const missing = err.errors
      .map((e) => `  ${e.path.join(".")}: ${e.message}`)
      .join("\n");
    console.error("[env] ❌ Environment validation failed:\n" + missing);
    console.error(
      "[env] Ensure all required variables are set in your .env file.\n" +
        "      Required: JWT_SECRET, MONGODB_URI, GROQ_API_KEY, JINA_API_KEY, " +
        "AWS_REGION, AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_BUCKET, QDRANT_URL",
    );
  } else {
    console.error("[env] ❌ Unexpected error during env validation:", err);
  }
  process.exit(1);
}

/** Raw validated environment variables — use `config` for structured access. */
export const env = _env;

// ---------------------------------------------------------------------------
// Structured config — single source of truth for the entire server
// ---------------------------------------------------------------------------

export const config = {
  env: env.NODE_ENV,

  server: {
    port: env.PORT,
    frontendUrl: env.FRONTEND_URL,
  },

  auth: {
    jwtSecret: env.JWT_SECRET,
    jwtExpires: env.JWT_EXPIRES_IN,
    googleClientId: env.GOOGLE_CLIENT_ID,
  },

  db: {
    mongoUri: env.MONGODB_URI,
    redisUrl: env.REDIS_URL,
  },

  upstash: {
    url: env.UPSTASH_REDIS_REST_URL,
    token: env.UPSTASH_REDIS_REST_TOKEN,
  },

  qdrant: {
    url: env.QDRANT_URL,
    apiKey: env.QDRANT_API_KEY,
    collection: env.QDRANT_COLLECTION,
  },

  s3: {
    region: env.AWS_REGION,
    accessKeyId: env.AWS_ACCESS_KEY_ID,
    secretAccessKey: env.AWS_SECRET_ACCESS_KEY,
    bucket: env.AWS_BUCKET,
  },

  llm: {
    primaryProvider: env.PRIMARY_LLM_PROVIDER,
    timeout: parseInt(env.LLM_TIMEOUT, 10),
    retries: parseInt(env.MAX_RETRIES, 10),
    maxTokens: parseInt(env.MAX_TOKENS, 10),
    temperature: parseFloat(env.TEMPERATURE),
    topP: parseFloat(env.TOP_P),
  },

  groq: {
    apiKey: env.GROQ_API_KEY,
    baseUrl: env.GROQ_BASE_URL,
  },

  openrouter: {
    apiKey: env.OPENROUTER_API_KEY,
    baseUrl: env.OPENROUTER_BASE_URL,
  },

  gemini: {
    apiKey: env.GEMINI_API_KEY,
    baseUrl: env.GEMINI_BASE_URL,
  },

  freemodel: {
    apiKey: env.FREEMODEL_API_KEY,
    baseUrl: env.FREEMODEL_BASE_URL,
  },

  jina: {
    apiKey: env.JINA_API_KEY,
  },

  tavily: {
    apiKey: env.TAVILY_API_KEY,
  },

  payment: {
    razorpayKeyId: env.RAZORPAY_KEY_ID,
    razorpayKeySecret: env.RAZORPAY_KEY_SECRET,
  },

  email: {
    service: "gmail",
    user: env.EMAIL_USER,
    pass: env.EMAIL_PASS,
  },

  langsmith: {
    apiKey: env.LANGSMITH_API_KEY,
    project: env.LANGCHAIN_PROJECT,
    tracingEnabled: env.LANGCHAIN_TRACING_V2 === "true",
    endpoint: env.LANGCHAIN_ENDPOINT,
  },

  rag: {
    mode: env.RAG_MODE,
    threshold: parseFloat(env.RAG_THRESHOLD),
    alignment: parseFloat(env.RAG_ALIGNMENT_THRESHOLD),
    topK: parseInt(env.RAG_TOP_K, 10),
    minChars: 150 as const,
  },

  limits: {
    rateWindow: parseInt(env.RATE_LIMIT_WINDOW, 10),
    rateMax: parseInt(env.RATE_LIMIT_MAX, 10),
    dailyQuota: parseInt(env.DAILY_QUOTA, 10),
  },
} as const;

export type AppConfig = typeof config;
export type Config = typeof config;
