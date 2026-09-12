import React from 'react';
import { Sparkle, BrainCircuit, Blocks, Mic, ArrowUp, Search, Code, Calculator, Image as ImageIcon, FileText, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export function HomeContent({ composer, onAction }: { composer?: React.ReactNode, onAction?: (action: string) => void }) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center h-full max-w-4xl mx-auto px-6 w-full -mt-10">
      
      {/* Headings */}
      <div className="text-center mb-12 animate-in fade-in slide-in-from-bottom-4 duration-700 ease-out">
        <h1 className="text-4xl md:text-5xl font-serif text-foreground tracking-tight mb-4">
          What would you like to <span className="text-[#6d79e8] italic">create</span> today?
        </h1>
        <p className="text-lg text-muted-foreground/80">
          Ask, build, research, and solve in one place.
        </p>
      </div>

      {/* Composer */}
      <div className="w-full max-w-3xl mb-6 animate-in fade-in slide-in-from-bottom-6 duration-700 delay-100 ease-out">
        {composer}
      </div>

      {/* Quick Actions */}
      <div className="flex flex-wrap justify-center gap-3 w-full max-w-3xl animate-in fade-in slide-in-from-bottom-8 duration-700 delay-200 ease-out">
        <QuickAction icon={Search} label="Research" color="text-emerald-500" onClick={() => onAction?.('research')} />
        <QuickAction icon={Code} label="Code" color="text-blue-500" onClick={() => onAction?.('code')} />
        <QuickAction icon={Calculator} label="Solve Math" color="text-orange-500" onClick={() => onAction?.('math')} />
        <QuickAction icon={ImageIcon} label="Create Image" color="text-purple-500" onClick={() => onAction?.('image')} />
        <QuickAction icon={FileText} label="Analyze File" color="text-slate-500" onClick={() => onAction?.('file')} />
      </div>

      {/* Footer tags */}
      <div className="absolute bottom-6 flex items-center justify-center gap-8 text-xs text-muted-foreground/60 font-medium animate-in fade-in duration-1000 delay-500">
        <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full border border-current flex items-center justify-center text-[8px] font-bold">âœ“</span> Private by default</div>
        <div className="flex items-center gap-2"><Blocks className="w-3 h-3" /> Multi-model</div>
        <div className="flex items-center gap-2"><Blocks className="w-3 h-3" /> Tools for real work</div>
        <div className="flex items-center gap-2"><Sparkle className="w-3 h-3" /> Fast responses</div>
      </div>
    </div>
  );
}

function ComposerDropdown({ icon: Icon, label, active, onClick }: { icon: any, label: string, active?: boolean, onClick?: () => void }) {
  return (
    <button onClick={onClick} className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-sm font-medium transition-colors ${active ? 'bg-background shadow-sm border border-border/40 text-foreground' : 'text-muted-foreground hover:bg-background/50 hover:text-foreground'}`}>
      <Icon className={`w-3.5 h-3.5 ${active ? 'fill-current' : ''}`} />
      <span>{label}</span>
      <svg width="10" height="10" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg" className="opacity-50 ml-1"><path d="M4 6L7.5 10.5L11 6" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"/></svg>
    </button>
  );
}

function QuickAction({ icon: Icon, label, color, onClick }: { icon: any, label: string, color: string, onClick?: () => void }) {
  return (
    <button onClick={onClick} className="flex items-center gap-2 px-5 py-2.5 rounded-full border border-border/50 bg-card hover:bg-muted/30 hover:border-border/80 transition-all shadow-sm">
      <div className={`p-1 rounded-full bg-background border border-border/40 shadow-sm ${color}`}>
        <Icon className="w-3.5 h-3.5" />
      </div>
      <span className="text-sm font-medium text-muted-foreground">{label}</span>
    </button>
  );
}
