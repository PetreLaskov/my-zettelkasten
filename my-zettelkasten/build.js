#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { marked } = require('marked');

class ZettelkastenBuilder {
  constructor() {
    this.notesDir = './notes';
    this.buildDir = './build';
    this.srcDir = './src';
    this.notes = new Map();
    this.backlinks = new Map();
    
    console.log('🗃️  Building zettelkasten...\n');
  }

  // Ensure directory exists
  ensureDir(dir) {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }

  // Convert title to URL slug
  titleToSlug(title) {
    return title.toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  }

  // Extract title from markdown content
  extractTitle(content) {
    const titleMatch = content.match(/^#\s+(.+)$/m);
    return titleMatch ? titleMatch[1].trim() : null;
  }

  // Load all notes
  loadNotes() {
    console.log('📖 Loading notes...');
    
    this.ensureDir(this.notesDir);
    
    const files = fs.readdirSync(this.notesDir).filter(file => file.endsWith('.md'));
    
    if (files.length === 0) {
      console.log('   No notes found. Create some .md files in the notes/ folder!');
      return;
    }
    
    files.forEach(file => {
      const filePath = path.join(this.notesDir, file);
      const content = fs.readFileSync(filePath, 'utf8');
      const stats = fs.statSync(filePath);
      
      const slug = path.basename(file, '.md');
      const title = this.extractTitle(content) || slug.replace(/-/g, ' ');
      
      this.notes.set(slug, {
        slug,
        title,
        content,
        modified: stats.mtime,
        filename: file
      });
      
      console.log(`   ✓ ${title}`);
    });
    
    console.log(`\n📚 Loaded ${this.notes.size} notes\n`);
  }

  // Process [[wiki links]] in content
  processWikiLinks(content, currentSlug) {
    return content.replace(/\[\[([^\]]+)\]\]/g, (match, linkText) => {
      const targetSlug = this.titleToSlug(linkText);
      
      // Find note by title or slug
      let foundNote = null;
      for (const note of this.notes.values()) {
        if (this.titleToSlug(note.title) === targetSlug || note.slug === targetSlug) {
          foundNote = note;
          break;
        }
      }
      
      if (foundNote) {
        // Track backlinks
        if (!this.backlinks.has(foundNote.slug)) {
          this.backlinks.set(foundNote.slug, []);
        }
        this.backlinks.get(foundNote.slug).push(currentSlug);
        
        return `<a href="${foundNote.slug}.html">${linkText}</a>`;
      } else {
        // Note doesn't exist - just return plain text
        return linkText;
      }
    });
  }

  // Generate backlinks HTML
  generateBacklinks(slug) {
    const links = this.backlinks.get(slug) || [];
    if (links.length === 0) return '';
    
    const uniqueLinks = [...new Set(links)];
    let html = '<div class="backlinks">\n';
    html += '<h3>Linked from</h3>\n';
    html += '<ul>\n';
    
    uniqueLinks.forEach(linkSlug => {
      const note = this.notes.get(linkSlug);
      if (note) {
        html += `<li><a href="${linkSlug}.html">${note.title}</a></li>\n`;
      }
    });
    
    html += '</ul>\n';
    html += '</div>\n';
    
    return html;
  }

  // Get page template
  getTemplate() {
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{title}} — Zettelkasten</title>
    <link rel="stylesheet" href="style.css">
</head>
<body>
    <div class="container">
        <div class="nav">
            <a href="index.html">← Home</a>
        </div>
        <main>
            {{content}}
            {{backlinks}}
        </main>
    </div>
</body>
</html>`;
  }

  // Get index template
  getIndexTemplate() {
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Zettelkasten</title>
    <link rel="stylesheet" href="style.css">
</head>
<body>
    <div class="container">
        <main>
            {{content}}
        </main>
    </div>
</body>
</html>`;
  }

  // Render a single note
  renderNote(note) {
    const template = this.getTemplate();
    const processedContent = this.processWikiLinks(note.content, note.slug);
    const html = marked(processedContent);
    const backlinks = this.generateBacklinks(note.slug);
    const date = note.modified.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
    
    const contentWithMeta = `<div class="note-meta">${date}</div>\n${html}`;
    
    return template
      .replace('{{title}}', note.title)
      .replace('{{content}}', contentWithMeta)
      .replace('{{backlinks}}', backlinks);
  }

  // Generate index page
  generateIndex() {
    const notes = Array.from(this.notes.values())
      .sort((a, b) => b.modified - a.modified);
    
    let content = '<h1>Zettelkasten</h1>\n\n';
    
    if (notes.length === 0) {
      content += '<p>No notes yet. Create some .md files in the notes/ folder!</p>';
    } else {
      content += '<div class="note-list">\n';
      
      notes.forEach(note => {
        const date = note.modified.toLocaleDateString('en-US', { 
          year: 'numeric', 
          month: 'short', 
          day: 'numeric' 
        });
        content += `<div class="note-item">`;
        content += `<a href="${note.slug}.html">${note.title}</a>`;
        content += `<span class="note-date">${date}</span>`;
        content += `</div>\n`;
      });
      
      content += '</div>\n';
    }
    
    return this.getIndexTemplate().replace('{{content}}', content);
  }

  // Copy CSS
  copyCss() {
    const srcCss = path.join(this.srcDir, 'style.css');
    const destCss = path.join(this.buildDir, 'style.css');
    
    if (fs.existsSync(srcCss)) {
      fs.copyFileSync(srcCss, destCss);
      console.log('🎨 CSS copied');
    } else {
      console.log('❌ CSS file not found at src/style.css');
    }
  }

  // Build everything
  build() {
    try {
      this.ensureDir(this.buildDir);
      this.ensureDir(this.srcDir);
      
      this.loadNotes();
      
      console.log('🔗 Processing wiki links...');
      
      // Generate index
      const indexHtml = this.generateIndex();
      fs.writeFileSync(path.join(this.buildDir, 'index.html'), indexHtml);
      console.log('   ✓ index.html');
      
      // Generate note pages
      this.notes.forEach(note => {
        const html = this.renderNote(note);
        fs.writeFileSync(path.join(this.buildDir, `${note.slug}.html`), html);
        console.log(`   ✓ ${note.slug}.html`);
      });
      
      this.copyCss();
      
      console.log(`\n✅ Built ${this.notes.size + 1} pages`);
      console.log('💡 Run "npm run serve" to preview\n');
      
    } catch (error) {
      console.error('❌ Build failed:', error.message);
      process.exit(1);
    }
  }
}

// Run the builder
const builder = new ZettelkastenBuilder();
builder.build();