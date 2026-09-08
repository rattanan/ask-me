module.exports = {
  apps: [{
    name: "ask-me",
    cwd: "/opt/apps/ask-me",
    script: "node_modules/next/dist/bin/next",
    args: "start --hostname 127.0.0.1 --port 3012",
    instances: 1,
    exec_mode: "fork",
    env: { NODE_ENV: "production" },
    max_memory_restart: "750M",
    time: true,
  }],
};
