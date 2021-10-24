module.exports = {
  apps: [
    {
      name: "seonest-be",
      script: "ts-node",
      args: "-r tsconfig-paths/register --transpile-only src/index.ts",
      exec_mode: "cluster",
      instances: 2,
      wait_ready: true,
      listen_timeout: 50000,
      kill_timeout: 5000,
      env: {
        NODE_ENV: "production",
      },
    },
  ],

  deploy: {
    production: {
      key: "~/.ssh/deploy.key",
      user: "ubuntu",
      host: process.env.HOST_ADDRESS,
      ref: "origin/master",
      repo: "https://github.com/JHSeo-git/seonest-be.git",
      path: "/home/ubuntu/seonest-be",
      "pre-deploy-local": "",
      "post-deploy": "yarn install && yarn pm2:reload",
      "pre-setup": "",
      env: {
        NODE_ENV: "production",
      },
    },
  },
};
