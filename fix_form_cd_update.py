import re

with open('src/components/TransformerForm.tsx', 'r') as f:
    content = f.read()

change_handler = """  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    let updates: Partial<TransformerInputs> = {
      [name]: type === 'number' ? Number(value) : value,
    };
    
    // Auto-update current density if conductor changes
    if (name === 'conductor') {
      const isCopper = value === 'Copper';
      updates.maxCurrentDensityHv = isCopper ? 3.0 : 1.6;
      updates.maxCurrentDensityLv = isCopper ? 3.0 : 1.6;
    }

    onChange({
      ...inputs,
      ...updates,
    });
  };"""

content = re.sub(r"  const handleChange = \(e: React\.ChangeEvent.*?\}\);\n  \};\n", change_handler + "\n", content, flags=re.DOTALL)

with open('src/components/TransformerForm.tsx', 'w') as f:
    f.write(content)
