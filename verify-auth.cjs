const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
const source = fs.readFileSync('database.js','utf8');
function client(error, rpcError = null) {
  let rpcCalls = 0;
  const context = { window: { GALLERY_SUPABASE: { url:'https://example.test',key:'public-test-key' } }, supabase: {
    createClient: () => ({ auth: { signInWithPassword:async()=>({error}) }, rpc:async()=>{rpcCalls++;return {data:{participants:[]},error:rpcError};} })
  } };
  vm.runInNewContext(source,context);
  return {login:()=>context.window.galleryCloud.login('organizer@example.test','test-password'),calls:()=>rpcCalls};
}
(async()=>{
  for(const [error,expected] of [
    [{code:'invalid_credentials',status:400},/Email o contraseña incorrectos/],
    [{code:'email_not_confirmed',status:400},/Confirmá tu email/],
    [{status:429},/Demasiados intentos/],
    [{status:0,message:'Failed to fetch'},/conexión o el estado de Supabase/],
    [{status:503},/conexión o el estado de Supabase/]
  ]) {
    const test=client(error);
    await assert.rejects(test.login,expected);
    assert.equal(test.calls(),0);
  }
  await assert.rejects(client(null,{code:'42501',message:'Acceso de organización requerido.'}).login,/Acceso de organización requerido/);
  assert.equal((await client(null).login()).participants.length,0);
  console.log('OK: login distinguishes credentials, unconfirmed email, throttling and outages; administrator permissions still required.');
})().catch(error=>{console.error(error);process.exitCode=1});
