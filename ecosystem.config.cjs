module.exports = {
  apps: [{
    name: "ask-me",
    cwd: "/opt/apps/ask-me/.runtime/current",
    script: "/opt/apps/ask-me/.runtime/current/server.js",
    args: [],
    instances: 1,
    exec_mode: "fork",
    env: { NODE_ENV: "production", HOSTNAME: "127.0.0.1", PORT: "3012" },
    kill_timeout: 310000,
    max_memory_restart: "750M",
    time: true,
  }],
};
