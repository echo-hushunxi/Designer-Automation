import {Client} from '@modelcontextprotocol/sdk/client/index.js';
import {StdioClientTransport} from '@modelcontextprotocol/sdk/client/stdio.js';
import path from 'node:path';
import {root} from './io.mjs';

// Workbench and host Agents use the same local MCP entry and durable outbox.
export class ExperienceBridgeClient {
  constructor({data,url,token}) { this.options = {data,url,token}; }
  async call(name,args) {
    if (!this.client) {
      this.client = new Client({name:'designer-workbench',version:'0.3.0'});
      const {data,url,token} = this.options;
      this.transport = new StdioClientTransport({command:process.execPath,args:[path.join(root,'bin/experience-mcp.mjs')],env:{...process.env,DA_EXPERIENCE_CLIENT_DATA:data,...(url ? {DA_EXPERIENCE_URL:url,DA_EXPERIENCE_TOKEN:token || ''} : {})},stderr:'inherit'});
      await this.client.connect(this.transport);
    }
    const result = await this.client.callTool({name,arguments:args});
    if (result.isError) throw Error(result.content?.find(c=>c.type==='text')?.text || 'Experience MCP rejected the operation');
    return JSON.parse(result.content.find(c=>c.type==='text').text);
  }
  search(filter) { return this.call('experience_search',filter); }
  capture(entry) { return this.call('experience_capture',{case:entry}); }
  async close() { await this.client?.close(); }
}
