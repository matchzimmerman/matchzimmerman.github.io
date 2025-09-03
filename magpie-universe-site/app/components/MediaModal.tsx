'use client';

import { useEffect } from "react";

export default function MediaModal({
  open,
  onClose,
  src,
  alt
}: { open: boolean; onClose: ()=>void; src: string; alt?: string; }){
  useEffect(()=>{
    function onKey(e: KeyboardEvent){ if (e.key === "Escape") onClose(); }
    if(open){ document.addEventListener("keydown", onKey); }
    return ()=> document.removeEventListener("keydown", onKey);
  },[open,onClose]);

  if(!open) return null;
  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-6" onClick={onClose}>
      <img src={src} alt={alt ?? ""} className="max-h-[90vh] max-w-[95vw] rounded-2xl shadow-soft" onClick={(e)=>e.stopPropagation()} />
    </div>
  );
}
