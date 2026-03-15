<body style="line-height:1.6; max-width:1000px; margin:auto;">

<h1 align="center">Aletheia</h1>

<p align="center">
Aletheia is a conversational AI platform designed for modern AI products.
It combines real-time chat, structured memory, and modular orchestration into a scalable developer-friendly system.
</p>

<p align="center">
  <img src="https://www.infralovers.com/images/posts/ai-for-devops-engineers/langchain_logo.png" height="45"/>
  <img src="https://miro.medium.com/1*b9wiAr_HG6ct7uYtCnf0xA.png" height="28"/>
  <img src="https://assets.vercel.com/image/upload/v1662130559/nextjs/Icon_light_background.png" height="45"/>
  <img src="https://fastapi.tiangolo.com/img/logo-margin/logo-teal.png" height="45"/>
  <img src="https://cdn.worldvectorlogo.com/logos/postgresql.svg" height="45"/>
  <img src="https://brandlogos.net/wp-content/uploads/2025/10/docker_mark-logo_brandlogos.net_yetav.png" height="45"/>
</p>



<h2>Memory System</h2>
<p>
Aletheia implements a structured conversational memory architecture inspired by modern research in persistent LLM systems.
</p>

<p>
Reference:<br/>
<a href="https://arxiv.org/pdf/2502.12110" target="_blank">
Persistent Memory for Conversational AI Systems
</a>
</p>

<ul>
<li>Context-aware memory retrieval</li>
<li>Long-term interaction persistence</li>
<li>Memory summarization pipelines</li>
<li>Graph-driven agent orchestration</li>
</ul>

<h2>Product Interface</h2>

<h3>Model Selection</h3>
<p align="center">
<img src="https://lh3.googleusercontent.com/d/1sfIfVvmuJ2UJuvEdxr1S4zRv62r96GFx=w1000?authuser=0" width="1000"/>
</p>

<h3>Personalization Controls</h3>
<p align="center">
<img src="https://lh3.googleusercontent.com/d/1i1J_b5U3qGiMl_jLAgay3xc7x4mESfOe=w1000?authuser=0" width="1000"/>
</p>

<h3>Conversational Interface</h3>
<p align="center">
<img src="https://lh3.googleusercontent.com/d/1pi-U99cqAePW2lhJbvrQFif9JvBlyXak=w1000?authuser=0" width="1000"/>
</p>

<h2> Architecture Overview</h2>

<h3>Frontend</h3>
<ul>
<li>Next.js</li>
<li>Component-driven UI system</li>
<li>NextAuth authentication</li>
</ul>

<h3>Backend</h3>
<ul>
<li>FastAPI service layer</li>
<li>LangGraph / LangChain orchestration</li>
<li>Groq inference integration</li>
</ul>

<h3>Infrastructure</h3>
<ul>
<li>PostgreSQL persistence (NeonDB)</li>
<li>Docker containerization</li>
<li>Compose-based local orchestration</li>
</ul>

<h2>Known Platform Constraint</h2>

<h3>NeonDB Free Tier Sleep</h3>
<p>The database may enter idle suspension.</p>

<p><strong>Impact:</strong></p>
<ul>
<li>First request latency</li>
<li>Temporary connection failure</li>
</ul>

<p><strong>Mitigation:</strong></p>
<ul>
<li>Warm-up query at startup</li>
<li>Retry logic in client</li>
</ul>

<h2>🛠️ Local Development</h2>

<h3>Client</h3>
<pre>
cd client
npm install
npm run dev
</pre>

<p>Environment:</p>
<pre>
GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=
NEXTAUTH_SECRET=
NEXT_PUBLIC_API_URL=
</pre>

<h3>Server</h3>
<pre>
uv venv .venv
./.venv/Scripts/activate
docker build -t server .
docker run -p 8080:8080 server
</pre>

<p>Environment:</p>
<pre>
GROQ_API_KEY=
DB_URL=
PINECONE_API_KEY=
VOYAGE_API_KEY=
</pre>

<pre>
docker compose up
</pre>

</body>
</html>