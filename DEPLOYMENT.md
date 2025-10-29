# SpaceGraphJS4 Deployment Guide

This guide explains how to deploy the SpaceGraphJS4 engine and demonstrations to a web server.

## Project Structure

The project has the following structure:

```
spacegraphjs4/
├── demo/
│   ├── comprehensive-demo.html
│   ├── comprehensive-demo.js
│   ├── integration-tests.html
│   ├── integration-tests.js
│   ├── physics-demo.html
│   └── README.md
├── src/
│   ├── components/
│   ├── containers/
│   ├── gestures/
│   ├── layout/
│   ├── physics/
│   └── *.js (core files)
├── index.html
├── README.md
├── package.json
├── start-demo.sh
├── start-demo.bat
└── DEPLOYMENT.md (this file)
```

## Deployment Options

### Option 1: Static Web Server

Since SpaceGraphJS4 is a client-side JavaScript application, it can be deployed to any static web server:

1. Copy the entire project directory to your web server's document root
2. Ensure your web server is configured to serve static files
3. Access the demos through your web server:
   - Comprehensive Demo: `http://your-server/demo/comprehensive-demo.html`
   - Integration Tests: `http://your-server/demo/integration-tests.html`

### Option 2: GitHub Pages

To deploy to GitHub Pages:

1. Create a new GitHub repository
2. Push the entire project to the repository
3. In your repository settings, enable GitHub Pages
4. Select the branch containing your code as the source
5. Your site will be available at `https://username.github.io/repository-name/`

### Option 3: Cloud Storage (AWS S3, Google Cloud Storage, etc.)

Most cloud storage providers offer static website hosting:

1. Upload all project files to your cloud storage bucket
2. Configure the bucket for static website hosting
3. Set `index.html` as the index document
4. Make the files publicly accessible
5. Access your site through the provided URL

## Dependencies

The project has minimal dependencies:

- **Three.js**: Loaded via CDN in the HTML files
- **Node.js/npm**: Only required for the development server (not needed for deployment)

All other dependencies are included in the source code.

## Browser Compatibility

The SpaceGraphJS4 engine works with modern browsers that support:

- WebGL
- ES6 JavaScript modules
- Pointer Events API

Tested browsers:
- Chrome 60+
- Firefox 54+
- Safari 12+
- Edge 79+

## Performance Considerations

For optimal performance in production:

1. **Minify JavaScript**: Use a tool like UglifyJS or Terser to reduce file sizes
2. **Enable Compression**: Configure your web server to use gzip or brotli compression
3. **Use a CDN**: Serve Three.js from a CDN to leverage browser caching
4. **Lazy Loading**: For large applications, consider loading components on demand

## Security Considerations

Since this is a client-side application, there are no server-side security concerns. However:

1. **Content Security Policy**: If implementing CSP, ensure it allows:
   - Inline scripts (or use nonces/hashes)
   - WebGL canvas usage
   - CDN script loading

2. **File Access**: The application does not access local files or make XMLHttpRequests, so CORS policies are not a concern

## Troubleshooting

Common deployment issues:

1. **Modules not loading**: Ensure your web server is configured to serve `.js` files with the correct MIME type (`text/javascript`)
2. **CORS errors**: If loading from file:// URLs, browsers may block module loading. Use a web server instead
3. **WebGL errors**: Ensure the browser supports WebGL and it's enabled
4. **Performance issues**: Check browser console for errors and performance warnings

## Updating the Application

To update a deployed version:

1. Backup the existing deployment
2. Replace files with the new version
3. Clear browser cache if users report issues
4. Test the deployment to ensure everything works correctly

## Support

For issues with deployment or the engine itself, please:

1. Check the browser console for error messages
2. Review the documentation in `README.md`
3. File an issue on the project's GitHub repository