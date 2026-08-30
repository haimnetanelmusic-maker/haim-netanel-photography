import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2.112.4";

const DEFAULT_ORIGINS=["https://haimnetanelphoto.co.il","https://www.haimnetanelphoto.co.il","https://haim-netanel-photography.pages.dev"];
const allowedOrigins=(Deno.env.get("ADMIN_ALLOWED_ORIGINS")||DEFAULT_ORIGINS.join(",")).split(",").map(x=>x.trim()).filter(Boolean);
const requestOrigin=(req:Request)=>req.headers.get("origin")||"";
const originAllowed=(req:Request)=>{const o=requestOrigin(req);return !o||allowedOrigins.includes(o)};
function cors(req:Request){const o=requestOrigin(req);return {
  ...(o&&allowedOrigins.includes(o)?{"Access-Control-Allow-Origin":o,"Vary":"Origin"}:{}),
  "Access-Control-Allow-Headers":"authorization, apikey, content-type",
  "Access-Control-Allow-Methods":"POST, OPTIONS"
}}
function json(req:Request,data:unknown,status=200){return new Response(JSON.stringify(data),{status,headers:{...cors(req),"Content-Type":"application/json","Cache-Control":"no-store"}})}
const enc=(s:string)=>btoa(unescape(encodeURIComponent(s)));
const dec=(s:string)=>decodeURIComponent(escape(atob(s.replace(/\n/g,""))));

Deno.serve(async(req)=>{
  if(req.method==="OPTIONS"){if(!originAllowed(req))return new Response(null,{status:403});return new Response("ok",{headers:cors(req)});}
  if(!originAllowed(req))return json(req,{error:"Forbidden origin"},403);
  if(req.method!=="POST")return json(req,{error:"Method not allowed"},405);
  try{
    const supabaseUrl=Deno.env.get("SUPABASE_URL")!, anon=Deno.env.get("SUPABASE_ANON_KEY")!;
    const auth=req.headers.get("authorization")||""; if(!auth.startsWith("Bearer "))return json(req,{error:"Unauthorized"},401);
    const userClient=createClient(supabaseUrl,anon,{global:{headers:{Authorization:auth}},auth:{persistSession:false}});
    const {data:{user},error:userError}=await userClient.auth.getUser(); if(userError||!user)return json(req,{error:"Unauthorized"},401);
    const {data:isAdmin,error:adminError}=await userClient.rpc("is_gallery_admin"); if(adminError||!isAdmin)return json(req,{error:"Admin access required"},403);

    const token=Deno.env.get("GITHUB_TOKEN"),owner=Deno.env.get("GITHUB_OWNER")||"haimnetanelmusic-maker",repo=Deno.env.get("GITHUB_REPO")||"haim-netanel-photography",branch=Deno.env.get("GITHUB_BRANCH")||"v14-preview";
    if(!token)throw new Error("Missing GITHUB_TOKEN secret");
    const ghHeaders={"Authorization":`Bearer ${token}`,"Accept":"application/vnd.github+json","X-GitHub-Api-Version":"2022-11-28","Content-Type":"application/json"};
    const gh=async(path:string,init:RequestInit={})=>{const r=await fetch(`https://api.github.com/repos/${owner}/${repo}${path}`,{...init,headers:{...ghHeaders,...(init.headers||{})}});const j=await r.json().catch(()=>({}));if(!r.ok)throw new Error(j.message||`GitHub ${r.status}`);return j};
    const body=await req.json(),action=body?.action;
    if(action==="get_site_content"){
      const j=await gh(`/contents/content/site.json?ref=${encodeURIComponent(branch)}`);return json(req,{content:JSON.parse(dec(j.content)),sha:j.sha,branch});
    }
    if(action==="save_site_content"){
      if(!body?.content||typeof body.content!=="object")return json(req,{error:"Invalid content"},400);
      const current=await gh(`/contents/content/site.json?ref=${encodeURIComponent(branch)}`);
      const j=await gh(`/contents/content/site.json`,{method:"PUT",body:JSON.stringify({message:"Update site content from HN Admin",content:enc(JSON.stringify(body.content,null,2)),branch,sha:current.sha})});
      return json(req,{ok:true,sha:j.content?.sha||current.sha});
    }
    if(action==="upload_asset"){
      const path=String(body?.path||"");const base64=String(body?.base64||"");const contentType=String(body?.contentType||"");
      if(!/^assets\/uploads\/[a-zA-Z0-9._-]+\.(?:jpe?g|png|webp)$/i.test(path)||!base64)return json(req,{error:"Invalid upload"},400);
      if(!["image/jpeg","image/png","image/webp"].includes(contentType))return json(req,{error:"Unsupported image type"},415);
      if(base64.length>12_000_000)return json(req,{error:"Image is too large"},413);
      let bytes:Uint8Array;try{bytes=Uint8Array.from(atob(base64.replace(/\s/g,"")),c=>c.charCodeAt(0))}catch{return json(req,{error:"Invalid image encoding"},400)}
      const isJpeg=bytes.length>3&&bytes[0]===0xff&&bytes[1]===0xd8&&bytes[2]===0xff;
      const isPng=bytes.length>8&&bytes[0]===0x89&&bytes[1]===0x50&&bytes[2]===0x4e&&bytes[3]===0x47&&bytes[4]===0x0d&&bytes[5]===0x0a&&bytes[6]===0x1a&&bytes[7]===0x0a;
      const isWebp=bytes.length>12&&String.fromCharCode(...bytes.slice(0,4))==="RIFF"&&String.fromCharCode(...bytes.slice(8,12))==="WEBP";
      if((contentType==="image/jpeg"&&!isJpeg)||(contentType==="image/png"&&!isPng)||(contentType==="image/webp"&&!isWebp))return json(req,{error:"Image content does not match type"},415);
      const j=await gh(`/contents/${path}`,{method:"PUT",body:JSON.stringify({message:`Upload ${path.split('/').pop()}`,content:base64,branch})});
      return json(req,{ok:true,path,sha:j.content?.sha||null});
    }
    return json(req,{error:"Unknown action"},400);
  }catch(e){console.error(e);return json(req,{error:"Internal server error"},500)}
});
