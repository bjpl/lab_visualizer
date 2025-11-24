# Interactive Features UI Guide

## Where to Find Everything

When you navigate to `/viewer` (or `/viewer?pdb=1CRN`), you'll now see:

```
┌─────────────────────────────────────────────────────────────────┐
│  Toolbar (Top)                                      [Collaborate]│
├──────────────────────────┬──────────────────────────────────────┤
│                          │  SIDEBAR (Right - 30%)               │
│                          │  ┌────────────────────────────────┐  │
│                          │  │ Interactive Features           │  │
│                          │  ├────────────────────────────────┤  │
│   3D VIEWER              │  │ [Show/Hide H-Bonds]           │  │
│   (Left - 70%)           │  │ [Show/Hide Measurements]      │  │
│                          │  │ [Show/Hide Sequence]          │  │
│   • Hover for tooltips   │  └────────────────────────────────┘  │
│   • Click atoms          │                                      │
│   • Rotate/zoom          │  ┌────────────────────────────────┐  │
│                          │  │ Controls                       │  │
│                          │  │ - Representation               │  │
│                          │  │ - Color Scheme                 │  │
│   ┌──────────────────┐   │  │ - Quality                     │  │
│   │ Measurements     │   │  └────────────────────────────────┘  │
│   │ Panel (Overlay)  │   │                                      │
│   │ • Distance       │   │  ┌────────────────────────────────┐  │
│   │ • Angle          │   │  │ Selection                      │  │
│   │ • History        │   │  └────────────────────────────────┘  │
│   └──────────────────┘   │                                      │
│                          │  ┌────────────────────────────────┐  │
│   ┌──────────────────┐   │  │ Info                          │  │
│   │ Hover Tooltip    │   │  │ - PDB Details                 │  │
│   │ Chain: A         │   │  │ - Statistics                  │  │
│   │ Residue: ALA 10  │   │  └────────────────────────────────┘  │
│   │ Atom: CA         │   │                                      │
│   └──────────────────┘   │                                      │
│                          │                                      │
│        [Fullscreen]      │                                      │
├──────────────────────────┴──────────────────────────────────────┤
│  SEQUENCE VIEWER (Bottom - 256px height)                        │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  [<] Chain A [>]                              [Search]   │   │
│  ├──────────────────────────────────────────────────────────┤   │
│  │  [A][L][G][K][R][D][E][V][I][P][S][T][Y][F]...         │   │
│  │   1  2  3  4  5  6  7  8  9 10 11 12 13 14             │   │
│  ├──────────────────────────────────────────────────────────┤   │
│  │  Legend: 🟢 Hydrophobic  🔵 Polar  🔴 Charged          │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

## How to Use Each Feature

### 1. **Hover Tooltip** (Always Active)
- **Location:** Bottom-right corner of 3D viewer
- **What it does:** Shows info when you hover over atoms
- **Info displayed:**
  - Chain ID
  - Residue name and number
  - Atom name and element
  - 3D coordinates

### 2. **Hydrogen Bonds Toggle**
- **Location:** Sidebar > Interactive Features > First button
- **What it does:** Shows/hides yellow hydrogen bonds
- **States:**
  - OFF: "Show H-Bonds" (outline button)
  - ON: "Hide H-Bonds" (filled button, shows "Hydrogen bonds shown in yellow")

### 3. **Measurements**
- **Location:** Sidebar > Interactive Features > Second button
- **What it does:** Opens measurement panel overlay
- **Panel location:** Top-right of 3D viewer
- **Features:**
  - Create distance measurements (2 atoms)
  - Create angle measurements (3 atoms)
  - View measurement history
  - Delete individual measurements
  - Clear all measurements
  - Toggle measurement visibility

**How to measure:**
1. Click "Show Measurements" button
2. In measurements panel, click "Distance" or "Angle"
3. Click atoms in 3D viewer (2 for distance, 3 for angle)
4. Measurement auto-completes and shows in history

### 4. **Sequence Viewer**
- **Location:** Bottom panel (256px height)
- **Toggle:** Sidebar > Interactive Features > Third button
- **Features:**
  - Switch between chains using [<] [>] arrows
  - Search residues by name or number
  - Color-coded residues:
    - 🟢 Green: Hydrophobic (ALA, VAL, ILE, LEU, MET, PHE, TRP, PRO)
    - 🔵 Blue: Polar (SER, THR, CYS, TYR, ASN, GLN)
    - 🔴 Red: Charged (ASP, GLU, LYS, ARG, HIS)
  - Click any residue to select it in 3D
  - Auto-scroll to hovered residue
  - Selected residues show green highlight

**How to use:**
1. Click any residue button
2. Residue is selected in 3D with green tint
3. Hovering in 3D highlights in sequence
4. Use search to filter residues

## Quick Actions

| Action | How To |
|--------|--------|
| See atom info | Hover over atom in 3D |
| Measure distance | Measurements panel > Distance > Click 2 atoms |
| Measure angle | Measurements panel > Angle > Click 3 atoms |
| Show H-bonds | Click "Show H-Bonds" button |
| Select residue | Click residue in sequence viewer |
| Search residue | Type in sequence viewer search box |
| Switch chains | Use [<] [>] arrows in sequence viewer |
| Hide sequence | Click "Hide Sequence" button |

## Visual Indicators

- **Green highlight** = Selected atom/residue
- **Yellow lines** = Hydrogen bonds
- **White text overlay** = Measurement values (when implemented)
- **Blue ring** = Hovered residue in sequence
- **Green ring** = Selected residue in sequence

## Keyboard Shortcuts (Existing)

- `R` - Reset camera
- `F` - Focus selection
- `Ctrl+F` - Fullscreen
- `S` - Selection mode
- `H` - Help
- `Esc` - Clear selection
- `+/-` - Zoom in/out

## Tips

1. **Hover tooltip is always visible** - no need to enable it
2. **Measurements persist** - they stay until you delete them
3. **Sequence syncs automatically** - hover in 3D, see in sequence
4. **Green tint confirms selection** - look for green glow on selected atoms
5. **Panels can be hidden** - use toggle buttons to show/hide features

## Troubleshooting

**"I don't see the interactive features"**
- Check you're on the `/viewer` page
- Look for "Interactive Features" section in right sidebar
- Make sure you have a structure loaded (`/viewer?pdb=1CRN`)

**"Sequence viewer is empty"**
- Wait for structure to finish loading
- Check that structure has loaded successfully
- Look for "No structure loaded" message

**"Measurements aren't working"**
- Click "Show Measurements" button first
- Click "Distance" or "Angle" in measurements panel
- Then click atoms in 3D viewer
- Make sure structure is loaded

**"Hover tooltip not showing"**
- Hover directly over atoms (not empty space)
- Wait for structure to load completely
- Check browser console for errors

---

**Last Updated:** 2025-11-24
**Status:** ✅ All features active and integrated
