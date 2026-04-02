/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: [],
  },
}

module.exports = nextConfig
```

**Ctrl+S**, close, then:
```
git add next.config.js
git commit -m "Fix next config"
git push origin main --force