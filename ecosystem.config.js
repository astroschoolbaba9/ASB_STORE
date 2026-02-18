module.exports = {
    apps: [
        {
            name: "asb-backend",
            script: "./asb-backend/src/server.js",
            env: {
                NODE_ENV: "production",
            },
        },
        // Note: Frontends are typically served via Nginx in production,
        // but if you want to run them via PM2 specifically (e.g. using 'serve' package):
        /*
        {
          name: "asb-admin",
          script: "npx",
          args: "serve -s asb-admin/build -l 3001",
        },
        {
          name: "spiritual-marketplace-ui",
          script: "npx",
          args: "serve -s spiritual-marketplace-ui/build -l 3000",
        }
        */
    ],
};
