"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Download, Loader2, Image as ImageIcon, CheckCircle, AlertCircle, FileArchive, Code, Globe, ExternalLink, Star, X } from "lucide-react";
import JSZip from "jszip";
import { saveAs } from "file-saver";
import Image from "next/image";

type GeneratedImage = {
  word: string;
  url: string;
  error?: string;
};

export default function Home() {
  const [inputText, setInputText] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [results, setResults] = useState<GeneratedImage[]>([]);
  const [isDownloading, setIsDownloading] = useState(false);
  const [showFormatNotice, setShowFormatNotice] = useState(false);
  const [showStarPopup, setShowStarPopup] = useState(false);
  
  useEffect(() => {
    // 50% chance to show the popup after 12 seconds
    const timer = setTimeout(() => {
      if (Math.random() > 0.5) {
        setShowStarPopup(true);
      }
    }, 12000);
    return () => clearTimeout(timer);
  }, []);

  const handleGenerate = async () => {
    // If text contains spaces (a paragraph), format it and prevent generation until reviewed
    if (inputText.includes(" ")) {
      const formatted = inputText
        .split(/\s+/)
        .filter((w) => w.trim().length > 0)
        .join("\n");
        
      if (formatted !== inputText.trim()) {
        setInputText(formatted);
        setShowFormatNotice(true);
        setTimeout(() => setShowFormatNotice(false), 4000);
        return; // Intercept and stop generation
      }
    }

    const words = inputText
      .split("\n")
      .map((w) => w.trim())
      .filter((w) => w.length > 0);

    if (words.length === 0) return;

    setIsGenerating(true);
    setResults([]);

    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ words }),
      });

      const data = await response.json();
      if (data.results) {
        setResults(data.results);
      } else {
        alert(data.error || "Failed to generate images");
      }
    } catch (error) {
      alert("An unexpected error occurred.");
    } finally {
      setIsGenerating(false);
    }
  };

  const downloadImage = async (url: string, filename: string) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      saveAs(blob, filename);
    } catch (err) {
      alert("Failed to download image.");
    }
  };

  const downloadAllAsZip = async () => {
    const validResults = results.filter((r) => r.url && !r.error);
    if (validResults.length === 0) return;

    setIsDownloading(true);
    try {
      const zip = new JSZip();
      
      const imagePromises = validResults.map(async (result) => {
        const response = await fetch(result.url);
        const blob = await response.blob();
        zip.file(`${result.word}.png`, blob);
      });

      await Promise.all(imagePromises);

      const zipBlob = await zip.generateAsync({ type: "blob" });
      saveAs(zipBlob, "landsat-names.zip");
    } catch (err) {
      alert("Failed to create ZIP file.");
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-50 font-sans selection:bg-zinc-800">
      <main className="max-w-5xl mx-auto px-6 py-20 flex flex-col items-center">
        
        {/* Header section */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center justify-center p-3 mb-6 rounded-2xl bg-zinc-900 border border-zinc-800">
            <ImageIcon className="w-8 h-8 text-zinc-400" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4 text-transparent bg-clip-text bg-gradient-to-br from-white to-zinc-500">
            Landsat Generator
          </h1>
          <p className="text-zinc-400 text-lg max-w-lg mx-auto">
            Generate stunning satellite collages from your words. Powered by NASA Landsat imagery.
          </p>
        </motion.div>

        {/* Input section */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="w-full max-w-2xl bg-zinc-900/50 backdrop-blur-xl border border-zinc-800 rounded-3xl p-6 shadow-2xl relative"
        >
          {/* Format Notification Toast */}
          <AnimatePresence>
            {showFormatNotice && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="absolute -top-12 left-1/2 -translate-x-1/2 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-4 py-2 rounded-full text-sm font-medium flex items-center gap-2"
              >
                <CheckCircle className="w-4 h-4" />
                Text formatted, please review once.
              </motion.div>
            )}
          </AnimatePresence>

          <div className="mb-4">
            <label htmlFor="words" className="block text-sm font-medium text-zinc-400 mb-2 flex justify-between">
              <span>Enter words (one per line)</span>
            </label>
            <textarea
              id="words"
              rows={5}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-4 text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-zinc-700 transition-all resize-none"
              placeholder="NASA&#10;EARTH&#10;SPACE"
            />
          </div>
          
          <button
            onClick={handleGenerate}
            disabled={isGenerating || inputText.trim().length === 0}
            className="w-full relative group overflow-hidden rounded-xl bg-zinc-100 text-zinc-950 font-semibold py-4 px-6 transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white"
          >
            <span className="relative flex items-center justify-center gap-2">
              {isGenerating ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Generating via Playwright...
                </>
              ) : (
                <>
                  Generate Images
                </>
              )}
            </span>
          </button>
        </motion.div>

        {/* Results section */}
        <AnimatePresence>
          {results.length > 0 && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="w-full mt-16"
            >
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-2xl font-semibold flex items-center gap-2">
                  <CheckCircle className="w-6 h-6 text-emerald-400" />
                  Generated Results
                </h2>
                
                {results.some((r) => r.url && !r.error) && (
                  <button
                    onClick={downloadAllAsZip}
                    disabled={isDownloading}
                    className="flex items-center gap-2 px-4 py-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-lg text-sm font-medium transition-colors"
                  >
                    {isDownloading ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileArchive className="w-4 h-4" />}
                    Download ZIP
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {results.map((result, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: idx * 0.1 }}
                    className="group relative bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden"
                  >
                    {result.error ? (
                      <div className="flex flex-col items-center justify-center h-48 p-6 text-center text-red-400">
                        <AlertCircle className="w-8 h-8 mb-2" />
                        <span className="font-medium text-sm">Failed: {result.word}</span>
                        <span className="text-xs opacity-75 mt-1">{result.error}</span>
                      </div>
                    ) : (
                      <>
                        <div className="aspect-[21/9] w-full relative bg-zinc-950 flex items-center justify-center p-4">
                          {/* We use standard img because we don't know exact dimensions, object-contain is best */}
                          <img
                            src={result.url}
                            alt={result.word}
                            className="w-full h-full object-contain drop-shadow-lg"
                          />
                        </div>
                        <div className="p-4 border-t border-zinc-800 flex items-center justify-between bg-zinc-900/50">
                          <span className="font-semibold tracking-wide">{result.word}</span>
                          <button
                            onClick={() => downloadImage(result.url, `${result.word}.png`)}
                            className="p-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white rounded-lg transition-colors"
                            title="Download Image"
                          >
                            <Download className="w-4 h-4" />
                          </button>
                        </div>
                      </>
                    )}
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Footer section with credits */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="w-full mt-24 pt-8 border-t border-zinc-800 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-zinc-500"
        >
          <div className="flex items-center gap-2">
            <span>Powered by</span>
            <a 
              href="https://science.nasa.gov/specials/your-name-in-landsat/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-zinc-300 hover:text-white flex items-center gap-1 transition-colors"
            >
              NASA Landsat Project <ExternalLink className="w-3 h-3" />
            </a>
          </div>
          
          <div className="flex items-center gap-6">
            <span className="hidden md:inline">Developed by Praveen Jadhav</span>
            <div className="flex items-center gap-4">
              <a 
                href="https://github.com/praveenjadhav1510" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-zinc-400 hover:text-white flex items-center gap-2 transition-colors"
              >
                <Code className="w-4 h-4" /> GitHub
              </a>
              <a 
                href="https://praveenjadhav.in" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-zinc-400 hover:text-emerald-400 flex items-center gap-2 transition-colors"
              >
                <Globe className="w-4 h-4" /> Portfolio
              </a>
            </div>
          </div>
        </motion.div>
      </main>

      {/* Random GitHub Star Popup */}
      <AnimatePresence>
        {showStarPopup && (
          <motion.div
            initial={{ opacity: 0, x: 50, y: 20 }}
            animate={{ opacity: 1, x: 0, y: 0 }}
            exit={{ opacity: 0, x: 50, scale: 0.9 }}
            className="fixed bottom-6 right-6 bg-zinc-900 border border-zinc-800 rounded-2xl p-5 shadow-2xl max-w-sm z-50 flex flex-col gap-3"
          >
            <button 
              onClick={() => setShowStarPopup(false)}
              className="absolute top-3 right-3 text-zinc-500 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
            <div className="flex items-start gap-3">
              <div className="p-2 bg-yellow-500/10 text-yellow-500 rounded-lg shrink-0 mt-1">
                <Star className="w-5 h-5 fill-yellow-500" />
              </div>
              <div>
                <h3 className="font-semibold text-white mb-1">Find this useful?</h3>
                <p className="text-sm text-zinc-400 leading-relaxed mb-3 pr-4">
                  If this tool saved you some time, consider giving it a star on GitHub!
                </p>
                <div className="flex gap-3">
                  <a 
                    href="https://github.com/praveenjadhav1510/landsat" 
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => setShowStarPopup(false)}
                    className="inline-flex items-center justify-center gap-2 bg-white text-black px-4 py-2 rounded-lg text-sm font-semibold hover:bg-zinc-200 transition-colors flex-1"
                  >
                    <Code className="w-4 h-4" /> Star Repo
                  </a>
                  <button 
                    onClick={() => setShowStarPopup(false)}
                    className="inline-flex items-center justify-center px-4 py-2 rounded-lg text-sm font-medium text-zinc-400 hover:bg-zinc-800 hover:text-white transition-colors"
                  >
                    Maybe later
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
