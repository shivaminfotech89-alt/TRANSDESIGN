import re

with open('src/lib/engine.ts', 'r') as f:
    content = f.read()

# Replace noLoadLosses calculation
nl_loss_block = "const noLoadLosses = Math.round(coreWeight * specificCoreLoss);"
new_nl_loss_block = "const noLoadLosses = inputs.targetNoLoadLoss ? inputs.targetNoLoadLoss : Math.round(coreWeight * specificCoreLoss);"
content = content.replace(nl_loss_block, new_nl_loss_block)

# Replace loadLosses calculation
ll_loss_block = "const loadLosses = Math.round(baseLoadLosses * 1.15);"
new_ll_loss_block = "const loadLosses = inputs.targetLoadLoss ? inputs.targetLoadLoss : Math.round(baseLoadLosses * 1.15);"
content = content.replace(ll_loss_block, new_ll_loss_block)

with open('src/lib/engine.ts', 'w') as f:
    f.write(content)
