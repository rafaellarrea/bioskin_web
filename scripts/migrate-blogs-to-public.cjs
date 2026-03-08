
const fs = require('fs-extra');
const path = require('path');

async function migrateBlogs() {
  const srcDir = path.join(process.cwd(), 'src', 'data', 'blogs');
  const destDir = path.join(process.cwd(), 'public', 'data', 'blogs');

  try {
    console.log('📦 Migrating blogs to public/data/blogs...');
    
    // Ensure destination exists
    await fs.ensureDir(destDir);
    
    // Copy all files
    await fs.copy(srcDir, destDir);
    
    console.log('✅ Blogs copied successfully!');

    // Update index.json paths
    const indexPath = path.join(destDir, 'index.json');
    if (await fs.pathExists(indexPath)) {
      const indexContent = await fs.readFile(indexPath, 'utf8');
      const indexData = JSON.parse(indexContent);
      
      if (indexData.blogs) {
        // Update paths from 'src/data/blogs/...' to '/data/blogs/...'
        indexData.blogs = indexData.blogs.map(blog => {
          if (blog.paths && blog.paths.blog) {
            blog.paths.blog = blog.paths.blog.replace('src/data/blogs', '/data/blogs').replace(/^\/?/, '/');
            // Ensure path is relative to root for frontend fetch, e.g. /data/blogs/slug/blog.json
          }
          if (blog.heroImage) {
             // If image paths were pointing to src, they should be updated.
             // Usually images are already in public/images/blog.
          }
          return blog;
        });

        await fs.writeFile(indexPath, JSON.stringify(indexData, null, 2));
        console.log('✅ Updated index.json paths for public access.');
      }
    }

  } catch (error) {
    console.error('❌ Migration failed:', error);
  }
}

migrateBlogs();
