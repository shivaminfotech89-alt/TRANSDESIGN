import re

with open('src/components/TransformerForm.tsx', 'r') as f:
    content = f.read()

# Let's remove everything from the first "export function TransformerForm" to "const [expandedSection" and replace it cleanly.
start_str = "export function TransformerForm({ inputs, onChange }: TransformerFormProps) {"
end_str = "  const [expandedSection, setExpandedSection] = useState<string>('rating');"

parts = content.split(start_str)
if len(parts) > 1:
    before = parts[0]
    after = parts[-1] # take the last one to ignore multiple additions
    # Find expandedSection in after
    after_parts = after.split(end_str)
    if len(after_parts) > 1:
        rest = end_str + after_parts[1]
        
        sync_logic = """export function TransformerForm({ inputs, onChange }: TransformerFormProps) {
  const { user } = useAuth();
  
  const handleSyncPrices = async () => {
    if (!user) return alert("Sign in to sync company prices");
    try {
      const [matSnap, priceSnap] = await Promise.all([
        getDocs(query(collection(db, 'materials'), where('userId', '==', user.uid))),
        getDocs(query(collection(db, 'material_prices'), where('userId', '==', user.uid)))
      ]);
      const mats = matSnap.docs.map(d => ({id: d.id, ...d.data()}));
      const prices = priceSnap.docs.map(d => ({id: d.id, ...d.data()}));
      
      const getLatestPrice = (catName: string) => {
        const catMats = mats.filter(m => m.category.toLowerCase().includes(catName.toLowerCase()) || m.name.toLowerCase().includes(catName.toLowerCase()));
        if (!catMats.length) return null;
        let latestP: any = null;
        for (const m of catMats) {
           const pList = prices.filter(p => p.materialId === m.id);
           for (const p of pList) {
             if (!latestP || p.createdAt > latestP.createdAt) latestP = p;
           }
        }
        if (!latestP) return null;
        return Number(latestP.basePrice) + Number(latestP.transportation) + Number(latestP.loading) + Number(latestP.taxes);
      };
      
      const copperP = getLatestPrice('copper') || getLatestPrice('conductor') || getLatestPrice('aluminium');
      const coreP = getLatestPrice('crgo') || getLatestPrice('core');
      const oilP = getLatestPrice('oil');
      const steelP = getLatestPrice('steel') || getLatestPrice('tank');
      
      let msg = "Synced Prices from DB:\\n";
      let updates: any = {};
      if (copperP) { msg += `Conductor: ₹${copperP.toFixed(2)}\\n`; updates.conductorCostPerKg = copperP; }
      if (coreP) { msg += `Core: ₹${coreP.toFixed(2)}\\n`; updates.coreCostPerKg = coreP; }
      if (oilP) { msg += `Oil: ₹${oilP.toFixed(2)}\\n`; updates.oilCostPerLitre = oilP; }
      if (steelP) { msg += `Steel: ₹${steelP.toFixed(2)}\\n`; updates.steelCostPerKg = steelP; }
      
      onChange({ ...inputs, ...updates });
      alert(msg);
    } catch(e) {
      console.error(e);
      alert("Failed to sync prices");
    }
  };

"""
        
        with open('src/components/TransformerForm.tsx', 'w') as f:
            f.write(before + sync_logic + rest)
