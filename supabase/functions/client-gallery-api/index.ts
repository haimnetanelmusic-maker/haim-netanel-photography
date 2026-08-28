import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const cors={"Access-Control-Allow-Origin":"*","Access-Control-Allow-Headers":"content-type","Access-Control-Allow-Methods":"POST, OPTIONS"};
const json=(x:unknown,status=200)=>new Response(JSON.stringify(x),{status,headers:{...cors,"Content-Type":"application/json"}});
async function hashToken(token:string){const b=await crypto.subtle.digest("SHA-256",new TextEncoder().encode(token));return [...new Uint8Array(b)].map(x=>x.toString(16).padStart(2,"0")).join("")}

Deno.serve(async(req)=>{
  if(req.method==="OPTIONS") return new Response("ok",{headers:cors});
  if(req.method!=="POST") return json({error:"Method not allowed"},405);
  try{
    const url=Deno.env.get("SUPABASE_URL"),key=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if(!url||!key) throw new Error("Server configuration missing");
    const db=createClient(url,key,{auth:{persistSession:false}});
    const body=await req.json(),token=body?.token,action=body?.action;
    if(typeof token!=="string"||token.length<40) return json({error:"Invalid access link"},401);
    const h=await hashToken(token);
    const {data:event,error:ee}=await db.from("events").select("id,title,event_type,event_date,status,max_selections,storage_folder").eq("client_access_token_hash",h).in("status",["active","submitted"]).maybeSingle();
    if(ee||!event) return json({error:"הקישור אינו תקין או שכבר הוחלף."},401);

    if(action==="load"){
      const {data:rows,error}=await db.from("photos").select("id,preview_path,storage_path,original_filename,display_order").eq("event_id",event.id).order("display_order"); if(error) throw error;
      const photos=[]; for(const p of rows||[]){const path=p.preview_path||p.storage_path;const {data:s}=await db.storage.from("client-galleries").createSignedUrl(path,1800);photos.push({id:p.id,original_filename:p.original_filename,preview_url:s?.signedUrl||""})}
      let {data:sel}=await db.from("selections").select("id,status,submitted_at").eq("event_id",event.id).maybeSingle();
      let ids:string[]=[];if(sel){const {data:items}=await db.from("selection_items").select("photo_id").eq("selection_id",sel.id);ids=(items||[]).map(x=>x.photo_id)}
      return json({event,photos,selection:sel,selected_ids:ids});
    }

    let {data:sel,error:se}=await db.from("selections").select("*").eq("event_id",event.id).maybeSingle();if(se)throw se;
    if(!sel){const r=await db.from("selections").insert({event_id:event.id,status:"in_progress"}).select().single();if(r.error)throw r.error;sel=r.data}
    if(sel.status==="submitted") return json({error:"הבחירה כבר נשלחה."},409);

    if(action==="toggle"){
      const photoId=body?.photo_id,wants=body?.selected===true;const {data:p}=await db.from("photos").select("id").eq("id",photoId).eq("event_id",event.id).maybeSingle();if(!p)return json({error:"Invalid photo"},400);
      if(wants&&event.max_selections){const {count}=await db.from("selection_items").select("id",{count:"exact",head:true}).eq("selection_id",sel.id);if((count||0)>=event.max_selections)return json({error:"Selection limit reached"},409)}
      if(wants){const r=await db.from("selection_items").upsert({selection_id:sel.id,photo_id:photoId},{onConflict:"selection_id,photo_id"});if(r.error)throw r.error}else{const r=await db.from("selection_items").delete().eq("selection_id",sel.id).eq("photo_id",photoId);if(r.error)throw r.error}
      return json({ok:true,selection:sel});
    }

    if(action==="submit"){
      const {count}=await db.from("selection_items").select("id",{count:"exact",head:true}).eq("selection_id",sel.id);if(!count)return json({error:"No photos selected"},400);
      const now=new Date().toISOString();const r=await db.from("selections").update({status:"submitted",submitted_at:now,client_name:String(body?.client_name||"").slice(0,120)||null,client_email:String(body?.client_email||"").slice(0,200)||null,notes:String(body?.notes||"").slice(0,2000)||null}).eq("id",sel.id).select().single();if(r.error)throw r.error;await db.from("events").update({status:"submitted"}).eq("id",event.id);return json({ok:true,selection:r.data,count});
    }
    return json({error:"Unknown action"},400);
  }catch(e){console.error(e);return json({error:"Internal server error"},500)}
});
