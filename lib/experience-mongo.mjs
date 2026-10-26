import {MongoClient} from 'mongodb';
import {caseContent,caseId,capturedCase,validatePublication,validateStoredCase} from './experience-case.mjs';
import {digest} from './io.mjs';

const name = (value,label) => {
  if (!/^[a-zA-Z][a-zA-Z0-9_]{0,100}$/.test(value || '')) throw Error('Invalid '+label);
  return value;
};
const escaped = text => text.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
const withoutId = ({_id,...entry}) => entry;
const stateFor = cases => ({version:1,revision:cases.reduce((sum,c)=>sum+c.revision,0),cases});

export class MongoExperienceStore {
  static async connect({uri,database,collection = 'cases'}) {
    if (typeof uri !== 'string' || !uri.startsWith('mongodb')) throw Error('Shared experience requires an explicit MongoDB connection');
    name(database,'experience database'); name(collection,'experience collection');
    const client = new MongoClient(uri,{appName:'designer-automation-experience',serverSelectionTimeoutMS:5000,connectTimeoutMS:5000,socketTimeoutMS:30000,maxPoolSize:10,readPreference:'primary',writeConcern:{w:'majority',journal:true,wtimeoutMS:10000}});
    try {
      await client.connect();
      const hello = await client.db('admin').command({hello:1});
      if (!hello.setName) throw Error('Shared experience requires a MongoDB replica set for consistent online backups');
      const store = new MongoExperienceStore(client,database,collection);
      await store.ensureIndexes(); return store;
    } catch (error) {
      await client.close();
      // Connection errors can include URIs; never echo credentials to logs.
      throw Error('MongoDB initialization did not succeed ('+(error.code || error.name)+'). Check the private server configuration and replica set.');
    }
  }
  constructor(client,database,collection) {
    this.client = client; this.database = database; this.collectionName = collection;
    this.collection = client.db(database).collection(collection);
  }
  async ensureIndexes() {
    await this.collection.createIndex({status:1,'scope.pages':1},{name:'status_pages'});
    await this.collection.createIndex({status:1,'scope.site':1},{name:'status_site'});
  }
  async health() { await this.client.db(this.database).command({ping:1}); return {backend:'mongodb',database:this.database,collection:this.collectionName}; }
  async close() { await this.client.close(); }
  async capture(input) {
    const content = caseContent(input), id = caseId(content);
    const entry = capturedCase(content);
    try { await this.collection.updateOne({_id:id},{$setOnInsert:entry},{upsert:true}); }
    catch (error) { if (error.code !== 11000) throw error; }
    return withoutId(await this.collection.findOne({_id:id}));
  }
  async search({pages = [],site,query = '',includeCandidates = false} = {}) {
    if (!Array.isArray(pages) || pages.some(p=>typeof p !== 'string') || typeof query !== 'string' || (site !== undefined && typeof site !== 'string')) throw Error('Invalid experience search filter');
    const filter = {$and:[{$or:[{'scope.site':{$exists:false}},...(site ? [{'scope.site':site}] : [])]}]};
    if (!includeCandidates) filter.status = 'active';
    if (pages.length) filter['scope.pages'] = {$in:['*',...pages]};
    if (query) filter.$and.push({$or:['summary','cause','prevention'].map(key=>({[key]:{$regex:escaped(query),$options:'i'}}))});
    const cases = (await this.collection.find(filter).sort({_id:1}).toArray()).map(withoutId);
    return {revision:stateFor(cases).revision,cases,hash:digest(cases)};
  }
  async publish(args) {
    const entry = await this.collection.findOne({_id:args.id});
    validatePublication(entry,args);
    if (entry.status === 'active') return withoutId(entry);
    const active = await this.collection.findOneAndUpdate({_id:args.id,revision:args.expectedRevision,status:'candidate'},{$set:{status:'active',publishedBy:args.actor,reason:args.reason,publishedAt:new Date().toISOString()},$inc:{revision:1}},{returnDocument:'after',includeResultMetadata:false});
    if (!active) throw Error('Experience revision is absent or stale');
    return withoutId(active);
  }
  async read() {
    // Snapshot isolation covers the entire collection even while designers write.
    const session = this.client.startSession();
    try {
      return await session.withTransaction(async () => stateFor((await this.collection.find({},{session}).sort({_id:1}).toArray()).map(withoutId)),{readConcern:{level:'snapshot'},readPreference:'primary'});
    } finally { await session.endSession(); }
  }
  async importCases(cases) {
    cases.forEach(validateStoredCase);
    let inserted = 0;
    for (const entry of cases) {
      const result = await this.collection.updateOne({_id:entry.id},{$setOnInsert:entry},{upsert:true});
      if (result.upsertedCount) inserted++;
      else {
        const current = withoutId(await this.collection.findOne({_id:entry.id}));
        if (digest(current) !== digest(entry)) throw Error('Import conflicts with existing case '+entry.id+'; existing case preserved');
      }
    }
    return {inserted,total:cases.length};
  }
  async restoreInto(collection,cases) {
    name(collection,'restore collection');
    if (!collection.startsWith('restore_') || collection === this.collectionName) throw Error('Restore requires a new restore_ collection; live collection is preserved');
    cases.forEach(validateStoredCase);
    const db = this.client.db(this.database);
    // createCollection is exclusive: never clear, merge or overwrite a target.
    await db.createCollection(collection);
    const target = new MongoExperienceStore(this.client,this.database,collection);
    await target.ensureIndexes();
    if (cases.length) await target.collection.insertMany(cases.map(entry=>({_id:entry.id,...entry})),{ordered:true});
    const restored = await target.read();
    const expected = [...cases].sort((a,b)=>a.id.localeCompare(b.id));
    if (digest(restored.cases) !== digest(expected)) throw Error('Restore verification did not match; live collection preserved');
    return {database:this.database,collection,count:cases.length,hash:digest(expected),liveCollectionUnchanged:this.collectionName};
  }
}
