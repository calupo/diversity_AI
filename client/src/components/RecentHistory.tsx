import { useHistory } from "@/hooks/use-translations";
import { formatDistanceToNow } from "date-fns";
import { History, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";

export function RecentHistory() {
  const { data: history, isLoading } = useHistory();

  if (isLoading) return <div className="animate-pulse h-20 bg-muted rounded-xl" />;
  if (!history || history.length === 0) return null;

  return (
    <section className="mt-12 w-full max-w-2xl mx-auto px-4">
      <div className="flex items-center gap-2 mb-4 text-muted-foreground">
        <History className="w-4 h-4" />
        <h3 className="text-sm font-semibold uppercase tracking-wider">Recent Translations</h3>
      </div>
      
      <div className="space-y-3">
        {history.map((item, i) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="group bg-card hover:bg-white border border-border/50 hover:border-black/10 rounded-xl p-4 transition-all duration-200 shadow-sm hover:shadow-md"
          >
            <div className="flex justify-between items-start mb-2">
              <span className="text-xs font-mono text-muted-foreground bg-muted px-2 py-1 rounded-md">
                {formatDistanceToNow(new Date(item.createdAt), { addSuffix: true })}
              </span>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] gap-4 items-center">
              <div>
                <p className="text-sm font-medium text-foreground">{item.originalText}</p>
              </div>
              
              <ArrowRight className="hidden md:block w-4 h-4 text-muted-foreground" />
              <div className="md:hidden w-full h-px bg-border my-1" />
              
              <div className="space-y-1">
                <p className="text-sm font-bold text-black">{item.berlinText}</p>
                <p className="text-xs text-muted-foreground">{item.englishText}</p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
