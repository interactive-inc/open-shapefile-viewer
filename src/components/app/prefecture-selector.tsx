import { MapPin } from "lucide-react";
import { usePrefecture, PREFECTURES } from "@/hooks/use-prefecture";

export function PrefectureSelector() {
  const { selectedPrefecture, setSelectedPrefecture } = usePrefecture();

  return (
    <div className="flex items-center gap-2 px-3 py-2 bg-muted rounded-lg">
      <MapPin className="w-4 h-4 text-muted-foreground shrink-0" />
      <select
        value={selectedPrefecture}
        onChange={(e) => setSelectedPrefecture(e.target.value)}
        className="flex-1 text-sm bg-transparent cursor-pointer focus:outline-none"
      >
        <option value="">日本全体</option>
        {PREFECTURES.map((pref) => (
          <option key={pref.name} value={pref.name}>
            {pref.name}
          </option>
        ))}
      </select>
    </div>
  );
}
