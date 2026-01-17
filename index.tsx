
import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { GoogleGenAI, Type } from "@google/genai";
import { 
  Youtube, 
  Code2, 
  Cpu, 
  Layers, 
  Image as ImageIcon, 
  PlayCircle, 
  Terminal, 
  Sparkles,
  Loader2,
  Video,
  Download,
  Music,
  Volume2,
  Mic2,
  AlertCircle,
  Key,
  Settings,
  MonitorPlay
} from 'lucide-react';

// --- Type Definitions for AI Studio Window Helpers ---
declare global {
  interface AIStudio {
    hasSelectedApiKey: () => Promise<boolean>;
    openSelectKey: () => Promise<void>;
  }
  interface Window {
    aistudio?: AIStudio;
  }
}

// --- Components ---

const Header = ({ onSwitchKey }: { onSwitchKey: () => void }) => (
  <header className="border-b border-white/10 bg-slate-950/50 backdrop-blur-md sticky top-0 z-50">
    <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
      <div className="flex items-center gap-2">
        <div className="bg-orange-500 p-1.5 rounded-lg shadow-lg shadow-orange-500/20">
          <Youtube className="text-white w-6 h-6" />
        </div>
        <span className="font-bold text-xl tracking-tight text-white">Java<span className="text-orange-500">Stream</span> Studio</span>
      </div>
      <div className="flex items-center gap-4">
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-400 mr-4">
          <a href="#" className="hover:text-white transition-colors">Dashboard</a>
          <a href="#" className="hover:text-white transition-colors">Growth</a>
        </nav>
        <button 
          onClick={onSwitchKey}
          className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-white/10 hover:border-orange-500/50 hover:bg-orange-500/5 text-xs font-semibold text-slate-300 transition-all active:scale-95"
          title="Change API Key (use this if you hit quota limits or permission denied)"
        >
          <Key className="w-3.5 h-3.5 text-orange-400" />
          Switch Key
        </button>
      </div>
    </div>
  </header>
);

const CodeBlock = ({ code, language = 'java' }: { code: string, language?: string }) => (
  <div className="relative group rounded-xl overflow-hidden bg-slate-900 border border-white/10 my-4 shadow-inner">
    <div className="flex items-center justify-between px-4 py-2 bg-slate-800/50 border-b border-white/5">
      <div className="flex gap-1.5">
        <div className="w-3 h-3 rounded-full bg-red-500/50" />
        <div className="w-3 h-3 rounded-full bg-yellow-500/50" />
        <div className="w-3 h-3 rounded-full bg-green-500/50" />
      </div>
      <span className="text-xs text-slate-500 font-mono uppercase tracking-widest">{language}</span>
    </div>
    <pre className="p-4 overflow-x-auto">
      <code className="text-sm text-slate-300 font-mono leading-relaxed">
        {code}
      </code>
    </pre>
  </div>
);

function App() {
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [blueprint, setBlueprint] = useState<any>(null);
  const [thumbnail, setThumbnail] = useState<string | null>(null);
  const [thumbnailLoading, setThumbnailLoading] = useState(false);
  
  // Video Generation States
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [videoLoading, setVideoLoading] = useState(false);
  const [videoStatus, setVideoStatus] = useState<string>('');

  const switchApiKey = async () => {
    try {
      await window.aistudio?.openSelectKey();
    } catch (e) {
      console.error("Failed to open key selection dialog", e);
    }
  };

  const generateBlueprint = async () => {
    if (!input.trim()) return;
    setLoading(true);
    setVideoUrl(null);
    setThumbnail(null);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const prompt = `
        Act as a world-class Java technical content creator. 
        Transform the following Java content into an advanced, high-production-value YouTube video blueprint.
        
        Content: "${input}"

        Focus on:
        1. JVM internals and low-level mechanics.
        2. Modern Java features (Records, Sealed Types, Scoped Values, Virtual Threads).
        3. Design patterns and clean code architecture.

        Return a JSON object with:
        - title: Catchy YouTube title.
        - hook: A compelling 15-second intro hook.
        - deepDive: An advanced technical explanation.
        - script: An array of objects [{timestamp: string, talk: string, visual: string}].
        - visualizationIdea: Description of a complex animation.
        - javaCode: A robust, advanced code snippet.
        - audioAtmosphere: { intro: string, background: string, sfx: string, outro: string }
      `;

      const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              hook: { type: Type.STRING },
              deepDive: { type: Type.STRING },
              script: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    timestamp: { type: Type.STRING },
                    talk: { type: Type.STRING },
                    visual: { type: Type.STRING }
                  },
                  required: ["timestamp", "talk", "visual"]
                }
              },
              visualizationIdea: { type: Type.STRING },
              javaCode: { type: Type.STRING },
              audioAtmosphere: {
                type: Type.OBJECT,
                properties: {
                  intro: { type: Type.STRING },
                  background: { type: Type.STRING },
                  sfx: { type: Type.STRING },
                  outro: { type: Type.STRING }
                },
                required: ["intro", "background", "sfx", "outro"]
              }
            },
            required: ["title", "hook", "deepDive", "script", "visualizationIdea", "javaCode", "audioAtmosphere"]
          }
        }
      });

      const data = JSON.parse(response.text || '{}');
      setBlueprint(data);
    } catch (error) {
      console.error("Blueprint generation failed:", error);
    } finally {
      setLoading(false);
    }
  };

  const generateThumbnail = async () => {
    if (!blueprint?.title) return;

    const hasKey = await window.aistudio?.hasSelectedApiKey();
    if (!hasKey) {
      await window.aistudio?.openSelectKey();
    }

    setThumbnailLoading(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-3-pro-image-preview',
        contents: {
          parts: [{ text: `A professional high-quality YouTube thumbnail for a Java programming video titled "${blueprint.title}". Visual style: Modern, high-contrast, dark mode, with glowing Java logo, abstract digital network, 4k resolution, cinematic lighting, coding aesthetic.` }]
        },
        config: {
          imageConfig: { 
            aspectRatio: "16:9",
            imageSize: "4K"
          }
        }
      });

      if (response.candidates?.[0]?.content?.parts) {
        for (const part of response.candidates[0].content.parts) {
          if (part.inlineData) {
            setThumbnail(`data:image/png;base64,${part.inlineData.data}`);
          }
        }
      }
    } catch (error: any) {
      console.error("Thumbnail generation failed:", error);
      const errStr = JSON.stringify(error);
      if (errStr.includes("Requested entity was not found") || errStr.includes("PERMISSION_DENIED") || errStr.includes("403")) {
        await window.aistudio?.openSelectKey();
      }
    } finally {
      setThumbnailLoading(false);
    }
  };

  const generateVideo = async () => {
    if (!blueprint?.hook) return;
    
    const hasKey = await window.aistudio?.hasSelectedApiKey();
    if (!hasKey) {
      await window.aistudio?.openSelectKey();
    }

    setVideoLoading(true);
    setVideoStatus('Initializing Cinematic Engine...');
    setVideoUrl(null);
    
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const videoPrompt = `Cinematic, ultra-high quality intro for a Java tutorial titled "${blueprint.title}". Visuals: A dark tech environment with floating glowing code, digital circuits, 4k textures, professional lighting. Action: ${blueprint.hook}`;
      
      let operation = await ai.models.generateVideos({
        model: 'veo-3.1-fast-generate-preview',
        prompt: videoPrompt,
        config: {
          numberOfVideos: 1,
          resolution: '720p',
          aspectRatio: '16:9'
        }
      });

      setVideoStatus('Processing neural frames (usually takes 1-3 mins)...');
      
      while (!operation.done) {
        await new Promise(resolve => setTimeout(resolve, 10000));
        setVideoStatus('Compiling video and applying global illumination...');
        const pollAi = new GoogleGenAI({ apiKey: process.env.API_KEY });
        operation = await pollAi.operations.getVideosOperation({ operation: operation });
      }

      const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
      if (downloadLink) {
        setVideoUrl(`${downloadLink}&key=${process.env.API_KEY}`);
      }
    } catch (error: any) {
      console.error("Video generation failed:", error);
      const errStr = JSON.stringify(error);
      if (errStr.includes("Requested entity was not found") || errStr.includes("PERMISSION_DENIED") || errStr.includes("403")) {
        setVideoStatus("Access Denied or Quota Exceeded. Please select a valid paid API key.");
        await window.aistudio?.openSelectKey();
      } else {
        setVideoStatus("Generation failed. Check project billing and quota.");
      }
    } finally {
      setVideoLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 font-sans selection:bg-orange-500/30">
      <Header onSwitchKey={switchApiKey} />

      <main className="max-w-7xl mx-auto px-4 py-8">
        <section className="mb-12">
          <div className="max-w-3xl mx-auto text-center mb-10">
            <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-4 tracking-tight leading-tight">
              Craft Your Next <span className="text-orange-500 underline decoration-orange-500/20 underline-offset-8">Java Masterpiece</span>
            </h1>
            <p className="text-slate-400 text-lg">
              Transform your raw code into viral high-production Java programming content.
            </p>
          </div>

          <div className="bg-slate-900/50 border border-white/10 rounded-2xl p-6 shadow-2xl backdrop-blur-sm group hover:border-white/20 transition-all">
            <textarea
              className="w-full bg-slate-950/50 border border-white/10 rounded-xl p-5 text-slate-200 focus:ring-2 focus:ring-orange-500 focus:outline-none min-h-[160px] mb-4 transition-all placeholder:text-slate-600 font-mono text-sm"
              placeholder="Paste Java concept or code snippet here... (e.g. Garbage Collection mechanisms or Modern Records)"
              value={input}
              onChange={(e) => setInput(e.target.value)}
            />
            <div className="flex flex-col sm:flex-row gap-4 justify-between items-center">
              <div className="flex gap-2 text-[10px] text-slate-500 font-bold tracking-widest uppercase">
                <span className="px-2 py-1 bg-slate-800 rounded border border-white/5">Architecture</span>
                <span className="px-2 py-1 bg-slate-800 rounded border border-white/5">Production</span>
                <span className="px-2 py-1 bg-slate-800 rounded border border-white/5">SEO</span>
              </div>
              <button
                onClick={generateBlueprint}
                disabled={loading || !input.trim()}
                className="w-full sm:w-auto bg-orange-600 hover:bg-orange-500 disabled:bg-slate-800 text-white font-bold py-3.5 px-10 rounded-xl flex items-center justify-center gap-3 transition-all shadow-lg shadow-orange-900/20 active:scale-95 group"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5 group-hover:rotate-12 transition-transform" />}
                Generate Studio Blueprint
              </button>
            </div>
          </div>
        </section>

        {blueprint && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-in fade-in slide-in-from-bottom-8 duration-700">
            <div className="lg:col-span-2 space-y-8">
              {/* Production Hub */}
              <div className="bg-slate-900 border border-white/10 rounded-3xl overflow-hidden shadow-2xl">
                <div className="p-8 border-b border-white/5 bg-slate-800/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-orange-500/10 rounded-lg">
                      <MonitorPlay className="text-orange-500 w-6 h-6" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-white">{blueprint.title}</h2>
                      <p className="text-xs text-slate-500 font-medium">Production Script & Visual Workflow</p>
                    </div>
                  </div>
                  <button
                    onClick={generateVideo}
                    disabled={videoLoading}
                    className="flex items-center gap-2 px-6 py-2.5 bg-orange-600 hover:bg-orange-500 disabled:bg-slate-800 rounded-xl text-sm font-bold text-white transition-all shadow-xl active:scale-95 whitespace-nowrap"
                  >
                    {videoLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Video className="w-4 h-4" />}
                    {videoUrl ? 'Re-generate Hook Video' : 'Generate Cinematic Hook'}
                  </button>
                </div>
                
                <div className="p-8 space-y-8">
                  {/* Generated Video Section */}
                  {(videoLoading || videoUrl) && (
                    <div className="bg-slate-950 rounded-2xl overflow-hidden border border-white/10 shadow-inner group relative">
                      {videoLoading ? (
                        <div className="aspect-video flex flex-col items-center justify-center p-12 text-center space-y-6">
                          <div className="relative">
                            <Video className="w-20 h-20 text-orange-500/10 animate-pulse" />
                            <div className="absolute inset-0 flex items-center justify-center">
                              <Loader2 className="w-10 h-10 text-orange-500 animate-spin" />
                            </div>
                          </div>
                          <div className="space-y-2">
                            <p className="font-bold text-xl text-white">Directing AI Cinematic Clip</p>
                            <p className="text-sm text-slate-500 font-mono uppercase tracking-tighter animate-pulse">{videoStatus}</p>
                          </div>
                        </div>
                      ) : (
                        <div className="relative">
                          <video 
                            src={videoUrl!} 
                            controls 
                            autoPlay
                            muted
                            className="w-full aspect-video rounded-lg shadow-2xl border border-white/5"
                            poster={thumbnail || undefined}
                          />
                          <div className="absolute top-4 right-4 flex gap-2">
                            <a 
                              href={videoUrl!} 
                              download={`${blueprint.title}.mp4`}
                              className="flex items-center gap-2 px-5 py-2.5 bg-slate-900/90 backdrop-blur-xl border border-white/20 rounded-xl text-xs font-bold text-white transition-all hover:bg-orange-600 hover:border-orange-500 shadow-2xl"
                            >
                              <Download className="w-4 h-4" /> Download Cinematic MP4
                            </a>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {!videoLoading && !videoUrl && (
                    <div className="p-6 bg-orange-500/5 border border-orange-500/20 rounded-2xl relative overflow-hidden group">
                      <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:rotate-12 transition-transform">
                        <Sparkles className="w-12 h-12 text-orange-400" />
                      </div>
                      <h3 className="text-xs uppercase font-bold text-orange-400 mb-3 flex items-center gap-2 tracking-widest">
                        <Sparkles className="w-3.5 h-3.5" /> 15s Viral Hook
                      </h3>
                      <p className="text-slate-200 italic text-lg leading-relaxed font-serif">"{blueprint.hook}"</p>
                    </div>
                  )}

                  <div>
                    <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                      <Layers className="w-5 h-5 text-blue-400" /> Advanced Engineering Deep-Dive
                    </h3>
                    <p className="text-slate-400 leading-relaxed mb-6 bg-slate-800/20 p-4 rounded-xl border border-white/5">{blueprint.deepDive}</p>
                    <CodeBlock code={blueprint.javaCode} />
                  </div>

                  <div>
                    <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                      <Video className="w-5 h-5 text-purple-400" /> Production Script
                    </h3>
                    <div className="grid gap-4">
                      {blueprint.script.map((segment: any, idx: number) => (
                        <div key={idx} className="flex gap-6 p-6 bg-slate-800/20 rounded-2xl border border-white/5 hover:border-white/10 transition-colors group">
                          <div className="text-orange-500 font-mono text-xs font-bold pt-1 bg-orange-500/5 px-2 rounded h-fit">{segment.timestamp}</div>
                          <div className="flex-1">
                            <p className="text-sm font-medium text-slate-200 mb-3 italic leading-relaxed">"{segment.talk}"</p>
                            <div className="flex items-center gap-3 p-2 bg-slate-950/50 rounded-lg border border-white/5">
                              <ImageIcon className="w-4 h-4 text-slate-500" />
                              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{segment.visual}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-8">
              {/* Thumbnail Design */}
              <div className="bg-slate-900 border border-white/10 rounded-3xl overflow-hidden shadow-2xl group">
                <div className="p-6 border-b border-white/5 bg-slate-800/20 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <ImageIcon className="text-emerald-500 w-5 h-5" />
                    <h2 className="text-lg font-bold text-white">4K Thumbnail</h2>
                  </div>
                  <button 
                    onClick={generateThumbnail}
                    disabled={thumbnailLoading}
                    className="p-2 hover:bg-slate-800 rounded-lg transition-all text-slate-400 hover:text-white"
                  >
                    {thumbnailLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5 group-hover:scale-110" />}
                  </button>
                </div>
                <div className="p-6">
                  {thumbnail ? (
                    <div className="space-y-4">
                      <div className="relative group/thumb overflow-hidden rounded-xl border border-white/10 aspect-video bg-slate-950">
                        <img src={thumbnail} className="w-full h-full object-cover transition-transform duration-700 group-hover/thumb:scale-110" alt="Thumbnail Preview" />
                      </div>
                      <a href={thumbnail} download={`${blueprint.title}_thumb.png`} className="w-full flex items-center justify-center gap-2 py-3 bg-slate-800 hover:bg-slate-700 rounded-xl text-xs font-bold text-white transition-all">
                        <Download className="w-4 h-4" /> Download 4K Thumbnail
                      </a>
                    </div>
                  ) : (
                    <div className="aspect-video bg-slate-950 border-2 border-dashed border-white/5 rounded-2xl flex flex-col items-center justify-center text-slate-600 gap-3">
                      <ImageIcon className="w-10 h-10 opacity-10" />
                      <p className="text-[10px] uppercase font-bold tracking-widest">Awaiting Generator</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Audio Atmosphere */}
              <div className="bg-slate-900 border border-white/10 rounded-3xl overflow-hidden shadow-2xl">
                <div className="p-6 border-b border-white/5 bg-slate-800/20 flex items-center gap-3">
                  <Music className="text-orange-500 w-5 h-5" />
                  <h2 className="text-lg font-bold text-white">Audio Guide</h2>
                </div>
                <div className="p-6 space-y-5">
                  {[
                    { icon: PlayCircle, label: 'Intro Theme', val: blueprint.audioAtmosphere.intro, color: 'text-orange-400' },
                    { icon: Volume2, label: 'Background', val: blueprint.audioAtmosphere.background, color: 'text-blue-400' },
                    { icon: Sparkles, label: 'Sound FX', val: blueprint.audioAtmosphere.sfx, color: 'text-purple-400' },
                    { icon: Mic2, label: 'Outro Hook', val: blueprint.audioAtmosphere.outro, color: 'text-emerald-400' }
                  ].map((item, i) => (
                    <div key={i} className="flex gap-4 p-3 bg-slate-950/40 rounded-xl border border-white/5">
                      <div className="mt-0.5"><item.icon className={`w-4 h-4 ${item.color}`} /></div>
                      <div>
                        <span className="text-[10px] uppercase font-extrabold text-slate-500 tracking-tighter">{item.label}</span>
                        <p className="text-xs text-slate-300 leading-relaxed font-medium mt-1">{item.val}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Visual Idea */}
              <div className="bg-slate-900 border border-white/10 rounded-3xl overflow-hidden shadow-2xl">
                <div className="p-6 border-b border-white/5 bg-slate-800/20 flex items-center gap-3">
                  <Cpu className="text-pink-500 w-5 h-5" />
                  <h2 className="text-lg font-bold text-white">VFX Concept</h2>
                </div>
                <div className="p-6">
                  <div className="bg-slate-950 rounded-2xl p-5 border border-white/5 shadow-inner">
                    <p className="text-xs text-slate-400 leading-relaxed font-medium italic">
                      {blueprint.visualizationIdea}
                    </p>
                  </div>
                </div>
              </div>
              
              {/* Billing Alert */}
              <div className="bg-blue-600/5 border border-blue-500/20 rounded-2xl p-5 flex gap-4">
                <div className="p-2 bg-blue-500/10 rounded-lg h-fit">
                  <Settings className="w-5 h-5 text-blue-500" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-blue-400 mb-1 uppercase tracking-wider">Quota Management</h4>
                  <p className="text-[10px] text-slate-500 leading-normal">
                    If you hit quota limits or 403 errors, use the <strong>Switch Key</strong> button to select a project with active billing for video generation.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {!blueprint && !loading && (
          <div className="mt-20 flex flex-col items-center justify-center opacity-10 select-none grayscale py-20">
            <div className="relative">
              <Code2 className="w-32 h-32 mb-6" />
              <div className="absolute inset-0 flex items-center justify-center">
                <Terminal className="w-12 h-12 text-white/50" />
              </div>
            </div>
            <p className="text-2xl font-bold tracking-tighter uppercase italic">Awaiting Java Logic...</p>
          </div>
        )}
      </main>

      <footer className="mt-20 py-12 border-t border-white/5 text-center bg-slate-950/80">
        <div className="max-w-7xl mx-auto px-4">
          <p className="text-slate-500 text-sm font-medium">
            Developed for High-Performance Tech Creators. Powered by Gemini 3 & Veo.
          </p>
          <div className="mt-4 flex justify-center gap-6 text-slate-600">
            <div className="flex items-center gap-2"><Cpu className="w-3 h-3" /> JVM Engine</div>
            <div className="flex items-center gap-2"><Video className="w-3 h-3" /> 4K Production</div>
          </div>
        </div>
      </footer>
    </div>
  );
}

const container = document.getElementById('root');
if (container) {
  const root = createRoot(container);
  root.render(<App />);
}
