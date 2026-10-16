import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { exec } from 'child_process';
import { defineConfig, Plugin } from 'vite';

function gitApiPlugin(): Plugin {
  return {
    name: 'git-api-plugin',
    configureServer(server) {
      server.middlewares.use('/api/git-push', (req, res) => {
        if (req.method !== 'POST') {
          res.statusCode = 405;
          res.end(JSON.stringify({ error: 'Method not allowed' }));
          return;
        }

        let body = '';
        req.on('data', (chunk) => {
          body += chunk;
        });

        req.on('end', () => {
          try {
            const { token, repo } = JSON.parse(body || '{}');
            const cleanToken = (token || '').trim();
            const cleanRepo = (repo || 'chiayuting88-byte/mas-exchanger').trim();

            if (!cleanToken) {
              res.statusCode = 400;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ success: false, error: 'Token is required' }));
              return;
            }

            const targetUrl = `https://${encodeURIComponent(cleanToken)}@github.com/${cleanRepo}.git`;
            const command = `git push "${targetUrl}" main`;

            exec(command, (error, stdout, stderr) => {
              res.setHeader('Content-Type', 'application/json');
              if (error) {
                // Sanitize output to not leak token in error messages
                const sanitizedErr = (stderr || error.message || '').replace(new RegExp(cleanToken, 'g'), '[REDACTED_TOKEN]');
                res.statusCode = 400;
                res.end(JSON.stringify({ success: false, error: sanitizedErr, stdout }));
              } else {
                res.statusCode = 200;
                res.end(JSON.stringify({ success: true, message: 'Successfully pushed to GitHub!', stdout }));
              }
            });
          } catch (err: any) {
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ success: false, error: err?.message || 'Server error' }));
          }
        });
      });
    },
  };
}

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss(), gitApiPlugin()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});

