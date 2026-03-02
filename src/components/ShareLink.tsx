'use client';

import { useState, useRef, useEffect } from 'react';
import { Share2, Copy, Check, Twitter, Facebook, Linkedin, MessageCircle, X } from 'lucide-react';
import toast from 'react-hot-toast';

interface ShareLinkProps {
  url: string;
  title: string;
  text?: string;
  buttonText?: string;
  className?: string;
  compact?: boolean;
}

export default function ShareLink({
  url,
  title,
  text = '',
  buttonText = 'Share',
  className = '',
  compact = false,
}: ShareLinkProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fullText = text ? `${title} - ${text}` : title;

  const handleShare = async () => {
    // Use Native Web Share API if available (Mobile browsers mostly)
    if (navigator.share) {
      try {
        await navigator.share({
          title,
          text: fullText,
          url,
        });
        return;
      } catch (err) {
        // Fallback if they cancel or it fails, open dropdown
        if (err instanceof Error && err.name !== 'AbortError') {
          setIsOpen(true);
        }
      }
    } else {
      // Fallback for desktop browsers
      setIsOpen(!isOpen);
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast.success('Link copied to clipboard!');
      setTimeout(() => setCopied(false), 2000);
      setIsOpen(false);
    } catch (err) {
      toast.error('Failed to copy link');
    }
  };

  const shareLinks = {
    whatsapp: `https://wa.me/?text=${encodeURIComponent(`${fullText} ${url}`)}`,
    twitter: `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(fullText)}`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`,
  };

  const openPopup = (url: string) => {
    window.open(url, 'share-popup', 'width=600,height=600,left=100,top=100');
    setIsOpen(false);
  };

  return (
    <div className="relative inline-block" ref={dropdownRef}>
      <button
        onClick={handleShare}
        className={`flex items-center justify-center gap-2 font-bold transition-all shadow-sm active:scale-95 ${
          compact
            ? 'p-2 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg'
            : `bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 px-4 py-2.5 rounded-xl ${className}`
        }`}
        aria-label={buttonText}
      >
        <Share2 className={compact ? 'w-4 h-4' : 'w-4 h-4'} />
        {!compact && <span>{buttonText}</span>}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.15)] border border-slate-100 py-2 z-50 animate-in fade-in slide-in-from-top-2">
          <div className="px-4 py-2 border-b border-slate-100 mb-1 flex justify-between items-center">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Share to...</span>
            <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-slate-600">
              <X className="w-4 h-4" />
            </button>
          </div>
          
          <button
            onClick={() => openPopup(shareLinks.whatsapp)}
            className="w-full text-left px-4 py-2.5 flex items-center gap-3 hover:bg-[#25D366]/10 text-slate-700 hover:text-[#25D366] transition-colors font-medium"
          >
            <MessageCircle className="w-5 h-5" />
            WhatsApp
          </button>
          
          <button
            onClick={() => openPopup(shareLinks.twitter)}
            className="w-full text-left px-4 py-2.5 flex items-center gap-3 hover:bg-[#1DA1F2]/10 text-slate-700 hover:text-[#1DA1F2] transition-colors font-medium"
          >
            <Twitter className="w-5 h-5" />
            X (Twitter)
          </button>
          
          <button
            onClick={() => openPopup(shareLinks.facebook)}
            className="w-full text-left px-4 py-2.5 flex items-center gap-3 hover:bg-[#1877F2]/10 text-slate-700 hover:text-[#1877F2] transition-colors font-medium"
          >
            <Facebook className="w-5 h-5" />
            Facebook
          </button>
          
          <button
            onClick={() => openPopup(shareLinks.linkedin)}
            className="w-full text-left px-4 py-2.5 flex items-center gap-3 hover:bg-[#0A66C2]/10 text-slate-700 hover:text-[#0A66C2] transition-colors font-medium"
          >
            <Linkedin className="w-5 h-5" />
            LinkedIn
          </button>
          
          <div className="h-px bg-slate-100 my-1"></div>
          
          <button
            onClick={handleCopy}
            className="w-full text-left px-4 py-2.5 flex items-center gap-3 hover:bg-emerald-50 text-slate-700 hover:text-emerald-700 transition-colors font-medium"
          >
            {copied ? <Check className="w-5 h-5 text-emerald-600" /> : <Copy className="w-5 h-5" />}
            {copied ? 'Copied!' : 'Copy Link'}
          </button>
        </div>
      )}
    </div>
  );
}
