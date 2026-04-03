import { Target, Wifi, WifiOff } from "lucide-react";

interface HeaderProps {
  isConnected: boolean;
}

const Header = ({ isConnected }: HeaderProps) => {
  return (
    <header className="flex items-center justify-between px-4 py-3 glass-surface border-b border-border/50">
      <div className="flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-lg bg-primary/15 flex items-center justify-center neon-glow">
          <Target className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h1 className="font-display font-bold text-sm uppercase tracking-widest text-foreground">
            AutoDarts
            <span className="text-primary"> Vision</span>
          </h1>
        </div>
      </div>
      <div className="flex items-center gap-1.5">
        {isConnected ? (
          <Wifi className="w-4 h-4 text-primary" />
        ) : (
          <WifiOff className="w-4 h-4 text-accent" />
        )}
        <span className={`text-[10px] font-display font-semibold uppercase tracking-wider ${
          isConnected ? "text-primary" : "text-accent"
        }`}>
          {isConnected ? "Online" : "Offline"}
        </span>
      </div>
    </header>
  );
};

export default Header;
