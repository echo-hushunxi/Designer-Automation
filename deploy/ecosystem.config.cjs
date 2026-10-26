const path = require('node:path');
const root = path.resolve(__dirname,'..');
module.exports = {apps:[{
  name:'designer-automation-experience',
  cwd:root,
  script:path.join(root,'bin/experience-managed.mjs'),
  args:[process.env.DA_EXPERIENCE_CONFIG || '/home/liusili/.config/designer-automation/service.json'],
  interpreter:process.execPath,
  instances:1,exec_mode:'fork',autorestart:true,min_uptime:'10s',restart_delay:3000,
  max_memory_restart:'300M',kill_timeout:30000,time:true,
  env:{NODE_ENV:'production'}
}]};
