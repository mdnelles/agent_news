const path = require('path')

const appDir = __dirname

module.exports = {
  apps: [
    {
      name: 'agent-news-web',
      cwd: appDir,
      script: path.join(appDir, 'node_modules/next/dist/bin/next'),
      args: 'start -p 3034',
      env: {
        NODE_ENV: 'production',
        PORT: 3034,
      },
    },
    {
      name: 'agent-news-agent',
      cwd: appDir,
      script: path.join(appDir, 'agent/index.ts'),
      interpreter: path.join(appDir, 'node_modules/.bin/tsx'),
      args: '--schedule',
      env: {
        NODE_ENV: 'production',
      },
    },
  ],
}
