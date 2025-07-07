# Simple Zettelkasten Generator

A minimal static site generator for your zettelkasten that mimics the clean aesthetic of nat.org.

## Daily Usage

```bash
# Write notes in the notes/ folder
echo "# My New Idea\n\nThis connects to [[Other Note]]." > notes/my-new-idea.md

# Build the site
npm run build

# Preview locally
npm run serve

# Deploy to GitHub Pages
git add . && git commit -m "Update notes" && git push
```

## Project Structure

```
my-zettelkasten/
├── notes/          # Your markdown files go here
├── src/           
│   └── style.css   # Clean CSS (auto-generated)
├── build/          # Generated website (deploy this folder)
├── build.js        # Simple build script
├── package.json    # Dependencies
└── CLAUDE.md       # This file
```

## Writing Notes

### Basic Note Format
```markdown
# Note Title

Your content here. Link to other notes using [[Note Name]].

You can also use normal markdown:
- Lists work
- **Bold text**
- *Italics*

Links to [[Another Note]] are automatically converted.
```

### Wiki Links
- `[[Note Name]]` - Links to another note
- Works with exact title matching
- Missing notes show as plain text (no broken links)

### File Naming
- Use descriptive filenames: `digital-gardens.md`
- Title comes from the first `# Heading` in the file
- Dates are auto-generated from file modification time

## Commands

```bash
npm install     # First time setup
npm run build   # Generate the website
npm run serve   # Build and serve locally at http://localhost:3000
npm run clean   # Clean build directory
```

## GitHub Pages Deployment

1. Push your repository to GitHub
2. Go to Settings → Pages
3. Set source to "Deploy from a branch"
4. Choose "main" branch and "/ (root)" folder
5. Your site will be live at `https://username.github.io/my-zettelkasten`

Alternatively, deploy just the `build/` folder to any static hosting service.

## Design Philosophy

This generator prioritizes:
- **Simplicity** - One command to build
- **Speed** - Fast builds, fast loading
- **Readability** - Clean typography, minimal design
- **Portability** - Works anywhere, no external dependencies
- **Longevity** - Standard HTML/CSS that will work forever

Inspired by nat.org's perfect minimalism.